-- 1. Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  actor_id UUID,
  metadata JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- No direct INSERT policy → only triggers (SECURITY DEFINER) can create notifications

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 2. Trigger: friend request received
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_name TEXT;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT COALESCE(display_name, username, 'Quelqu''un') INTO v_name
      FROM profiles WHERE id = NEW.requester_id;
    INSERT INTO notifications(user_id, type, title, message, link, actor_id)
    VALUES (NEW.addressee_id, 'friend_request',
            'Nouvelle demande d''ami',
            v_name || ' veut t''ajouter en ami',
            '/app/campus', NEW.requester_id);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_friend_request
AFTER INSERT ON public.friendships
FOR EACH ROW EXECUTE FUNCTION public.notify_friend_request();

-- 3. Trigger: friend request accepted
CREATE OR REPLACE FUNCTION public.notify_friend_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_name TEXT;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
    SELECT COALESCE(display_name, username, 'Quelqu''un') INTO v_name
      FROM profiles WHERE id = NEW.addressee_id;
    INSERT INTO notifications(user_id, type, title, message, link, actor_id)
    VALUES (NEW.requester_id, 'friend_accepted',
            'Demande acceptée 🎉',
            v_name || ' est maintenant ton ami',
            '/app/campus', NEW.addressee_id);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_friend_accepted
AFTER UPDATE ON public.friendships
FOR EACH ROW EXECUTE FUNCTION public.notify_friend_accepted();

-- 4. Trigger: duel created
CREATE OR REPLACE FUNCTION public.notify_duel_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_name TEXT;
BEGIN
  SELECT COALESCE(display_name, username, 'Quelqu''un') INTO v_name
    FROM profiles WHERE id = NEW.challenger_id;
  INSERT INTO notifications(user_id, type, title, message, link, actor_id, metadata)
  VALUES (NEW.opponent_id, 'duel_received',
          '⚔️ Nouveau duel !',
          v_name || ' te défie sur ' || COALESCE(NEW.subject, 'un quiz'),
          '/app/duel/' || NEW.id, NEW.challenger_id,
          jsonb_build_object('duel_id', NEW.id));
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_duel_created
AFTER INSERT ON public.duels
FOR EACH ROW EXECUTE FUNCTION public.notify_duel_created();

-- 5. Trigger: duel completed → notify both
CREATE OR REPLACE FUNCTION public.notify_duel_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_msg_c TEXT; v_msg_o TEXT;
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    IF NEW.winner_id = NEW.challenger_id THEN
      v_msg_c := 'Tu as gagné ton duel ! 🏆';
      v_msg_o := 'Tu as perdu ce duel. Revanche ?';
    ELSIF NEW.winner_id = NEW.opponent_id THEN
      v_msg_c := 'Tu as perdu ce duel. Revanche ?';
      v_msg_o := 'Tu as gagné ton duel ! 🏆';
    ELSE
      v_msg_c := 'Match nul ! 🤝';
      v_msg_o := 'Match nul ! 🤝';
    END IF;
    INSERT INTO notifications(user_id, type, title, message, link, metadata)
    VALUES
      (NEW.challenger_id, 'duel_completed', 'Duel terminé', v_msg_c, '/app/duel/' || NEW.id, jsonb_build_object('duel_id', NEW.id)),
      (NEW.opponent_id, 'duel_completed', 'Duel terminé', v_msg_o, '/app/duel/' || NEW.id, jsonb_build_object('duel_id', NEW.id));
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_duel_completed
AFTER UPDATE ON public.duels
FOR EACH ROW EXECUTE FUNCTION public.notify_duel_completed();
-- 1. Allow trigger-based group notifications via RLS
DROP POLICY IF EXISTS "insert own fomo notifications" ON public.notifications;
CREATE POLICY "insert own fomo notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  AND (type = ANY (ARRAY[
    'fomo_streak'::text,
    'fomo_quest'::text,
    'fomo_level'::text,
    'fomo_morning'::text,
    'group_streak_gained'::text,
    'group_streak_at_risk'::text,
    'group_member_joined'::text
  ]))
);

-- 2. When a group bumps its streak (all members contributed), notify each member
CREATE OR REPLACE FUNCTION public.bump_group_streak(p_group_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total int;
  v_active int;
  v_g record;
  v_today date := CURRENT_DATE;
  v_new_streak int;
BEGIN
  SELECT * INTO v_g FROM study_groups WHERE id = p_group_id;
  IF NOT FOUND THEN RETURN; END IF;
  IF v_g.last_active_date = v_today THEN RETURN; END IF;
  SELECT COUNT(*) INTO v_total FROM study_group_members WHERE group_id = p_group_id;
  SELECT COUNT(DISTINCT user_id) INTO v_active FROM study_group_activity
    WHERE group_id = p_group_id AND activity_date = v_today;
  IF v_active < v_total THEN RETURN; END IF;

  IF v_g.last_active_date = v_today - 1 THEN
    v_new_streak := v_g.group_streak_days + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  UPDATE study_groups
     SET group_streak_days = v_new_streak,
         group_streak_record = GREATEST(group_streak_record, v_new_streak),
         last_active_date = v_today
   WHERE id = p_group_id;

  -- Notify every member that the group hit its daily goal
  INSERT INTO notifications(user_id, type, title, message, link, metadata)
  SELECT m.user_id,
         'group_streak_gained',
         '🔥 Streak de groupe +1',
         v_g.name || ' : ' || v_new_streak || 'j d''affilée. Belle équipe !',
         '/app/groupes',
         jsonb_build_object('group_id', p_group_id, 'streak', v_new_streak)
    FROM study_group_members m
   WHERE m.group_id = p_group_id;
END; $function$;

-- 3. RPC to send "streak en danger" reminders for groups (called by cron or client)
CREATE OR REPLACE FUNCTION public.notify_groups_at_risk()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_today date := CURRENT_DATE;
  v_g record;
  v_count int := 0;
BEGIN
  FOR v_g IN
    SELECT g.id, g.name,
           (SELECT COUNT(*) FROM study_group_members WHERE group_id = g.id) AS total,
           (SELECT COUNT(DISTINCT user_id) FROM study_group_activity
              WHERE group_id = g.id AND activity_date = v_today) AS active
      FROM study_groups g
     WHERE g.group_streak_days >= 1
       AND g.last_active_date = v_today - 1
  LOOP
    IF v_g.active < v_g.total THEN
      -- Notify only the slackers (members who haven't logged today)
      INSERT INTO notifications(user_id, type, title, message, link, metadata)
      SELECT m.user_id,
             'group_streak_at_risk',
             '⏰ Ta team t''attend',
             v_g.name || ' : ' || v_g.active || '/' || v_g.total || ' ont bossé. Sauve la streak !',
             '/app/groupes',
             jsonb_build_object('group_id', v_g.id)
        FROM study_group_members m
       WHERE m.group_id = v_g.id
         AND NOT EXISTS (
           SELECT 1 FROM study_group_activity a
            WHERE a.group_id = v_g.id AND a.user_id = m.user_id AND a.activity_date = v_today
         )
         -- Avoid spamming: don't re-notify if a notif was sent in the last 6h
         AND NOT EXISTS (
           SELECT 1 FROM notifications n
            WHERE n.user_id = m.user_id
              AND n.type = 'group_streak_at_risk'
              AND (n.metadata->>'group_id')::uuid = v_g.id
              AND n.created_at > now() - interval '6 hours'
         );
      v_count := v_count + 1;
    END IF;
  END LOOP;
  RETURN jsonb_build_object('groups_warned', v_count);
END; $function$;

-- 4. Notify owner when someone joins their group
CREATE OR REPLACE FUNCTION public.notify_group_member_joined()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid;
  v_group_name text;
  v_member_name text;
BEGIN
  SELECT owner_id, name INTO v_owner, v_group_name
    FROM study_groups WHERE id = NEW.group_id;
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN RETURN NEW; END IF;
  SELECT COALESCE(display_name, username, 'Quelqu''un') INTO v_member_name
    FROM profiles WHERE id = NEW.user_id;
  INSERT INTO notifications(user_id, type, title, message, link, actor_id, metadata)
  VALUES (v_owner, 'group_member_joined',
          '👥 Nouveau membre',
          v_member_name || ' a rejoint ' || v_group_name,
          '/app/groupes', NEW.user_id,
          jsonb_build_object('group_id', NEW.group_id));
  RETURN NEW;
END; $function$;

DROP TRIGGER IF EXISTS trg_group_member_joined ON public.study_group_members;
CREATE TRIGGER trg_group_member_joined
AFTER INSERT ON public.study_group_members
FOR EACH ROW EXECUTE FUNCTION public.notify_group_member_joined();
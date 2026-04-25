
-- Table des partages de fiches
CREATE TABLE public.course_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);

CREATE INDEX idx_course_shares_recipient ON public.course_shares(recipient_id, status);
CREATE INDEX idx_course_shares_sender ON public.course_shares(sender_id);

ALTER TABLE public.course_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "see own course shares"
  ON public.course_shares FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "delete own course share"
  ON public.course_shares FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Pas d'INSERT/UPDATE direct → tout passe par les fonctions

-- Étendre les notifications autorisées
DROP POLICY IF EXISTS "insert own fomo notifications" ON public.notifications;
CREATE POLICY "insert own fomo notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND type = ANY (ARRAY[
      'fomo_streak','fomo_quest','fomo_level','fomo_morning',
      'group_streak_gained','group_streak_at_risk','group_member_joined',
      'course_share_received','course_share_response'
    ])
  );

-- Fonction : envoyer une fiche à un ami
CREATE OR REPLACE FUNCTION public.send_course_to_friend(
  p_course_id uuid,
  p_recipient_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_friend boolean;
  v_course record;
  v_sender_name text;
  v_share_id uuid;
  v_existing uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF v_user = p_recipient_id THEN RAISE EXCEPTION 'cannot_send_to_self'; END IF;

  -- Vérifier amitié
  SELECT EXISTS(
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
      AND ((requester_id = v_user AND addressee_id = p_recipient_id)
        OR (addressee_id = v_user AND requester_id = p_recipient_id))
  ) INTO v_friend;
  IF NOT v_friend THEN RAISE EXCEPTION 'not_friends'; END IF;

  -- Vérifier propriété de la fiche
  SELECT id, title, emoji INTO v_course
  FROM courses WHERE id = p_course_id AND user_id = v_user;
  IF NOT FOUND THEN RAISE EXCEPTION 'course_not_found'; END IF;

  -- Pas de doublon en attente
  SELECT id INTO v_existing
  FROM course_shares
  WHERE course_id = p_course_id
    AND sender_id = v_user
    AND recipient_id = p_recipient_id
    AND status = 'pending';
  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_pending', 'share_id', v_existing);
  END IF;

  INSERT INTO course_shares(course_id, sender_id, recipient_id)
  VALUES (p_course_id, v_user, p_recipient_id)
  RETURNING id INTO v_share_id;

  SELECT COALESCE(display_name, username, 'Un ami') INTO v_sender_name
  FROM profiles WHERE id = v_user;

  INSERT INTO notifications(user_id, type, title, message, link, actor_id, metadata)
  VALUES (
    p_recipient_id,
    'course_share_received',
    '📨 Nouvelle fiche reçue',
    v_sender_name || ' te partage « ' || COALESCE(v_course.emoji, '📘') || ' ' || v_course.title || ' »',
    '/app/fiches',
    v_user,
    jsonb_build_object('share_id', v_share_id, 'course_id', p_course_id)
  );

  RETURN jsonb_build_object('success', true, 'share_id', v_share_id);
END;
$$;

-- Fonction : accepter / refuser un partage
CREATE OR REPLACE FUNCTION public.respond_course_share(
  p_share_id uuid,
  p_accept boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_share record;
  v_orig record;
  v_new_course_id uuid;
  v_recipient_name text;
  v_quiz record;
  v_new_quiz_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT * INTO v_share FROM course_shares
  WHERE id = p_share_id AND recipient_id = v_user AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'share_not_found_or_handled'; END IF;

  IF NOT p_accept THEN
    UPDATE course_shares SET status = 'declined', responded_at = now() WHERE id = p_share_id;

    SELECT COALESCE(display_name, username, 'Ton ami') INTO v_recipient_name
    FROM profiles WHERE id = v_user;

    INSERT INTO notifications(user_id, type, title, message, link, actor_id, metadata)
    VALUES (
      v_share.sender_id,
      'course_share_response',
      'Fiche refusée',
      v_recipient_name || ' a refusé ta fiche.',
      '/app/fiches',
      v_user,
      jsonb_build_object('share_id', p_share_id, 'accepted', false)
    );

    RETURN jsonb_build_object('success', true, 'accepted', false);
  END IF;

  -- Accepté → cloner la fiche chez le destinataire
  SELECT * INTO v_orig FROM courses WHERE id = v_share.course_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'course_gone'; END IF;

  INSERT INTO courses(user_id, title, emoji, subject, level, source_content, summary, exam_date)
  VALUES (v_user, v_orig.title, v_orig.emoji, v_orig.subject, v_orig.level,
          v_orig.source_content, v_orig.summary, NULL)
  RETURNING id INTO v_new_course_id;

  -- Cloner les quiz + questions
  FOR v_quiz IN SELECT * FROM quizzes WHERE course_id = v_share.course_id AND user_id = v_share.sender_id LOOP
    INSERT INTO quizzes(user_id, course_id, title, quiz_type)
    VALUES (v_user, v_new_course_id, v_quiz.title, v_quiz.quiz_type)
    RETURNING id INTO v_new_quiz_id;

    INSERT INTO quiz_questions(user_id, quiz_id, question, type, answers, correct_index, accepted_answers, explanation, chapter, position)
    SELECT v_user, v_new_quiz_id, question, type, answers, correct_index, accepted_answers, explanation, chapter, position
    FROM quiz_questions WHERE quiz_id = v_quiz.id;
  END LOOP;

  UPDATE course_shares SET status = 'accepted', responded_at = now() WHERE id = p_share_id;

  SELECT COALESCE(display_name, username, 'Ton ami') INTO v_recipient_name
  FROM profiles WHERE id = v_user;

  INSERT INTO notifications(user_id, type, title, message, link, actor_id, metadata)
  VALUES (
    v_share.sender_id,
    'course_share_response',
    '✅ Fiche acceptée',
    v_recipient_name || ' a accepté ta fiche !',
    '/app/fiches',
    v_user,
    jsonb_build_object('share_id', p_share_id, 'accepted', true)
  );

  RETURN jsonb_build_object('success', true, 'accepted', true, 'course_id', v_new_course_id);
END;
$$;

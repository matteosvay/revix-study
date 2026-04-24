
-- ============= DUELS =============
CREATE TABLE IF NOT EXISTS public.duels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid NOT NULL,
  opponent_id uuid NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  subject text,
  num_questions int NOT NULL DEFAULT 10,
  seconds_per_question int NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','completed','expired')),
  winner_id uuid,
  challenger_score int,
  opponent_score int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT duels_no_self CHECK (challenger_id <> opponent_id)
);
CREATE INDEX IF NOT EXISTS duels_challenger_idx ON public.duels(challenger_id);
CREATE INDEX IF NOT EXISTS duels_opponent_idx ON public.duels(opponent_id);

CREATE TABLE IF NOT EXISTS public.duel_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id uuid NOT NULL REFERENCES public.duels(id) ON DELETE CASCADE,
  position int NOT NULL,
  question text NOT NULL,
  answers jsonb NOT NULL,
  correct_index int NOT NULL,
  explanation text
);
CREATE INDEX IF NOT EXISTS duel_questions_duel_idx ON public.duel_questions(duel_id);

CREATE TABLE IF NOT EXISTS public.duel_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id uuid NOT NULL REFERENCES public.duels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  answers jsonb NOT NULL,
  score int NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(duel_id, user_id)
);
CREATE INDEX IF NOT EXISTS duel_attempts_duel_idx ON public.duel_attempts(duel_id);

-- ============= STUDY ROOMS =============
CREATE TABLE IF NOT EXISTS public.study_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL,
  name text NOT NULL,
  invite_code text NOT NULL UNIQUE,
  subjects jsonb DEFAULT '[]',
  max_members int NOT NULL DEFAULT 6 CHECK (max_members BETWEEN 2 AND 10),
  privacy text NOT NULL DEFAULT 'open' CHECK (privacy IN ('open','invite')),
  timer_preset text NOT NULL DEFAULT 'pomodoro_25_5',
  timer_started_at timestamptz,
  timer_phase text DEFAULT 'idle' CHECK (timer_phase IN ('idle','focus','pause')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','ended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);
CREATE INDEX IF NOT EXISTS study_rooms_host_idx ON public.study_rooms(host_id);
CREATE INDEX IF NOT EXISTS study_rooms_status_idx ON public.study_rooms(status);

CREATE TABLE IF NOT EXISTS public.room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'focus' CHECK (status IN ('focus','pause','away')),
  last_seen timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);
CREATE INDEX IF NOT EXISTS room_members_room_idx ON public.room_members(room_id);
CREATE INDEX IF NOT EXISTS room_members_user_idx ON public.room_members(user_id);

CREATE TABLE IF NOT EXISTS public.room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (length(content) BETWEEN 1 AND 120),
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS room_messages_room_idx ON public.room_messages(room_id, created_at);

CREATE TABLE IF NOT EXISTS public.room_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (length(content) BETWEEN 1 AND 100),
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS room_goals_room_idx ON public.room_goals(room_id);

-- Helper SECURITY DEFINER pour éviter récursion RLS dans policies
CREATE OR REPLACE FUNCTION public.is_room_member(p_room_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.room_members WHERE room_id = p_room_id AND user_id = p_user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_room_visible(p_room_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.study_rooms r WHERE r.id = p_room_id AND (
    r.privacy = 'open' OR r.host_id = p_user_id
    OR EXISTS(SELECT 1 FROM public.room_members rm WHERE rm.room_id = r.id AND rm.user_id = p_user_id)
  ));
$$;

-- ============= RLS =============
ALTER TABLE public.duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duel_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duel_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_goals ENABLE ROW LEVEL SECURITY;

-- Duels
DROP POLICY IF EXISTS "see own duels" ON public.duels;
CREATE POLICY "see own duels" ON public.duels FOR SELECT USING (auth.uid() IN (challenger_id, opponent_id));
DROP POLICY IF EXISTS "create own duel" ON public.duels;
CREATE POLICY "create own duel" ON public.duels FOR INSERT WITH CHECK (auth.uid() = challenger_id);
DROP POLICY IF EXISTS "update own duel" ON public.duels;
CREATE POLICY "update own duel" ON public.duels FOR UPDATE USING (auth.uid() IN (challenger_id, opponent_id));

DROP TRIGGER IF EXISTS trg_duels_updated_at ON public.duels;
CREATE TRIGGER trg_duels_updated_at BEFORE UPDATE ON public.duels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "see duel questions" ON public.duel_questions;
CREATE POLICY "see duel questions" ON public.duel_questions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.duels d WHERE d.id = duel_id AND auth.uid() IN (d.challenger_id, d.opponent_id)));

DROP POLICY IF EXISTS "see duel attempts" ON public.duel_attempts;
CREATE POLICY "see duel attempts" ON public.duel_attempts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.duels d WHERE d.id = duel_id AND auth.uid() IN (d.challenger_id, d.opponent_id)));
DROP POLICY IF EXISTS "insert own attempt" ON public.duel_attempts;
CREATE POLICY "insert own attempt" ON public.duel_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Study rooms (utilise helpers SECURITY DEFINER)
DROP POLICY IF EXISTS "see open or member rooms" ON public.study_rooms;
CREATE POLICY "see open or member rooms" ON public.study_rooms FOR SELECT
  USING (auth.uid() IS NOT NULL AND (privacy = 'open' OR host_id = auth.uid() OR public.is_room_member(id, auth.uid())));
DROP POLICY IF EXISTS "create own room" ON public.study_rooms;
CREATE POLICY "create own room" ON public.study_rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
DROP POLICY IF EXISTS "host updates room" ON public.study_rooms;
CREATE POLICY "host updates room" ON public.study_rooms FOR UPDATE USING (auth.uid() = host_id);
DROP POLICY IF EXISTS "host deletes room" ON public.study_rooms;
CREATE POLICY "host deletes room" ON public.study_rooms FOR DELETE USING (auth.uid() = host_id);

-- Room members
DROP POLICY IF EXISTS "see members of accessible rooms" ON public.room_members;
CREATE POLICY "see members of accessible rooms" ON public.room_members FOR SELECT
  USING (public.is_room_visible(room_id, auth.uid()));
DROP POLICY IF EXISTS "join as self" ON public.room_members;
CREATE POLICY "join as self" ON public.room_members FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update own membership" ON public.room_members;
CREATE POLICY "update own membership" ON public.room_members FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "leave room" ON public.room_members;
CREATE POLICY "leave room" ON public.room_members FOR DELETE
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.study_rooms r WHERE r.id = room_id AND r.host_id = auth.uid()));

-- Room messages
DROP POLICY IF EXISTS "see room messages" ON public.room_messages;
CREATE POLICY "see room messages" ON public.room_messages FOR SELECT
  USING (public.is_room_member(room_id, auth.uid()));
DROP POLICY IF EXISTS "send room message" ON public.room_messages;
CREATE POLICY "send room message" ON public.room_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_room_member(room_id, auth.uid()));

-- Room goals
DROP POLICY IF EXISTS "see room goals" ON public.room_goals;
CREATE POLICY "see room goals" ON public.room_goals FOR SELECT
  USING (public.is_room_member(room_id, auth.uid()));
DROP POLICY IF EXISTS "add own goal" ON public.room_goals;
CREATE POLICY "add own goal" ON public.room_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_room_member(room_id, auth.uid()));
DROP POLICY IF EXISTS "toggle own goal" ON public.room_goals;
CREATE POLICY "toggle own goal" ON public.room_goals FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete own goal" ON public.room_goals;
CREATE POLICY "delete own goal" ON public.room_goals FOR DELETE USING (auth.uid() = user_id);

-- ============= FUNCTIONS =============
CREATE OR REPLACE FUNCTION public.create_duel(
  p_opponent_id uuid, p_course_id uuid, p_num_questions int, p_seconds_per_question int
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_duel_id uuid; v_subject text; v_friend boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT EXISTS(SELECT 1 FROM friendships WHERE status='accepted'
    AND ((requester_id=auth.uid() AND addressee_id=p_opponent_id)
      OR (addressee_id=auth.uid() AND requester_id=p_opponent_id))) INTO v_friend;
  IF NOT v_friend THEN RAISE EXCEPTION 'not_friends'; END IF;
  SELECT subject INTO v_subject FROM courses WHERE id = p_course_id AND user_id = auth.uid();

  INSERT INTO duels(challenger_id, opponent_id, course_id, subject, num_questions, seconds_per_question)
  VALUES (auth.uid(), p_opponent_id, p_course_id, v_subject, p_num_questions, p_seconds_per_question)
  RETURNING id INTO v_duel_id;

  INSERT INTO duel_questions(duel_id, position, question, answers, correct_index, explanation)
  SELECT v_duel_id, ROW_NUMBER() OVER (ORDER BY random()) - 1,
         q.question, q.answers, q.correct_index, q.explanation
  FROM quiz_questions q
  JOIN quizzes qz ON qz.id = q.quiz_id
  WHERE qz.user_id = auth.uid() AND qz.course_id = p_course_id
    AND q.type = 'qcm' AND q.correct_index IS NOT NULL AND q.answers IS NOT NULL
  ORDER BY random() LIMIT p_num_questions;

  IF (SELECT COUNT(*) FROM duel_questions WHERE duel_id = v_duel_id) < 3 THEN
    DELETE FROM duels WHERE id = v_duel_id;
    RAISE EXCEPTION 'not_enough_questions';
  END IF;
  RETURN v_duel_id;
END; $$;

CREATE OR REPLACE FUNCTION public.accept_duel(p_duel_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE duels SET status='accepted'
  WHERE id=p_duel_id AND opponent_id=auth.uid() AND status='pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'cannot_accept'; END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.submit_duel_attempt(
  p_duel_id uuid, p_answers jsonb, p_score int
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_duel record; v_other_attempt record; v_winner uuid; v_xp jsonb;
BEGIN
  SELECT * INTO v_duel FROM duels WHERE id = p_duel_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'duel_not_found'; END IF;
  IF auth.uid() NOT IN (v_duel.challenger_id, v_duel.opponent_id) THEN RAISE EXCEPTION 'not_a_player'; END IF;
  IF v_duel.status NOT IN ('accepted','completed') THEN RAISE EXCEPTION 'duel_not_active'; END IF;

  INSERT INTO duel_attempts(duel_id, user_id, answers, score)
  VALUES (p_duel_id, auth.uid(), p_answers, p_score)
  ON CONFLICT (duel_id, user_id) DO NOTHING;

  IF auth.uid() = v_duel.challenger_id THEN
    UPDATE duels SET challenger_score = p_score WHERE id = p_duel_id;
  ELSE
    UPDATE duels SET opponent_score = p_score WHERE id = p_duel_id;
  END IF;

  SELECT * INTO v_other_attempt FROM duel_attempts WHERE duel_id = p_duel_id AND user_id <> auth.uid();
  IF FOUND THEN
    IF p_score > v_other_attempt.score THEN v_winner := auth.uid();
    ELSIF p_score < v_other_attempt.score THEN v_winner := v_other_attempt.user_id;
    ELSE v_winner := NULL; END IF;

    UPDATE duels SET status='completed', winner_id = v_winner WHERE id = p_duel_id;
    IF v_winner = auth.uid() THEN
      v_xp := public.award_xp(auth.uid(), 100, 'duel_win');
      PERFORM public.award_xp(v_other_attempt.user_id, 40, 'duel_loss');
    ELSIF v_winner IS NULL THEN
      v_xp := public.award_xp(auth.uid(), 60, 'duel_tie');
      PERFORM public.award_xp(v_other_attempt.user_id, 60, 'duel_tie');
    ELSE
      v_xp := public.award_xp(auth.uid(), 40, 'duel_loss');
      PERFORM public.award_xp(v_other_attempt.user_id, 100, 'duel_win');
    END IF;
    RETURN jsonb_build_object('completed', true, 'winner_id', v_winner, 'xp', v_xp);
  END IF;
  RETURN jsonb_build_object('completed', false, 'waiting_opponent', true);
END; $$;

-- Salles : génération code
CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_code text; v_exists boolean; v_attempts int := 0;
BEGIN
  LOOP
    v_code := upper(substring(md5(random()::text) for 6));
    SELECT EXISTS(SELECT 1 FROM study_rooms WHERE invite_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists OR v_attempts > 30;
    v_attempts := v_attempts + 1;
  END LOOP;
  RETURN v_code;
END; $$;

CREATE OR REPLACE FUNCTION public.set_room_code_on_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := public.generate_room_code();
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_room_code ON public.study_rooms;
CREATE TRIGGER trg_room_code BEFORE INSERT ON public.study_rooms
  FOR EACH ROW EXECUTE FUNCTION public.set_room_code_on_insert();

CREATE OR REPLACE FUNCTION public.add_host_as_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO room_members(room_id, user_id) VALUES (NEW.id, NEW.host_id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_room_host_member ON public.study_rooms;
CREATE TRIGGER trg_room_host_member AFTER INSERT ON public.study_rooms
  FOR EACH ROW EXECUTE FUNCTION public.add_host_as_member();

CREATE OR REPLACE FUNCTION public.join_room_by_code(p_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_room record; v_count int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO v_room FROM study_rooms WHERE invite_code = upper(p_code) AND status='active';
  IF NOT FOUND THEN RAISE EXCEPTION 'room_not_found'; END IF;
  SELECT COUNT(*) INTO v_count FROM room_members WHERE room_id = v_room.id;
  IF v_count >= v_room.max_members AND NOT EXISTS(SELECT 1 FROM room_members WHERE room_id=v_room.id AND user_id=auth.uid()) THEN
    RAISE EXCEPTION 'room_full';
  END IF;
  INSERT INTO room_members(room_id, user_id) VALUES (v_room.id, auth.uid())
  ON CONFLICT (room_id, user_id) DO UPDATE SET last_seen = now(), status='focus';
  PERFORM public.award_xp(auth.uid(), 20, 'room_joined');
  RETURN v_room.id;
END; $$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.duels;

-- ============================================================
-- VAGUE 2 — Pédagogie : SRS + heatmap chapitres + notes vocales
-- ============================================================

-- 1) Spaced repetition : une ligne par (user, question)
CREATE TABLE public.question_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  chapter text,
  ease numeric NOT NULL DEFAULT 2.5,        -- SM-2 ease factor
  interval_days int NOT NULL DEFAULT 0,     -- current interval
  repetitions int NOT NULL DEFAULT 0,       -- successful in a row
  lapses int NOT NULL DEFAULT 0,
  due_at date NOT NULL DEFAULT CURRENT_DATE,
  last_reviewed_at timestamptz,
  last_correct boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);

CREATE INDEX idx_qr_due ON public.question_reviews (user_id, due_at);
CREATE INDEX idx_qr_course ON public.question_reviews (user_id, course_id, chapter);

ALTER TABLE public.question_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own reviews all" ON public.question_reviews
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_qr_updated
BEFORE UPDATE ON public.question_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Notes vocales sur les cours
CREATE TABLE public.voice_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  audio_path text,
  transcript text,
  duration_seconds int,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own voice notes all" ON public.voice_notes
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_vn_course ON public.voice_notes (user_id, course_id);

-- 3) Marqueur "boss" sur quiz_attempts
ALTER TABLE public.quiz_attempts
  ADD COLUMN IF NOT EXISTS is_boss_attempt boolean NOT NULL DEFAULT false;

-- 4) RPC : update SRS state (SM-2 simplifié)
-- p_quality: 0 = wrong, 1 = correct
CREATE OR REPLACE FUNCTION public.review_question(
  p_question_id uuid,
  p_correct boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_q record;
  v_r record;
  v_new_interval int;
  v_new_ease numeric;
  v_new_reps int;
  v_new_lapses int;
  v_due date;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT q.id, q.chapter, q.quiz_id, qz.course_id
    INTO v_q
    FROM quiz_questions q
    JOIN quizzes qz ON qz.id = q.quiz_id
   WHERE q.id = p_question_id AND q.user_id = v_user;
  IF NOT FOUND THEN RAISE EXCEPTION 'question_not_found'; END IF;

  SELECT * INTO v_r FROM question_reviews
   WHERE user_id = v_user AND question_id = p_question_id;

  IF NOT FOUND THEN
    v_new_ease := 2.5; v_new_reps := 0; v_new_lapses := 0;
  ELSE
    v_new_ease := v_r.ease; v_new_reps := v_r.repetitions; v_new_lapses := v_r.lapses;
  END IF;

  IF p_correct THEN
    v_new_reps := v_new_reps + 1;
    IF v_new_reps = 1 THEN v_new_interval := 1;
    ELSIF v_new_reps = 2 THEN v_new_interval := 3;
    ELSE v_new_interval := GREATEST(1, ROUND(COALESCE(v_r.interval_days, 1) * v_new_ease)::int);
    END IF;
    v_new_ease := GREATEST(1.3, v_new_ease + 0.10);
  ELSE
    v_new_reps := 0;
    v_new_lapses := v_new_lapses + 1;
    v_new_interval := 1;
    v_new_ease := GREATEST(1.3, v_new_ease - 0.20);
  END IF;

  v_due := CURRENT_DATE + v_new_interval;

  INSERT INTO question_reviews(
    user_id, question_id, course_id, chapter,
    ease, interval_days, repetitions, lapses,
    due_at, last_reviewed_at, last_correct
  ) VALUES (
    v_user, p_question_id, v_q.course_id, v_q.chapter,
    v_new_ease, v_new_interval, v_new_reps, v_new_lapses,
    v_due, now(), p_correct
  )
  ON CONFLICT (user_id, question_id) DO UPDATE SET
    ease = EXCLUDED.ease,
    interval_days = EXCLUDED.interval_days,
    repetitions = EXCLUDED.repetitions,
    lapses = EXCLUDED.lapses,
    due_at = EXCLUDED.due_at,
    last_reviewed_at = EXCLUDED.last_reviewed_at,
    last_correct = EXCLUDED.last_correct,
    chapter = EXCLUDED.chapter,
    course_id = EXCLUDED.course_id;

  RETURN jsonb_build_object(
    'due_at', v_due,
    'interval_days', v_new_interval,
    'ease', v_new_ease,
    'repetitions', v_new_reps
  );
END; $$;

-- 5) RPC : maîtrise par chapitre (heatmap)
CREATE OR REPLACE FUNCTION public.get_chapter_mastery(p_course_id uuid)
RETURNS TABLE(
  chapter text,
  total_questions int,
  reviewed_questions int,
  mastered_questions int,
  due_today int,
  avg_ease numeric,
  mastery_pct int
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH qs AS (
    SELECT q.id, COALESCE(q.chapter, 'Sans chapitre') AS chapter
      FROM quiz_questions q
      JOIN quizzes qz ON qz.id = q.quiz_id
     WHERE qz.course_id = p_course_id AND q.user_id = auth.uid()
  ),
  rs AS (
    SELECT r.question_id, r.ease, r.repetitions, r.due_at
      FROM question_reviews r
     WHERE r.user_id = auth.uid() AND r.course_id = p_course_id
  )
  SELECT
    qs.chapter,
    COUNT(qs.id)::int AS total_questions,
    COUNT(rs.question_id)::int AS reviewed_questions,
    COUNT(*) FILTER (WHERE rs.repetitions >= 2)::int AS mastered_questions,
    COUNT(*) FILTER (WHERE rs.due_at <= CURRENT_DATE)::int AS due_today,
    ROUND(AVG(rs.ease)::numeric, 2) AS avg_ease,
    CASE WHEN COUNT(qs.id) = 0 THEN 0
         ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE rs.repetitions >= 2) / COUNT(qs.id))::int
    END AS mastery_pct
  FROM qs LEFT JOIN rs ON rs.question_id = qs.id
  GROUP BY qs.chapter
  ORDER BY mastery_pct ASC, qs.chapter;
$$;

-- 6) RPC : questions à réviser aujourd'hui (toutes matières)
CREATE OR REPLACE FUNCTION public.get_due_review_questions(p_limit int DEFAULT 15)
RETURNS TABLE(
  question_id uuid,
  quiz_id uuid,
  course_id uuid,
  course_title text,
  course_emoji text,
  chapter text,
  question text,
  type text,
  answers jsonb,
  correct_index int,
  accepted_answers jsonb,
  explanation text,
  due_at date
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT q.id, q.quiz_id, qz.course_id, c.title, c.emoji,
         COALESCE(q.chapter, 'Sans chapitre'),
         q.question, q.type, q.answers, q.correct_index,
         q.accepted_answers, q.explanation, r.due_at
    FROM question_reviews r
    JOIN quiz_questions q ON q.id = r.question_id
    JOIN quizzes qz ON qz.id = q.quiz_id
    LEFT JOIN courses c ON c.id = qz.course_id
   WHERE r.user_id = auth.uid()
     AND r.due_at <= CURRENT_DATE
   ORDER BY r.due_at ASC, r.ease ASC
   LIMIT GREATEST(1, LEAST(p_limit, 50));
$$;

-- 7) Storage bucket pour les notes vocales
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-notes', 'voice-notes', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "users read own voice notes"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users upload own voice notes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users delete own voice notes"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

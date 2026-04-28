-- ============ 1. Hash de contenu sur les cours (déduplication) ============
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS content_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_courses_content_hash ON public.courses(content_hash);

-- ============ 2. État de conversation coach (résumé glissant) ============
CREATE TABLE IF NOT EXISTS public.coach_conversation_state (
  user_id UUID PRIMARY KEY,
  summary TEXT NOT NULL DEFAULT '',
  summary_until_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_conversation_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own coach state"
  ON public.coach_conversation_state
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT/UPDATE bloqués pour les clients : seules les edge functions (service role) écrivent.
-- Pas de policy = refusé par RLS.

-- ============ 3. Clone de la banque de quiz pour la déduplication ============
CREATE OR REPLACE FUNCTION public.clone_quiz_bank_from_course(
  p_source_course_id UUID,
  p_target_course_id UUID,
  p_target_user_id UUID
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted INTEGER;
BEGIN
  INSERT INTO public.quiz_bank (course_id, user_id, question, answer, question_type, options, difficulty)
  SELECT p_target_course_id, p_target_user_id, question, answer, question_type, options, difficulty
    FROM public.quiz_bank
   WHERE course_id = p_source_course_id;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.clone_quiz_bank_from_course(UUID, UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clone_quiz_bank_from_course(UUID, UUID, UUID) TO authenticated, service_role;

-- ============ 4. Extensions pour cron ============
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

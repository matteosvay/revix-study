ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS chapter text;
CREATE INDEX IF NOT EXISTS idx_quiz_questions_chapter ON public.quiz_questions(quiz_id, chapter);
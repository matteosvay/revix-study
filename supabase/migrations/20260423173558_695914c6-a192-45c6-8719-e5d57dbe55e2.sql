-- Add rich summary column to courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS summary jsonb;

-- Add quiz_type to quizzes
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS quiz_type text NOT NULL DEFAULT 'qcm';

-- Make answers / correct_index nullable, add type & accepted_answers
ALTER TABLE public.quiz_questions ALTER COLUMN answers DROP NOT NULL;
ALTER TABLE public.quiz_questions ALTER COLUMN correct_index DROP NOT NULL;
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'qcm';
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS accepted_answers jsonb;
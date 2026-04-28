-- Table de banque de questions de quiz pré-générées par fiche (course)
CREATE TABLE public.quiz_bank (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('qcm', 'vrai_faux', 'ouvert')),
  options JSONB,
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  times_shown INTEGER NOT NULL DEFAULT 0,
  times_correct INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quiz_bank_course ON public.quiz_bank(course_id);
CREATE INDEX idx_quiz_bank_user ON public.quiz_bank(user_id);

ALTER TABLE public.quiz_bank ENABLE ROW LEVEL SECURITY;

-- Lecture : seul le propriétaire voit ses questions
CREATE POLICY "read own quiz bank"
  ON public.quiz_bank
  FOR SELECT
  USING (auth.uid() = user_id);

-- Mise à jour : le propriétaire peut incrémenter times_shown / times_correct
CREATE POLICY "update own quiz bank stats"
  ON public.quiz_bank
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- INSERT/DELETE bloqués côté client : seules les edge functions (service role) peuvent écrire
-- (pas de policy INSERT/DELETE = refusé par RLS)

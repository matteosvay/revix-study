-- Recreate flashcards table with full SM-2 spaced repetition fields.
-- The previous table was dropped (migration 20260424142607); this restores it
-- with the SM-2 scheduling columns needed for the study session feature.

CREATE TABLE IF NOT EXISTS public.flashcards (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  front           TEXT        NOT NULL,
  back            TEXT        NOT NULL,
  position        INT         NOT NULL DEFAULT 0,
  -- SM-2 scheduling
  ease            FLOAT       NOT NULL DEFAULT 2.5,
  interval_days   INT         NOT NULL DEFAULT 0,
  repetitions     INT         NOT NULL DEFAULT 0,
  lapses          INT         NOT NULL DEFAULT 0,
  due_at          DATE,                          -- NULL = new card, due immediately
  last_reviewed_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own flashcards all"
  ON public.flashcards FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_flashcards_course   ON public.flashcards(course_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_due      ON public.flashcards(user_id, due_at);
CREATE INDEX IF NOT EXISTS idx_flashcards_user     ON public.flashcards(user_id);

-- RPC: get cards due for review for a user (due today or new cards)
CREATE OR REPLACE FUNCTION public.get_due_flashcards(p_user_id UUID, p_limit INT DEFAULT 20)
RETURNS SETOF public.flashcards
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT * FROM public.flashcards
  WHERE user_id = p_user_id
    AND (due_at IS NULL OR due_at <= CURRENT_DATE)
  ORDER BY COALESCE(due_at, '1970-01-01'::date), position
  LIMIT p_limit;
$$;

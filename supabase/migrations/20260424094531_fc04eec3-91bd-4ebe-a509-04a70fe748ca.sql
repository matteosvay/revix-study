-- Coach chat history
CREATE TABLE public.coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coach_messages_user_created ON public.coach_messages(user_id, created_at DESC);

ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own coach messages all"
  ON public.coach_messages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Saved coach tips
CREATE TABLE public.coach_saved_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT false,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coach_saved_tips_user ON public.coach_saved_tips(user_id, pinned DESC, created_at DESC);

ALTER TABLE public.coach_saved_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own saved tips all"
  ON public.coach_saved_tips FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
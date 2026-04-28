CREATE TABLE public.usage_counters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('fiche', 'quiz_ia', 'coach', 'correction', 'planning')),
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly')),
  period_key TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, action_type, period_type, period_key)
);

CREATE INDEX idx_usage_counters_lookup
  ON public.usage_counters(user_id, action_type, period_type, period_key);

ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage"
  ON public.usage_counters
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.check_and_increment_usage(
  p_user_id UUID,
  p_action_type TEXT,
  p_daily_limit INTEGER,
  p_weekly_limit INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today TEXT := to_char(now() AT TIME ZONE 'Europe/Paris', 'YYYY-MM-DD');
  v_week  TEXT := to_char(now() AT TIME ZONE 'Europe/Paris', 'IYYY-"W"IW');
  v_daily_count INTEGER := 0;
  v_weekly_count INTEGER := 0;
BEGIN
  SELECT COALESCE(count, 0) INTO v_daily_count
    FROM public.usage_counters
   WHERE user_id = p_user_id AND action_type = p_action_type
     AND period_type = 'daily' AND period_key = v_today;

  SELECT COALESCE(count, 0) INTO v_weekly_count
    FROM public.usage_counters
   WHERE user_id = p_user_id AND action_type = p_action_type
     AND period_type = 'weekly' AND period_key = v_week;

  IF v_daily_count >= p_daily_limit THEN
    RETURN jsonb_build_object(
      'allowed', false, 'reason', 'daily_limit',
      'current', v_daily_count, 'limit', p_daily_limit,
      'daily_used', v_daily_count, 'daily_limit', p_daily_limit,
      'weekly_used', v_weekly_count, 'weekly_limit', p_weekly_limit
    );
  END IF;

  IF v_weekly_count >= p_weekly_limit THEN
    RETURN jsonb_build_object(
      'allowed', false, 'reason', 'weekly_limit',
      'current', v_weekly_count, 'limit', p_weekly_limit,
      'daily_used', v_daily_count, 'daily_limit', p_daily_limit,
      'weekly_used', v_weekly_count, 'weekly_limit', p_weekly_limit
    );
  END IF;

  INSERT INTO public.usage_counters (user_id, action_type, period_type, period_key, count)
  VALUES (p_user_id, p_action_type, 'daily', v_today, 1)
  ON CONFLICT (user_id, action_type, period_type, period_key)
  DO UPDATE SET count = usage_counters.count + 1, updated_at = now();

  INSERT INTO public.usage_counters (user_id, action_type, period_type, period_key, count)
  VALUES (p_user_id, p_action_type, 'weekly', v_week, 1)
  ON CONFLICT (user_id, action_type, period_type, period_key)
  DO UPDATE SET count = usage_counters.count + 1, updated_at = now();

  RETURN jsonb_build_object(
    'allowed', true,
    'daily_used', v_daily_count + 1, 'daily_limit', p_daily_limit,
    'weekly_used', v_weekly_count + 1, 'weekly_limit', p_weekly_limit
  );
END;
$$;
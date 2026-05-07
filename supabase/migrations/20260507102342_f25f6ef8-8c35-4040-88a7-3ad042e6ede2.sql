-- 1. profiles.plan : élargir le CHECK
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('gratuit','free','pro','max','premium'));

-- 2. usage_counters.action_type : élargir le CHECK
ALTER TABLE public.usage_counters DROP CONSTRAINT IF EXISTS usage_counters_action_type_check;
ALTER TABLE public.usage_counters
  ADD CONSTRAINT usage_counters_action_type_check
  CHECK (action_type IN ('fiche','quiz_ia','coach','correction','planning','oral','transcription'));

-- 3. award_xp : whitelist + plafond
CREATE OR REPLACE FUNCTION public.award_xp(p_user_id uuid, p_amount integer, p_reason text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_new_total integer; v_new_week integer; v_old_level integer;
  v_new_level integer := 1; v_week_start date; v_today date := CURRENT_DATE;
  v_max_amount integer;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  v_max_amount := CASE p_reason
    WHEN 'course_upload'        THEN 60
    WHEN 'quiz_finish'          THEN 300
    WHEN 'srs_session'          THEN 700
    WHEN 'coach:plan_imported'  THEN 80
    WHEN 'coach:plan_generated' THEN 30
    WHEN 'coach:tip_saved'      THEN 10
    WHEN 'coach:question'       THEN 5
    WHEN 'first_login_today'    THEN 10
    WHEN 'streak_milestone'     THEN 100
    ELSE NULL
  END;
  IF v_max_amount IS NULL THEN
    RAISE EXCEPTION 'invalid_xp_reason: %', p_reason;
  END IF;
  IF p_amount IS NULL OR p_amount < 0 OR p_amount > v_max_amount THEN
    RAISE EXCEPTION 'xp_amount_out_of_range_for_reason: amount=% reason=% max=%', p_amount, p_reason, v_max_amount;
  END IF;
  SELECT week_started_at, level INTO v_week_start, v_old_level FROM profiles WHERE id = p_user_id;
  IF v_week_start IS NULL OR v_week_start < (v_today - ((EXTRACT(DOW FROM v_today)::int + 6) % 7)) THEN
    UPDATE profiles SET xp_week = 0, week_started_at = v_today - ((EXTRACT(DOW FROM v_today)::int + 6) % 7)
      WHERE id = p_user_id;
  END IF;
  UPDATE profiles SET xp_total = xp_total + p_amount, xp_week = xp_week + GREATEST(p_amount, 0)
    WHERE id = p_user_id RETURNING xp_total, xp_week INTO v_new_total, v_new_week;
  WHILE v_new_level < 50 AND v_new_total >= public.xp_for_level(v_new_level + 1) LOOP
    v_new_level := v_new_level + 1;
  END LOOP;
  IF v_new_level <> v_old_level THEN
    UPDATE profiles SET level = v_new_level WHERE id = p_user_id;
  END IF;
  INSERT INTO xp_events (user_id, amount, reason) VALUES (p_user_id, p_amount, p_reason);
  RETURN jsonb_build_object(
    'xp_total',   v_new_total,
    'xp_week',    v_new_week,
    'level',      v_new_level,
    'leveled_up', v_new_level > v_old_level,
    'old_level',  v_old_level
  );
END;
$function$;

-- 4. restore_streak : pro + max
CREATE OR REPLACE FUNCTION public.restore_streak(p_user_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_plan text; v_tokens int; v_record int; v_last date; v_today date := CURRENT_DATE;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT plan, streak_tokens, streak_record, last_active_date
    INTO v_plan, v_tokens, v_record, v_last
    FROM public.profiles WHERE id = p_user_id;
  IF v_plan NOT IN ('pro','max') THEN
    RETURN jsonb_build_object('success', false, 'error', 'pro_required');
  END IF;
  IF v_tokens < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_tokens');
  END IF;
  IF v_last IS NULL OR v_last >= v_today - 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_broken_streak');
  END IF;
  UPDATE public.profiles
    SET streak_tokens   = streak_tokens - 1,
        streak_days     = GREATEST(streak_days, v_record),
        last_active_date = v_today - 1
    WHERE id = p_user_id;
  RETURN jsonb_build_object('success', true, 'tokens_left', v_tokens - 1);
END;
$function$;

-- 5. subscriptions.tier
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS tier text
  CHECK (tier IS NULL OR tier IN ('free','pro','max'));

UPDATE public.subscriptions
SET tier = CASE
  WHEN price_id LIKE 'max%' THEN 'max'
  WHEN price_id LIKE 'pro%' THEN 'pro'
  ELSE 'free'
END
WHERE tier IS NULL;

-- 6. get_user_tier
CREATE OR REPLACE FUNCTION public.get_user_tier(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_tier text;
  active_price text;
BEGIN
  SELECT tier, price_id INTO active_tier, active_price
  FROM public.subscriptions
  WHERE user_id = user_uuid
    AND (
      (status IN ('active', 'trialing', 'past_due')
        AND (current_period_end IS NULL OR current_period_end > now()))
      OR (status = 'canceled' AND current_period_end > now())
    )
  ORDER BY created_at DESC
  LIMIT 1;
  IF active_tier IN ('pro','max') THEN
    RETURN active_tier;
  END IF;
  IF active_price LIKE 'max%' THEN RETURN 'max'; END IF;
  IF active_price LIKE 'pro%' THEN RETURN 'pro'; END IF;
  RETURN 'free';
END;
$$;

-- 7. processed_webhook_events
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  event_id     text PRIMARY KEY,
  source       text NOT NULL DEFAULT 'stripe',
  event_type   text,
  received_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at
  ON public.processed_webhook_events(received_at);
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only read"   ON public.processed_webhook_events FOR SELECT TO authenticated USING (false);
CREATE POLICY "service role only write"  ON public.processed_webhook_events FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "service role only update" ON public.processed_webhook_events FOR UPDATE TO authenticated USING (false);
CREATE POLICY "service role only delete" ON public.processed_webhook_events FOR DELETE TO authenticated USING (false);
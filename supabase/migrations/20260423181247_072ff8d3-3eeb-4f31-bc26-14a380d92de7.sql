
-- Profile gamification fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp_total integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS xp_week integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS league text NOT NULL DEFAULT 'bronze',
  ADD COLUMN IF NOT EXISTS week_started_at date;

-- User quests (daily + weekly)
CREATE TABLE IF NOT EXISTS public.user_quests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  quest_key text NOT NULL,
  quest_type text NOT NULL CHECK (quest_type IN ('daily','weekly')),
  title text NOT NULL,
  description text,
  emoji text,
  target integer NOT NULL DEFAULT 1,
  progress integer NOT NULL DEFAULT 0,
  xp_reward integer NOT NULL DEFAULT 50,
  completed boolean NOT NULL DEFAULT false,
  claimed boolean NOT NULL DEFAULT false,
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_quests_user ON public.user_quests(user_id, quest_type, period_end);
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own quests all" ON public.user_quests;
CREATE POLICY "own quests all" ON public.user_quests FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  badge_key text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own badges all" ON public.user_badges;
CREATE POLICY "own badges all" ON public.user_badges FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User inventory (shop items)
CREATE TABLE IF NOT EXISTS public.user_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  item_key text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_key)
);
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own inventory all" ON public.user_inventory;
CREATE POLICY "own inventory all" ON public.user_inventory FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- XP events history
CREATE TABLE IF NOT EXISTS public.xp_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_xp_events_user ON public.xp_events(user_id, created_at DESC);
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own xp events all" ON public.xp_events;
CREATE POLICY "own xp events all" ON public.xp_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Fn: XP needed to reach a level (L2=200, then +150/level)
CREATE OR REPLACE FUNCTION public.xp_for_level(p_level integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_level <= 1 THEN 0
    ELSE 200 * (p_level - 1) + 75 * (p_level - 1) * (p_level - 2)
  END;
$$;

-- Fn: award XP and recompute level
CREATE OR REPLACE FUNCTION public.award_xp(p_user_id uuid, p_amount integer, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_total integer;
  v_new_week integer;
  v_old_level integer;
  v_new_level integer := 1;
  v_week_start date;
  v_today date := CURRENT_DATE;
BEGIN
  -- reset weekly XP if new week (monday)
  SELECT week_started_at, level INTO v_week_start, v_old_level FROM profiles WHERE id = p_user_id;
  IF v_week_start IS NULL OR v_week_start < (v_today - ((EXTRACT(DOW FROM v_today)::int + 6) % 7)) THEN
    UPDATE profiles SET xp_week = 0, week_started_at = v_today - ((EXTRACT(DOW FROM v_today)::int + 6) % 7) WHERE id = p_user_id;
  END IF;

  UPDATE profiles
    SET xp_total = xp_total + p_amount,
        xp_week = xp_week + GREATEST(p_amount, 0)
    WHERE id = p_user_id
    RETURNING xp_total, xp_week INTO v_new_total, v_new_week;

  -- compute new level (cap 50)
  WHILE v_new_level < 50 AND v_new_total >= public.xp_for_level(v_new_level + 1) LOOP
    v_new_level := v_new_level + 1;
  END LOOP;

  IF v_new_level <> v_old_level THEN
    UPDATE profiles SET level = v_new_level WHERE id = p_user_id;
  END IF;

  INSERT INTO xp_events (user_id, amount, reason) VALUES (p_user_id, p_amount, p_reason);

  RETURN jsonb_build_object(
    'xp_total', v_new_total,
    'xp_week', v_new_week,
    'level', v_new_level,
    'leveled_up', v_new_level > v_old_level,
    'old_level', v_old_level
  );
END;
$$;

-- Fn: bump quest progress
CREATE OR REPLACE FUNCTION public.bump_quest(p_user_id uuid, p_quest_key text, p_inc integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quest record;
  v_xp_result jsonb;
BEGIN
  SELECT * INTO v_quest FROM user_quests
    WHERE user_id = p_user_id
      AND quest_key = p_quest_key
      AND completed = false
      AND period_end >= CURRENT_DATE
    ORDER BY period_end ASC
    LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('updated', false);
  END IF;

  UPDATE user_quests
    SET progress = LEAST(progress + p_inc, target),
        completed = (progress + p_inc) >= target
    WHERE id = v_quest.id;

  IF (v_quest.progress + p_inc) >= v_quest.target AND NOT v_quest.claimed THEN
    UPDATE user_quests SET claimed = true WHERE id = v_quest.id;
    v_xp_result := public.award_xp(p_user_id, v_quest.xp_reward, 'quest:' || v_quest.quest_key);
    RETURN jsonb_build_object('updated', true, 'completed', true, 'xp', v_xp_result);
  END IF;

  RETURN jsonb_build_object('updated', true, 'completed', false);
END;
$$;

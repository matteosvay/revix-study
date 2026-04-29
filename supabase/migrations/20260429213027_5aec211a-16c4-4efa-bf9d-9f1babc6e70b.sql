-- 1) Supprimer les questions de type ouvert/trous existantes (et quiz vides résultants)
DELETE FROM public.quiz_questions WHERE type IN ('ouvert', 'trous');
DELETE FROM public.quizzes q
  WHERE NOT EXISTS (SELECT 1 FROM public.quiz_questions qq WHERE qq.quiz_id = q.id);

-- 2) Loot box stackable : nouvelle colonne pending
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS quiz_loot_box_pending integer NOT NULL DEFAULT 0;

-- Migrer l'état existant : pending = max(0, floor(qc/5) - claimed)
UPDATE public.profiles
   SET quiz_loot_box_pending = GREATEST(0, FLOOR(COALESCE(quiz_completed_count,0)::numeric / 5)::int - COALESCE(quiz_loot_box_claimed_count,0));

-- 3) increment_quiz_count : à chaque palier de 5, +1 pending box
CREATE OR REPLACE FUNCTION public.increment_quiz_count(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_count int;
  v_new_count int;
  v_old_milestones int;
  v_new_milestones int;
  v_earned_token boolean := false;
  v_earned_box boolean := false;
BEGIN
  IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT COALESCE(quiz_completed_count, 0) INTO v_old_count FROM public.profiles WHERE id = p_user_id;
  v_new_count := v_old_count + 1;

  -- Pass de restauration tous les 10 quiz (existant)
  IF (v_old_count / 10) <> (v_new_count / 10) THEN
    v_earned_token := true;
    UPDATE public.profiles
       SET quiz_completed_count = v_new_count,
           streak_tokens = LEAST(COALESCE(streak_tokens,0) + 1, 5)
     WHERE id = p_user_id;
  ELSE
    UPDATE public.profiles SET quiz_completed_count = v_new_count WHERE id = p_user_id;
  END IF;

  -- Boîte bonus tous les 5 quiz : ajoute aux pending (stackable)
  v_old_milestones := v_old_count / 5;
  v_new_milestones := v_new_count / 5;
  IF v_new_milestones > v_old_milestones THEN
    v_earned_box := true;
    UPDATE public.profiles
       SET quiz_loot_box_pending = COALESCE(quiz_loot_box_pending, 0) + (v_new_milestones - v_old_milestones)
     WHERE id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'earned', v_earned_token,
    'earned_box', v_earned_box,
    'count', v_new_count
  );
END;
$$;

-- 4) open_quiz_bonus_loot_box : utilise pending au lieu de claimed
CREATE OR REPLACE FUNCTION public.open_quiz_bonus_loot_box()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_pending int;
  v_xp_bonus int;
  v_streak_token boolean := false;
  v_powerup_key text := NULL;
  v_cosmetic_key text := NULL;
  v_cosmetic_name text := NULL;
  v_cosmetic_emoji text := NULL;
  v_cosmetic_rarity text := NULL;
  v_cosmetic_category text := NULL;
  v_pool text[] := ARRAY['power_5050','power_skip','power_time'];
  v_cosmetic_roll int;
  v_rarity_roll int;
  v_target_rarity text;
  v_xp_result jsonb;
  v_rewards jsonb;
  v_pick record;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT COALESCE(quiz_loot_box_pending, 0) INTO v_pending FROM profiles WHERE id = v_user;

  IF v_pending <= 0 THEN
    RETURN jsonb_build_object('eligible', false, 'remaining', 0);
  END IF;

  v_xp_bonus := 30 + (random() * 90)::int;

  IF random() < 0.05 THEN
    v_streak_token := true;
    UPDATE profiles SET streak_tokens = LEAST(streak_tokens + 1, 5) WHERE id = v_user;
  END IF;

  IF random() < 0.75 THEN
    v_powerup_key := v_pool[1 + floor(random() * 3)::int];
    IF v_powerup_key IS NOT NULL THEN
      INSERT INTO user_inventory(user_id, item_key, quantity)
      VALUES (v_user, v_powerup_key, 1)
      ON CONFLICT (user_id, item_key) DO UPDATE SET quantity = user_inventory.quantity + 1;
    END IF;
  END IF;

  v_cosmetic_roll := (random() * 100)::int;
  IF v_cosmetic_roll < 90 THEN
    v_rarity_roll := (random() * 100)::int;
    v_target_rarity := CASE
      WHEN v_rarity_roll < 55 THEN 'common'
      WHEN v_rarity_roll < 83 THEN 'rare'
      WHEN v_rarity_roll < 96 THEN 'epic'
      ELSE 'legendary'
    END;

    SELECT ci.item_key, ci.name, ci.emoji, ci.rarity, ci.category INTO v_pick
    FROM cosmetic_items ci
    WHERE ci.unlockable_in_loot = true
      AND ci.rarity = v_target_rarity
      AND NOT EXISTS (SELECT 1 FROM user_cosmetics uc WHERE uc.user_id = v_user AND uc.item_key = ci.item_key)
    ORDER BY random() LIMIT 1;

    IF NOT FOUND THEN
      SELECT ci.item_key, ci.name, ci.emoji, ci.rarity, ci.category INTO v_pick
      FROM cosmetic_items ci
      WHERE ci.unlockable_in_loot = true
        AND NOT EXISTS (SELECT 1 FROM user_cosmetics uc WHERE uc.user_id = v_user AND uc.item_key = ci.item_key)
      ORDER BY random() LIMIT 1;
    END IF;

    IF FOUND THEN
      v_cosmetic_key := v_pick.item_key;
      v_cosmetic_name := v_pick.name;
      v_cosmetic_emoji := v_pick.emoji;
      v_cosmetic_rarity := v_pick.rarity;
      v_cosmetic_category := v_pick.category;
      INSERT INTO user_cosmetics(user_id, item_key, acquired_via)
      VALUES (v_user, v_cosmetic_key, 'loot');
    ELSE
      v_xp_bonus := v_xp_bonus + 50;
    END IF;
  END IF;

  v_xp_result := public._award_xp_internal(v_user, v_xp_bonus, 'quiz_bonus_loot_box');

  v_rewards := jsonb_build_object(
    'xp', v_xp_bonus,
    'streak_token', v_streak_token,
    'powerup', v_powerup_key,
    'cosmetic', CASE WHEN v_cosmetic_key IS NOT NULL THEN
      jsonb_build_object('key', v_cosmetic_key, 'name', v_cosmetic_name, 'emoji', v_cosmetic_emoji, 'rarity', v_cosmetic_rarity, 'category', v_cosmetic_category)
    ELSE NULL END
  );

  -- Décrémente une boîte du stock + maintient claimed_count cohérent
  UPDATE profiles
     SET quiz_loot_box_pending = quiz_loot_box_pending - 1,
         quiz_loot_box_claimed_count = COALESCE(quiz_loot_box_claimed_count, 0) + 1
   WHERE id = v_user;

  RETURN jsonb_build_object(
    'eligible', true,
    'rewards', v_rewards,
    'remaining', v_pending - 1,
    'xp_result', v_xp_result
  );
END;
$$;

-- 5) Cron : auto-suppression des quiz de plus de 7 jours
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.cleanup_old_quizzes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  WITH deleted AS (
    DELETE FROM public.quizzes
     WHERE created_at < (now() - interval '7 days')
     RETURNING id
  )
  SELECT count(*) INTO v_count FROM deleted;
  RETURN v_count;
END;
$$;

-- Planification quotidienne à 03:15 UTC (idempotent)
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-old-quizzes-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'cleanup-old-quizzes-daily',
  '15 3 * * *',
  $$ SELECT public.cleanup_old_quizzes(); $$
);
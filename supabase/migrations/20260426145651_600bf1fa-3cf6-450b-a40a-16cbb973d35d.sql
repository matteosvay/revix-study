CREATE OR REPLACE FUNCTION public.open_quiz_bonus_loot_box()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_quiz_count int;
  v_claimed int;
  v_eligible int;
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

  SELECT quiz_completed_count, quiz_loot_box_claimed_count
    INTO v_quiz_count, v_claimed
  FROM profiles WHERE id = v_user;

  v_eligible := GREATEST(0, FLOOR(COALESCE(v_quiz_count,0) / 5)::int - COALESCE(v_claimed,0));

  IF v_eligible <= 0 THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'remaining', 0,
      'next_at', (FLOOR(COALESCE(v_quiz_count,0) / 5)::int + 1) * 5,
      'quiz_count', COALESCE(v_quiz_count,0)
    );
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

  UPDATE profiles
    SET quiz_loot_box_claimed_count = COALESCE(quiz_loot_box_claimed_count,0) + 1
    WHERE id = v_user;

  v_eligible := v_eligible - 1;

  RETURN jsonb_build_object(
    'eligible', true,
    'rewards', v_rewards,
    'remaining', v_eligible,
    'quiz_count', COALESCE(v_quiz_count,0),
    'xp_result', v_xp_result
  );
END; $function$;
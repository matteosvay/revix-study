-- Rebalance loot box: streak token now ultra-rare (5%)
CREATE OR REPLACE FUNCTION public.open_daily_loot_box()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_today date := CURRENT_DATE;
  v_existing record;
  v_xp_bonus int;
  v_streak_token boolean := false;
  v_powerup_key text := NULL;
  v_cosmetic record;
  v_pool text[] := ARRAY['power_5050','power_skip','power_time'];
  v_cosmetic_roll int;
  v_rarity_roll int;
  v_target_rarity text;
  v_xp_result jsonb;
  v_rewards jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT * INTO v_existing FROM daily_loot_box WHERE user_id = v_user AND open_date = v_today;
  IF FOUND THEN
    RETURN jsonb_build_object('already_opened', true, 'rewards', v_existing.rewards);
  END IF;

  v_xp_bonus := 30 + (random() * 90)::int;

  IF random() < 0.05 THEN
    v_streak_token := true;
    UPDATE profiles SET streak_tokens = LEAST(streak_tokens + 1, 5) WHERE id = v_user;
  END IF;

  IF random() < 0.75 THEN
    v_powerup_key := v_pool[1 + (random() * 3)::int];
    INSERT INTO user_inventory(user_id, item_key, quantity)
    VALUES (v_user, v_powerup_key, 1)
    ON CONFLICT (user_id, item_key) DO UPDATE SET quantity = user_inventory.quantity + 1;
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

    SELECT ci.* INTO v_cosmetic
    FROM cosmetic_items ci
    WHERE ci.unlockable_in_loot = true
      AND ci.rarity = v_target_rarity
      AND NOT EXISTS (SELECT 1 FROM user_cosmetics uc WHERE uc.user_id = v_user AND uc.item_key = ci.item_key)
    ORDER BY random() LIMIT 1;

    IF NOT FOUND THEN
      SELECT ci.* INTO v_cosmetic
      FROM cosmetic_items ci
      WHERE ci.unlockable_in_loot = true
        AND NOT EXISTS (SELECT 1 FROM user_cosmetics uc WHERE uc.user_id = v_user AND uc.item_key = ci.item_key)
      ORDER BY random() LIMIT 1;
    END IF;

    IF FOUND THEN
      INSERT INTO user_cosmetics(user_id, item_key, acquired_via) VALUES (v_user, v_cosmetic.item_key, 'loot');
    ELSE
      v_xp_bonus := v_xp_bonus + 50;
    END IF;
  END IF;

  v_xp_result := public._award_xp_internal(v_user, v_xp_bonus, 'loot_box');

  v_rewards := jsonb_build_object(
    'xp', v_xp_bonus,
    'streak_token', v_streak_token,
    'powerup', v_powerup_key,
    'cosmetic', CASE WHEN v_cosmetic.item_key IS NOT NULL THEN
      jsonb_build_object('key', v_cosmetic.item_key, 'name', v_cosmetic.name, 'emoji', v_cosmetic.emoji, 'rarity', v_cosmetic.rarity, 'category', v_cosmetic.category)
    ELSE NULL END
  );

  INSERT INTO daily_loot_box(user_id, open_date, rewards) VALUES (v_user, v_today, v_rewards);
  UPDATE profiles SET last_loot_box_at = v_today WHERE id = v_user;

  RETURN jsonb_build_object('already_opened', false, 'rewards', v_rewards, 'xp_result', v_xp_result);
END; $function$;

CREATE OR REPLACE FUNCTION public.get_my_cosmetics_inventory()
 RETURNS TABLE(
   item_key text, name text, description text, emoji text,
   category text, rarity text,
   acquired_at timestamptz, acquired_via text, equipped boolean
 )
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    ci.item_key, ci.name, ci.description, ci.emoji, ci.category, ci.rarity,
    uc.acquired_at, uc.acquired_via,
    (
      (ci.category = 'frame'      AND p.equipped_frame      = ci.item_key) OR
      (ci.category = 'background' AND p.equipped_background = ci.item_key) OR
      (ci.category = 'sticker'    AND p.equipped_sticker    = ci.item_key) OR
      (ci.category = 'title'      AND p.equipped_title      = ci.item_key)
    ) AS equipped
  FROM user_cosmetics uc
  JOIN cosmetic_items ci ON ci.item_key = uc.item_key
  JOIN profiles p ON p.id = uc.user_id
  WHERE uc.user_id = auth.uid()
  ORDER BY
    CASE ci.rarity WHEN 'legendary' THEN 0 WHEN 'epic' THEN 1 WHEN 'rare' THEN 2 ELSE 3 END,
    uc.acquired_at DESC;
$function$;

DROP FUNCTION IF EXISTS public.get_public_profile(uuid);
CREATE FUNCTION public.get_public_profile(p_user_id uuid)
 RETURNS TABLE(
   id uuid, display_name text, username text, student_code text,
   avatar_url text, bio text, level integer, cursus text, formation text,
   streak_days integer, streak_record integer, xp_total integer, xp_week integer,
   equipped_frame text, equipped_background text, equipped_sticker text, equipped_title text,
   title_name text, title_emoji text, title_rarity text,
   sticker_emoji text, sticker_rarity text
 )
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    p.id, p.display_name, p.username, p.student_code, p.avatar_url, p.bio,
    p.level, p.cursus, p.formation, p.streak_days, p.streak_record, p.xp_total, p.xp_week,
    p.equipped_frame, p.equipped_background, p.equipped_sticker, p.equipped_title,
    t.name, t.emoji, t.rarity,
    s.emoji, s.rarity
  FROM public.profiles p
  LEFT JOIN public.cosmetic_items t ON t.item_key = p.equipped_title    AND t.category = 'title'
  LEFT JOIN public.cosmetic_items s ON s.item_key = p.equipped_sticker  AND s.category = 'sticker'
  WHERE auth.uid() IS NOT NULL AND p.id = p_user_id;
$function$;
-- ===== TABLE: daily_loot_box =====
CREATE TABLE public.daily_loot_box (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  opened_at timestamp with time zone NOT NULL DEFAULT now(),
  open_date date NOT NULL DEFAULT CURRENT_DATE,
  rewards jsonb NOT NULL,
  UNIQUE (user_id, open_date)
);
ALTER TABLE public.daily_loot_box ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own loot" ON public.daily_loot_box FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "no direct insert loot" ON public.daily_loot_box FOR INSERT TO authenticated WITH CHECK (false);

-- ===== TABLE: cosmetic_items =====
CREATE TABLE public.cosmetic_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_key text UNIQUE NOT NULL,
  category text NOT NULL CHECK (category IN ('sticker','frame','background')),
  name text NOT NULL,
  description text,
  emoji text,
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary')),
  price_xp integer NOT NULL DEFAULT 0,
  unlockable_in_loot boolean NOT NULL DEFAULT true,
  preview_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.cosmetic_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can browse catalog" ON public.cosmetic_items FOR SELECT USING (true);

-- ===== TABLE: user_cosmetics =====
CREATE TABLE public.user_cosmetics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_key text NOT NULL,
  acquired_at timestamp with time zone NOT NULL DEFAULT now(),
  acquired_via text NOT NULL DEFAULT 'shop' CHECK (acquired_via IN ('shop','loot','quest','gift','starter')),
  UNIQUE (user_id, item_key)
);
ALTER TABLE public.user_cosmetics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own cosmetics" ON public.user_cosmetics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "no direct insert cosmetics" ON public.user_cosmetics FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "no direct delete cosmetics" ON public.user_cosmetics FOR DELETE TO authenticated USING (false);

-- ===== TABLE: push_subscriptions =====
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_used_at timestamp with time zone,
  UNIQUE (user_id, endpoint)
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "manage own subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===== ALTER profiles =====
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS equipped_frame text,
  ADD COLUMN IF NOT EXISTS equipped_background text,
  ADD COLUMN IF NOT EXISTS equipped_sticker text,
  ADD COLUMN IF NOT EXISTS last_loot_box_at date,
  ADD COLUMN IF NOT EXISTS push_enabled boolean NOT NULL DEFAULT false;

-- ===== ALTER quiz_attempts =====
ALTER TABLE public.quiz_attempts
  ADD COLUMN IF NOT EXISTS max_combo integer NOT NULL DEFAULT 0;

-- ===== FUNCTION: open_daily_loot_box =====
CREATE OR REPLACE FUNCTION public.open_daily_loot_box()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_today date := CURRENT_DATE;
  v_existing record;
  v_xp_bonus int;
  v_streak_token boolean := false;
  v_powerup_key text := NULL;
  v_cosmetic record;
  v_pool text[] := ARRAY['power_5050','power_skip','power_time'];
  v_rarity_roll int;
  v_xp_result jsonb;
  v_rewards jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  -- Already opened today?
  SELECT * INTO v_existing FROM daily_loot_box WHERE user_id = v_user AND open_date = v_today;
  IF FOUND THEN
    RETURN jsonb_build_object('already_opened', true, 'rewards', v_existing.rewards);
  END IF;

  -- Roll XP bonus 20-80
  v_xp_bonus := 20 + (random() * 60)::int;

  -- 30% chance to get a streak token
  IF random() < 0.30 THEN
    v_streak_token := true;
    UPDATE profiles SET streak_tokens = LEAST(streak_tokens + 1, 5) WHERE id = v_user;
  END IF;

  -- 60% chance to get a power-up
  IF random() < 0.60 THEN
    v_powerup_key := v_pool[1 + (random() * 3)::int];
    INSERT INTO user_inventory(user_id, item_key, quantity)
    VALUES (v_user, v_powerup_key, 1)
    ON CONFLICT (user_id, item_key) DO UPDATE SET quantity = user_inventory.quantity + 1;
  END IF;

  -- 25% chance to drop a cosmetic (prefer ones not owned)
  v_rarity_roll := (random() * 100)::int;
  IF v_rarity_roll < 25 THEN
    SELECT ci.* INTO v_cosmetic
    FROM cosmetic_items ci
    WHERE ci.unlockable_in_loot = true
      AND NOT EXISTS (SELECT 1 FROM user_cosmetics uc WHERE uc.user_id = v_user AND uc.item_key = ci.item_key)
      AND ci.rarity IN (
        CASE WHEN v_rarity_roll < 15 THEN 'common'
             WHEN v_rarity_roll < 22 THEN 'rare'
             WHEN v_rarity_roll < 24 THEN 'epic'
             ELSE 'legendary' END
      )
    ORDER BY random() LIMIT 1;

    IF FOUND THEN
      INSERT INTO user_cosmetics(user_id, item_key, acquired_via) VALUES (v_user, v_cosmetic.item_key, 'loot');
    END IF;
  END IF;

  -- Award XP
  v_xp_result := public._award_xp_internal(v_user, v_xp_bonus, 'loot_box');

  -- Build rewards JSON
  v_rewards := jsonb_build_object(
    'xp', v_xp_bonus,
    'streak_token', v_streak_token,
    'powerup', v_powerup_key,
    'cosmetic', CASE WHEN v_cosmetic.item_key IS NOT NULL THEN
      jsonb_build_object('key', v_cosmetic.item_key, 'name', v_cosmetic.name, 'emoji', v_cosmetic.emoji, 'rarity', v_cosmetic.rarity, 'category', v_cosmetic.category)
    ELSE NULL END
  );

  -- Persist
  INSERT INTO daily_loot_box(user_id, open_date, rewards) VALUES (v_user, v_today, v_rewards);
  UPDATE profiles SET last_loot_box_at = v_today WHERE id = v_user;

  RETURN jsonb_build_object('already_opened', false, 'rewards', v_rewards, 'xp_result', v_xp_result);
END; $$;

-- ===== FUNCTION: buy_cosmetic =====
CREATE OR REPLACE FUNCTION public.buy_cosmetic(p_item_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_item record;
  v_xp int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT * INTO v_item FROM cosmetic_items WHERE item_key = p_item_key;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'item_not_found'); END IF;

  IF EXISTS (SELECT 1 FROM user_cosmetics WHERE user_id = v_user AND item_key = p_item_key) THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_owned');
  END IF;

  SELECT xp_total INTO v_xp FROM profiles WHERE id = v_user;
  IF v_xp < v_item.price_xp THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_xp', 'price', v_item.price_xp, 'have', v_xp);
  END IF;

  UPDATE profiles SET xp_total = xp_total - v_item.price_xp WHERE id = v_user;
  INSERT INTO user_cosmetics(user_id, item_key, acquired_via) VALUES (v_user, p_item_key, 'shop');
  INSERT INTO xp_events(user_id, amount, reason) VALUES (v_user, -v_item.price_xp, 'shop:' || p_item_key);

  RETURN jsonb_build_object('success', true, 'item_key', p_item_key, 'remaining_xp', v_xp - v_item.price_xp);
END; $$;

-- ===== FUNCTION: equip_cosmetic =====
CREATE OR REPLACE FUNCTION public.equip_cosmetic(p_item_key text, p_category text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_owned boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  IF p_item_key IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM user_cosmetics WHERE user_id = v_user AND item_key = p_item_key) INTO v_owned;
    IF NOT v_owned THEN RETURN jsonb_build_object('success', false, 'error', 'not_owned'); END IF;
  END IF;

  IF p_category = 'frame' THEN
    UPDATE profiles SET equipped_frame = p_item_key WHERE id = v_user;
  ELSIF p_category = 'background' THEN
    UPDATE profiles SET equipped_background = p_item_key WHERE id = v_user;
  ELSIF p_category = 'sticker' THEN
    UPDATE profiles SET equipped_sticker = p_item_key WHERE id = v_user;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'invalid_category');
  END IF;

  RETURN jsonb_build_object('success', true);
END; $$;

-- ===== FUNCTION: consume_powerup =====
CREATE OR REPLACE FUNCTION public.consume_powerup(p_powerup_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_qty int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_powerup_key NOT IN ('power_5050','power_skip','power_time') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_powerup');
  END IF;

  SELECT quantity INTO v_qty FROM user_inventory WHERE user_id = v_user AND item_key = p_powerup_key;
  IF v_qty IS NULL OR v_qty < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_powerup');
  END IF;

  IF v_qty = 1 THEN
    DELETE FROM user_inventory WHERE user_id = v_user AND item_key = p_powerup_key;
  ELSE
    UPDATE user_inventory SET quantity = quantity - 1 WHERE user_id = v_user AND item_key = p_powerup_key;
  END IF;

  RETURN jsonb_build_object('success', true, 'remaining', GREATEST(v_qty - 1, 0));
END; $$;

-- ===== Allow user_inventory inserts via SECURITY DEFINER funcs only =====
-- (Already restricted to no direct insert, so all good.)

-- ===== Seed catalog =====
INSERT INTO public.cosmetic_items (item_key, category, name, emoji, rarity, price_xp, description) VALUES
  ('sticker_fire','sticker','Flamme','🔥','common',150,'Pour les streakers'),
  ('sticker_brain','sticker','Cerveau','🧠','common',150,'Le sticker du cracker'),
  ('sticker_rocket','sticker','Fusée','🚀','rare',400,'Décollage immédiat'),
  ('sticker_crown','sticker','Couronne','👑','epic',900,'Pour les rois du quiz'),
  ('sticker_diamond','sticker','Diamant','💎','legendary',2000,'Rare comme un 20/20'),
  ('frame_paper','frame','Cadre Papier','📄','common',200,'Bordure cahier classique'),
  ('frame_neon','frame','Cadre Néon','✨','rare',600,'Brille fort dans la nuit'),
  ('frame_gold','frame','Cadre Or','🏆','epic',1200,'Réservé aux champions'),
  ('frame_holo','frame','Cadre Holographique','🌈','legendary',2500,'Effet hologramme animé'),
  ('bg_grid','background','Grille','📐','common',250,'Fond de carnet à carreaux'),
  ('bg_galaxy','background','Galaxie','🌌','rare',700,'Plonge dans le cosmos'),
  ('bg_aurora','background','Aurore','🌠','epic',1400,'Aurore boréale en fond')
ON CONFLICT (item_key) DO NOTHING;
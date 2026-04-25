-- 1. Profile: equipped_title
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS equipped_title text;

-- 2. Cosmetic items: allow 'title' category
ALTER TABLE public.cosmetic_items DROP CONSTRAINT IF EXISTS cosmetic_items_category_check;
ALTER TABLE public.cosmetic_items ADD CONSTRAINT cosmetic_items_category_check
  CHECK (category IN ('frame','background','sticker','title'));

-- 3. Equip cosmetic: handle title
CREATE OR REPLACE FUNCTION public.equip_cosmetic(p_item_key text, p_category text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  ELSIF p_category = 'title' THEN
    UPDATE profiles SET equipped_title = p_item_key WHERE id = v_user;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'invalid_category');
  END IF;

  RETURN jsonb_build_object('success', true);
END; $function$;

-- 4. Improved loot box
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

  -- XP 30-120
  v_xp_bonus := 30 + (random() * 90)::int;

  -- 45% streak token
  IF random() < 0.45 THEN
    v_streak_token := true;
    UPDATE profiles SET streak_tokens = LEAST(streak_tokens + 1, 5) WHERE id = v_user;
  END IF;

  -- 75% power-up
  IF random() < 0.75 THEN
    v_powerup_key := v_pool[1 + (random() * 3)::int];
    INSERT INTO user_inventory(user_id, item_key, quantity)
    VALUES (v_user, v_powerup_key, 1)
    ON CONFLICT (user_id, item_key) DO UPDATE SET quantity = user_inventory.quantity + 1;
  END IF;

  -- 90% cosmetic with rarity weighting
  v_cosmetic_roll := (random() * 100)::int;
  IF v_cosmetic_roll < 90 THEN
    v_rarity_roll := (random() * 100)::int;
    v_target_rarity := CASE
      WHEN v_rarity_roll < 55 THEN 'common'
      WHEN v_rarity_roll < 83 THEN 'rare'
      WHEN v_rarity_roll < 96 THEN 'epic'
      ELSE 'legendary'
    END;

    -- Try preferred rarity
    SELECT ci.* INTO v_cosmetic
    FROM cosmetic_items ci
    WHERE ci.unlockable_in_loot = true
      AND ci.rarity = v_target_rarity
      AND NOT EXISTS (SELECT 1 FROM user_cosmetics uc WHERE uc.user_id = v_user AND uc.item_key = ci.item_key)
    ORDER BY random() LIMIT 1;

    -- Fallback: any rarity not owned
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
      -- Everything owned: bonus XP instead
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

-- 5. Global chapter mastery (across all courses)
CREATE OR REPLACE FUNCTION public.get_global_chapter_mastery()
 RETURNS TABLE(
   course_id uuid,
   course_title text,
   course_emoji text,
   chapter text,
   total_questions integer,
   reviewed_questions integer,
   mastered_questions integer,
   due_today integer,
   mastery_pct integer
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH qs AS (
    SELECT q.id, qz.course_id, c.title AS course_title, c.emoji AS course_emoji,
           COALESCE(q.chapter, 'Sans chapitre') AS chapter
      FROM quiz_questions q
      JOIN quizzes qz ON qz.id = q.quiz_id
      JOIN courses c ON c.id = qz.course_id
     WHERE q.user_id = auth.uid()
  ),
  rs AS (
    SELECT r.question_id, r.repetitions, r.due_at
      FROM question_reviews r
     WHERE r.user_id = auth.uid()
  ),
  agg AS (
    SELECT
      qs.course_id,
      qs.course_title,
      qs.course_emoji,
      qs.chapter,
      COUNT(qs.id)::int AS total_questions,
      COUNT(rs.question_id)::int AS reviewed_questions,
      COUNT(*) FILTER (WHERE rs.repetitions >= 2)::int AS mastered_questions,
      COUNT(*) FILTER (WHERE rs.due_at <= CURRENT_DATE)::int AS due_today,
      CASE WHEN COUNT(qs.id) = 0 THEN 0
           ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE rs.repetitions >= 2) / COUNT(qs.id))::int
      END AS mastery_pct
    FROM qs LEFT JOIN rs ON rs.question_id = qs.id
    GROUP BY qs.course_id, qs.course_title, qs.course_emoji, qs.chapter
  )
  SELECT * FROM agg ORDER BY mastery_pct ASC, course_title, chapter;
$function$;

-- 6. Seed ~110 cosmetics
INSERT INTO public.cosmetic_items (item_key, category, name, description, emoji, rarity, price_xp, unlockable_in_loot) VALUES
-- ============ FRAMES (30) ============
('frame_paper', 'frame', 'Cadre papier', 'Bordure papier classique', '📄', 'common', 100, true),
('frame_kraft', 'frame', 'Cadre kraft', 'Bordure kraft naturelle', '📦', 'common', 100, true),
('frame_dotted', 'frame', 'Cadre pointillé', 'Bordure en pointillés', '⚪', 'common', 100, true),
('frame_dashed', 'frame', 'Cadre tirets', 'Bordure en tirets', '➖', 'common', 100, true),
('frame_notebook', 'frame', 'Cadre cahier', 'Bordure ligné cahier', '📓', 'common', 100, true),
('frame_grid', 'frame', 'Cadre quadrillé', 'Bordure quadrillée', '🔲', 'common', 100, true),
('frame_pencil', 'frame', 'Cadre crayonné', 'Trait de crayon', '✏️', 'common', 120, true),
('frame_scotch', 'frame', 'Cadre scotch', 'Coins scotchés', '📎', 'common', 120, true),
('frame_sticker', 'frame', 'Cadre stickers', 'Bordure de stickers', '⭐', 'rare', 250, true),
('frame_neon_blue', 'frame', 'Cadre néon bleu', 'Lueur bleue électrique', '💙', 'rare', 250, true),
('frame_neon_pink', 'frame', 'Cadre néon rose', 'Lueur rose néon', '💗', 'rare', 250, true),
('frame_neon_green', 'frame', 'Cadre néon vert', 'Lueur verte fluo', '💚', 'rare', 250, true),
('frame_marker_yellow', 'frame', 'Cadre fluo jaune', 'Surligneur jaune', '💛', 'rare', 250, true),
('frame_marker_orange', 'frame', 'Cadre fluo orange', 'Surligneur orange', '🧡', 'rare', 250, true),
('frame_polaroid', 'frame', 'Cadre polaroid', 'Cadre photo vintage', '📷', 'rare', 280, true),
('frame_postit_yellow', 'frame', 'Cadre post-it', 'Encadré post-it', '🟨', 'rare', 280, true),
('frame_floral', 'frame', 'Cadre floral', 'Couronne de fleurs', '🌸', 'epic', 500, true),
('frame_lightning', 'frame', 'Cadre éclairs', 'Bordure d''éclairs', '⚡', 'epic', 500, true),
('frame_fire', 'frame', 'Cadre flammes', 'Encerclé de feu', '🔥', 'epic', 500, true),
('frame_ice', 'frame', 'Cadre glacé', 'Cristaux de glace', '❄️', 'epic', 500, true),
('frame_galaxy', 'frame', 'Cadre galaxie', 'Étoiles tourbillonnantes', '🌌', 'epic', 600, true),
('frame_rainbow', 'frame', 'Cadre arc-en-ciel', 'Spectre complet', '🌈', 'epic', 600, true),
('frame_thunder', 'frame', 'Cadre foudre', 'Foudre animée', '🌩️', 'epic', 600, true),
('frame_diamond', 'frame', 'Cadre diamant', 'Facettes scintillantes', '💎', 'legendary', 1500, true),
('frame_gold', 'frame', 'Cadre or massif', 'Or 24 carats', '🏅', 'legendary', 1500, true),
('frame_phoenix', 'frame', 'Cadre phénix', 'Plumes ardentes', '🦅', 'legendary', 1800, true),
('frame_dragon', 'frame', 'Cadre dragon', 'Écailles de dragon', '🐉', 'legendary', 1800, true),
('frame_cosmic', 'frame', 'Cadre cosmique', 'Trou noir radiant', '🕳️', 'legendary', 2000, true),
('frame_aurora', 'frame', 'Cadre aurore', 'Aurore boréale', '🌠', 'legendary', 2000, true),
('frame_celestial', 'frame', 'Cadre céleste', 'Anneaux planétaires', '🪐', 'legendary', 2200, true),

-- ============ BACKGROUNDS (30) ============
('bg_paper_white', 'background', 'Fond papier blanc', 'Page vierge', '⬜', 'common', 80, true),
('bg_paper_kraft', 'background', 'Fond kraft', 'Papier kraft', '📦', 'common', 80, true),
('bg_grid', 'background', 'Fond quadrillé', 'Maths style', '🔲', 'common', 80, true),
('bg_lined', 'background', 'Fond ligné', 'Cahier ligné', '📝', 'common', 80, true),
('bg_dotted', 'background', 'Fond pointillé', 'Bullet journal', '⚪', 'common', 100, true),
('bg_pastel_pink', 'background', 'Pastel rose', 'Doux et apaisant', '🌷', 'common', 100, true),
('bg_pastel_blue', 'background', 'Pastel bleu', 'Ciel léger', '☁️', 'common', 100, true),
('bg_pastel_mint', 'background', 'Pastel menthe', 'Vert frais', '🍃', 'common', 100, true),
('bg_chalkboard', 'background', 'Tableau noir', 'Ambiance école', '🟫', 'rare', 250, true),
('bg_corkboard', 'background', 'Liège', 'Tableau d''affichage', '📌', 'rare', 250, true),
('bg_library', 'background', 'Bibliothèque', 'Étagères de livres', '📚', 'rare', 280, true),
('bg_sunset', 'background', 'Coucher de soleil', 'Dégradé orange', '🌅', 'rare', 280, true),
('bg_sunrise', 'background', 'Lever du jour', 'Dégradé rosé', '🌄', 'rare', 280, true),
('bg_ocean', 'background', 'Océan', 'Vagues bleues', '🌊', 'rare', 280, true),
('bg_forest', 'background', 'Forêt', 'Vert profond', '🌲', 'rare', 300, true),
('bg_cherry', 'background', 'Cerisiers', 'Sakura japonais', '🌸', 'epic', 550, true),
('bg_neon_city', 'background', 'Ville néon', 'Cyberpunk vibes', '🏙️', 'epic', 550, true),
('bg_starfield', 'background', 'Champ d''étoiles', 'Nuit étoilée', '✨', 'epic', 550, true),
('bg_nebula', 'background', 'Nébuleuse', 'Nuages spatiaux', '🌫️', 'epic', 600, true),
('bg_aurora', 'background', 'Aurore boréale', 'Lumières du nord', '🌌', 'epic', 600, true),
('bg_volcano', 'background', 'Volcan', 'Lave incandescente', '🌋', 'epic', 600, true),
('bg_lightning', 'background', 'Orage', 'Éclairs nocturnes', '⛈️', 'epic', 600, true),
('bg_underwater', 'background', 'Sous l''eau', 'Récif corallien', '🐠', 'epic', 650, true),
('bg_holographic', 'background', 'Holographique', 'Iridescent', '🔮', 'legendary', 1500, true),
('bg_galaxy_swirl', 'background', 'Spirale galactique', 'Voie lactée', '🌌', 'legendary', 1700, true),
('bg_phoenix_fire', 'background', 'Feu de phénix', 'Flammes éternelles', '🔥', 'legendary', 1800, true),
('bg_crystal_cave', 'background', 'Grotte de cristal', 'Cristaux brillants', '💎', 'legendary', 1800, true),
('bg_dimension', 'background', 'Faille dimensionnelle', 'Réalité fracturée', '🌀', 'legendary', 2000, true),
('bg_celestial_temple', 'background', 'Temple céleste', 'Sanctuaire divin', '⛩️', 'legendary', 2200, true),
('bg_cosmic_void', 'background', 'Vide cosmique', 'Au-delà du temps', '⚫', 'legendary', 2500, true),

-- ============ STICKERS (30) ============
('sticker_star', 'sticker', 'Étoile', 'Brille fort', '⭐', 'common', 50, true),
('sticker_heart', 'sticker', 'Cœur', 'Avec amour', '❤️', 'common', 50, true),
('sticker_smiley', 'sticker', 'Smiley', 'Sourire éclatant', '😊', 'common', 50, true),
('sticker_thumbs', 'sticker', 'Pouce levé', 'Bien joué', '👍', 'common', 50, true),
('sticker_check', 'sticker', 'Validé', 'C''est fait', '✅', 'common', 50, true),
('sticker_pencil', 'sticker', 'Crayon', 'Studieux', '✏️', 'common', 60, true),
('sticker_book', 'sticker', 'Livre', 'Lecteur passionné', '📖', 'common', 60, true),
('sticker_apple', 'sticker', 'Pomme', 'Pour le prof', '🍎', 'common', 60, true),
('sticker_brain', 'sticker', 'Cerveau', 'Pleinement actif', '🧠', 'rare', 200, true),
('sticker_rocket', 'sticker', 'Fusée', 'Décollage', '🚀', 'rare', 200, true),
('sticker_fire', 'sticker', 'Feu', 'En feu !', '🔥', 'rare', 200, true),
('sticker_lightning', 'sticker', 'Éclair', 'Rapide comme l''éclair', '⚡', 'rare', 200, true),
('sticker_sparkles', 'sticker', 'Étincelles', 'Magique', '✨', 'rare', 220, true),
('sticker_trophy_bronze', 'sticker', 'Trophée bronze', 'Bonne perf', '🥉', 'rare', 220, true),
('sticker_trophy_silver', 'sticker', 'Trophée argent', 'Très bien', '🥈', 'rare', 250, true),
('sticker_medal', 'sticker', 'Médaille', 'Honoré', '🎖️', 'rare', 250, true),
('sticker_crown_simple', 'sticker', 'Petite couronne', 'Royal', '👑', 'epic', 500, true),
('sticker_trophy_gold', 'sticker', 'Trophée or', 'Champion', '🏆', 'epic', 500, true),
('sticker_diamond', 'sticker', 'Diamant', 'Précieux', '💎', 'epic', 500, true),
('sticker_unicorn', 'sticker', 'Licorne', 'Magique et rare', '🦄', 'epic', 550, true),
('sticker_alien', 'sticker', 'Alien', 'Hors du commun', '👽', 'epic', 550, true),
('sticker_ninja', 'sticker', 'Ninja', 'Discret et efficace', '🥷', 'epic', 600, true),
('sticker_wizard', 'sticker', 'Magicien', 'Maîtrise les sorts', '🧙', 'epic', 600, true),
('sticker_phoenix', 'sticker', 'Phénix', 'Renaît de ses cendres', '🦅', 'legendary', 1500, true),
('sticker_dragon', 'sticker', 'Dragon', 'Puissance ultime', '🐉', 'legendary', 1500, true),
('sticker_crown_royal', 'sticker', 'Couronne royale', 'Souverain', '👑', 'legendary', 1700, true),
('sticker_galaxy', 'sticker', 'Galaxie', 'Vastitude', '🌌', 'legendary', 1800, true),
('sticker_infinity', 'sticker', 'Infini', 'Sans limite', '♾️', 'legendary', 1800, true),
('sticker_meteor', 'sticker', 'Météore', 'Brûle dans le ciel', '☄️', 'legendary', 2000, true),
('sticker_cosmic_eye', 'sticker', 'Œil cosmique', 'Voit tout', '👁️', 'legendary', 2200, true),

-- ============ TITLES (20) ============
('title_apprenti', 'title', 'Apprenti', 'Premier pas', NULL, 'common', 100, true),
('title_curieux', 'title', 'Curieux', 'Toujours en quête', NULL, 'common', 100, true),
('title_studieux', 'title', 'Studieux', 'Sérieux à l''ouvrage', NULL, 'common', 100, true),
('title_assidu', 'title', 'Assidu', 'Régulier et fiable', NULL, 'common', 120, true),
('title_motive', 'title', 'Motivé', 'Énergie débordante', NULL, 'common', 120, true),
('title_strategique', 'title', 'Stratégique', 'Pense avant d''agir', NULL, 'rare', 250, true),
('title_brillant', 'title', 'Brillant', 'Talent éclatant', NULL, 'rare', 250, true),
('title_inventif', 'title', 'Inventif', 'Esprit créatif', NULL, 'rare', 280, true),
('title_perspicace', 'title', 'Perspicace', 'Voit l''invisible', NULL, 'rare', 280, true),
('title_acharne', 'title', 'Acharné', 'Ne lâche jamais', NULL, 'rare', 300, true),
('title_genie', 'title', 'Génie', 'Au-dessus du lot', NULL, 'epic', 600, true),
('title_virtuose', 'title', 'Virtuose', 'Maître de son art', NULL, 'epic', 600, true),
('title_sage', 'title', 'Sage', 'Connaissance profonde', NULL, 'epic', 650, true),
('title_titan', 'title', 'Titan', 'Force colossale', NULL, 'epic', 700, true),
('title_phenix', 'title', 'Phénix', 'Renaît plus fort', NULL, 'epic', 700, true),
('title_legende', 'title', 'Légende', 'Inscrit dans l''histoire', NULL, 'legendary', 1800, true),
('title_immortel', 'title', 'Immortel', 'Au-delà du temps', NULL, 'legendary', 2000, true),
('title_demiurge', 'title', 'Démiurge', 'Créateur de mondes', NULL, 'legendary', 2200, true),
('title_omniscient', 'title', 'Omniscient', 'Sait tout', NULL, 'legendary', 2500, true),
('title_eternel', 'title', 'Éternel', 'Au-delà de l''infini', NULL, 'legendary', 3000, true)
ON CONFLICT (item_key) DO NOTHING;
-- ============================================================
-- Rééquilibrage des raretés cosmétiques
-- Objectif: legendary ~5%, epic ~15%, rare ~30%, common ~50%
-- ============================================================

-- ---------- BACKGROUNDS ----------
-- Légendaires -> Épiques (on garde les plus iconiques en legendary)
UPDATE cosmetic_items SET rarity = 'epic' WHERE category = 'background' AND item_key IN (
  'bg_celestial_temple',
  'bg_crystal_cave',
  'bg_holographic',
  'bg_summer_aurora_bay',
  'bg_summer_caribbean',
  'bg_thunderstorm',
  'bg_violet_crystal'
);
-- Restent légendaires: bg_cosmic_void, bg_dimension, bg_galaxy_swirl, bg_phoenix_fire

-- Épiques -> Rares
UPDATE cosmetic_items SET rarity = 'rare' WHERE category = 'background' AND item_key IN (
  'bg_cherry',
  'bg_deep_sea',
  'bg_enchanted_forest',
  'bg_golden_desert',
  'bg_lightning',
  'bg_summer_neon_beach',
  'bg_summer_paradise',
  'bg_summer_sunset_sea',
  'bg_summer_tropic',
  'bg_underwater'
);

-- Rares -> Communs (quelques fonds simples)
UPDATE cosmetic_items SET rarity = 'common' WHERE category = 'background' AND item_key IN (
  'bg_dawn',
  'bg_dusk',
  'bg_meadow',
  'bg_pastel',
  'bg_soft_blue'
);

-- ---------- FRAMES ----------
-- Légendaires -> Épiques
UPDATE cosmetic_items SET rarity = 'epic' WHERE category = 'frame' AND item_key IN (
  'frame_aurora',
  'frame_celestial',
  'frame_holo',
  'frame_summer_gold_sun',
  'frame_summer_lagoon'
);
-- Restent légendaires: frame_cosmic, frame_diamond, frame_dragon, frame_phoenix

-- Épiques -> Rares
UPDATE cosmetic_items SET rarity = 'rare' WHERE category = 'frame' AND item_key IN (
  'frame_emerald',
  'frame_floral',
  'frame_ice',
  'frame_moon',
  'frame_ruby',
  'frame_sapphire',
  'frame_summer_flower',
  'frame_summer_pineapple',
  'frame_summer_sunset',
  'frame_sun'
);

-- Rares -> Communs
UPDATE cosmetic_items SET rarity = 'common' WHERE category = 'frame' AND item_key IN (
  'frame_bronze',
  'frame_copper',
  'frame_silver',
  'frame_pastel',
  'frame_dotted'
);

-- ---------- STICKERS ----------
-- Légendaires -> Épiques
UPDATE cosmetic_items SET rarity = 'epic' WHERE category = 'sticker' AND item_key IN (
  'sticker_cosmic_eye',
  'sticker_diamond',
  'sticker_infinity',
  'sticker_meteor',
  'sticker_third_eye'
);
-- Restent légendaires: sticker_crown_royal, sticker_dragon, sticker_galaxy, sticker_lion, sticker_phoenix

-- Épiques -> Rares
UPDATE cosmetic_items SET rarity = 'rare' WHERE category = 'sticker' AND item_key IN (
  'sticker_alien',
  'sticker_crown_simple',
  'sticker_summer_dolphin',
  'sticker_summer_flamingo',
  'sticker_summer_surf',
  'sticker_wizard_hat'
);

-- ---------- TITLES ----------
-- Légendaires -> Épiques
UPDATE cosmetic_items SET rarity = 'epic' WHERE category = 'title' AND item_key IN (
  'title_demiurge',
  'title_eternel',
  'title_living_legend',
  'title_starborn',
  'title_summer_king'
);
-- Restent légendaires: title_immortel, title_legende, title_omniscient, title_owner

-- Épiques -> Rares
UPDATE cosmetic_items SET rarity = 'rare' WHERE category = 'title' AND item_key IN (
  'title_champion',
  'title_phenix',
  'title_strategist',
  'title_summer_surfer',
  'title_summer_tropic',
  'title_virtuose'
);

-- Rares -> Communs
UPDATE cosmetic_items SET rarity = 'common' WHERE category = 'title' AND item_key IN (
  'title_curieux',
  'title_studious'
);

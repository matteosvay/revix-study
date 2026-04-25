
-- ====== PHASE 2: Premium cosmetics expansion (28 items) ======

INSERT INTO public.cosmetic_items (item_key, name, description, emoji, category, rarity, unlockable_in_loot) VALUES

-- ===== Stickers PNG IA (Légendaire / Épique) =====
('sticker_lion',        'Lion Royal',          'Le roi des animaux veille sur ton profil.',           '🦁', 'sticker', 'legendary', true),
('sticker_third_eye',   'Œil Cosmique',        'Vois au-delà du voile de la réalité.',                '👁️', 'sticker', 'legendary', true),
('sticker_wizard_hat',  'Chapeau de Sorcier',  'Magie ancienne et secrets de l''univers.',            '🧙', 'sticker', 'epic',      true),
('sticker_fire_heart',  'Cœur de Flammes',     'Une passion qui ne s''éteint jamais.',                '❤️‍🔥', 'sticker', 'epic',      true),

-- ===== Cadres SVG riches =====
('frame_emerald',       'Cadre Émeraude',      'Une pierre précieuse rare et lumineuse.',             '💚', 'frame',   'epic',      true),
('frame_ruby',          'Cadre Rubis',         'Un éclat rouge écarlate envoûtant.',                  '❤️', 'frame',   'epic',      true),
('frame_sapphire',      'Cadre Saphir',        'Un bleu profond comme l''océan.',                     '💙', 'frame',   'epic',      true),
('frame_sun',           'Cadre Soleil Royal',  'Rayonne comme un soleil au zénith.',                  '☀️', 'frame',   'epic',      true),
('frame_moon',          'Cadre Lune Argentée', 'Une lueur nocturne mystérieuse.',                     '🌙', 'frame',   'epic',      true),
('frame_shooting_stars','Cadre Étoiles Filantes','Fais un vœu à chaque connexion.',                   '🌠', 'frame',   'rare',      true),
('frame_crystal_blue',  'Cadre Cristal Bleu',  'Glacé et cristallin.',                                '💎', 'frame',   'rare',      true),
('frame_pixel',         'Cadre Pixel Art',     'Rétro-gaming en 8-bit.',                              '🎮', 'frame',   'rare',      true),

-- ===== Fonds (gradients riches) =====
('bg_tropical_sunset',  'Coucher Tropical',    'Plage paradisiaque au crépuscule.',                   '🌅', 'background','rare',     true),
('bg_polar_dawn',       'Aube Polaire',        'Couleurs glacées d''un matin du nord.',               '❄️', 'background','rare',     true),
('bg_mountain_mist',    'Brume Montagne',      'Sommets enneigés dans les nuages.',                   '🏔️', 'background','rare',     true),
('bg_enchanted_forest', 'Forêt Enchantée',     'Magie verdoyante et lucioles.',                       '🌲', 'background','epic',     true),
('bg_deep_sea',         'Fond Marin',          'Profondeurs océaniques bioluminescentes.',            '🌊', 'background','epic',     true),
('bg_golden_desert',    'Désert d''Or',        'Dunes infinies sous un soleil ardent.',               '🏜️', 'background','epic',     true),
('bg_violet_crystal',   'Cave de Cristal',     'Cristaux violets brillants dans l''obscurité.',       '🔮', 'background','legendary',true),
('bg_thunderstorm',     'Tempête Électrique',  'Éclairs déchirant un ciel orageux.',                  '⛈️', 'background','legendary',true),

-- ===== Titres premium =====
('title_strategist',    'Maître Stratège',     'Pour ceux qui pensent trois coups d''avance.',        '♟️', 'title',    'epic',     true),
('title_champion',      'Champion·ne',         'Au sommet de leur art.',                              '🏆', 'title',    'epic',     true),
('title_visionary',     'Visionnaire',         'Voit ce que d''autres ne voient pas.',                '🔭', 'title',    'epic',     true),
('title_living_legend', 'Légende Vivante',     'Une légende parmi les étudiants.',                    '⚡', 'title',    'legendary',true),
('title_starborn',      'Élu·e des Étoiles',   'Né·e pour briller dans la nuit.',                     '✨', 'title',    'legendary',true),

-- ===== Petits bonus communs/rares pour étoffer la pool =====
('frame_marker_pink',   'Marqueur Rose',       'Une touche girly fluo.',                              '💗', 'frame',   'common',    true),
('bg_pastel_lavender',  'Pastel Lavande',      'Doux et apaisant.',                                   '💜', 'background','common',   true),
('sticker_pen',         'Stylo Légendaire',    'L''outil de tous les génies.',                        '🖊️', 'sticker', 'common',    true)

ON CONFLICT (item_key) DO NOTHING;

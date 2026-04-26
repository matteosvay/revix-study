-- ============================================================================
-- SUMMER COSMETICS PACK (40 items)
-- All unlockable via loot boxes; some also available in shop with low XP cost.
-- ============================================================================

INSERT INTO public.cosmetic_items (item_key, category, name, description, emoji, rarity, price_xp, unlockable_in_loot) VALUES

-- ============== BACKGROUNDS (12) ==============
('bg_summer_beach',      'background', 'Plage de sable',        'Sable doré, mer turquoise et ciel bleu.',                  '🏖️', 'common',    300, true),
('bg_summer_lagoon',     'background', 'Lagon turquoise',       'Eaux cristallines d''un lagon paradisiaque.',              '🐚',  'rare',      600, true),
('bg_summer_palm',       'background', 'Palmiers au vent',      'Silhouettes de palmiers sur fond pastel.',                 '🌴',  'rare',      600, true),
('bg_summer_pool',       'background', 'Bord de piscine',       'Reflets dansants sur l''eau d''une piscine.',              '🏊',  'rare',      600, true),
('bg_summer_tropic',     'background', 'Tropical Vibes',        'Dégradé tropical fuschia, mangue et turquoise.',           '🍹',  'epic',      900, true),
('bg_summer_paradise',   'background', 'Paradis tropical',      'Plage paradisiaque au coucher du soleil.',                 '🌺',  'epic',      900, true),
('bg_summer_sunset_sea', 'background', 'Soleil sur la mer',     'Le soleil se couche sur l''océan infini.',                 '🌇',  'epic',      900, true),
('bg_summer_neon_beach', 'background', 'Plage néon',            'Soirée Miami sur la plage en néons fluo.',                 '🌃',  'epic',      900, true),
('bg_summer_coconut',    'background', 'Sous le cocotier',      'Pause à l''ombre d''un cocotier.',                         '🥥',  'common',    300, true),
('bg_summer_aurora_bay', 'background', 'Baie d''Or',            'Reflets dorés sur une baie tranquille.',                   '🌅',  'legendary', 1500, true),
('bg_summer_caribbean',  'background', 'Caraïbes',              'Eaux émeraude des Caraïbes vues du ciel.',                 '🐢',  'legendary', 1500, true),
('bg_summer_ice_cream',  'background', 'Glace fondante',        'Pastels gourmands façon glace à l''italienne.',            '🍦',  'rare',      600, true),

-- ============== FRAMES (12) ==============
('frame_summer_seashell','frame',      'Cadre coquillage',      'Bord nacré couleur coquillage.',                           '🐚',  'common',    300, true),
('frame_summer_palm',    'frame',      'Cadre palmier',         'Tons verts et dorés des palmiers.',                        '🌴',  'rare',      600, true),
('frame_summer_wave',    'frame',      'Cadre vague',           'Bordure ondulée bleu océan.',                              '🌊',  'rare',      600, true),
('frame_summer_flower',  'frame',      'Couronne tropicale',    'Couronne de fleurs hibiscus.',                             '🌺',  'epic',      900, true),
('frame_summer_pineapple','frame',     'Cadre ananas',          'Doré façon écorce d''ananas.',                             '🍍',  'epic',      900, true),
('frame_summer_neon',    'frame',      'Néon Miami',            'Bordure néon rose et turquoise.',                          '🌴',  'epic',      900, true),
('frame_summer_surf',    'frame',      'Cadre surfeur',         'Style planche de surf vintage.',                           '🏄',  'rare',      600, true),
('frame_summer_pool',    'frame',      'Cadre piscine',         'Mosaïque turquoise reflet d''eau.',                        '🏊',  'rare',      600, true),
('frame_summer_sunset',  'frame',      'Cadre coucher de soleil','Dégradé orangé chaleureux.',                              '🌇',  'epic',      900, true),
('frame_summer_coral',   'frame',      'Cadre corail',          'Corail rose et reflets nacrés.',                           '🪸',  'rare',      600, true),
('frame_summer_gold_sun','frame',      'Soleil d''or',          'Bordure rayonnante en or pur.',                            '☀️',  'legendary', 1500, true),
('frame_summer_lagoon',  'frame',      'Cadre lagon',           'Turquoise profond du lagon.',                              '🏝️', 'legendary', 1500, true),

-- ============== STICKERS (10) ==============
('sticker_summer_icecream','sticker',  'Glace italienne',       'Une bonne glace qui coule.',                               '🍦',  'common',    200, true),
('sticker_summer_palm',   'sticker',   'Palmier',               'Petit palmier solitaire.',                                 '🌴',  'common',    200, true),
('sticker_summer_flipflop','sticker',  'Tongs',                 'Direction la plage.',                                      '🩴',  'common',    200, true),
('sticker_summer_cocktail','sticker',  'Cocktail tropical',     'Avec sa petite ombrelle.',                                 '🍹',  'rare',      400, true),
('sticker_summer_sun',    'sticker',   'Soleil',                'Le bon vieux soleil radieux.',                             '☀️',  'common',    200, true),
('sticker_summer_jelly',  'sticker',   'Méduse',                'Petite méduse dansante.',                                  '🪼',  'rare',      400, true),
('sticker_summer_surf',   'sticker',   'Planche de surf',       'Pour rider les vagues.',                                   '🏄',  'epic',      700, true),
('sticker_summer_pineapple','sticker', 'Ananas',                'Le roi des fruits tropicaux.',                             '🍍',  'rare',      400, true),
('sticker_summer_dolphin','sticker',   'Dauphin',               'Le pote de la mer.',                                       '🐬',  'epic',      700, true),
('sticker_summer_flamingo','sticker',  'Flamant rose',          'Pour la touche tropicale.',                                '🦩',  'epic',      700, true),

-- ============== TITLES (6) ==============
('title_summer_lifeguard','title',     'Lifeguard',             'Sauveur de la plage.',                                     '🏖️', 'rare',      400, true),
('title_summer_surfer',  'title',      'Surfeur Étoile',        'Toujours sur la vague.',                                   '🏄',  'epic',      800, true),
('title_summer_tropic',  'title',      'Tropical Vibes',        'Esprit tropical à 100%.',                                  '🌺',  'epic',      800, true),
('title_summer_king',    'title',      'Roi de la Plage',       'Le sable ne lui résiste pas.',                             '👑',  'legendary', 1200, true),
('title_summer_bronze',  'title',      'Bronzé Doré',           'Couleur soleil garantie.',                                 '🌞',  'rare',      400, true),
('title_summer_cool',    'title',      'Mode Vacances',         'Aucun stress en vue.',                                     '😎',  'common',    250, true)

ON CONFLICT (item_key) DO NOTHING;
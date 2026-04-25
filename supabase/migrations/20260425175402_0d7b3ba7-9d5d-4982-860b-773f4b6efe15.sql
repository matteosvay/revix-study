-- Extend rarity check
ALTER TABLE public.cosmetic_items DROP CONSTRAINT IF EXISTS cosmetic_items_rarity_check;
ALTER TABLE public.cosmetic_items
  ADD CONSTRAINT cosmetic_items_rarity_check
  CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'mythic', 'creator'));

-- Extend acquired_via check on user_cosmetics to allow creator grants
ALTER TABLE public.user_cosmetics DROP CONSTRAINT IF EXISTS user_cosmetics_acquired_via_check;
ALTER TABLE public.user_cosmetics
  ADD CONSTRAINT user_cosmetics_acquired_via_check
  CHECK (acquired_via IN ('shop', 'loot', 'gift', 'reward', 'creator_grant'));

-- Add the exclusive "Origine" creator set
INSERT INTO public.cosmetic_items (item_key, name, category, rarity, price_xp, unlockable_in_loot, emoji, description) VALUES
  ('frame_origine',    'Couronne d''Origine',  'frame',      'creator', 0, false, '👑', 'Set exclusif du créateur de Revix. Une couronne d''or liquide gravée d''un M ondule sans cesse autour de toi.'),
  ('bg_origine',       'Manuscrit d''Origine', 'background', 'creator', 0, false, '📜', 'Set exclusif du créateur. Parchemin sombre où coulent l''or et l''encre, parsemé d''une constellation en M.'),
  ('sticker_origine',  'Signature d''Origine', 'sticker',    'creator', 0, false, '✒️', 'Set exclusif du créateur. La signature dorée animée du fondateur de Revix.')
ON CONFLICT (item_key) DO UPDATE SET
  name = EXCLUDED.name, category = EXCLUDED.category, rarity = EXCLUDED.rarity,
  price_xp = EXCLUDED.price_xp, unlockable_in_loot = EXCLUDED.unlockable_in_loot,
  emoji = EXCLUDED.emoji, description = EXCLUDED.description;

INSERT INTO public.user_cosmetics (user_id, item_key, acquired_via) VALUES
  ('77aebf92-3adb-4517-a823-d7f76f181a99', 'frame_origine',   'creator_grant'),
  ('77aebf92-3adb-4517-a823-d7f76f181a99', 'bg_origine',      'creator_grant'),
  ('77aebf92-3adb-4517-a823-d7f76f181a99', 'sticker_origine', 'creator_grant')
ON CONFLICT DO NOTHING;

UPDATE public.profiles
SET equipped_frame = 'frame_origine',
    equipped_background = 'bg_origine',
    equipped_sticker = 'sticker_origine'
WHERE id = '77aebf92-3adb-4517-a823-d7f76f181a99';
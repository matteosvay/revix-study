-- 0) Allow the new "queen" rarity tier on cosmetic_items
ALTER TABLE public.cosmetic_items
  DROP CONSTRAINT IF EXISTS cosmetic_items_rarity_check;

ALTER TABLE public.cosmetic_items
  ADD CONSTRAINT cosmetic_items_rarity_check
  CHECK (rarity IN ('common','rare','epic','legendary','creator','queen'));

-- 1) Add new cosmetics for the "queen" rarity, exclusive to Léna.
INSERT INTO public.cosmetic_items (item_key, category, name, description, emoji, rarity, price_xp, unlockable_in_loot)
VALUES
  ('frame_reine', 'frame',      'Couronne de la Reine', 'Cadre exclusif rose & or, créé pour Léna 👑🌹', '👑', 'queen', 0, false),
  ('bg_reine',   'background', 'Jardin de la Reine',    'Roses dorées et velours royal — exclusif à Léna 🌹✨', '🌹', 'queen', 0, false)
ON CONFLICT (item_key) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      emoji = EXCLUDED.emoji,
      rarity = EXCLUDED.rarity,
      unlockable_in_loot = EXCLUDED.unlockable_in_loot;

-- 2) Grant both cosmetics to Léna
INSERT INTO public.user_cosmetics (user_id, item_key, acquired_via)
VALUES
  ('963d27ad-c2e5-4f3c-83ae-7132c99dc521', 'frame_reine', 'gift'),
  ('963d27ad-c2e5-4f3c-83ae-7132c99dc521', 'bg_reine',    'gift')
ON CONFLICT DO NOTHING;

-- 3) One-shot personal notification for Léna (will appear once in her bell)
INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
VALUES (
  '963d27ad-c2e5-4f3c-83ae-7132c99dc521',
  'fomo_morning',
  '👑 Une rareté rien que pour toi, ma Reine',
  'Matteo t''a créé une rareté unique : Reine. Un cadre Couronne et un fond Jardin de la Reine t''attendent dans tes cosmétiques 🌹✨',
  '/app/cosmetics',
  jsonb_build_object('queen_gift', true, 'items', jsonb_build_array('frame_reine','bg_reine'))
);
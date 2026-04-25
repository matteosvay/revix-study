
-- 1. Remove direct gift from Léna so she opens it via lootbox
DELETE FROM public.user_cosmetics
WHERE user_id = '963d27ad-c2e5-4f3c-83ae-7132c99dc521'
  AND item_key IN ('frame_reine', 'bg_reine')
  AND acquired_via = 'gift';

-- Reset her equipped queen items if any (so she sees the change)
UPDATE public.profiles
SET equipped_frame = NULL,
    equipped_background = NULL
WHERE id = '963d27ad-c2e5-4f3c-83ae-7132c99dc521'
  AND (equipped_frame = 'frame_reine' OR equipped_background = 'bg_reine');

-- 2. Remove old "morning" notification for the previous reveal
DELETE FROM public.notifications
WHERE user_id = '963d27ad-c2e5-4f3c-83ae-7132c99dc521'
  AND type = 'fomo_morning'
  AND title ILIKE '%Reine%';

-- 3. Allow the "queen_lootbox" notification type via RLS check policy
DROP POLICY IF EXISTS "insert own fomo notifications" ON public.notifications;
CREATE POLICY "insert own fomo notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND type = ANY (ARRAY[
      'fomo_streak'::text, 'fomo_quest'::text, 'fomo_level'::text, 'fomo_morning'::text,
      'group_streak_gained'::text, 'group_streak_at_risk'::text, 'group_member_joined'::text,
      'course_share_received'::text, 'course_share_response'::text,
      'queen_lootbox'::text
    ])
  );

-- 4. RPC to claim the queen lootbox — only callable by users who own a queen_lootbox notification
CREATE OR REPLACE FUNCTION public.claim_queen_lootbox()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_notif_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Must hold an unread queen_lootbox notification
  SELECT id INTO v_notif_id
  FROM public.notifications
  WHERE user_id = v_uid
    AND type = 'queen_lootbox'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_notif_id IS NULL THEN
    RAISE EXCEPTION 'no_queen_lootbox';
  END IF;

  -- Grant both queen items (idempotent)
  INSERT INTO public.user_cosmetics (user_id, item_key, acquired_via)
  VALUES (v_uid, 'frame_reine', 'gift'),
         (v_uid, 'bg_reine',    'gift')
  ON CONFLICT DO NOTHING;

  -- Mark the notification as read so the button can disappear
  UPDATE public.notifications
  SET read = true
  WHERE id = v_notif_id;

  -- Build a Reward payload compatible with LootBoxReveal
  RETURN jsonb_build_object(
    'rewards', jsonb_build_object(
      'xp', 0,
      'streak_token', false,
      'powerup', null,
      'cosmetic', jsonb_build_object(
        'key',      'frame_reine',
        'name',     'Couronne de la Reine',
        'emoji',    '👑',
        'rarity',   'queen',
        'category', 'frame'
      ),
      'extras', jsonb_build_array(
        jsonb_build_object(
          'key',      'bg_reine',
          'name',     'Jardin de la Reine',
          'emoji',    '🌹',
          'rarity',   'queen',
          'category', 'background'
        )
      )
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_queen_lootbox() FROM public;
GRANT EXECUTE ON FUNCTION public.claim_queen_lootbox() TO authenticated;

-- 5. Insert the special notification for Léna (production)
INSERT INTO public.notifications (user_id, type, title, message, link, metadata, read)
VALUES (
  '963d27ad-c2e5-4f3c-83ae-7132c99dc521',
  'queen_lootbox',
  '👑 Une lootbox royale pour toi, ma Reine',
  'Une rareté unique au monde t''attend : la Couronne et le Jardin de la Reine. Touche pour ouvrir ta lootbox exclusive ✨🌹',
  null,
  jsonb_build_object('exclusive_for', 'lena'),
  false
);

-- 6. Same notification for Lois (simulation / QA on his own account)
INSERT INTO public.notifications (user_id, type, title, message, link, metadata, read)
VALUES (
  '1e97ebcd-fec2-4379-b65c-4a20cc11617d',
  'queen_lootbox',
  '👑 Simulation — Lootbox Reine',
  'Aperçu du rendu : ouvre cette lootbox pour voir le cadre et le fond exclusifs de Léna.',
  null,
  jsonb_build_object('exclusive_for', 'lena', 'simulation', true),
  false
);

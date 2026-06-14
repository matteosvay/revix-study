
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;

DROP FUNCTION IF EXISTS public.get_public_profile(uuid);
CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS TABLE(
  avatar_url text, bio text, cursus text, display_name text,
  equipped_background text, equipped_frame text, equipped_sticker text, equipped_title text,
  formation text, gender text, id uuid, level integer,
  sticker_emoji text, sticker_rarity text, streak_days integer, streak_record integer,
  title_emoji text, title_name text, title_rarity text,
  username text, xp_total integer, xp_week integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    p.avatar_url, p.bio, p.cursus, p.display_name,
    p.equipped_background, p.equipped_frame, p.equipped_sticker, p.equipped_title,
    p.formation, p.gender, p.id, p.level,
    s.emoji AS sticker_emoji, s.rarity AS sticker_rarity,
    p.streak_days, p.streak_record,
    t.emoji AS title_emoji, t.name AS title_name, t.rarity AS title_rarity,
    p.username, p.xp_total, p.xp_week
  FROM public.profiles p
  LEFT JOIN public.cosmetic_items s ON s.id::text = p.equipped_sticker
  LEFT JOIN public.cosmetic_items t ON t.id::text = p.equipped_title
  WHERE p.id = p_user_id;
$function$;

REVOKE ALL ON FUNCTION public.get_public_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "delete whiteboard note" ON public.room_whiteboard;
CREATE POLICY "delete whiteboard note"
  ON public.room_whiteboard
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.study_rooms sr
      WHERE sr.id = room_whiteboard.room_id AND sr.host_id = auth.uid()
    )
  );

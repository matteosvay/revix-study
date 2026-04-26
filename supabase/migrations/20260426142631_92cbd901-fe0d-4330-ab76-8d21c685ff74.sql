DROP FUNCTION IF EXISTS public.get_friends_leaderboard();

CREATE FUNCTION public.get_friends_leaderboard()
RETURNS TABLE(
  avatar_url text,
  display_name text,
  equipped_frame text,
  equipped_sticker text,
  equipped_title text,
  gender text,
  id uuid,
  is_me boolean,
  level integer,
  sticker_emoji text,
  streak_days integer,
  title_emoji text,
  title_name text,
  title_rarity text,
  username text,
  xp_total integer,
  xp_week integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (SELECT auth.uid() AS uid),
  friend_ids AS (
    SELECT CASE WHEN f.requester_id = (SELECT uid FROM me) THEN f.addressee_id ELSE f.requester_id END AS fid
    FROM public.friendships f
    WHERE f.status = 'accepted'
      AND ((SELECT uid FROM me) IN (f.requester_id, f.addressee_id))
  ),
  pool AS (
    SELECT (SELECT uid FROM me) AS pid
    UNION
    SELECT fid FROM friend_ids
  )
  SELECT
    p.avatar_url,
    p.display_name,
    p.equipped_frame,
    p.equipped_sticker,
    p.equipped_title,
    p.gender,
    p.id,
    (p.id = (SELECT uid FROM me)) AS is_me,
    p.level,
    s.emoji AS sticker_emoji,
    p.streak_days,
    t.emoji AS title_emoji,
    t.name AS title_name,
    t.rarity AS title_rarity,
    p.username,
    p.xp_total,
    p.xp_week
  FROM public.profiles p
  LEFT JOIN public.cosmetic_items s ON s.item_key = p.equipped_sticker
  LEFT JOIN public.cosmetic_items t ON t.item_key = p.equipped_title
  WHERE p.id IN (SELECT pid FROM pool)
  ORDER BY p.xp_week DESC NULLS LAST, p.xp_total DESC NULLS LAST;
$$;
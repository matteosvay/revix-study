
-- Helper inline: current week start (Monday)
-- (CURRENT_DATE - ((EXTRACT(DOW FROM CURRENT_DATE)::int + 6) % 7))

CREATE OR REPLACE FUNCTION public.get_global_leaderboard()
 RETURNS TABLE(id uuid, display_name text, avatar_url text, level integer, xp_week integer, xp_total integer, streak_days integer, equipped_frame text, equipped_sticker text, equipped_title text, sticker_emoji text, title_name text, title_emoji text, title_rarity text, is_me boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.id, p.display_name, p.avatar_url, p.level,
         CASE WHEN p.week_started_at IS NOT NULL
              AND p.week_started_at >= (CURRENT_DATE - ((EXTRACT(DOW FROM CURRENT_DATE)::int + 6) % 7))
              THEN p.xp_week ELSE 0 END AS xp_week,
         p.xp_total, p.streak_days,
         p.equipped_frame, p.equipped_sticker, p.equipped_title,
         cs.emoji, ct.name, ct.emoji, ct.rarity,
         (p.id = auth.uid())
    FROM profiles p
    LEFT JOIN cosmetic_items cs ON cs.item_key = p.equipped_sticker
    LEFT JOIN cosmetic_items ct ON ct.item_key = p.equipped_title
   WHERE auth.uid() IS NOT NULL
   ORDER BY (CASE WHEN p.week_started_at IS NOT NULL
              AND p.week_started_at >= (CURRENT_DATE - ((EXTRACT(DOW FROM CURRENT_DATE)::int + 6) % 7))
              THEN p.xp_week ELSE 0 END) DESC, p.xp_total DESC
   LIMIT 100;
$function$;

CREATE OR REPLACE FUNCTION public.get_cursus_leaderboard()
 RETURNS TABLE(id uuid, display_name text, avatar_url text, level integer, xp_week integer, xp_total integer, streak_days integer, cursus text, equipped_frame text, equipped_sticker text, equipped_title text, sticker_emoji text, title_name text, title_emoji text, title_rarity text, is_me boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH me AS (SELECT cursus FROM profiles WHERE id = auth.uid())
  SELECT p.id, p.display_name, p.avatar_url, p.level,
         CASE WHEN p.week_started_at IS NOT NULL
              AND p.week_started_at >= (CURRENT_DATE - ((EXTRACT(DOW FROM CURRENT_DATE)::int + 6) % 7))
              THEN p.xp_week ELSE 0 END AS xp_week,
         p.xp_total, p.streak_days, p.cursus,
         p.equipped_frame, p.equipped_sticker, p.equipped_title,
         cs.emoji, ct.name, ct.emoji, ct.rarity,
         (p.id = auth.uid())
    FROM profiles p
    LEFT JOIN cosmetic_items cs ON cs.item_key = p.equipped_sticker
    LEFT JOIN cosmetic_items ct ON ct.item_key = p.equipped_title, me
   WHERE auth.uid() IS NOT NULL AND me.cursus IS NOT NULL AND p.cursus = me.cursus
   ORDER BY (CASE WHEN p.week_started_at IS NOT NULL
              AND p.week_started_at >= (CURRENT_DATE - ((EXTRACT(DOW FROM CURRENT_DATE)::int + 6) % 7))
              THEN p.xp_week ELSE 0 END) DESC, p.xp_total DESC
   LIMIT 100;
$function$;

CREATE OR REPLACE FUNCTION public.get_school_leaderboard()
 RETURNS TABLE(id uuid, display_name text, avatar_url text, level integer, xp_week integer, xp_total integer, streak_days integer, school text, equipped_frame text, equipped_sticker text, equipped_title text, sticker_emoji text, title_name text, title_emoji text, title_rarity text, is_me boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH me AS (SELECT school FROM profiles WHERE id = auth.uid())
  SELECT p.id, p.display_name, p.avatar_url, p.level,
         CASE WHEN p.week_started_at IS NOT NULL
              AND p.week_started_at >= (CURRENT_DATE - ((EXTRACT(DOW FROM CURRENT_DATE)::int + 6) % 7))
              THEN p.xp_week ELSE 0 END AS xp_week,
         p.xp_total, p.streak_days, p.school,
         p.equipped_frame, p.equipped_sticker, p.equipped_title,
         cs.emoji, ct.name, ct.emoji, ct.rarity,
         (p.id = auth.uid())
    FROM profiles p
    LEFT JOIN cosmetic_items cs ON cs.item_key = p.equipped_sticker
    LEFT JOIN cosmetic_items ct ON ct.item_key = p.equipped_title, me
   WHERE auth.uid() IS NOT NULL AND me.school IS NOT NULL AND p.school = me.school
   ORDER BY (CASE WHEN p.week_started_at IS NOT NULL
              AND p.week_started_at >= (CURRENT_DATE - ((EXTRACT(DOW FROM CURRENT_DATE)::int + 6) % 7))
              THEN p.xp_week ELSE 0 END) DESC, p.xp_total DESC
   LIMIT 100;
$function$;

CREATE OR REPLACE FUNCTION public.get_friends_leaderboard()
 RETURNS TABLE(avatar_url text, display_name text, equipped_frame text, equipped_sticker text, equipped_title text, gender text, id uuid, is_me boolean, level integer, sticker_emoji text, streak_days integer, title_emoji text, title_name text, title_rarity text, username text, xp_total integer, xp_week integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH me AS (SELECT auth.uid() AS uid),
  friend_ids AS (
    SELECT CASE WHEN f.requester_id = (SELECT uid FROM me) THEN f.addressee_id ELSE f.requester_id END AS fid
    FROM public.friendships f
    WHERE f.status = 'accepted'
      AND ((SELECT uid FROM me) IN (f.requester_id, f.addressee_id))
  ),
  ids AS (
    SELECT (SELECT uid FROM me) AS uid
    UNION
    SELECT fid FROM friend_ids
  )
  SELECT p.avatar_url, p.display_name, p.equipped_frame, p.equipped_sticker, p.equipped_title,
         p.gender, p.id, (p.id = (SELECT uid FROM me)) AS is_me, p.level,
         cs.emoji AS sticker_emoji, p.streak_days,
         ct.emoji AS title_emoji, ct.name AS title_name, ct.rarity AS title_rarity,
         p.username, p.xp_total,
         CASE WHEN p.week_started_at IS NOT NULL
              AND p.week_started_at >= (CURRENT_DATE - ((EXTRACT(DOW FROM CURRENT_DATE)::int + 6) % 7))
              THEN p.xp_week ELSE 0 END AS xp_week
    FROM public.profiles p
    JOIN ids ON ids.uid = p.id
    LEFT JOIN public.cosmetic_items cs ON cs.item_key = p.equipped_sticker
    LEFT JOIN public.cosmetic_items ct ON ct.item_key = p.equipped_title
   ORDER BY (CASE WHEN p.week_started_at IS NOT NULL
              AND p.week_started_at >= (CURRENT_DATE - ((EXTRACT(DOW FROM CURRENT_DATE)::int + 6) % 7))
              THEN p.xp_week ELSE 0 END) DESC, p.xp_total DESC
   LIMIT 100;
$function$;

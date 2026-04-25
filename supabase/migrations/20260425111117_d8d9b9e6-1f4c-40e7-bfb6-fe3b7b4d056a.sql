-- Drop and recreate to change return type signatures
DROP FUNCTION IF EXISTS public.get_global_leaderboard();
DROP FUNCTION IF EXISTS public.get_friends_leaderboard();
DROP FUNCTION IF EXISTS public.get_cursus_leaderboard();
DROP FUNCTION IF EXISTS public.get_school_leaderboard();
DROP FUNCTION IF EXISTS public.get_group_members(uuid);
DROP FUNCTION IF EXISTS public.search_users_public(text);

CREATE FUNCTION public.get_global_leaderboard()
 RETURNS TABLE(id uuid, display_name text, avatar_url text, level integer, xp_week integer, xp_total integer, streak_days integer,
               equipped_frame text, equipped_sticker text, equipped_title text,
               sticker_emoji text, title_name text, title_emoji text, title_rarity text,
               is_me boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.id, p.display_name, p.avatar_url, p.level, p.xp_week, p.xp_total, p.streak_days,
         p.equipped_frame, p.equipped_sticker, p.equipped_title,
         cs.emoji, ct.name, ct.emoji, ct.rarity,
         (p.id = auth.uid())
    FROM profiles p
    LEFT JOIN cosmetic_items cs ON cs.item_key = p.equipped_sticker
    LEFT JOIN cosmetic_items ct ON ct.item_key = p.equipped_title
   WHERE auth.uid() IS NOT NULL
   ORDER BY p.xp_week DESC, p.xp_total DESC
   LIMIT 100;
$$;

CREATE FUNCTION public.get_friends_leaderboard()
 RETURNS TABLE(id uuid, display_name text, username text, avatar_url text, level integer, xp_week integer, xp_total integer, streak_days integer,
               equipped_frame text, equipped_sticker text, equipped_title text,
               sticker_emoji text, title_name text, title_emoji text, title_rarity text,
               is_me boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.id, p.display_name, p.username, p.avatar_url,
         p.level, p.xp_week, p.xp_total, p.streak_days,
         p.equipped_frame, p.equipped_sticker, p.equipped_title,
         cs.emoji, ct.name, ct.emoji, ct.rarity,
         (p.id = auth.uid())
  FROM public.profiles p
  LEFT JOIN cosmetic_items cs ON cs.item_key = p.equipped_sticker
  LEFT JOIN cosmetic_items ct ON ct.item_key = p.equipped_title
  WHERE auth.uid() IS NOT NULL
    AND (p.id = auth.uid() OR p.id IN (SELECT friend_id FROM public.get_friend_ids(auth.uid())))
  ORDER BY p.xp_week DESC, p.xp_total DESC;
$$;

CREATE FUNCTION public.get_cursus_leaderboard()
 RETURNS TABLE(id uuid, display_name text, avatar_url text, level integer, xp_week integer, xp_total integer, streak_days integer, cursus text,
               equipped_frame text, equipped_sticker text, equipped_title text,
               sticker_emoji text, title_name text, title_emoji text, title_rarity text,
               is_me boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH me AS (SELECT cursus FROM profiles WHERE id = auth.uid())
  SELECT p.id, p.display_name, p.avatar_url, p.level, p.xp_week, p.xp_total, p.streak_days, p.cursus,
         p.equipped_frame, p.equipped_sticker, p.equipped_title,
         cs.emoji, ct.name, ct.emoji, ct.rarity,
         (p.id = auth.uid())
    FROM profiles p
    LEFT JOIN cosmetic_items cs ON cs.item_key = p.equipped_sticker
    LEFT JOIN cosmetic_items ct ON ct.item_key = p.equipped_title, me
   WHERE auth.uid() IS NOT NULL AND me.cursus IS NOT NULL AND p.cursus = me.cursus
   ORDER BY p.xp_week DESC, p.xp_total DESC LIMIT 100;
$$;

CREATE FUNCTION public.get_school_leaderboard()
 RETURNS TABLE(id uuid, display_name text, avatar_url text, level integer, xp_week integer, xp_total integer, streak_days integer, school text,
               equipped_frame text, equipped_sticker text, equipped_title text,
               sticker_emoji text, title_name text, title_emoji text, title_rarity text,
               is_me boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH me AS (SELECT school FROM profiles WHERE id = auth.uid())
  SELECT p.id, p.display_name, p.avatar_url, p.level, p.xp_week, p.xp_total, p.streak_days, p.school,
         p.equipped_frame, p.equipped_sticker, p.equipped_title,
         cs.emoji, ct.name, ct.emoji, ct.rarity,
         (p.id = auth.uid())
    FROM profiles p
    LEFT JOIN cosmetic_items cs ON cs.item_key = p.equipped_sticker
    LEFT JOIN cosmetic_items ct ON ct.item_key = p.equipped_title, me
   WHERE auth.uid() IS NOT NULL AND me.school IS NOT NULL AND p.school = me.school
   ORDER BY p.xp_week DESC, p.xp_total DESC LIMIT 100;
$$;

CREATE FUNCTION public.get_group_members(p_group_id uuid)
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, level integer, role text,
               contributed_today boolean, xp_today integer,
               equipped_frame text, equipped_sticker text, equipped_title text,
               sticker_emoji text, title_name text, title_emoji text, title_rarity text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT m.user_id, p.display_name, p.avatar_url, p.level, m.role,
         COALESCE(a.xp_contributed, 0) > 0, COALESCE(a.xp_contributed, 0),
         p.equipped_frame, p.equipped_sticker, p.equipped_title,
         cs.emoji, ct.name, ct.emoji, ct.rarity
  FROM study_group_members m
  JOIN profiles p ON p.id = m.user_id
  LEFT JOIN cosmetic_items cs ON cs.item_key = p.equipped_sticker
  LEFT JOIN cosmetic_items ct ON ct.item_key = p.equipped_title
  LEFT JOIN study_group_activity a ON a.group_id = m.group_id AND a.user_id = m.user_id AND a.activity_date = CURRENT_DATE
  WHERE m.group_id = p_group_id AND public.is_group_member(p_group_id, auth.uid())
  ORDER BY COALESCE(a.xp_contributed, 0) DESC, p.display_name;
$$;

CREATE FUNCTION public.search_users_public(p_query text)
 RETURNS TABLE(id uuid, display_name text, username text, student_code text, avatar_url text, level integer, cursus text,
               equipped_frame text, equipped_sticker text, equipped_title text,
               sticker_emoji text, title_name text, title_emoji text, title_rarity text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.id, p.display_name, p.username, p.student_code, p.avatar_url, p.level, p.cursus,
         p.equipped_frame, p.equipped_sticker, p.equipped_title,
         cs.emoji, ct.name, ct.emoji, ct.rarity
  FROM public.profiles p
  LEFT JOIN cosmetic_items cs ON cs.item_key = p.equipped_sticker
  LEFT JOIN cosmetic_items ct ON ct.item_key = p.equipped_title
  WHERE auth.uid() IS NOT NULL
    AND p.id <> auth.uid()
    AND length(coalesce(p_query, '')) >= 2
    AND (p.student_code ILIKE '%' || p_query || '%'
      OR p.username ILIKE '%' || p_query || '%'
      OR p.display_name ILIKE '%' || p_query || '%')
  LIMIT 20;
$$;
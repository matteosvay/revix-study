-- Add gender column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gender text;

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_gender_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_gender_check
CHECK (gender IS NULL OR gender IN ('homme', 'femme', 'autre'));

-- Drop and recreate get_public_profile with gender
DROP FUNCTION IF EXISTS public.get_public_profile(uuid);

CREATE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS TABLE(
  avatar_url text,
  bio text,
  cursus text,
  display_name text,
  equipped_background text,
  equipped_frame text,
  equipped_sticker text,
  equipped_title text,
  formation text,
  gender text,
  id uuid,
  level integer,
  sticker_emoji text,
  sticker_rarity text,
  streak_days integer,
  streak_record integer,
  student_code text,
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
  SELECT
    p.avatar_url,
    p.bio,
    p.cursus,
    p.display_name,
    p.equipped_background,
    p.equipped_frame,
    p.equipped_sticker,
    p.equipped_title,
    p.formation,
    p.gender,
    p.id,
    p.level,
    s.emoji AS sticker_emoji,
    s.rarity AS sticker_rarity,
    p.streak_days,
    p.streak_record,
    p.student_code,
    t.emoji AS title_emoji,
    t.name AS title_name,
    t.rarity AS title_rarity,
    p.username,
    p.xp_total,
    p.xp_week
  FROM public.profiles p
  LEFT JOIN public.cosmetic_items s ON s.item_key = p.equipped_sticker
  LEFT JOIN public.cosmetic_items t ON t.item_key = p.equipped_title
  WHERE p.id = p_user_id;
$$;

-- Update send_course_to_friend to include sender gender in notification metadata
CREATE OR REPLACE FUNCTION public.send_course_to_friend(
  p_course_id uuid,
  p_recipient_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id uuid := auth.uid();
  v_share_id uuid;
  v_course record;
  v_sender record;
BEGIN
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_sender_id = p_recipient_id THEN
    RAISE EXCEPTION 'Cannot send to yourself';
  END IF;

  -- Verify course belongs to sender
  SELECT id, title, emoji INTO v_course
  FROM public.courses
  WHERE id = p_course_id AND user_id = v_sender_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Course not found or not owned';
  END IF;

  -- Get sender info (name + gender)
  SELECT display_name, gender INTO v_sender
  FROM public.profiles
  WHERE id = v_sender_id;

  -- Insert share record
  INSERT INTO public.course_shares (course_id, sender_id, recipient_id, status)
  VALUES (p_course_id, v_sender_id, p_recipient_id, 'pending')
  RETURNING id INTO v_share_id;

  -- Notify recipient with sender gender in metadata
  INSERT INTO public.notifications (
    user_id, actor_id, type, title, message, link, metadata
  ) VALUES (
    p_recipient_id,
    v_sender_id,
    'course_share_received',
    'Nouvelle fiche partagée 📚',
    coalesce(v_sender.display_name, 'Quelqu''un') || ' t''a envoyé : ' || v_course.title,
    '/app',
    jsonb_build_object(
      'share_id', v_share_id,
      'course_id', v_course.id,
      'course_title', v_course.title,
      'course_emoji', v_course.emoji,
      'sender_id', v_sender_id,
      'sender_name', v_sender.display_name,
      'sender_gender', v_sender.gender
    )
  );

  RETURN jsonb_build_object('share_id', v_share_id, 'status', 'pending');
END;
$$;
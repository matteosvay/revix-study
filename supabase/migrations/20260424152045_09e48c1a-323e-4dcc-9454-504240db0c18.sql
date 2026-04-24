
-- 1. Nouvelles colonnes profil
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS student_code text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_student_code_unique_idx
  ON public.profiles (student_code)
  WHERE student_code IS NOT NULL;

-- 2. Génération code étudiant unique
CREATE OR REPLACE FUNCTION public.generate_student_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_exists boolean;
  v_attempts int := 0;
BEGIN
  LOOP
    v_code := 'REVIX-' || lpad(floor(random() * 9000 + 1000)::int::text, 4, '0');
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE student_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists OR v_attempts > 20;
    v_attempts := v_attempts + 1;
  END LOOP;
  RETURN v_code;
END;
$$;

-- Backfill codes manquants
UPDATE public.profiles
SET student_code = public.generate_student_code()
WHERE student_code IS NULL;

-- Trigger pour auto-générer à la création
CREATE OR REPLACE FUNCTION public.set_student_code_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.student_code IS NULL THEN
    NEW.student_code := public.generate_student_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_student_code ON public.profiles;
CREATE TRIGGER profiles_set_student_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_student_code_on_insert();

-- 3. Table friendships
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  addressee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT friendships_no_self CHECK (requester_id <> addressee_id),
  CONSTRAINT friendships_unique_pair UNIQUE (requester_id, addressee_id)
);

CREATE INDEX IF NOT EXISTS friendships_requester_idx ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS friendships_addressee_idx ON public.friendships(addressee_id);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "see own friendships" ON public.friendships;
CREATE POLICY "see own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "send friend request" ON public.friendships;
CREATE POLICY "send friend request"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');

DROP POLICY IF EXISTS "respond to friend request" ON public.friendships;
CREATE POLICY "respond to friend request"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = addressee_id AND status = 'accepted');

DROP POLICY IF EXISTS "delete own friendship" ON public.friendships;
CREATE POLICY "delete own friendship"
  ON public.friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP TRIGGER IF EXISTS trg_friendships_updated_at ON public.friendships;
CREATE TRIGGER trg_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Mise à jour handle_new_user pour code automatique (déjà via trigger BEFORE INSERT)
-- (rien à changer, set_student_code_on_insert s'occupe de ça)

-- 5. Helper : récupère les ids amis d'un user (acceptées seulement)
CREATE OR REPLACE FUNCTION public.get_friend_ids(p_user_id uuid)
RETURNS TABLE(friend_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE WHEN requester_id = p_user_id THEN addressee_id ELSE requester_id END
  FROM public.friendships
  WHERE status = 'accepted'
    AND (requester_id = p_user_id OR addressee_id = p_user_id);
$$;

-- 6. Recherche d'utilisateurs publique (limitée)
CREATE OR REPLACE FUNCTION public.search_users_public(p_query text)
RETURNS TABLE(
  id uuid,
  display_name text,
  username text,
  student_code text,
  avatar_url text,
  level int,
  cursus text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name, p.username, p.student_code, p.avatar_url, p.level, p.cursus
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND p.id <> auth.uid()
    AND length(coalesce(p_query, '')) >= 2
    AND (
      p.student_code ILIKE '%' || p_query || '%'
      OR p.username ILIKE '%' || p_query || '%'
      OR p.display_name ILIKE '%' || p_query || '%'
    )
  LIMIT 20;
$$;

-- 7. Profil public d'un utilisateur (utilisé pour amis ou résultats recherche)
CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS TABLE(
  id uuid,
  display_name text,
  username text,
  student_code text,
  avatar_url text,
  bio text,
  level int,
  cursus text,
  formation text,
  streak_days int,
  streak_record int,
  xp_total int,
  xp_week int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name, p.username, p.student_code, p.avatar_url, p.bio,
         p.level, p.cursus, p.formation, p.streak_days, p.streak_record, p.xp_total, p.xp_week
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND p.id = p_user_id;
$$;

-- 8. Classement hebdo des amis (+ toi)
CREATE OR REPLACE FUNCTION public.get_friends_leaderboard()
RETURNS TABLE(
  id uuid,
  display_name text,
  username text,
  avatar_url text,
  level int,
  xp_week int,
  xp_total int,
  streak_days int,
  is_me boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name, p.username, p.avatar_url,
         p.level, p.xp_week, p.xp_total, p.streak_days,
         (p.id = auth.uid()) AS is_me
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND (
      p.id = auth.uid()
      OR p.id IN (SELECT friend_id FROM public.get_friend_ids(auth.uid()))
    )
  ORDER BY p.xp_week DESC, p.xp_total DESC;
$$;

-- 9. Réservation pseudo
CREATE OR REPLACE FUNCTION public.set_username(p_username text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean text;
  v_exists boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;
  v_clean := lower(trim(p_username));
  IF v_clean !~ '^[a-z0-9_]{3,20}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_format');
  END IF;
  SELECT EXISTS(
    SELECT 1 FROM public.profiles
    WHERE lower(username) = v_clean AND id <> auth.uid()
  ) INTO v_exists;
  IF v_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'taken');
  END IF;
  UPDATE public.profiles SET username = v_clean WHERE id = auth.uid();
  RETURN jsonb_build_object('success', true, 'username', v_clean);
END;
$$;

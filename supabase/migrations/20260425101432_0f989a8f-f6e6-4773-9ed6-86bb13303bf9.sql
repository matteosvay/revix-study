-- ============================================
-- VAGUE 3 — Social compétitif
-- ============================================

-- 1) DUEL PRESENCE (live duels)
CREATE TABLE IF NOT EXISTS public.duel_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id uuid NOT NULL,
  user_id uuid NOT NULL,
  ready boolean NOT NULL DEFAULT false,
  current_question int NOT NULL DEFAULT 0,
  last_seen timestamptz NOT NULL DEFAULT now(),
  UNIQUE (duel_id, user_id)
);
ALTER TABLE public.duel_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "see duel presence" ON public.duel_presence
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.duels d
    WHERE d.id = duel_id AND (auth.uid() = d.challenger_id OR auth.uid() = d.opponent_id))
);
CREATE POLICY "upsert own presence" ON public.duel_presence
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own presence" ON public.duel_presence
FOR UPDATE USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.duel_presence;

CREATE OR REPLACE FUNCTION public.set_duel_presence(p_duel_id uuid, p_ready boolean, p_current_question int DEFAULT 0)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ok boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT EXISTS(SELECT 1 FROM duels d WHERE d.id = p_duel_id
    AND (d.challenger_id = auth.uid() OR d.opponent_id = auth.uid())) INTO v_ok;
  IF NOT v_ok THEN RAISE EXCEPTION 'not_a_player'; END IF;
  INSERT INTO duel_presence(duel_id, user_id, ready, current_question, last_seen)
  VALUES (p_duel_id, auth.uid(), p_ready, p_current_question, now())
  ON CONFLICT (duel_id, user_id) DO UPDATE
    SET ready = EXCLUDED.ready,
        current_question = GREATEST(duel_presence.current_question, EXCLUDED.current_question),
        last_seen = now();
END; $$;

-- 2) STUDY GROUPS (streaks de groupe)
CREATE TABLE IF NOT EXISTS public.study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text DEFAULT '👥',
  owner_id uuid NOT NULL,
  invite_code text NOT NULL UNIQUE,
  group_streak_days int NOT NULL DEFAULT 0,
  group_streak_record int NOT NULL DEFAULT 0,
  last_active_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.study_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.study_group_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  xp_contributed int NOT NULL DEFAULT 0,
  UNIQUE (group_id, user_id, activity_date)
);
ALTER TABLE public.study_group_activity ENABLE ROW LEVEL SECURITY;

-- helpers
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM study_group_members WHERE group_id = p_group_id AND user_id = p_user_id);
$$;

-- RLS : groups
CREATE POLICY "members see group" ON public.study_groups
FOR SELECT USING (auth.uid() = owner_id OR public.is_group_member(id, auth.uid()));
CREATE POLICY "create own group" ON public.study_groups
FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner updates group" ON public.study_groups
FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "owner deletes group" ON public.study_groups
FOR DELETE USING (auth.uid() = owner_id);

-- RLS : members
CREATE POLICY "see group members" ON public.study_group_members
FOR SELECT USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "join as self" ON public.study_group_members
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "leave group" ON public.study_group_members
FOR DELETE USING (auth.uid() = user_id OR EXISTS(
  SELECT 1 FROM study_groups g WHERE g.id = group_id AND g.owner_id = auth.uid()
));

-- RLS : activity
CREATE POLICY "see group activity" ON public.study_group_activity
FOR SELECT USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "log own activity" ON public.study_group_activity
FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_group_member(group_id, auth.uid()));
CREATE POLICY "update own activity" ON public.study_group_activity
FOR UPDATE USING (auth.uid() = user_id);

-- generate group code
CREATE OR REPLACE FUNCTION public.generate_group_code()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_code text; v_exists boolean; v_attempts int := 0;
BEGIN
  LOOP
    v_code := upper(substring(md5(random()::text) for 6));
    SELECT EXISTS(SELECT 1 FROM study_groups WHERE invite_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists OR v_attempts > 30;
    v_attempts := v_attempts + 1;
  END LOOP;
  RETURN v_code;
END; $$;

CREATE OR REPLACE FUNCTION public.set_group_code_on_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := public.generate_group_code();
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_set_group_code BEFORE INSERT ON public.study_groups
FOR EACH ROW EXECUTE FUNCTION public.set_group_code_on_insert();

-- auto-add owner as member
CREATE OR REPLACE FUNCTION public.add_group_owner_as_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO study_group_members(group_id, user_id, role) VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_add_owner_member AFTER INSERT ON public.study_groups
FOR EACH ROW EXECUTE FUNCTION public.add_group_owner_as_member();

-- create / join / leave group
CREATE OR REPLACE FUNCTION public.create_study_group(p_name text, p_emoji text DEFAULT '👥')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF length(trim(p_name)) < 2 THEN RAISE EXCEPTION 'invalid_name'; END IF;
  INSERT INTO study_groups(name, emoji, owner_id) VALUES (trim(p_name), COALESCE(p_emoji, '👥'), auth.uid())
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.join_group_by_code(p_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_group_id uuid; v_count int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT id INTO v_group_id FROM study_groups WHERE invite_code = upper(trim(p_code));
  IF v_group_id IS NULL THEN RAISE EXCEPTION 'group_not_found'; END IF;
  SELECT COUNT(*) INTO v_count FROM study_group_members WHERE group_id = v_group_id;
  IF v_count >= 10 AND NOT EXISTS(SELECT 1 FROM study_group_members WHERE group_id = v_group_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'group_full';
  END IF;
  INSERT INTO study_group_members(group_id, user_id) VALUES (v_group_id, auth.uid())
  ON CONFLICT DO NOTHING;
  RETURN v_group_id;
END; $$;

CREATE OR REPLACE FUNCTION public.leave_study_group(p_group_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  DELETE FROM study_group_members WHERE group_id = p_group_id AND user_id = auth.uid();
END; $$;

-- log group activity (called from quiz/upload completion)
CREATE OR REPLACE FUNCTION public.log_group_activity(p_xp int DEFAULT 10)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_today date := CURRENT_DATE; v_g record; v_count int := 0;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  FOR v_g IN SELECT group_id FROM study_group_members WHERE user_id = v_user LOOP
    INSERT INTO study_group_activity(group_id, user_id, activity_date, xp_contributed)
    VALUES (v_g.group_id, v_user, v_today, p_xp)
    ON CONFLICT (group_id, user_id, activity_date) DO UPDATE
      SET xp_contributed = study_group_activity.xp_contributed + EXCLUDED.xp_contributed;
    -- check if all members contributed today → bump group streak
    PERFORM public.bump_group_streak(v_g.group_id);
    v_count := v_count + 1;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'groups_updated', v_count);
END; $$;

-- bump group streak if all members active today
CREATE OR REPLACE FUNCTION public.bump_group_streak(p_group_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_total int; v_active int; v_g record; v_today date := CURRENT_DATE;
BEGIN
  SELECT * INTO v_g FROM study_groups WHERE id = p_group_id;
  IF NOT FOUND THEN RETURN; END IF;
  IF v_g.last_active_date = v_today THEN RETURN; END IF;
  SELECT COUNT(*) INTO v_total FROM study_group_members WHERE group_id = p_group_id;
  SELECT COUNT(DISTINCT user_id) INTO v_active FROM study_group_activity
    WHERE group_id = p_group_id AND activity_date = v_today;
  IF v_active < v_total THEN RETURN; END IF;
  -- all members active today
  IF v_g.last_active_date = v_today - 1 THEN
    UPDATE study_groups SET group_streak_days = group_streak_days + 1,
      group_streak_record = GREATEST(group_streak_record, group_streak_days + 1),
      last_active_date = v_today WHERE id = p_group_id;
  ELSE
    UPDATE study_groups SET group_streak_days = 1,
      group_streak_record = GREATEST(group_streak_record, 1),
      last_active_date = v_today WHERE id = p_group_id;
  END IF;
END; $$;

-- get user's groups with details
CREATE OR REPLACE FUNCTION public.get_my_groups()
RETURNS TABLE(
  id uuid, name text, emoji text, invite_code text,
  group_streak_days int, group_streak_record int,
  member_count int, contributed_today int, all_contributed_today boolean,
  is_owner boolean
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT g.id, g.name, g.emoji, g.invite_code,
         g.group_streak_days, g.group_streak_record,
         (SELECT COUNT(*)::int FROM study_group_members WHERE group_id = g.id) AS member_count,
         (SELECT COUNT(DISTINCT user_id)::int FROM study_group_activity
            WHERE group_id = g.id AND activity_date = CURRENT_DATE) AS contributed_today,
         ((SELECT COUNT(DISTINCT user_id) FROM study_group_activity
            WHERE group_id = g.id AND activity_date = CURRENT_DATE)
          >= (SELECT COUNT(*) FROM study_group_members WHERE group_id = g.id)) AS all_contributed_today,
         (g.owner_id = auth.uid()) AS is_owner
  FROM study_groups g
  WHERE EXISTS(SELECT 1 FROM study_group_members m WHERE m.group_id = g.id AND m.user_id = auth.uid())
  ORDER BY g.group_streak_days DESC, g.created_at DESC;
$$;

-- get group details + members
CREATE OR REPLACE FUNCTION public.get_group_members(p_group_id uuid)
RETURNS TABLE(
  user_id uuid, display_name text, avatar_url text, level int,
  role text, contributed_today boolean, xp_today int
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.user_id, p.display_name, p.avatar_url, p.level, m.role,
         COALESCE(a.xp_contributed, 0) > 0 AS contributed_today,
         COALESCE(a.xp_contributed, 0) AS xp_today
  FROM study_group_members m
  JOIN profiles p ON p.id = m.user_id
  LEFT JOIN study_group_activity a ON a.group_id = m.group_id AND a.user_id = m.user_id AND a.activity_date = CURRENT_DATE
  WHERE m.group_id = p_group_id
    AND public.is_group_member(p_group_id, auth.uid())
  ORDER BY xp_today DESC, p.display_name;
$$;

-- 3) LEADERBOARDS (school / cursus / global)
CREATE OR REPLACE FUNCTION public.get_school_leaderboard()
RETURNS TABLE(id uuid, display_name text, avatar_url text, level int, xp_week int, xp_total int, streak_days int, school text, is_me boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH me AS (SELECT school FROM profiles WHERE id = auth.uid())
  SELECT p.id, p.display_name, p.avatar_url, p.level, p.xp_week, p.xp_total, p.streak_days, p.school,
         (p.id = auth.uid()) AS is_me
    FROM profiles p, me
   WHERE auth.uid() IS NOT NULL
     AND me.school IS NOT NULL
     AND p.school = me.school
   ORDER BY p.xp_week DESC, p.xp_total DESC
   LIMIT 100;
$$;

CREATE OR REPLACE FUNCTION public.get_cursus_leaderboard()
RETURNS TABLE(id uuid, display_name text, avatar_url text, level int, xp_week int, xp_total int, streak_days int, cursus text, is_me boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH me AS (SELECT cursus FROM profiles WHERE id = auth.uid())
  SELECT p.id, p.display_name, p.avatar_url, p.level, p.xp_week, p.xp_total, p.streak_days, p.cursus,
         (p.id = auth.uid()) AS is_me
    FROM profiles p, me
   WHERE auth.uid() IS NOT NULL
     AND me.cursus IS NOT NULL
     AND p.cursus = me.cursus
   ORDER BY p.xp_week DESC, p.xp_total DESC
   LIMIT 100;
$$;

CREATE OR REPLACE FUNCTION public.get_global_leaderboard()
RETURNS TABLE(id uuid, display_name text, avatar_url text, level int, xp_week int, xp_total int, streak_days int, is_me boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.display_name, p.avatar_url, p.level, p.xp_week, p.xp_total, p.streak_days,
         (p.id = auth.uid()) AS is_me
    FROM profiles p
   WHERE auth.uid() IS NOT NULL
   ORDER BY p.xp_week DESC, p.xp_total DESC
   LIMIT 100;
$$;
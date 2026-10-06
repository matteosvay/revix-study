-- =====================================================================
-- Signalements, blocages entre élèves, et série qui pardonne un jour.
-- À coller en une fois dans Lovable Cloud > SQL editor.
-- =====================================================================

-- 1) Signalements : erreur dans une fiche ou une question, message ou profil
--    inapproprié, contenu qui porte atteinte aux droits d'un tiers.
CREATE TABLE IF NOT EXISTS public.content_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('fiche','question','message','profile','room','other')),
  target_id   text NOT NULL CHECK (char_length(target_id) BETWEEN 1 AND 200),
  reason      text NOT NULL CHECK (reason IN ('erreur','inapproprie','harcelement','droits','autre')),
  details     text CHECK (details IS NULL OR char_length(details) <= 1000),
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','closed')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS content_reports_status_idx ON public.content_reports (status, created_at DESC);

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports insert own" ON public.content_reports;
CREATE POLICY "reports insert own" ON public.content_reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid() AND status = 'open');

DROP POLICY IF EXISTS "reports read own" ON public.content_reports;
CREATE POLICY "reports read own" ON public.content_reports
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());
-- Pas de UPDATE ni de DELETE pour les utilisateurs : seul l'admin traite les
-- signalements, depuis le SQL editor ou avec la clé de service.

-- Limite anti-abus : 30 signalements par jour et par personne.
CREATE OR REPLACE FUNCTION public.limit_content_reports()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.content_reports
       WHERE reporter_id = NEW.reporter_id
         AND created_at > now() - interval '1 day') >= 30 THEN
    RAISE EXCEPTION 'too_many_reports';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS content_reports_limit ON public.content_reports;
CREATE TRIGGER content_reports_limit BEFORE INSERT ON public.content_reports
  FOR EACH ROW EXECUTE FUNCTION public.limit_content_reports();

-- 2) Blocages entre élèves
CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocks own" ON public.user_blocks;
CREATE POLICY "blocks own" ON public.user_blocks
  FOR ALL TO authenticated
  USING (blocker_id = auth.uid())
  WITH CHECK (blocker_id = auth.uid());

-- Vérifie s'il existe un blocage entre deux personnes, dans un sens ou dans l'autre.
-- SECURITY DEFINER : la personne bloquée ne peut pas lire les blocages des autres
-- (la table est privée), mais la règle doit quand même pouvoir les vérifier.
CREATE OR REPLACE FUNCTION public.is_blocked_between(p_a uuid, p_b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
     WHERE (blocker_id = p_a AND blocked_id = p_b)
        OR (blocker_id = p_b AND blocked_id = p_a)
  )
$$;
REVOKE ALL ON FUNCTION public.is_blocked_between(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_blocked_between(uuid, uuid) TO authenticated;

-- Une personne bloquée ne peut plus t'envoyer de demande d'ami.
-- Politique RESTRICTIVE : elle s'ajoute aux règles existantes sans les remplacer.
DO $$
BEGIN
  IF to_regclass('public.friendships') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "no friend request when blocked" ON public.friendships';
    EXECUTE $p$
      CREATE POLICY "no friend request when blocked" ON public.friendships
        AS RESTRICTIVE FOR INSERT TO authenticated
        WITH CHECK (NOT public.is_blocked_between(friendships.requester_id, friendships.addressee_id))
    $p$;
  END IF;
END $$;

-- 3) Série qui pardonne : un jour manqué par semaine ne casse pas la série.
--    La série continue, le jour manqué compte comme un jour de repos.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_grace_week date;
-- Pas de GRANT UPDATE sur cette colonne : seul le serveur la modifie.

CREATE OR REPLACE FUNCTION public.bump_streak(p_user_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_last   DATE;
  v_streak INT;
  v_record INT;
  v_grace  DATE;
  v_today  DATE := (now() AT TIME ZONE 'Europe/Paris')::date;
  v_week   DATE := date_trunc('week', (now() AT TIME ZONE 'Europe/Paris'))::date;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT last_active_date, streak_days, streak_record, streak_grace_week
    INTO v_last, v_streak, v_record, v_grace
    FROM public.profiles WHERE id = p_user_id;

  IF v_last = v_today THEN RETURN; END IF;

  IF v_last = v_today - 1 THEN
    v_streak := COALESCE(v_streak, 0) + 1;
  ELSIF v_last = v_today - 2 AND (v_grace IS NULL OR v_grace < v_week) THEN
    -- Un seul jour manqué, et le jour de repos de la semaine n'a pas encore servi.
    v_streak := COALESCE(v_streak, 0) + 1;
    v_grace  := v_week;
  ELSE
    v_streak := 1;
  END IF;

  IF v_streak > COALESCE(v_record, 0) THEN v_record := v_streak; END IF;

  UPDATE public.profiles
     SET last_active_date = v_today,
         streak_days = v_streak,
         streak_record = v_record,
         streak_grace_week = v_grace
   WHERE id = p_user_id;
END; $function$;

REVOKE ALL ON FUNCTION public.bump_streak(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bump_streak(uuid) TO authenticated;

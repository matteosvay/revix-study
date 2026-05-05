ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'gratuit';

UPDATE public.profiles SET subscription_tier = COALESCE(plan, 'gratuit');

DROP VIEW IF EXISTS public.admin_daily_stats CASCADE;
DROP VIEW IF EXISTS public.admin_user_stats CASCADE;

CREATE VIEW public.admin_daily_stats
WITH (security_invoker = true)
AS
SELECT
  d.day::date AS day,
  (SELECT count(*) FROM public.profiles p WHERE p.created_at::date = d.day::date) AS new_users,
  (SELECT count(*) FROM public.quizzes q WHERE q.created_at::date = d.day::date) AS quizzes_created,
  (SELECT count(*) FROM public.courses c WHERE c.created_at::date = d.day::date) AS courses_created,
  (SELECT count(*) FROM public.quiz_attempts a WHERE a.created_at::date = d.day::date) AS quiz_attempts,
  (SELECT count(*) FROM public.subscriptions s WHERE s.created_at::date = d.day::date AND s.status = 'active') AS new_subscriptions
FROM generate_series(
  (CURRENT_DATE - INTERVAL '60 days')::date,
  CURRENT_DATE,
  INTERVAL '1 day'
) AS d(day);

CREATE VIEW public.admin_user_stats
WITH (security_invoker = true)
AS
SELECT
  p.id AS user_id,
  p.display_name,
  p.email,
  p.subscription_tier,
  p.plan,
  p.xp_total,
  p.level,
  p.streak_days,
  p.created_at,
  p.last_active_date,
  (SELECT count(*) FROM public.quizzes q WHERE q.user_id = p.id) AS total_quizzes,
  (SELECT count(*) FROM public.quiz_attempts qa WHERE qa.user_id = p.id) AS total_attempts,
  (SELECT count(*) FROM public.courses c WHERE c.user_id = p.id) AS total_courses
FROM public.profiles p;

REVOKE ALL ON public.admin_daily_stats FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.admin_user_stats FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_daily_stats()
RETURNS SETOF public.admin_daily_stats
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.admin_daily_stats
  WHERE public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

CREATE OR REPLACE FUNCTION public.get_admin_user_stats()
RETURNS SETOF public.admin_user_stats
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.admin_user_stats
  WHERE public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_daily_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_user_stats() TO authenticated;
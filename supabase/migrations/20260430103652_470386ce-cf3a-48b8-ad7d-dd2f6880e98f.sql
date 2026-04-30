-- Vue agrégée par jour et type d'action avec coût estimé
CREATE OR REPLACE VIEW public.admin_daily_stats AS
SELECT
  uc.period_key AS day,
  uc.action_type,
  COUNT(DISTINCT uc.user_id) AS unique_users,
  SUM(uc.count) AS total_calls,
  ROUND(
    (SUM(uc.count) * CASE uc.action_type
      WHEN 'fiche'      THEN 0.005
      WHEN 'quiz_ia'    THEN 0.003
      WHEN 'coach'      THEN 0.002
      WHEN 'correction' THEN 0.001
      WHEN 'planning'   THEN 0.004
      ELSE 0
    END)::numeric, 4
  ) AS estimated_cost_eur
FROM public.usage_counters uc
WHERE uc.period_type = 'daily'
GROUP BY uc.period_key, uc.action_type
ORDER BY uc.period_key DESC, uc.action_type;

-- Vue agrégée par utilisateur avec coût total estimé
CREATE OR REPLACE VIEW public.admin_user_stats AS
SELECT
  p.id AS user_id,
  p.email,
  p.plan,
  COALESCE(SUM(uc.count) FILTER (WHERE uc.period_type = 'daily'), 0)::bigint AS total_calls,
  COALESCE(SUM(uc.count) FILTER (WHERE uc.action_type = 'fiche'      AND uc.period_type = 'daily'), 0)::bigint AS fiches,
  COALESCE(SUM(uc.count) FILTER (WHERE uc.action_type = 'quiz_ia'    AND uc.period_type = 'daily'), 0)::bigint AS quizz,
  COALESCE(SUM(uc.count) FILTER (WHERE uc.action_type = 'coach'      AND uc.period_type = 'daily'), 0)::bigint AS coach,
  COALESCE(SUM(uc.count) FILTER (WHERE uc.action_type = 'correction' AND uc.period_type = 'daily'), 0)::bigint AS corrections,
  COALESCE(SUM(uc.count) FILTER (WHERE uc.action_type = 'planning'   AND uc.period_type = 'daily'), 0)::bigint AS plannings,
  ROUND(COALESCE(SUM(
    CASE WHEN uc.period_type = 'daily' THEN uc.count * CASE uc.action_type
      WHEN 'fiche'      THEN 0.005
      WHEN 'quiz_ia'    THEN 0.003
      WHEN 'coach'      THEN 0.002
      WHEN 'correction' THEN 0.001
      WHEN 'planning'   THEN 0.004
      ELSE 0
    END ELSE 0 END
  ), 0)::numeric, 4) AS estimated_cost_eur,
  MAX(uc.updated_at) AS last_activity
FROM public.profiles p
LEFT JOIN public.usage_counters uc ON uc.user_id = p.id
GROUP BY p.id, p.email, p.plan
ORDER BY total_calls DESC;

-- Sécurité : vues accessibles uniquement aux admins via la fonction security definer existante
REVOKE ALL ON public.admin_daily_stats FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.admin_user_stats  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.admin_daily_stats TO service_role;
GRANT SELECT ON public.admin_user_stats  TO service_role;

COMMENT ON VIEW public.admin_daily_stats IS 'Stats quotidiennes par action_type avec coût IA estimé. Accès via service_role uniquement (admin-stats edge function).';
COMMENT ON VIEW public.admin_user_stats IS 'Stats par utilisateur avec coût IA estimé. Accès via service_role uniquement (admin-stats edge function).';
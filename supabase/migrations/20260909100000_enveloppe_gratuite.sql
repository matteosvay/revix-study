-- =====================================================================
-- Plan gratuit : enveloppe unique au lieu d'un quota qui se recharge.
--
-- Avant : chaque semaine, le compteur repartait à zéro. Le coût d'un
-- utilisateur qui ne paiera jamais était donc illimité dans le temps, ce qui
-- rendait la marge sur coût variable négative quelle que soit la croissance.
--
-- Après : une dotation unique de crédits, consommée action par action et
-- jamais rechargée. Le coût maximal d'un inscrit non converti devient fini
-- et connu d'avance, de l'ordre de 0,25 €.
-- =====================================================================

-- 1) Autoriser le type de période 'lifetime' et le compteur 'free_credits'
DO $$
DECLARE v_name TEXT;
BEGIN
  -- period_type
  SELECT c.conname INTO v_name
    FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
   WHERE n.nspname='public' AND t.relname='usage_counters'
     AND c.contype='c' AND pg_get_constraintdef(c.oid) ILIKE '%period_type%'
   LIMIT 1;
  IF v_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.usage_counters DROP CONSTRAINT %I', v_name);
  END IF;
  ALTER TABLE public.usage_counters
    ADD CONSTRAINT usage_counters_period_type_check
    CHECK (period_type IN ('daily','weekly','lifetime'));

  -- action_type
  SELECT c.conname INTO v_name
    FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
   WHERE n.nspname='public' AND t.relname='usage_counters'
     AND c.contype='c' AND pg_get_constraintdef(c.oid) ILIKE '%action_type%'
   LIMIT 1;
  IF v_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.usage_counters DROP CONSTRAINT %I', v_name);
  END IF;
  ALTER TABLE public.usage_counters
    ADD CONSTRAINT usage_counters_action_type_check
    CHECK (action_type IN ('fiche','quiz_ia','coach','correction','planning',
                           'oral','transcription','ocr','free_credits'));
END $$;

-- 2) Consommation atomique de l'enveloppe
CREATE OR REPLACE FUNCTION public.consume_free_credits(
  p_user_id UUID,
  p_action_type TEXT,
  p_cost INTEGER,
  p_total INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new  INTEGER;
  v_used INTEGER := 0;
BEGIN
  -- Interdit de consommer l'enveloppe de quelqu'un d'autre.
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_cost IS NULL OR p_cost < 1 OR p_total IS NULL OR p_total < 1 THEN
    RAISE EXCEPTION 'invalid_arguments';
  END IF;

  -- Une action plus chère que l'enveloppe entière ne peut jamais passer.
  IF p_cost > p_total THEN
    RETURN jsonb_build_object(
      'allowed', false, 'used', 0, 'total', p_total, 'left', p_total,
      'cost', p_cost, 'action', p_action_type
    );
  END IF;

  -- Le WHERE de la clause DO UPDATE rend l'opération atomique : deux appels
  -- simultanés ne peuvent pas faire passer le compteur au-dessus du plafond.
  INSERT INTO public.usage_counters (user_id, action_type, period_type, period_key, count)
  VALUES (p_user_id, 'free_credits', 'lifetime', 'grant', p_cost)
  ON CONFLICT (user_id, action_type, period_type, period_key)
  DO UPDATE SET count = public.usage_counters.count + p_cost, updated_at = now()
  WHERE public.usage_counters.count + p_cost <= p_total
  RETURNING count INTO v_new;

  IF v_new IS NULL THEN
    SELECT COALESCE(count, 0) INTO v_used
      FROM public.usage_counters
     WHERE user_id = p_user_id AND action_type = 'free_credits'
       AND period_type = 'lifetime' AND period_key = 'grant';
    RETURN jsonb_build_object(
      'allowed', false, 'used', v_used, 'total', p_total,
      'left', GREATEST(p_total - v_used, 0), 'cost', p_cost, 'action', p_action_type
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true, 'used', v_new, 'total', p_total,
    'left', GREATEST(p_total - v_new, 0), 'cost', p_cost, 'action', p_action_type
  );
END $$;

REVOKE ALL ON FUNCTION public.consume_free_credits(uuid, text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_free_credits(uuid, text, integer, integer) TO authenticated, service_role;

-- 3) Lecture de l'enveloppe restante, pour l'affichage dans l'app
CREATE OR REPLACE FUNCTION public.get_my_free_credits(p_total INTEGER DEFAULT 20)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_used INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  SELECT COALESCE(count, 0) INTO v_used
    FROM public.usage_counters
   WHERE user_id = auth.uid() AND action_type = 'free_credits'
     AND period_type = 'lifetime' AND period_key = 'grant';
  RETURN jsonb_build_object(
    'used', v_used, 'total', p_total, 'left', GREATEST(p_total - v_used, 0)
  );
END $$;

REVOKE ALL ON FUNCTION public.get_my_free_credits(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_free_credits(integer) TO authenticated;

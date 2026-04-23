-- Ajout des champs profil
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS formation text,
  ADD COLUMN IF NOT EXISTS subjects jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS streak_tokens integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quiz_completed_count integer NOT NULL DEFAULT 0;

-- Fonction : incrémenter compteur quiz et donner un jeton tous les 10 quiz (max 3)
CREATE OR REPLACE FUNCTION public.increment_quiz_count(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_tokens int;
  v_earned boolean := false;
BEGIN
  UPDATE public.profiles
    SET quiz_completed_count = quiz_completed_count + 1
    WHERE id = p_user_id
    RETURNING quiz_completed_count, streak_tokens INTO v_count, v_tokens;

  -- tous les 10 quiz, +1 jeton (plafonné à 3)
  IF v_count % 10 = 0 AND v_tokens < 3 THEN
    UPDATE public.profiles
      SET streak_tokens = streak_tokens + 1
      WHERE id = p_user_id
      RETURNING streak_tokens INTO v_tokens;
    v_earned := true;
  END IF;

  RETURN jsonb_build_object('count', v_count, 'tokens', v_tokens, 'earned', v_earned);
END; $$;

-- Fonction : restaurer une streak perdue (consomme un jeton, Pro uniquement)
CREATE OR REPLACE FUNCTION public.restore_streak(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_tokens int;
  v_record int;
  v_last date;
  v_today date := CURRENT_DATE;
BEGIN
  SELECT plan, streak_tokens, streak_record, last_active_date
    INTO v_plan, v_tokens, v_record, v_last
    FROM public.profiles WHERE id = p_user_id;

  IF v_plan <> 'pro' THEN
    RETURN jsonb_build_object('success', false, 'error', 'pro_required');
  END IF;
  IF v_tokens < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_tokens');
  END IF;
  IF v_last IS NULL OR v_last >= v_today - 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_broken_streak');
  END IF;

  -- restaure : remet streak_record et last_active_date à hier
  UPDATE public.profiles
    SET streak_tokens = streak_tokens - 1,
        streak_days = GREATEST(streak_days, v_record),
        last_active_date = v_today - 1
    WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'tokens_left', v_tokens - 1);
END; $$;
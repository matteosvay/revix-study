-- Fonction de démarrage d'une session de révision (sans IA)
CREATE OR REPLACE FUNCTION public.start_review_session(
  p_course_id uuid,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  question text,
  answer text,
  question_type text,
  options jsonb,
  difficulty int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_ids uuid[];
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth required';
  END IF;

  -- Sélectionne les questions à montrer (priorité : moins vues, puis taux d'échec élevé)
  SELECT array_agg(qb.id)
    INTO v_ids
  FROM (
    SELECT q.id
    FROM public.quiz_bank q
    WHERE q.user_id = v_uid AND q.course_id = p_course_id
    ORDER BY
      q.times_shown ASC,
      (q.times_correct::numeric / NULLIF(q.times_shown, 0)) ASC NULLS FIRST,
      random()
    LIMIT GREATEST(p_limit, 1)
  ) qb;

  IF v_ids IS NULL OR array_length(v_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  -- Incrémente le compteur d'affichage
  UPDATE public.quiz_bank
     SET times_shown = times_shown + 1
   WHERE id = ANY(v_ids) AND user_id = v_uid;

  RETURN QUERY
    SELECT q.id, q.question, q.answer, q.question_type, q.options, q.difficulty
    FROM public.quiz_bank q
    WHERE q.id = ANY(v_ids)
    ORDER BY random();
END;
$$;

REVOKE ALL ON FUNCTION public.start_review_session(uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_review_session(uuid, int) TO authenticated;

-- Fonction d'enregistrement d'une réponse de révision
CREATE OR REPLACE FUNCTION public.record_review_answer(
  p_question_id uuid,
  p_correct boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth required';
  END IF;

  IF p_correct THEN
    UPDATE public.quiz_bank
       SET times_correct = times_correct + 1
     WHERE id = p_question_id AND user_id = v_uid;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.record_review_answer(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_review_answer(uuid, boolean) TO authenticated;
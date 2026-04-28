-- Tente de cloner un cours existant (et sa banque de quiz) à partir d'un hash de contenu.
-- Retourne l'id du nouveau cours si trouvé, sinon NULL.
CREATE OR REPLACE FUNCTION public.clone_course_by_hash(
  p_content_hash TEXT,
  p_target_user_id UUID,
  p_title TEXT,
  p_subject TEXT,
  p_level TEXT,
  p_source_content TEXT,
  p_source_file_path TEXT,
  p_exam_date DATE
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source_course public.courses%ROWTYPE;
  v_new_id UUID;
BEGIN
  -- Sécurité : seul le user authentifié peut cloner pour lui-même
  IF auth.uid() IS NULL OR auth.uid() <> p_target_user_id THEN
    RETURN NULL;
  END IF;
  IF p_content_hash IS NULL OR length(p_content_hash) < 16 THEN
    RETURN NULL;
  END IF;

  -- Trouve un cours source (n'importe quel utilisateur) qui a déjà un summary généré
  SELECT * INTO v_source_course
    FROM public.courses
   WHERE content_hash = p_content_hash
     AND summary IS NOT NULL
   ORDER BY created_at ASC
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Crée le nouveau cours pour le user cible avec le même summary
  INSERT INTO public.courses (
    user_id, title, subject, level, source_content, source_file_path,
    exam_date, summary, content_hash, emoji
  ) VALUES (
    p_target_user_id, p_title, p_subject, p_level, p_source_content, p_source_file_path,
    p_exam_date, v_source_course.summary, p_content_hash, COALESCE(v_source_course.emoji, '📘')
  )
  RETURNING id INTO v_new_id;

  -- Clone la banque de quiz du cours source
  INSERT INTO public.quiz_bank (course_id, user_id, question, answer, question_type, options, difficulty)
  SELECT v_new_id, p_target_user_id, question, answer, question_type, options, difficulty
    FROM public.quiz_bank
   WHERE course_id = v_source_course.id;

  RETURN v_new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.clone_course_by_hash(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clone_course_by_hash(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, DATE) TO authenticated;

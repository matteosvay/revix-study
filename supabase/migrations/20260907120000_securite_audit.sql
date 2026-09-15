-- =====================================================================
-- Correctifs de sécurité issus de l'audit complet.
-- Chaque bloc est idempotent et défensif : la migration peut être rejouée.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) profiles : empêcher un client de s'octroyer le plan Max, de l'XP,
--    des niveaux ou des cosmétiques par écriture directe.
--
--    On utilise des privilèges PAR COLONNE plutôt qu'un trigger : les
--    fonctions SECURITY DEFINER (award_xp, bump_streak, equip_cosmetic…)
--    s'exécutent avec le rôle propriétaire et continuent donc de marcher,
--    alors qu'un trigger de garde les aurait cassées.
--    Liste noire : tout le reste des colonnes reste modifiable, donc
--    aucune régression sur display_name, avatar_url, cursus, bio…
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_cols TEXT;
  v_blacklist TEXT[] := ARRAY[
    'id','email','plan','subscription_tier',
    'xp_total','xp_week','level','league','week_started_at',
    'streak_days','streak_record','streak_tokens','last_active_date',
    'quiz_completed_count','quiz_loot_box_pending','quiz_loot_box_claimed_count',
    'equipped_frame','equipped_background','equipped_sticker','equipped_title',
    'student_code','username','referral_code','created_at'
  ];
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
    INTO v_cols
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name   = 'profiles'
     AND column_name <> ALL (v_blacklist);

  IF v_cols IS NULL THEN
    RAISE NOTICE 'profiles introuvable, bloc ignoré';
  ELSE
    EXECUTE 'REVOKE UPDATE ON public.profiles FROM authenticated';
    EXECUTE 'REVOKE UPDATE ON public.profiles FROM anon';
    EXECUTE format('GRANT UPDATE (%s) ON public.profiles TO authenticated', v_cols);
    RAISE NOTICE 'profiles : colonnes sensibles verrouillées';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 2) get_due_flashcards : SECURITY DEFINER, prend l'id en paramètre sans
--    le comparer à l'utilisateur connecté, et exécutable par anon.
--    N'est appelée nulle part dans l'app : on la supprime.
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_due_flashcards(uuid, integer);
DROP FUNCTION IF EXISTS public.get_due_flashcards(uuid, int);

-- ---------------------------------------------------------------------
-- 3) clone_quiz_bank_from_course : copie la banque de questions d'un
--    tiers et peut écrire dans le compte d'un tiers. Jamais appelée.
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.clone_quiz_bank_from_course(uuid, uuid, uuid);

-- ---------------------------------------------------------------------
-- 4) check_and_increment_usage : on garde l'exécution pour authenticated
--    (enforceLimit l'appelle avec le client de l'utilisateur), mais on
--    interdit d'incrémenter le compteur de QUELQU'UN D'AUTRE.
--    Sans ça, on épuise gratuitement le quota IA de n'importe qui.
-- ---------------------------------------------------------------------
DO $$
DECLARE v_src TEXT;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_src
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'check_and_increment_usage'
   LIMIT 1;

  IF v_src IS NULL THEN
    RAISE NOTICE 'check_and_increment_usage introuvable, bloc ignoré';
  ELSIF position('diplo_guard_caller' in v_src) > 0 THEN
    RAISE NOTICE 'check_and_increment_usage : garde déjà posée';
  ELSE
    v_src := regexp_replace(
      v_src,
      'BEGIN',
      'BEGIN' || chr(10) ||
      '  -- diplo_guard_caller : interdit d''incrementer le compteur d''autrui' || chr(10) ||
      '  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN' || chr(10) ||
      '    RAISE EXCEPTION ''forbidden'';' || chr(10) ||
      '  END IF;'
    );
    EXECUTE v_src;
    RAISE NOTICE 'check_and_increment_usage : garde posée';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 5) Espaces de stockage : taille et types autorisés côté serveur.
--    Les contrôles n'existaient que dans le navigateur, donc contournables.
--    L'espace avatars est public : sans filtre MIME, un fichier HTML piégé
--    y serait servi tel quel et exécutable.
-- ---------------------------------------------------------------------
DO $$
BEGIN
  UPDATE storage.buckets
     SET file_size_limit    = 5242880,
         allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp']
   WHERE id = 'avatars';

  UPDATE storage.buckets
     SET file_size_limit    = 26214400,
         allowed_mime_types = ARRAY[
           'application/pdf','image/jpeg','image/png','image/webp','image/gif',
           'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
         ]
   WHERE id = 'course-uploads';

  UPDATE storage.buckets
     SET file_size_limit    = 10485760,
         allowed_mime_types = ARRAY['audio/webm','audio/mpeg','audio/mp4','audio/ogg']
   WHERE id = 'voice-notes';

  RAISE NOTICE 'storage : limites de taille et de type posees';
EXCEPTION WHEN insufficient_privilege OR undefined_table THEN
  RAISE NOTICE 'storage : droits insuffisants depuis cet editeur, a regler dans le panneau Storage';
END $$;

-- ---------------------------------------------------------------------
-- 6) duel_attempts : on pouvait insérer directement un score arbitraire
--    avant de passer par submit_duel_attempt, qui ne l'écrasait pas.
--    submit_duel_attempt est SECURITY DEFINER et continue de fonctionner.
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='duel_attempts') THEN
    DROP POLICY IF EXISTS "insert own attempt" ON public.duel_attempts;
    DROP POLICY IF EXISTS "no direct attempt insert" ON public.duel_attempts;
    CREATE POLICY "no direct attempt insert" ON public.duel_attempts
      FOR INSERT TO authenticated WITH CHECK (false);
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 7) room_members / study_group_members : la policy « join as self » ne
--    vérifiait ni le caractère privé, ni le code d'invitation, ni la
--    capacité. Les fonctions join_room_by_code / join_group_by_code sont
--    SECURITY DEFINER et restent le seul chemin légitime.
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='room_members') THEN
    DROP POLICY IF EXISTS "join as self" ON public.room_members;
    DROP POLICY IF EXISTS "join open rooms as self" ON public.room_members;
    CREATE POLICY "join open rooms as self" ON public.room_members
      FOR INSERT TO authenticated
      WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1 FROM public.study_rooms r
           WHERE r.id = room_id AND r.privacy = 'open'
        )
      );
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='study_group_members') THEN
    DROP POLICY IF EXISTS "join as self" ON public.study_group_members;
    DROP POLICY IF EXISTS "no direct group join" ON public.study_group_members;
    CREATE POLICY "no direct group join" ON public.study_group_members
      FOR INSERT TO authenticated WITH CHECK (false);
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 8) room_messages : la contrainte de 120 caractères faisait échouer
--    systématiquement l'explication IA en salle, APRÈS avoir décompté le
--    quota et payé l'appel au modèle.
-- ---------------------------------------------------------------------
DO $$
DECLARE v_name TEXT;
BEGIN
  SELECT c.conname INTO v_name
    FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
   WHERE n.nspname='public' AND t.relname='room_messages'
     AND c.contype='c' AND pg_get_constraintdef(c.oid) ILIKE '%length(content)%'
   LIMIT 1;
  IF v_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.room_messages DROP CONSTRAINT %I', v_name);
    ALTER TABLE public.room_messages
      ADD CONSTRAINT room_messages_content_check CHECK (length(content) BETWEEN 1 AND 2000);
    RAISE NOTICE 'room_messages : longueur portée à 2000';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 9) bump_streak en heure de Paris. CURRENT_DATE est en UTC chez Supabase :
--    entre minuit et 2 h du matin, la série d'un utilisateur français
--    n'était pas enregistrée, et repartait à 1 le lendemain.
--    check_and_increment_usage utilise déjà Europe/Paris, on s'aligne.
-- ---------------------------------------------------------------------
DO $$
DECLARE v_src TEXT;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_src
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname='public' AND p.proname='bump_streak' LIMIT 1;

  IF v_src IS NULL THEN
    RAISE NOTICE 'bump_streak introuvable, bloc ignoré';
  ELSIF position('Europe/Paris' in v_src) > 0 THEN
    RAISE NOTICE 'bump_streak : déjà en heure de Paris';
  ELSE
    v_src := replace(v_src, 'CURRENT_DATE', '(now() AT TIME ZONE ''Europe/Paris'')::date');
    EXECUTE v_src;
    RAISE NOTICE 'bump_streak : passé en heure de Paris';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 10) Compteur d'usage : autoriser le nouveau type d'action 'ocr'.
--     L'OCR consommait le quota 'fiche', ce qui rendait la génération de
--     fiche impossible dès la première photo pour un compte gratuit.
-- ---------------------------------------------------------------------
DO $$
DECLARE v_name TEXT;
BEGIN
  SELECT c.conname INTO v_name
    FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
   WHERE n.nspname='public' AND t.relname='usage_counters'
     AND c.contype='c' AND pg_get_constraintdef(c.oid) ILIKE '%action_type%'
   LIMIT 1;
  IF v_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.usage_counters DROP CONSTRAINT %I', v_name);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='usage_counters') THEN
    ALTER TABLE public.usage_counters
      ADD CONSTRAINT usage_counters_action_type_check
      CHECK (action_type IN ('fiche','quiz_ia','coach','correction','planning','oral','transcription','ocr'));
    RAISE NOTICE 'usage_counters : action ocr autorisée';
  END IF;
END $$;

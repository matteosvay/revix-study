-- 1) coach_conversation_state : autoriser INSERT/UPDATE par le propriétaire
CREATE POLICY "insert own coach state"
  ON public.coach_conversation_state
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update own coach state"
  ON public.coach_conversation_state
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2) Bucket avatars : restreindre le listing tout en gardant la lecture par URL
-- Les avatars restent publics en lecture directe (URL connue) car bucket public=true,
-- mais on supprime toute policy SELECT large sur storage.objects qui permettrait le listing.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT polname
    FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'storage'
      AND c.relname = 'objects'
      AND p.polcmd = 'r'
      AND pg_get_expr(p.polqual, p.polrelid) ILIKE '%avatars%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.polname);
  END LOOP;
END $$;

-- Policies propres pour avatars
CREATE POLICY "avatars upload own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars update own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars delete own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
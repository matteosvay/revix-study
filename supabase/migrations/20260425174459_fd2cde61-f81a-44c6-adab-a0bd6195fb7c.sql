
-- Drop any policies that allowed broad SELECT on the cosmetics bucket
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname ILIKE '%cosmetics%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

-- Make bucket private (no public listing/reading) — assets are bundled in code instead
UPDATE storage.buckets SET public = false WHERE id = 'cosmetics';


-- 1) Restrict xp_events writes: users can only SELECT their own; writes go through award_xp (SECURITY DEFINER)
DROP POLICY IF EXISTS "own xp events all" ON public.xp_events;

CREATE POLICY "own xp events select"
ON public.xp_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policy => blocked for regular users.
-- award_xp() runs as SECURITY DEFINER and bypasses RLS.

-- 2) Add UPDATE policy on course-uploads bucket scoped to user folder
CREATE POLICY "Users can update their own course uploads"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'course-uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to create their own (self-targeted) FOMO notifications.
-- Restricted to safe FOMO types so clients can't spam arbitrary types.
CREATE POLICY "insert own fomo notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND type IN ('fomo_streak','fomo_quest','fomo_level','fomo_morning')
);
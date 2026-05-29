-- Tighten notifications INSERT policy: only allow self-inserts of "fomo_*" client-side
-- notification types. Reward/social types (lootbox, course_share, group_member,
-- group_streak) must be created server-side via SECURITY DEFINER functions or the
-- service role, so the client cannot fabricate them to trigger reward UI flows.

DROP POLICY IF EXISTS "insert own fomo notifications" ON public.notifications;

CREATE POLICY "insert own fomo notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND type = ANY (ARRAY[
    'fomo_streak',
    'fomo_quest',
    'fomo_level',
    'fomo_morning'
  ])
);
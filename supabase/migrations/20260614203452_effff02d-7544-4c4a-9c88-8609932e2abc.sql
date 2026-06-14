
-- course_shares: explicit INSERT policy
CREATE POLICY "create own course share" ON public.course_shares
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- quiz_bank: INSERT + DELETE scoped to owner
CREATE POLICY "insert own quiz bank" ON public.quiz_bank
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete own quiz bank" ON public.quiz_bank
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- duels: block direct UPDATE; all mutations must go through SECURITY DEFINER RPCs
CREATE POLICY "block direct duel updates" ON public.duels
  FOR UPDATE TO authenticated
  USING (false)
  WITH CHECK (false);

-- study_group_members: block role self-escalation
CREATE POLICY "block direct member updates" ON public.study_group_members
  FOR UPDATE TO authenticated
  USING (false)
  WITH CHECK (false);

-- user_quests: block direct INSERT/UPDATE (must use RPC)
CREATE POLICY "block direct quest insert" ON public.user_quests
  FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "block direct quest update" ON public.user_quests
  FOR UPDATE TO authenticated
  USING (false)
  WITH CHECK (false);

-- xp_events: block direct INSERT (must use RPC)
CREATE POLICY "block direct xp insert" ON public.xp_events
  FOR INSERT TO authenticated
  WITH CHECK (false);

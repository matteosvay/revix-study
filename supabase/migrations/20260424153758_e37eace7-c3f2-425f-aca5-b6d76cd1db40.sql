
-- Lock down user_badges: read only for client, writes via server
DROP POLICY IF EXISTS "own badges all" ON public.user_badges;
CREATE POLICY "read own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);

-- Lock down user_inventory: read only
DROP POLICY IF EXISTS "own inventory all" ON public.user_inventory;
CREATE POLICY "read own inventory" ON public.user_inventory FOR SELECT USING (auth.uid() = user_id);

-- Lock down user_quests: read + delete only (writes via bump_quest RPC)
DROP POLICY IF EXISTS "own quests all" ON public.user_quests;
CREATE POLICY "read own quests" ON public.user_quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "delete own quests" ON public.user_quests FOR DELETE USING (auth.uid() = user_id);

-- Restrict duel updates: prevent score/winner/status manipulation
-- (writes go through submit_duel_attempt and accept_duel SECURITY DEFINER RPCs)
DROP POLICY IF EXISTS "update own duel" ON public.duels;
-- No client UPDATE policy: all duel mutations must go through RPCs

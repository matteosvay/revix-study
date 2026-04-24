
CREATE OR REPLACE FUNCTION public.award_xp(p_user_id uuid, p_amount integer, p_reason text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_new_total integer; v_new_week integer; v_old_level integer;
  v_new_level integer := 1; v_week_start date; v_today date := CURRENT_DATE;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT week_started_at, level INTO v_week_start, v_old_level FROM profiles WHERE id = p_user_id;
  IF v_week_start IS NULL OR v_week_start < (v_today - ((EXTRACT(DOW FROM v_today)::int + 6) % 7)) THEN
    UPDATE profiles SET xp_week = 0, week_started_at = v_today - ((EXTRACT(DOW FROM v_today)::int + 6) % 7) WHERE id = p_user_id;
  END IF;
  UPDATE profiles SET xp_total = xp_total + p_amount, xp_week = xp_week + GREATEST(p_amount, 0)
    WHERE id = p_user_id RETURNING xp_total, xp_week INTO v_new_total, v_new_week;
  WHILE v_new_level < 50 AND v_new_total >= public.xp_for_level(v_new_level + 1) LOOP
    v_new_level := v_new_level + 1;
  END LOOP;
  IF v_new_level <> v_old_level THEN UPDATE profiles SET level = v_new_level WHERE id = p_user_id; END IF;
  INSERT INTO xp_events (user_id, amount, reason) VALUES (p_user_id, p_amount, p_reason);
  RETURN jsonb_build_object('xp_total', v_new_total, 'xp_week', v_new_week, 'level', v_new_level,
    'leveled_up', v_new_level > v_old_level, 'old_level', v_old_level);
END; $function$;

CREATE OR REPLACE FUNCTION public._award_xp_internal(p_user_id uuid, p_amount integer, p_reason text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_new_total integer; v_new_week integer; v_old_level integer;
  v_new_level integer := 1; v_week_start date; v_today date := CURRENT_DATE;
BEGIN
  SELECT week_started_at, level INTO v_week_start, v_old_level FROM profiles WHERE id = p_user_id;
  IF v_week_start IS NULL OR v_week_start < (v_today - ((EXTRACT(DOW FROM v_today)::int + 6) % 7)) THEN
    UPDATE profiles SET xp_week = 0, week_started_at = v_today - ((EXTRACT(DOW FROM v_today)::int + 6) % 7) WHERE id = p_user_id;
  END IF;
  UPDATE profiles SET xp_total = xp_total + p_amount, xp_week = xp_week + GREATEST(p_amount, 0)
    WHERE id = p_user_id RETURNING xp_total, xp_week INTO v_new_total, v_new_week;
  WHILE v_new_level < 50 AND v_new_total >= public.xp_for_level(v_new_level + 1) LOOP
    v_new_level := v_new_level + 1;
  END LOOP;
  IF v_new_level <> v_old_level THEN UPDATE profiles SET level = v_new_level WHERE id = p_user_id; END IF;
  INSERT INTO xp_events (user_id, amount, reason) VALUES (p_user_id, p_amount, p_reason);
  RETURN jsonb_build_object('xp_total', v_new_total, 'xp_week', v_new_week, 'level', v_new_level,
    'leveled_up', v_new_level > v_old_level, 'old_level', v_old_level);
END; $function$;

REVOKE ALL ON FUNCTION public._award_xp_internal(uuid, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._award_xp_internal(uuid, integer, text) FROM anon;
REVOKE ALL ON FUNCTION public._award_xp_internal(uuid, integer, text) FROM authenticated;

CREATE OR REPLACE FUNCTION public.bump_quest(p_user_id uuid, p_quest_key text, p_inc integer DEFAULT 1)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_quest record; v_xp_result jsonb;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO v_quest FROM user_quests
    WHERE user_id = p_user_id AND quest_key = p_quest_key
      AND completed = false AND period_end >= CURRENT_DATE
    ORDER BY period_end ASC LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('updated', false); END IF;
  UPDATE user_quests SET progress = LEAST(progress + p_inc, target),
    completed = (progress + p_inc) >= target WHERE id = v_quest.id;
  IF (v_quest.progress + p_inc) >= v_quest.target AND NOT v_quest.claimed THEN
    UPDATE user_quests SET claimed = true WHERE id = v_quest.id;
    v_xp_result := public._award_xp_internal(p_user_id, v_quest.xp_reward, 'quest:' || v_quest.quest_key);
    RETURN jsonb_build_object('updated', true, 'completed', true, 'xp', v_xp_result);
  END IF;
  RETURN jsonb_build_object('updated', true, 'completed', false);
END; $function$;

CREATE OR REPLACE FUNCTION public.bump_streak(p_user_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_last DATE; v_streak INT; v_record INT; v_today DATE := CURRENT_DATE;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT last_active_date, streak_days, streak_record INTO v_last, v_streak, v_record
  FROM public.profiles WHERE id = p_user_id;
  IF v_last = v_today THEN RETURN; END IF;
  IF v_last = v_today - 1 THEN v_streak := v_streak + 1; ELSE v_streak := 1; END IF;
  IF v_streak > COALESCE(v_record, 0) THEN v_record := v_streak; END IF;
  UPDATE public.profiles SET last_active_date = v_today, streak_days = v_streak, streak_record = v_record
  WHERE id = p_user_id;
END; $function$;

CREATE OR REPLACE FUNCTION public.increment_quiz_count(p_user_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_count int; v_tokens int; v_earned boolean := false;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.profiles SET quiz_completed_count = quiz_completed_count + 1
    WHERE id = p_user_id RETURNING quiz_completed_count, streak_tokens INTO v_count, v_tokens;
  IF v_count % 10 = 0 AND v_tokens < 3 THEN
    UPDATE public.profiles SET streak_tokens = streak_tokens + 1
      WHERE id = p_user_id RETURNING streak_tokens INTO v_tokens;
    v_earned := true;
  END IF;
  RETURN jsonb_build_object('count', v_count, 'tokens', v_tokens, 'earned', v_earned);
END; $function$;

CREATE OR REPLACE FUNCTION public.restore_streak(p_user_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_plan text; v_tokens int; v_record int; v_last date; v_today date := CURRENT_DATE;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT plan, streak_tokens, streak_record, last_active_date
    INTO v_plan, v_tokens, v_record, v_last FROM public.profiles WHERE id = p_user_id;
  IF v_plan <> 'pro' THEN RETURN jsonb_build_object('success', false, 'error', 'pro_required'); END IF;
  IF v_tokens < 1 THEN RETURN jsonb_build_object('success', false, 'error', 'no_tokens'); END IF;
  IF v_last IS NULL OR v_last >= v_today - 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_broken_streak');
  END IF;
  UPDATE public.profiles SET streak_tokens = streak_tokens - 1,
    streak_days = GREATEST(streak_days, v_record), last_active_date = v_today - 1
    WHERE id = p_user_id;
  RETURN jsonb_build_object('success', true, 'tokens_left', v_tokens - 1);
END; $function$;

-- Duel: server recomputes score, ignores client value
CREATE OR REPLACE FUNCTION public.submit_duel_attempt(p_duel_id uuid, p_answers jsonb, p_score integer)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_duel record; v_other_attempt record; v_winner uuid; v_xp jsonb; v_score int;
BEGIN
  SELECT * INTO v_duel FROM duels WHERE id = p_duel_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'duel_not_found'; END IF;
  IF auth.uid() NOT IN (v_duel.challenger_id, v_duel.opponent_id) THEN RAISE EXCEPTION 'not_a_player'; END IF;
  IF v_duel.status NOT IN ('accepted','completed') THEN RAISE EXCEPTION 'duel_not_active'; END IF;

  SELECT COUNT(*)::int INTO v_score
  FROM jsonb_array_elements(p_answers) WITH ORDINALITY arr(answer, pos)
  JOIN duel_questions dq ON dq.duel_id = p_duel_id AND dq."position" = (arr.pos - 1)::int
  WHERE NULLIF(answer::text, 'null')::int = dq.correct_index;

  INSERT INTO duel_attempts(duel_id, user_id, answers, score)
  VALUES (p_duel_id, auth.uid(), p_answers, v_score)
  ON CONFLICT (duel_id, user_id) DO NOTHING;

  IF auth.uid() = v_duel.challenger_id THEN
    UPDATE duels SET challenger_score = v_score WHERE id = p_duel_id;
  ELSE
    UPDATE duels SET opponent_score = v_score WHERE id = p_duel_id;
  END IF;

  SELECT * INTO v_other_attempt FROM duel_attempts WHERE duel_id = p_duel_id AND user_id <> auth.uid();
  IF FOUND THEN
    IF v_score > v_other_attempt.score THEN v_winner := auth.uid();
    ELSIF v_score < v_other_attempt.score THEN v_winner := v_other_attempt.user_id;
    ELSE v_winner := NULL; END IF;
    UPDATE duels SET status='completed', winner_id = v_winner WHERE id = p_duel_id;
    IF v_winner = auth.uid() THEN
      v_xp := public._award_xp_internal(auth.uid(), 100, 'duel_win');
      PERFORM public._award_xp_internal(v_other_attempt.user_id, 40, 'duel_loss');
    ELSIF v_winner IS NULL THEN
      v_xp := public._award_xp_internal(auth.uid(), 60, 'duel_tie');
      PERFORM public._award_xp_internal(v_other_attempt.user_id, 60, 'duel_tie');
    ELSE
      v_xp := public._award_xp_internal(auth.uid(), 40, 'duel_loss');
      PERFORM public._award_xp_internal(v_other_attempt.user_id, 100, 'duel_win');
    END IF;
    RETURN jsonb_build_object('completed', true, 'winner_id', v_winner, 'score', v_score, 'xp', v_xp);
  END IF;
  RETURN jsonb_build_object('completed', false, 'score', v_score, 'waiting_opponent', true);
END; $function$;

CREATE OR REPLACE FUNCTION public.join_room_by_code(p_code text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_room record; v_count int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO v_room FROM study_rooms WHERE invite_code = upper(p_code) AND status='active';
  IF NOT FOUND THEN RAISE EXCEPTION 'room_not_found'; END IF;
  SELECT COUNT(*) INTO v_count FROM room_members WHERE room_id = v_room.id;
  IF v_count >= v_room.max_members AND NOT EXISTS(SELECT 1 FROM room_members WHERE room_id=v_room.id AND user_id=auth.uid()) THEN
    RAISE EXCEPTION 'room_full';
  END IF;
  INSERT INTO room_members(room_id, user_id) VALUES (v_room.id, auth.uid())
  ON CONFLICT (room_id, user_id) DO UPDATE SET last_seen = now(), status='focus';
  PERFORM public._award_xp_internal(auth.uid(), 20, 'room_joined');
  RETURN v_room.id;
END; $function$;

-- Duel questions: hide correct_index from clients during play, full row only after completion
DROP POLICY IF EXISTS "see duel questions" ON public.duel_questions;
CREATE POLICY "see completed duel questions"
ON public.duel_questions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM duels d
  WHERE d.id = duel_questions.duel_id
    AND (auth.uid() = d.challenger_id OR auth.uid() = d.opponent_id)
    AND d.status = 'completed'
));

CREATE OR REPLACE FUNCTION public.get_duel_questions(p_duel_id uuid)
 RETURNS TABLE(q_id uuid, q_position int, q_question text, q_answers jsonb)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT dq.id, dq."position", dq.question, dq.answers
  FROM public.duel_questions dq
  JOIN public.duels d ON d.id = dq.duel_id
  WHERE dq.duel_id = p_duel_id
    AND (auth.uid() = d.challenger_id OR auth.uid() = d.opponent_id)
  ORDER BY dq."position";
$function$;

-- Explicit deny on direct writes to badges + inventory
CREATE POLICY "no direct insert badges" ON public.user_badges FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "no direct update badges" ON public.user_badges FOR UPDATE TO authenticated USING (false);
CREATE POLICY "no direct delete badges" ON public.user_badges FOR DELETE TO authenticated USING (false);

CREATE POLICY "no direct insert inventory" ON public.user_inventory FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "no direct update inventory" ON public.user_inventory FOR UPDATE TO authenticated USING (false);
CREATE POLICY "no direct delete inventory" ON public.user_inventory FOR DELETE TO authenticated USING (false);

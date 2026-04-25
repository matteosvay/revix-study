CREATE OR REPLACE FUNCTION public.ensure_today_quests()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_today date := CURRENT_DATE;
  v_week_start date := CURRENT_DATE - ((EXTRACT(DOW FROM CURRENT_DATE)::int + 6) % 7);
  v_week_end date := (CURRENT_DATE - ((EXTRACT(DOW FROM CURRENT_DATE)::int + 6) % 7)) + 6;
  v_daily_count int;
  v_weekly_count int;
  v_seed_d text;
  v_seed_w text;
  v_pick record;
  v_daily_pool jsonb := '[
    {"key":"quiz_done","title":"Révise bien","description":"Termine 1 quiz","emoji":"🧠","target":1,"xp":60},
    {"key":"course_uploaded","title":"Fiche express","description":"Upload 1 cours","emoji":"📄","target":1,"xp":60},
    {"key":"streak_kept","title":"Chaud devant","description":"Garde ta streak aujourd''hui","emoji":"🔥","target":1,"xp":60},
    {"key":"questions_answered","title":"Sprint","description":"Réponds à 20 questions","emoji":"⚡","target":20,"xp":60},
    {"key":"high_score","title":"Précision","description":"Score 80%+ à un quiz","emoji":"🎯","target":1,"xp":80},
    {"key":"task_added","title":"Planificateur","description":"Ajoute une session au planning","emoji":"🗓️","target":1,"xp":50},
    {"key":"perfect_quiz","title":"Sans faute","description":"Termine un quiz sans erreur","emoji":"💪","target":1,"xp":100},
    {"key":"coach_question","title":"Consulte ton coach","description":"Pose 1 question au coach IA","emoji":"🧠","target":1,"xp":60}
  ]'::jsonb;
  v_weekly_pool jsonb := '[
    {"key":"w_5_quizzes","title":"Semaine de feu","description":"Termine 5 quizzes cette semaine","emoji":"🏆","target":5,"xp":200},
    {"key":"w_4_uploads","title":"Bibliothécaire","description":"Upload 4 cours cette semaine","emoji":"📖","target":4,"xp":200},
    {"key":"w_3_high_scores","title":"Major","description":"3 scores au-dessus de 80%","emoji":"🎓","target":3,"xp":250},
    {"key":"w_7_streak","title":"Consistance","description":"Valide 7 jours de streak sur la semaine","emoji":"🌟","target":7,"xp":300},
    {"key":"w_5_planning_tasks","title":"Agenda blindé","description":"Ajoute 5 sessions au planning cette semaine","emoji":"🗂️","target":5,"xp":220}
  ]'::jsonb;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Daily quests
  SELECT COUNT(*) INTO v_daily_count
  FROM user_quests
  WHERE user_id = v_user AND quest_type = 'daily' AND period_start = v_today;

  IF v_daily_count = 0 THEN
    v_seed_d := v_user::text || '-' || v_today::text;
    -- Pick 3 random distinct daily quests (deterministic per user/day via md5 hash ordering)
    FOR v_pick IN
      SELECT q.* FROM jsonb_array_elements(v_daily_pool) AS q
      ORDER BY md5(v_seed_d || (q->>'key'))
      LIMIT 3
    LOOP
      INSERT INTO user_quests(user_id, quest_key, quest_type, title, description, emoji, target, xp_reward, period_start, period_end)
      VALUES (
        v_user,
        v_pick.value->>'key',
        'daily',
        v_pick.value->>'title',
        v_pick.value->>'description',
        v_pick.value->>'emoji',
        (v_pick.value->>'target')::int,
        (v_pick.value->>'xp')::int,
        v_today,
        v_today
      );
    END LOOP;
  END IF;

  -- Weekly quest
  SELECT COUNT(*) INTO v_weekly_count
  FROM user_quests
  WHERE user_id = v_user AND quest_type = 'weekly' AND period_start = v_week_start;

  IF v_weekly_count = 0 THEN
    v_seed_w := v_user::text || '-' || v_week_start::text;
    FOR v_pick IN
      SELECT q.* FROM jsonb_array_elements(v_weekly_pool) AS q
      ORDER BY md5(v_seed_w || (q->>'key'))
      LIMIT 1
    LOOP
      INSERT INTO user_quests(user_id, quest_key, quest_type, title, description, emoji, target, xp_reward, period_start, period_end)
      VALUES (
        v_user,
        v_pick.value->>'key',
        'weekly',
        v_pick.value->>'title',
        v_pick.value->>'description',
        v_pick.value->>'emoji',
        (v_pick.value->>'target')::int,
        (v_pick.value->>'xp')::int,
        v_week_start,
        v_week_end
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('ok', true, 'today', v_today, 'week_start', v_week_start);
END; $$;
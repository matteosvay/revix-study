
-- ============== PROFILES ==============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  school TEXT,
  cursus TEXT CHECK (cursus IN ('BTS','Licence','Prépa','Autre')),
  plan TEXT NOT NULL DEFAULT 'gratuit' CHECK (plan IN ('gratuit','pro','premium')),
  streak_days INT NOT NULL DEFAULT 0,
  streak_record INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============== COURSES ==============
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT,
  level TEXT CHECK (level IN ('BTS','Licence','Prépa','Autre')),
  source_content TEXT,
  source_file_path TEXT,
  exam_date DATE,
  emoji TEXT DEFAULT '📘',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own courses all" ON public.courses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_courses_user ON public.courses(user_id);

-- ============== FLASHCARDS ==============
CREATE TABLE public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  reviewed_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own flashcards all" ON public.flashcards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_flashcards_course ON public.flashcards(course_id);

-- ============== QUIZZES ==============
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own quizzes all" ON public.quizzes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answers JSONB NOT NULL,
  correct_index INT NOT NULL,
  explanation TEXT,
  position INT NOT NULL DEFAULT 0
);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own quiz_questions all" ON public.quiz_questions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_qq_quiz ON public.quiz_questions(quiz_id);

CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INT NOT NULL,
  total INT NOT NULL,
  wrong_indices JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attempts all" ON public.quiz_attempts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============== PLANNING ==============
CREATE TABLE public.planning_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  task_date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  subject TEXT NOT NULL,
  title TEXT,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.planning_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tasks all" ON public.planning_tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_tasks_user_date ON public.planning_tasks(user_id, task_date);

-- ============== ORAL SESSIONS ==============
CREATE TABLE public.oral_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  transcript TEXT,
  feedback JSONB,
  score INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.oral_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own oral all" ON public.oral_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============== TIMESTAMP TRIGGER ==============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== AUTO PROFILE ON SIGNUP ==============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, cursus)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'cursus'
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============== STREAK FUNCTION ==============
CREATE OR REPLACE FUNCTION public.bump_streak(p_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_last DATE;
  v_streak INT;
  v_record INT;
  v_today DATE := CURRENT_DATE;
BEGIN
  SELECT last_active_date, streak_days, streak_record INTO v_last, v_streak, v_record
  FROM public.profiles WHERE id = p_user_id;

  IF v_last = v_today THEN RETURN; END IF;
  IF v_last = v_today - 1 THEN v_streak := v_streak + 1;
  ELSE v_streak := 1; END IF;

  IF v_streak > COALESCE(v_record, 0) THEN v_record := v_streak; END IF;

  UPDATE public.profiles
  SET last_active_date = v_today, streak_days = v_streak, streak_record = v_record
  WHERE id = p_user_id;
END; $$;

-- ============== STORAGE BUCKET ==============
INSERT INTO storage.buckets (id, name, public) VALUES ('course-uploads', 'course-uploads', false);

CREATE POLICY "own uploads read" ON storage.objects FOR SELECT
  USING (bucket_id = 'course-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own uploads insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'course-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own uploads delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'course-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

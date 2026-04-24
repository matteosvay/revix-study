
-- Fiches partagées dans une salle
CREATE TABLE public.room_shared_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, course_id)
);

ALTER TABLE public.room_shared_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "see shared courses in my rooms"
  ON public.room_shared_courses FOR SELECT
  USING (public.is_room_member(room_id, auth.uid()));

CREATE POLICY "share own course in my room"
  ON public.room_shared_courses FOR INSERT
  WITH CHECK (
    auth.uid() = shared_by
    AND public.is_room_member(room_id, auth.uid())
    AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.user_id = auth.uid())
  );

CREATE POLICY "unshare own course"
  ON public.room_shared_courses FOR DELETE
  USING (auth.uid() = shared_by);

-- Tableau blanc collaboratif (notes / mots-clés)
CREATE TABLE public.room_whiteboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  color text NOT NULL DEFAULT 'yellow',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.room_whiteboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "see whiteboard"
  ON public.room_whiteboard FOR SELECT
  USING (public.is_room_member(room_id, auth.uid()));

CREATE POLICY "add whiteboard note"
  ON public.room_whiteboard FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_room_member(room_id, auth.uid()));

CREATE POLICY "delete whiteboard note"
  ON public.room_whiteboard FOR DELETE
  USING (public.is_room_member(room_id, auth.uid()));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_shared_courses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_whiteboard;
ALTER TABLE public.room_shared_courses REPLICA IDENTITY FULL;
ALTER TABLE public.room_whiteboard REPLICA IDENTITY FULL;

-- Index utiles
CREATE INDEX idx_room_shared_courses_room ON public.room_shared_courses(room_id);
CREATE INDEX idx_room_whiteboard_room ON public.room_whiteboard(room_id, created_at DESC);

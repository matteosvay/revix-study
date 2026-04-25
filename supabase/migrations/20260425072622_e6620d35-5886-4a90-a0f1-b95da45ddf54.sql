CREATE OR REPLACE FUNCTION public.join_room_by_code(p_code text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
  RETURN v_room.id;
END; $function$;
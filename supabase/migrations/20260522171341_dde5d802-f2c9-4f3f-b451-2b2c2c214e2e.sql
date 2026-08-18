-- Fix mutable search_path on trigger function
CREATE OR REPLACE FUNCTION public.set_subscriptions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Make intent explicit for the private 'cosmetics' bucket: deny all client access
DROP POLICY IF EXISTS "cosmetics service-role only" ON storage.objects;
CREATE POLICY "cosmetics service-role only"
ON storage.objects
FOR SELECT
TO authenticated, anon
USING (bucket_id = 'cosmetics' AND false);

-- Add explicit deny UPDATE policy on voice-notes bucket
DROP POLICY IF EXISTS "voice-notes no updates" ON storage.objects;
CREATE POLICY "voice-notes no updates"
ON storage.objects
FOR UPDATE
TO authenticated, anon
USING (bucket_id = 'voice-notes' AND false);
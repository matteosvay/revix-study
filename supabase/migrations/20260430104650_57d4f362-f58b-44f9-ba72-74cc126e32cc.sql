-- Codes parrainage uniques sur profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_unique_idx ON public.profiles (referral_code) WHERE referral_code IS NOT NULL;

-- Génère un code court aléatoire ABCDE12 type
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT;
  i INT;
  attempts INT := 0;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..7 LOOP
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = code);
    attempts := attempts + 1;
    IF attempts > 10 THEN RAISE EXCEPTION 'cannot generate code'; END IF;
  END LOOP;
  RETURN code;
END;
$$;

-- Rétro-remplit les codes manquants
UPDATE public.profiles SET referral_code = public.generate_referral_code() WHERE referral_code IS NULL;

-- Table referrals : qui a parrainé qui
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  reward_granted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON public.referrals(referrer_id);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see referrals they made or received"
ON public.referrals FOR SELECT
TO authenticated
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- RPC sécurisé : applique un code de parrainage au user courant
CREATE OR REPLACE FUNCTION public.apply_referral_code(_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_referrer UUID;
  v_existing UUID;
  v_user_created TIMESTAMPTZ;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT created_at INTO v_user_created FROM public.profiles WHERE id = v_user;
  -- Empêche d'utiliser un code après 7 jours d'inscription
  IF v_user_created IS NOT NULL AND v_user_created < now() - interval '7 days' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'too_late');
  END IF;

  SELECT id INTO v_referrer FROM public.profiles WHERE referral_code = upper(trim(_code));
  IF v_referrer IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;
  IF v_referrer = v_user THEN
    RETURN jsonb_build_object('ok', false, 'error', 'self_referral');
  END IF;

  SELECT id INTO v_existing FROM public.referrals WHERE referred_id = v_user;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_referred');
  END IF;

  INSERT INTO public.referrals (referrer_id, referred_id, referral_code)
  VALUES (v_referrer, v_user, upper(trim(_code)));

  -- Récompense immédiate : +100 XP au filleul, +200 XP au parrain
  UPDATE public.profiles SET xp_total = xp_total + 100 WHERE id = v_user;
  UPDATE public.profiles SET xp_total = xp_total + 200 WHERE id = v_referrer;

  RETURN jsonb_build_object('ok', true, 'referrer_id', v_referrer);
END;
$$;

-- Trigger : à la création d'un profile, génère un code automatiquement
CREATE OR REPLACE FUNCTION public.set_referral_code_on_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_referral_code ON public.profiles;
CREATE TRIGGER profiles_set_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_referral_code_on_profile();
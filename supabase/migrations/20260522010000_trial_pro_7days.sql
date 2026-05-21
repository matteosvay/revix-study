-- Essai gratuit 7 jours Pro pour tout nouveau compte
-- trial_ends_at = NULL → aucun essai (utilisateurs existants)
-- trial_ends_at > now() → essai actif → tier Pro

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- Mise à jour du trigger de création de compte
-- Les utilisateurs existants gardent trial_ends_at = NULL (pas d'essai rétroactif)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, cursus, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'cursus',
    now() + interval '7 days'
  );
  RETURN NEW;
END; $$;

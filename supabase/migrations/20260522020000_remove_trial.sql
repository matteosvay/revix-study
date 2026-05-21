-- Suppression de la colonne trial_ends_at (essai Pro retiré de l'app)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS trial_ends_at;

-- Restauration du trigger handle_new_user sans trial_ends_at
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

-- Enum des rôles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Table des rôles (séparée de profiles pour éviter privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Fonction security definer pour éviter récursion RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: chacun peut voir ses propres rôles
CREATE POLICY "read own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- RLS: seuls les admins peuvent voir tous les rôles
CREATE POLICY "admins read all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 1. Renommer ultra → max dans profiles.plan
UPDATE public.profiles SET plan = 'max' WHERE plan = 'ultra';

-- Normaliser aussi 'gratuit' → 'free' pour rester cohérent (mais on accepte les deux)
-- (on ne touche pas la valeur par défaut tout de suite pour éviter de casser la création de profils)

-- 2. Table des abonnements Stripe
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_user_env ON public.subscriptions(user_id, environment);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- 3. Fonction has_active_subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(
  user_uuid uuid,
  check_env text DEFAULT 'live'
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
    AND environment = check_env
    AND (
      (status IN ('active', 'trialing', 'past_due') AND (current_period_end IS NULL OR current_period_end > now()))
      OR (status = 'canceled' AND current_period_end > now())
    )
  );
$$;

-- 4. Helper : déduire le tier (free/pro/max) depuis le price_id d'un abonnement actif
CREATE OR REPLACE FUNCTION public.get_user_tier(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_price text;
BEGIN
  SELECT price_id INTO active_price
  FROM public.subscriptions
  WHERE user_id = user_uuid
    AND (
      (status IN ('active', 'trialing', 'past_due') AND (current_period_end IS NULL OR current_period_end > now()))
      OR (status = 'canceled' AND current_period_end > now())
    )
  ORDER BY created_at DESC
  LIMIT 1;

  IF active_price IS NULL THEN
    RETURN 'free';
  ELSIF active_price LIKE 'max%' THEN
    RETURN 'max';
  ELSIF active_price LIKE 'pro%' THEN
    RETURN 'pro';
  ELSE
    RETURN 'free';
  END IF;
END;
$$;

-- 5. Trigger qui synchronise profiles.plan quand subscriptions change
CREATE OR REPLACE FUNCTION public.sync_profile_plan_from_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_user uuid;
  new_tier text;
BEGIN
  affected_user := COALESCE(NEW.user_id, OLD.user_id);
  new_tier := public.get_user_tier(affected_user);
  UPDATE public.profiles SET plan = new_tier, updated_at = now() WHERE id = affected_user;
  RETURN NULL;
END;
$$;

CREATE TRIGGER subscriptions_sync_profile_plan
AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_plan_from_subscription();

-- 6. Trigger updated_at sur subscriptions (réutilise la fonction existante si présente)
CREATE OR REPLACE FUNCTION public.set_subscriptions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER subscriptions_set_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_subscriptions_updated_at();
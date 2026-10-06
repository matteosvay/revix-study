// Hook qui retourne l'abonnement actif de l'utilisateur courant (filtré par environnement).
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getStripeEnvironment } from "@/lib/stripe";
import { TEST_PHASE } from "@/lib/pricing";

export interface SubscriptionRow {
  id: string;
  status: string;
  price_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  environment: string;
  tier?: "free" | "pro" | "max" | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setSubscription(null);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("subscriptions" as any)
      .select("id, status, price_id, current_period_end, cancel_at_period_end, environment, tier")
      .eq("user_id", user.id)
      .eq("environment", getStripeEnvironment())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription((data as any) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`subscriptions:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, load]);

  const isActive = (() => {
    if (!subscription) return false;
    const end = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
    const future = !end || end.getTime() > Date.now();
    if (["active", "trialing", "past_due"].includes(subscription.status) && future) return true;
    if (subscription.status === "canceled" && end && end.getTime() > Date.now()) return true;
    return false;
  })();

  // Phase de test : tout le monde a Max gratuitement. Pour la terminer, mets
  // TEST_PHASE à false dans src/lib/pricing.ts, et le secret serveur
  // FREE_ACCESS_TIER à "off" dans Lovable Cloud. Les deux vont ensemble.
  if (TEST_PHASE) {
    return { subscription, isActive: true, tier: "max" as const, loading, refresh: load, testPhase: true };
  }
  const tier: "free" | "pro" | "max" = isActive ? (subscription?.tier === "max" ? "max" : "pro") : "free";
  return { subscription, isActive, tier, loading, refresh: load, testPhase: false };
}
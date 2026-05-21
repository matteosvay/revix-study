import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface TrialStatus {
  active: boolean;
  daysLeft: number;
  endsAt: Date | null;
  loading: boolean;
}

export function useTrial(): TrialStatus {
  const { user } = useAuth();
  const [endsAt, setEndsAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("profiles")
      .select("trial_ends_at, plan")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const plan = (data as any)?.plan;
        const raw: string | null = (data as any)?.trial_ends_at ?? null;
        // Si l'utilisateur a un vrai plan payant, on n'affiche pas la bannière trial
        if (plan === "pro" || plan === "max" || plan === "ultra") {
          setEndsAt(null);
        } else {
          setEndsAt(raw ? new Date(raw) : null);
        }
        setLoading(false);
      });
  }, [user]);

  const now = new Date();
  const active = endsAt !== null && endsAt > now;
  const msLeft = active && endsAt ? endsAt.getTime() - now.getTime() : 0;
  const daysLeft = active ? Math.ceil(msLeft / (1000 * 60 * 60 * 24)) : 0;

  return { active, daysLeft, endsAt, loading };
}

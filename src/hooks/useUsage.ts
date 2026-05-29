// Hook qui retourne l'usage IA actuel de l'utilisateur (daily + weekly) pour chaque action,
// avec les limites correspondant à son tier. Lit directement la table usage_counters
// (RLS = read own) et expose une fonction refresh().

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type UsageAction = "fiche" | "quiz_ia" | "coach" | "correction" | "planning";
export type UsageTier = "free" | "pro" | "max";

interface Limits {
  daily: number;
  weekly: number;
}

const TIER_LIMITS: Record<UsageTier, Record<UsageAction, Limits>> = {
  free: {
    fiche:      { daily: 1,  weekly: 1 },
    quiz_ia:    { daily: 5,  weekly: 15 },
    coach:      { daily: 5,  weekly: 15 },
    correction: { daily: 5,  weekly: 15 },
    planning:   { daily: 1,  weekly: 1 },
  },
  pro: {
    fiche:      { daily: 1,  weekly: 5 },
    quiz_ia:    { daily: 10, weekly: 60 },
    coach:      { daily: 20, weekly: 100 },
    correction: { daily: 25, weekly: 120 },
    planning:   { daily: 1,  weekly: 5 },
  },
  max: {
    fiche:      { daily: 3,  weekly: 15 },
    quiz_ia:    { daily: 30, weekly: 150 },
    coach:      { daily: 50, weekly: 300 },
    correction: { daily: 60, weekly: 350 },
    planning:   { daily: 3,  weekly: 999 },
  },
};

export interface UsageEntry {
  action: UsageAction;
  daily_used: number;
  daily_limit: number;
  weekly_used: number;
  weekly_limit: number;
  daily_pct: number;
  weekly_pct: number;
  reached: boolean;
}

const ACTIONS: UsageAction[] = ["fiche", "quiz_ia", "coach", "correction", "planning"];

function todayKey(): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .split("/")
    .reverse()
    .join("-");
}

function isoWeekKey(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function useUsage() {
  const { user } = useAuth();
  const [tier, setTier] = useState<UsageTier>("free");
  const [usage, setUsage] = useState<UsageEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [{ data: profile }, { data: counters }] = await Promise.all([
        supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
        supabase
          .from("usage_counters")
          .select("action_type, period_type, period_key, count")
          .eq("user_id", user.id),
      ]);

      // 🧪 PHASE DE TEST : tout le monde est considéré "max" (accès illimité).
      const t: UsageTier = "max";
      setTier(t);

      const today = todayKey();
      const week = isoWeekKey();

      const entries: UsageEntry[] = ACTIONS.map((action) => {
        const limits = TIER_LIMITS[t][action];
        const daily = (counters ?? []).find(
          (c: any) => c.action_type === action && c.period_type === "daily" && c.period_key === today,
        )?.count ?? 0;
        const weekly = (counters ?? []).find(
          (c: any) => c.action_type === action && c.period_type === "weekly" && c.period_key === week,
        )?.count ?? 0;
        const daily_pct = limits.daily > 0 ? Math.min(100, (daily / limits.daily) * 100) : 0;
        const weekly_pct = limits.weekly > 0 ? Math.min(100, (weekly / limits.weekly) * 100) : 0;
        return {
          action,
          daily_used: daily,
          daily_limit: limits.daily,
          weekly_used: weekly,
          weekly_limit: limits.weekly,
          daily_pct,
          weekly_pct,
          reached: daily >= limits.daily || weekly >= limits.weekly,
        };
      });
      setUsage(entries);
    } catch (e) {
      console.error("[useUsage] load failed", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
    // Refresh quand un toast de limite est émis (l'utilisateur vient juste de hit)
    const onLimit = () => load();
    window.addEventListener("revix:ai-limit-reached", onLimit);
    return () => window.removeEventListener("revix:ai-limit-reached", onLimit);
  }, [load]);

  return { tier, usage, loading, refresh: load };
}

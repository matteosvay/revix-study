import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { levelInfo, xpProgress, pickDailyQuests, pickWeeklyQuest, todayKey, weekKey, weekEnd } from "@/lib/gamification";

export type GamProfile = {
  xp_total: number;
  level: number;
  xp_week: number;
  league: string;
  streak_days: number;
};

export type Quest = {
  id: string;
  quest_key: string;
  quest_type: "daily" | "weekly";
  title: string;
  description: string | null;
  emoji: string | null;
  target: number;
  progress: number;
  xp_reward: number;
  completed: boolean;
  claimed: boolean;
  period_start: string;
  period_end: string;
};

/** Floating XP pill — global event. */
export function emitXp(amount: number, label?: string) {
  window.dispatchEvent(new CustomEvent("revix:xp", { detail: { amount, label } }));
}

/** Award XP server-side and trigger UI feedback. */
export async function awardXp(userId: string, amount: number, reason: string) {
  const { data, error } = await supabase.rpc("award_xp", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
  });
  if (!error && data) {
    emitXp(amount, reason);
    const res = data as any;
    if (res?.leveled_up) {
      window.dispatchEvent(new CustomEvent("revix:levelup", { detail: { level: res.level } }));
    }
  }
  return data as any;
}

export async function bumpQuest(userId: string, questKey: string, inc = 1) {
  const { data } = await supabase.rpc("bump_quest", {
    p_user_id: userId,
    p_quest_key: questKey,
    p_inc: inc,
  });
  const res = data as any;
  if (res?.completed && res?.xp) {
    toast.success(`Quête complétée ! +${res.xp.xp_total ? "" : ""}`, { description: "Nouvelle XP gagnée 🎉" });
  }
  return res;
}

/** Ensure today's daily quests + this week's weekly quest exist (server-side, atomic). */
async function ensureQuests(_userId: string) {
  // Server-side RPC handles idempotent generation using server's CURRENT_DATE,
  // so it works regardless of client clock/timezone and even if client logic broke.
  await supabase.rpc("ensure_today_quests" as any);
}

export function useGamification() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<GamProfile | null>(null);
  const [dailyQuests, setDailyQuests] = useState<Quest[]>([]);
  const [weeklyQuest, setWeeklyQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    await ensureQuests(user.id);
    const [{ data: p }, { data: quests }] = await Promise.all([
      supabase.from("profiles")
        .select("xp_total, level, xp_week, league, streak_days").eq("id", user.id).maybeSingle(),
      supabase.from("user_quests").select("*")
        .eq("user_id", user.id).gte("period_end", todayKey())
        .order("quest_type").order("created_at"),
    ]);
    setProfile(p as any);
    const all = (quests ?? []) as any as Quest[];
    setDailyQuests(all.filter((q) => q.quest_type === "daily"));
    setWeeklyQuest(all.find((q) => q.quest_type === "weekly") ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Re-check quests when the tab regains focus or when the local date rolls over.
  useEffect(() => {
    if (!user) return;
    let lastDay = todayKey();
    const onFocus = () => {
      const now = todayKey();
      if (now !== lastDay) {
        lastDay = now;
        load();
      }
    };
    const interval = setInterval(onFocus, 60_000);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [user, load]);

  return { profile, dailyQuests, weeklyQuest, loading, reload: load,
    levelTier: profile ? levelInfo(profile.level) : null,
    xp: profile ? xpProgress(profile.xp_total, profile.level) : null };
}
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

/** Ensure today's daily quests + this week's weekly quest exist. */
async function ensureQuests(userId: string) {
  const day = todayKey();
  const week = weekKey();
  const wEnd = weekEnd(week);

  // daily
  const { data: existingDaily } = await supabase
    .from("user_quests").select("id")
    .eq("user_id", userId).eq("quest_type", "daily").eq("period_start", day);
  if (!existingDaily || existingDaily.length === 0) {
    const picks = pickDailyQuests(`${userId}-${day}`, 3);
    await supabase.from("user_quests").insert(
      picks.map((q) => ({
        user_id: userId, quest_key: q.key, quest_type: "daily",
        title: q.title, description: q.description, emoji: q.emoji,
        target: q.target, xp_reward: q.xp,
        period_start: day, period_end: day,
      }))
    );
  }

  // weekly
  const { data: existingWeek } = await supabase
    .from("user_quests").select("id")
    .eq("user_id", userId).eq("quest_type", "weekly").eq("period_start", week);
  if (!existingWeek || existingWeek.length === 0) {
    const w = pickWeeklyQuest(`${userId}-${week}`);
    await supabase.from("user_quests").insert({
      user_id: userId, quest_key: w.key, quest_type: "weekly",
      title: w.title, description: w.description, emoji: w.emoji,
      target: w.target, xp_reward: w.xp,
      period_start: week, period_end: wEnd,
    });
  }
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

  return { profile, dailyQuests, weeklyQuest, loading, reload: load,
    levelTier: profile ? levelInfo(profile.level) : null,
    xp: profile ? xpProgress(profile.xp_total, profile.level) : null };
}
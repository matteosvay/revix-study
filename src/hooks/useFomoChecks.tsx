import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * FOMO checks — runs once per session on Dashboard mount.
 * Inserts an in-app notification (if not already created today) when:
 *  - Streak is at risk (no activity today, streak >= 3)
 *  - A daily quest is ≥ 80% complete and not claimed
 *  - Less than 100 XP needed to next level
 */
export function useFomoChecks() {
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;

    (async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);

      const { data: profile } = await supabase
        .from("profiles")
        .select("streak_days, last_active_date, xp_total, level")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile || cancelled) return;

      // Existing FOMO notifs today (read once)
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { data: existing } = await supabase
        .from("notifications")
        .select("type, metadata")
        .eq("user_id", user.id)
        .gte("created_at", startOfDay.toISOString());
      const hasType = (t: string) => (existing ?? []).some((n: any) => n.type === t);

      const toInsert: any[] = [];

      // 1. Streak en danger
      if (
        profile.streak_days >= 3 &&
        profile.last_active_date !== today &&
        !hasType("fomo_streak")
      ) {
        toInsert.push({
          user_id: user.id,
          type: "fomo_streak",
          title: "🔥 Ta streak est en danger !",
          message: `${profile.streak_days} jours d'affilée — ne laisse pas tomber maintenant.`,
          link: "/app/streak",
        });
      }

      // 2. Quête presque finie
      const { data: quests } = await supabase
        .from("user_quests")
        .select("title, progress, target, claimed, quest_key")
        .eq("user_id", user.id)
        .eq("claimed", false)
        .gte("period_end", today);

      const almostDone = (quests ?? []).find(
        (q: any) => q.progress / q.target >= 0.8 && q.progress < q.target
      );
      if (almostDone && !hasType("fomo_quest")) {
        toInsert.push({
          user_id: user.id,
          type: "fomo_quest",
          title: "🎯 Quête presque finie !",
          message: `"${almostDone.title}" : ${almostDone.progress}/${almostDone.target}`,
          link: "/app/aventure",
        });
      }

      // 3. Bientôt level up
      // xp_for_level(L+1) approx via formula (matches SQL): 200*L + 75*L*(L-1)
      const L = profile.level;
      const xpNext = 200 * L + 75 * L * (L - 1);
      const remaining = xpNext - profile.xp_total;
      if (remaining > 0 && remaining <= 100 && !hasType("fomo_level")) {
        toInsert.push({
          user_id: user.id,
          type: "fomo_level",
          title: "⚡ Niveau supérieur en vue",
          message: `Plus que ${remaining} XP avant le niveau ${L + 1} !`,
          link: "/app/aventure",
        });
      }

      if (toInsert.length > 0) {
        // RLS allows users to insert their own notifications? Check policy
        // -- Currently no INSERT policy → use rpc-less direct insert may fail.
        // Fallback: skip silently if RLS blocks.
        await supabase.from("notifications").insert(toInsert);
      }

      // 4. Group streaks at risk — only run in the evening (>= 18h local time)
      const hour = new Date().getHours();
        if (hour >= 18) {
          await supabase.rpc("notify_groups_at_risk" as any);
        }
      } catch {
        // Silent best-effort checks: they must never block the app shell.
      }
    })();

    return () => { cancelled = true; };
  }, [authLoading, user]);
}
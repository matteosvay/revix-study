import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Gift, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { emitXp } from "@/hooks/useGamification";
import { LootBoxReveal } from "@/components/revix/LootBoxReveal";

type Reward = {
  xp: number;
  streak_token: boolean;
  powerup: string | null;
  cosmetic: { key: string; name: string; emoji: string | null; rarity: string; category: string } | null;
};

/**
 * Bonus mystery box: 1 available every 5 completed quizzes.
 * Shown only when the user has at least one unclaimed milestone.
 */
export function QuizBonusLootBoxCard() {
  const { user } = useAuth();
  const [remaining, setRemaining] = useState<number>(0);
  const [quizCount, setQuizCount] = useState<number>(0);
  const [opening, setOpening] = useState(false);
  const [reward, setReward] = useState<Reward | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const refresh = async () => {
    if (!user) {
      // Toujours afficher le teaser même si l'auth tarde — évite d'avoir une carte
      // invisible sur certains contextes (ex: desktop avec hydratation lente).
      setLoaded(true);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("quiz_completed_count, quiz_loot_box_claimed_count")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      const qc = (data as any)?.quiz_completed_count ?? 0;
      const claimed = (data as any)?.quiz_loot_box_claimed_count ?? 0;
      const eligible = Math.max(0, Math.floor(qc / 5) - claimed);
      setQuizCount(qc);
      setRemaining(eligible);
    } catch {
      // En cas d'erreur, on affiche quand même le teaser (état neutre).
      setQuizCount(0);
      setRemaining(0);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const open = async () => {
    if (opening || remaining <= 0) return;
    setOpening(true);
    try {
      const { data, error } = await supabase.rpc("open_quiz_bonus_loot_box" as any);
      if (error) throw error;
      const res = data as any;
      if (!res?.eligible) {
        toast.info("Aucune boîte bonus disponible pour le moment.");
        await refresh();
        return;
      }
      const rew = res.rewards as Reward;
      setReward(rew);
      setShowModal(true);
      setRemaining(res.remaining ?? 0);
      if (rew?.xp) emitXp(rew.xp, "Boîte bonus");
    } catch (e: any) {
      toast.error(e?.message ?? "Impossible d'ouvrir la boîte bonus");
    } finally {
      setOpening(false);
    }
  };

  if (!loaded) return null;

  // Nothing unlocked yet → always tease progress (even at 0 quizzes) so users
  // know the bonus box exists.
  if (remaining <= 0) {
    const next = (Math.floor(quizCount / 5) + 1) * 5;
    const left = next - quizCount;
    const pct = Math.round(((quizCount % 5) / 5) * 100);
    return (
      <div className="card-paper p-3 mb-3 flex items-center gap-3 opacity-80">
        <span className="text-2xl">🎁</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">
            Boîte bonus dans <span className="font-bold text-foreground">{left} quiz</span> ({quizCount}/{next})
          </p>
          <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full gradient-primary transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={open}
        disabled={opening}
        className="block w-full card-paper p-4 mb-3 relative overflow-hidden text-left tilt-l hover:shadow-glow transition-all group"
      >
        <span className="tape" />
        <div className="flex items-center gap-3">
          <div className={`h-14 w-14 rounded-xl gradient-primary flex items-center justify-center text-3xl shadow-glow ${opening ? "" : "loot-bounce"}`}>
            {opening ? <Loader2 className="h-6 w-6 animate-spin text-primary-foreground" /> : "🎁"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-lg leading-none flex items-center gap-1.5">
              Boîte bonus quiz <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Récompense pour 5 quiz complétés{remaining > 1 ? ` · ${remaining} disponibles` : ""}
            </p>
          </div>
          {remaining > 1 && (
            <span className="font-mono-tag text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-primary/15 text-primary">
              ×{remaining}
            </span>
          )}
          <Gift className="h-5 w-5 text-primary" />
        </div>
      </button>

      {showModal && reward && (
        <LootBoxReveal reward={reward} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
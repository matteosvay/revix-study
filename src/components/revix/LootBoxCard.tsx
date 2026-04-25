import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Gift, Sparkles, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { emitXp } from "@/hooks/useGamification";

type Reward = {
  xp: number;
  streak_token: boolean;
  powerup: string | null;
  cosmetic: { key: string; name: string; emoji: string | null; rarity: string; category: string } | null;
};

const POWERUP_LABELS: Record<string, { name: string; emoji: string }> = {
  power_5050: { name: "50 / 50", emoji: "✂️" },
  power_skip: { name: "Skip question", emoji: "⏭️" },
  power_time: { name: "+30 sec", emoji: "⏱️" },
};

const RARITY_RING: Record<string, string> = {
  common: "ring-muted-foreground/40",
  rare: "ring-blue-400",
  epic: "ring-purple-500",
  legendary: "ring-yellow-400",
};

export function LootBoxCard() {
  const { user } = useAuth();
  const [openedToday, setOpenedToday] = useState<boolean | null>(null);
  const [opening, setOpening] = useState(false);
  const [reward, setReward] = useState<Reward | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("daily_loot_box")
        .select("rewards, open_date")
        .eq("user_id", user.id)
        .eq("open_date", today)
        .maybeSingle();
      setOpenedToday(!!data);
    })();
  }, [user]);

  const open = async () => {
    if (opening || openedToday) return;
    setOpening(true);
    try {
      const { data, error } = await supabase.rpc("open_daily_loot_box");
      if (error) throw error;
      const res = data as any;
      const rew = res?.rewards as Reward;
      setReward(rew);
      setShowModal(true);
      setOpenedToday(true);
      if (rew?.xp) emitXp(rew.xp, "Boîte mystère");
    } catch (e: any) {
      toast.error(e?.message ?? "Impossible d'ouvrir la boîte");
    } finally {
      setOpening(false);
    }
  };

  if (openedToday === null) return null;
  if (openedToday && !showModal) {
    return (
      <div className="card-paper p-3 mb-3 flex items-center gap-3 opacity-60">
        <Gift className="h-5 w-5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground flex-1">Boîte mystère ouverte ✓ Reviens demain.</p>
      </div>
    );
  }

  return (
    <>
      {!openedToday && (
        <button
          onClick={open}
          disabled={opening}
          className="block w-full card-paper p-4 mb-3 relative overflow-hidden text-left tilt-r hover:shadow-glow transition-all group"
        >
          <span className="tape" />
          <div className="flex items-center gap-3">
            <div className={`h-14 w-14 rounded-xl gradient-primary flex items-center justify-center text-3xl shadow-glow ${opening ? "" : "loot-bounce"}`}>
              {opening ? <Loader2 className="h-6 w-6 animate-spin text-primary-foreground" /> : "🎁"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif text-lg leading-none flex items-center gap-1.5">
                Boîte mystère <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              </p>
              <p className="text-xs text-muted-foreground mt-1">XP, jetons, power-ups, cosmétiques…</p>
            </div>
            <span className="font-mono-tag text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-primary/15 text-primary">
              Ouvrir
            </span>
          </div>
        </button>
      )}

      {showModal && reward && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/50 backdrop-blur-sm animate-fade-in p-4">
          <div className="card-paper p-6 max-w-sm w-full relative animate-scale-in">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
            <span className="tape" />
            <div className="text-center">
              <div className="text-6xl mb-2 loot-bounce">🎁</div>
              <p className="font-serif text-2xl">Récompenses</p>
              <p className="text-xs text-muted-foreground mt-1">Boîte mystère du jour</p>
            </div>

            <div className="mt-5 space-y-2.5">
              <div className="postit p-3 -rotate-1 flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div className="flex-1">
                  <p className="font-mono-tag text-[10px] uppercase opacity-70">Bonus XP</p>
                  <p className="font-hand text-2xl leading-none">+{reward.xp}</p>
                </div>
              </div>

              {reward.streak_token && (
                <div className="postit postit-pink p-3 rotate-1 flex items-center gap-3">
                  <span className="text-2xl">📎</span>
                  <div className="flex-1">
                    <p className="font-mono-tag text-[10px] uppercase opacity-70">Pass de streak</p>
                    <p className="font-hand text-lg leading-none">+1 scotch</p>
                  </div>
                </div>
              )}

              {reward.powerup && POWERUP_LABELS[reward.powerup] && (
                <div className="postit postit-blue p-3 -rotate-1 flex items-center gap-3">
                  <span className="text-2xl">{POWERUP_LABELS[reward.powerup].emoji}</span>
                  <div className="flex-1">
                    <p className="font-mono-tag text-[10px] uppercase opacity-70">Power-up</p>
                    <p className="font-hand text-lg leading-none">{POWERUP_LABELS[reward.powerup].name}</p>
                  </div>
                </div>
              )}

              {reward.cosmetic && (
                <div className={`postit postit-mint p-3 rotate-1 flex items-center gap-3 ring-2 ${RARITY_RING[reward.cosmetic.rarity] ?? RARITY_RING.common}`}>
                  <span className="text-3xl">{reward.cosmetic.emoji ?? "✨"}</span>
                  <div className="flex-1">
                    <p className="font-mono-tag text-[10px] uppercase opacity-70">{reward.cosmetic.rarity} · {reward.cosmetic.category}</p>
                    <p className="font-hand text-lg leading-none">{reward.cosmetic.name}</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-5 w-full rounded-md border-[2.5px] border-foreground gradient-primary text-primary-foreground py-2.5 font-bold uppercase text-xs tracking-wide shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm transition-all"
            >
              Génial !
            </button>
          </div>
        </div>
      )}
    </>
  );
}
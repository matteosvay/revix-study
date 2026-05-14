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
          className="block w-full card-paper p-4 mb-3 relative overflow-hidden text-left tilt-r hover:shadow-glow transition-all group active:scale-95"
        >
          <span className="tape" />
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className={`h-14 w-14 rounded-xl gradient-primary flex items-center justify-center text-3xl shadow-glow ${opening ? "" : "loot-bounce rainbow-glow-pulse"}`}>
                {opening ? <Loader2 className="h-6 w-6 animate-spin text-primary-foreground" /> : "🎁"}
              </div>
              {!opening && (<>
                <span className="float-sparkle absolute top-1 left-1 text-yellow-300 text-sm pointer-events-none leading-none" style={{ animationDelay: "0s" }}>✦</span>
                <span className="float-sparkle absolute top-2 right-0 text-pink-300 text-xs pointer-events-none leading-none" style={{ animationDelay: "0.75s" }}>✦</span>
                <span className="float-sparkle absolute bottom-1 left-3 text-purple-300 text-xs pointer-events-none leading-none" style={{ animationDelay: "1.4s" }}>✦</span>
              </>)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif text-lg leading-none flex items-center gap-1.5">
                Boîte mystère <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              </p>
              <p className="text-xs text-muted-foreground mt-1">XP, jetons, power-ups, cosmétiques…</p>
            </div>
            <span className="dispo-pulse font-mono-tag text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-primary text-primary-foreground">
              DISPO
            </span>
          </div>
        </button>
      )}

      {showModal && reward && (
        <LootBoxReveal reward={reward} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
import { useEffect, useState } from "react";
import { Sparkles, Trophy } from "lucide-react";
import { levelInfo } from "@/lib/gamification";

type Pill = { id: number; amount: number; label?: string };

/** Listens to global "revix:xp" + "revix:levelup" events and shows floating animations. */
export function XpOverlay() {
  const [pills, setPills] = useState<Pill[]>([]);
  const [levelup, setLevelup] = useState<number | null>(null);

  useEffect(() => {
    let id = 0;
    const onXp = (e: Event) => {
      const detail = (e as CustomEvent).detail as { amount: number; label?: string };
      const pill = { id: ++id, amount: detail.amount, label: detail.label };
      setPills((p) => [...p, pill]);
      setTimeout(() => setPills((p) => p.filter((x) => x.id !== pill.id)), 1700);
    };
    const onLvl = (e: Event) => {
      const detail = (e as CustomEvent).detail as { level: number };
      setLevelup(detail.level);
    };
    window.addEventListener("revix:xp", onXp);
    window.addEventListener("revix:levelup", onLvl);
    return () => {
      window.removeEventListener("revix:xp", onXp);
      window.removeEventListener("revix:levelup", onLvl);
    };
  }, []);

  return (
    <>
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] pointer-events-none flex flex-col items-center gap-1">
        {pills.map((p) => (
          <div key={p.id} className="xp-pill bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-bold shadow-glow flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> +{p.amount} XP
          </div>
        ))}
      </div>

      {levelup !== null && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/40 backdrop-blur-sm animate-fade-in">
          <div className="card-paper p-8 max-w-sm mx-4 text-center relative animate-scale-in">
            <span className="tape" />
            <Trophy className="h-12 w-12 mx-auto text-primary float-slow" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground mt-3">Level up</p>
            <p className="font-serif text-4xl mt-1">Niveau {levelup}</p>
            <p className="font-hand text-2xl text-primary mt-2">{levelInfo(levelup).emoji} {levelInfo(levelup).name}</p>
            <p className="text-sm text-muted-foreground mt-3">Tu es maintenant <strong>{levelInfo(levelup).name}</strong> ! 🎉</p>
            <button onClick={() => setLevelup(null)} className="mt-5 w-full rounded-full gradient-primary text-primary-foreground py-2.5 font-semibold text-sm">
              Continuer 🚀
            </button>
          </div>
        </div>
      )}
    </>
  );
}
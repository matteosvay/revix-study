import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { levelInfo } from "@/lib/gamification";
import { DiploFace } from "./DiploFace";
import { firePaperConfetti } from "@/lib/confetti";
import { playXp, playLevel } from "@/lib/sfx";

type Pill = { id: number; amount: number; label?: string };

/** Médaille papier avec le numéro de niveau + rayons + rubans. */
function Medal({ level }: { level: number }) {
  return (
    <div className="relative flex items-center justify-center">
      <svg className="absolute revix-spin" width="220" height="220" viewBox="-110 -110 220 220" aria-hidden="true">
        {Array.from({ length: 16 }).map((_, i) => (
          <polygon
            key={i}
            points="0,-58 7,-96 -7,-96"
            fill="hsl(45 92% 62%)"
            opacity={i % 2 ? 0.28 : 0.5}
            transform={`rotate(${(360 / 16) * i})`}
          />
        ))}
      </svg>
      <svg width="150" height="176" viewBox="0 0 150 176" className="relative overflow-visible">
        <path d="M58 96 L44 168 L66 150 Z" fill="#e2564b" stroke="#1e2c47" strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M92 96 L106 168 L84 150 Z" fill="#e2564b" stroke="#1e2c47" strokeWidth="3.5" strokeLinejoin="round" />
        <circle cx="75" cy="70" r="46" fill="#f6c945" stroke="#1e2c47" strokeWidth="4.5" />
        <circle cx="75" cy="70" r="35" fill="#fff7db" stroke="#1e2c47" strokeWidth="3" />
        <text x="75" y="72" textAnchor="middle" dominantBaseline="central" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="34" fill="#1e2c47">
          {level}
        </text>
      </svg>
    </div>
  );
}

/** Écoute les événements globaux "revix:xp" + "revix:levelup" et affiche les animations. */
export function XpOverlay() {
  const [pills, setPills] = useState<Pill[]>([]);
  const [levelup, setLevelup] = useState<number | null>(null);

  useEffect(() => {
    let id = 0;
    const onXp = (e: Event) => {
      const detail = (e as CustomEvent).detail as { amount: number; label?: string };
      const pill = { id: ++id, amount: detail.amount, label: detail.label };
      setPills((p) => [...p, pill]);
      playXp();
      setTimeout(() => setPills((p) => p.filter((x) => x.id !== pill.id)), 1700);
    };
    const onLvl = (e: Event) => {
      const detail = (e as CustomEvent).detail as { level: number };
      setLevelup(detail.level);
      playLevel();
      firePaperConfetti(["#2456d6", "#ffe14d", "#28a866", "#f6c945", "#3f7bff", "#ffffff"], 80, 0.42);
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
          <div
            key={p.id}
            className="xp-pill bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-bold border-2 border-foreground shadow-brutal-sm flex items-center gap-1"
          >
            <Sparkles className="h-3 w-3" /> +{p.amount} XP
          </div>
        ))}
      </div>

      {levelup !== null && (
        <div className="lb-backdrop fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in">
          <div className="relative flex flex-col items-center text-center animate-pop-in">
            <Medal level={levelup} />
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground mt-3">Tu montes de niveau</p>
            <p className="font-display text-3xl mt-1 leading-none">Niveau {levelup}</p>
            <p className="font-hand text-2xl text-primary mt-1">{levelInfo(levelup).name}</p>
            <div className="mt-1">
              <DiploFace expr="happy" size={104} />
            </div>
            <button
              onClick={() => setLevelup(null)}
              className="mt-1 px-8 py-3 rounded-lg border-[2.5px] border-foreground bg-primary text-primary-foreground font-bold uppercase tracking-wide text-sm shadow-brutal hover:-translate-y-0.5 active:translate-y-0.5 transition-transform"
            >
              Continuer
            </button>
          </div>
        </div>
      )}
    </>
  );
}

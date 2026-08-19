import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DiploFace } from "./DiploFace";

const GOAL = 50; // XP à gagner chaque jour pour valider l'objectif

/**
 * Objectif du jour — anneau d'XP qui se remplit en direct au fil de la journée.
 * La raison n°1 de revenir chaque jour : un but simple, visible, atteignable.
 * Lit les XP gagnés aujourd'hui (table xp_events) et se met à jour sur l'event revix:xp.
 */
export function DailyGoal() {
  const { user } = useAuth();
  const [xp, setXp] = useState<number | null>(null);
  const celebrated = useRef(false);

  useEffect(() => {
    if (!user) return;
    let active = true;

    const fetchToday = async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("xp_events")
        .select("amount")
        .eq("user_id", user.id)
        .gte("created_at", start.toISOString());
      if (!active) return;
      const total = (data ?? []).reduce((s: number, e: any) => s + (e.amount ?? 0), 0);
      setXp(Math.max(0, total));
    };
    fetchToday();

    // Mise à jour optimiste quand l'utilisateur gagne de l'XP (quizz, révision…)
    const onXp = (e: Event) => {
      const amount = (e as CustomEvent).detail?.amount ?? 0;
      setXp((prev) => Math.max(0, (prev ?? 0) + amount));
    };
    window.addEventListener("revix:xp", onXp);
    return () => {
      active = false;
      window.removeEventListener("revix:xp", onXp);
    };
  }, [user]);

  const val = xp ?? 0;
  const pct = Math.min(1, val / GOAL);
  const done = val >= GOAL;

  // Célébration Diplo la première fois qu'on atteint l'objectif dans la session
  useEffect(() => {
    if (done && !celebrated.current && xp !== null) {
      celebrated.current = true;
    }
  }, [done, xp]);

  const R = 30;
  const C = 2 * Math.PI * R;
  const dash = C * pct;

  return (
    <div className="rounded-2xl border-[2.5px] border-foreground bg-card shadow-brutal p-3.5 flex items-center gap-3.5 overflow-hidden relative">
      {/* Anneau */}
      <div className="relative shrink-0" style={{ width: 76, height: 76 }}>
        <svg width="76" height="76" viewBox="0 0 76 76" className="rotate-[-90deg]">
          <circle cx="38" cy="38" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
          <circle
            cx="38"
            cy="38"
            r={R}
            fill="none"
            stroke={done ? "hsl(var(--success))" : "hsl(var(--primary))"}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C}`}
            style={{ transition: "stroke-dasharray 0.7s cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {done ? (
            <DiploFace size={40} expr="happy" animClass="diplo-bob" />
          ) : (
            <span className="font-display font-bold text-lg text-foreground leading-none">{Math.round(pct * 100)}<span className="text-[10px]">%</span></span>
          )}
        </div>
      </div>

      {/* Texte */}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Objectif du jour</p>
        {done ? (
          <>
            <p className="font-display font-bold text-base leading-tight text-foreground">Objectif atteint !</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Bravo — reviens demain pour garder le rythme.</p>
          </>
        ) : (
          <>
            <p className="font-display font-bold text-base leading-tight text-foreground">
              {val} / {GOAL} XP
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Plus que {GOAL - val} XP — un petit quizz et c'est plié.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

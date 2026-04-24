import { useEffect, useState } from "react";
import { CoachContext, pickDailyTip } from "@/lib/coachContext";

export function DailyTipCard({ ctx }: { ctx: CoachContext | null }) {
  const [tip, setTip] = useState(() => (ctx ? pickDailyTip(ctx) : null));

  useEffect(() => {
    if (ctx) setTip(pickDailyTip(ctx));
  }, [ctx]);

  if (!tip) {
    return (
      <div className="postit p-4 rounded-md min-h-[140px] flex items-center justify-center text-sm">
        Chargement du conseil…
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="pin absolute -top-1.5 left-1/2 -translate-x-1/2 z-10" />
      <div className="postit p-4 rounded-md shadow-paper" style={{ transform: "rotate(0.5deg)" }}>
        <p className="font-mono text-[10px] tracking-widest text-foreground/60 mb-2">{tip.label}</p>
        <p className="font-hand text-xl leading-tight text-foreground">{tip.text}</p>
        <p className="text-[10px] text-foreground/50 mt-3 italic">💡 Basé sur ton planning + tes résultats</p>
      </div>
    </div>
  );
}
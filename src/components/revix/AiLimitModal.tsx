import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap } from "lucide-react";
import { AI_LIMIT_EVENT, type AiLimitInfo } from "@/lib/aiLimits";

const ACTION_LABELS: Record<string, string> = {
  fiche: "fiches IA",
  quiz_ia: "quizz IA",
  coach: "messages au coach",
  correction: "corrections IA",
  planning: "plannings IA",
};

export function AiLimitModal() {
  const [info, setInfo] = useState<AiLimitInfo | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onLimit = (e: Event) => setInfo((e as CustomEvent<AiLimitInfo>).detail);
    window.addEventListener(AI_LIMIT_EVENT, onLimit);
    return () => window.removeEventListener(AI_LIMIT_EVENT, onLimit);
  }, []);

  if (!info) return null;
  const period = info.reason === "weekly_limit" ? "cette semaine" : "aujourd'hui";
  const actionLabel = ACTION_LABELS[info.action] ?? "générations IA";

  const goToPlans = () => {
    setInfo(null);
    navigate("/app/profil#abonnement");
    setTimeout(() => {
      const el = document.getElementById("abonnement");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  return (
    <Dialog open={!!info} onOpenChange={(o) => !o && setInfo(null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">🚀 Tu as tout déchiré !</DialogTitle>
          <DialogDescription className="text-sm">
            Tu as utilisé toutes tes <strong>{actionLabel}</strong> pour {period}. Passe à une formule supérieure pour continuer sans attendre.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <button
            onClick={goToPlans}
            className="text-left rounded-xl border-2 border-primary/40 bg-primary/5 hover:border-primary hover:bg-primary/10 transition p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-serif text-lg font-semibold">Pro</span>
              </div>
              <span className="font-bold text-primary">4,99 €<span className="text-xs font-normal text-muted-foreground">/mois TTC</span></span>
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-primary shrink-0" /> 10 quizz IA / jour</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-primary shrink-0" /> 20 messages coach / jour</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-primary shrink-0" /> 5 fiches IA / semaine</li>
            </ul>
          </button>

          <button
            onClick={goToPlans}
            className="text-left rounded-xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-orange-600/5 hover:border-amber-500 transition p-4 relative"
          >
            <span className="absolute -top-2 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white">
              Recommandé
            </span>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="font-serif text-lg font-semibold">Max</span>
              </div>
              <span className="font-bold text-amber-600">8,99 €<span className="text-xs font-normal text-muted-foreground">/mois TTC</span></span>
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-amber-500 shrink-0" /> 30 quizz IA / jour</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-amber-500 shrink-0" /> 50 messages coach / jour</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-amber-500 shrink-0" /> 3 fiches IA / jour + planning illimité</li>
            </ul>
          </button>
        </div>

        <Button variant="ghost" size="sm" onClick={() => setInfo(null)} className="text-muted-foreground">
          Plus tard
        </Button>
      </DialogContent>
    </Dialog>
  );
}
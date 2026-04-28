import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    const onLimit = (e: Event) => setInfo((e as CustomEvent<AiLimitInfo>).detail);
    window.addEventListener(AI_LIMIT_EVENT, onLimit);
    return () => window.removeEventListener(AI_LIMIT_EVENT, onLimit);
  }, []);

  if (!info) return null;
  const period = info.reason === "weekly_limit" ? "cette semaine" : "aujourd'hui";
  const actionLabel = ACTION_LABELS[info.action] ?? "générations IA";

  return (
    <Dialog open={!!info} onOpenChange={(o) => !o && setInfo(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🚀 Limite atteinte</DialogTitle>
          <DialogDescription>
            Tu as utilisé toutes tes {actionLabel} pour {period}. Passe à une formule supérieure pour continuer sans attendre.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => setInfo(null)}>Plus tard</Button>
          <Button onClick={() => setInfo(null)}>Voir les formules</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
// Bouton « Signaler » réutilisable : erreur dans une fiche ou une question,
// message ou profil inapproprié, contenu qui porte atteinte aux droits de quelqu'un.
// Les signalements arrivent dans la table content_reports, lisible seulement par l'admin.
import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type ReportTarget = "fiche" | "question" | "message" | "profile" | "room" | "other";
type Reason = "erreur" | "inapproprie" | "harcelement" | "droits" | "autre";

const REASONS: Record<ReportTarget, { value: Reason; label: string }[]> = {
  fiche: [
    { value: "erreur", label: "Il y a une erreur dans la fiche" },
    { value: "droits", label: "Ce contenu m'appartient ou est diffusé sans autorisation" },
    { value: "autre", label: "Autre chose" },
  ],
  question: [
    { value: "erreur", label: "La question ou la réponse est fausse" },
    { value: "autre", label: "Autre chose" },
  ],
  message: [
    { value: "inapproprie", label: "Message inapproprié" },
    { value: "harcelement", label: "Harcèlement ou menace" },
    { value: "autre", label: "Autre chose" },
  ],
  profile: [
    { value: "inapproprie", label: "Profil inapproprié" },
    { value: "harcelement", label: "Harcèlement ou menace" },
    { value: "autre", label: "Autre chose" },
  ],
  room: [
    { value: "inapproprie", label: "Contenu inapproprié" },
    { value: "droits", label: "Contenu diffusé sans autorisation" },
    { value: "autre", label: "Autre chose" },
  ],
  other: [{ value: "autre", label: "Autre chose" }],
};

const TITLES: Record<ReportTarget, string> = {
  fiche: "Signaler un problème dans cette fiche",
  question: "Signaler un problème dans cette question",
  message: "Signaler ce message",
  profile: "Signaler ce profil",
  room: "Signaler cette salle",
  other: "Signaler un contenu",
};

interface Props {
  targetType: ReportTarget;
  targetId: string;
  /** Texte du bouton. Par défaut « Signaler ». */
  label?: string;
  /** Bouton compact (icône seule), pour les messages. */
  compact?: boolean;
  className?: string;
}

export function ReportButton({ targetType, targetId, label = "Signaler", compact = false, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason>(REASONS[targetType][0].value);
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    setSending(true);
    const { error } = await supabase.from("content_reports" as never).insert({
      target_type: targetType,
      target_id: String(targetId).slice(0, 200),
      reason,
      details: details.trim().slice(0, 1000) || null,
    } as never);
    setSending(false);
    if (error) {
      toast.error(error.message.includes("too_many_reports")
        ? "Tu as envoyé beaucoup de signalements aujourd'hui. Réessaie demain."
        : "Le signalement n'a pas pu être envoyé. Réessaie.");
      return;
    }
    toast.success("Merci, ton signalement a bien été envoyé.");
    setOpen(false);
    setDetails("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={TITLES[targetType]}
        title={TITLES[targetType]}
        className={compact
          ? `inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-destructive ${className}`
          : `inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive underline-offset-2 hover:underline ${className}`}
      >
        <Flag className="h-3.5 w-3.5" />
        {!compact && label}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{TITLES[targetType]}</DialogTitle>
            <DialogDescription>Ton signalement reste confidentiel.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2" role="radiogroup" aria-label="Raison du signalement">
            {REASONS[targetType].map((r) => (
              <label key={r.value} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="report-reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="accent-[hsl(var(--primary))]"
                />
                {r.label}
              </label>
            ))}
          </div>
          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={1000}
            placeholder={targetType === "fiche" || targetType === "question"
              ? "Qu'est-ce qui est faux ? Si tu connais la bonne réponse, écris-la ici."
              : "Ajoute un détail si tu veux (facultatif)."}
            className="min-h-[90px]"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>Annuler</Button>
            <Button onClick={submit} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Envoyer le signalement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

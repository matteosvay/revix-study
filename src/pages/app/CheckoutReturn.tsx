// Page de retour après paiement Stripe (Embedded Checkout).
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";

// TODO Phase 3 : remplacer par l'email de support définitif (ex: support@revix-study.com)
// quand tu auras choisi et configuré ton domaine de support.
const SUPPORT_EMAIL = "[VOTRE_EMAIL_DE_SUPPORT]";

export default function CheckoutReturn() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { isActive, tier, refresh } = useSubscription();
  const [waited, setWaited] = useState(false);

  // Le webhook Stripe met quelques secondes (parfois jusqu'à 30s) à arriver. On poll
  // l'abonnement avec un backoff jusqu'à ~30s avant d'afficher le message de fallback.
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const tick = async () => {
      attempts += 1;
      await refresh();
      if (cancelled) return;
      if (!isActive && attempts < 15) {
        // Backoff léger : 1.5s, 1.5s, 2s, 2s, 2.5s, … (~30s total sur 15 essais)
        const delay = Math.min(1500 + Math.floor(attempts / 2) * 500, 3000);
        setTimeout(tick, delay);
      } else {
        setWaited(true);
      }
    };
    tick();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppLayout>
      <PageHeader emoji="💳" title="Paiement" />
      <div className="px-5 py-6 flex flex-col items-center text-center gap-4">
        {isActive ? (
          <>
            <CheckCircle2 className="h-16 w-16 text-primary" />
            <h2 className="font-serif text-2xl">Bienvenue dans Revix {tier === "max" ? "Max" : "Pro"} 🎉</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Ton abonnement est actif. Tes nouveaux quotas IA sont déjà disponibles.
            </p>
            <Button asChild className="rounded-full gradient-primary border-0 mt-2">
              <Link to="/app">Aller au dashboard</Link>
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground max-w-sm">
              {waited
                ? "Le paiement est confirmé côté Stripe, mais la mise à jour de ton compte prend un peu plus de temps que prévu. Ça peut arriver — réessaie dans 1 à 2 minutes en rafraîchissant la page."
                : "On confirme ton paiement…"}
            </p>
            {sessionId && (
              <p className="text-[10px] text-muted-foreground font-mono opacity-60 break-all max-w-xs">
                Référence : {sessionId}
              </p>
            )}
            {waited && (
              <div className="flex flex-col gap-2 items-center">
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/app/profil">Retour au profil</Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="rounded-full">
                  <a href={`mailto:${SUPPORT_EMAIL}?subject=Abonnement%20non%20activé&body=Référence%20Stripe%20:%20${sessionId ?? ""}`}>
                    <Mail className="h-3.5 w-3.5 mr-1" /> Contacter le support
                  </a>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

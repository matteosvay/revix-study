// Page de retour après paiement Stripe (Embedded Checkout).
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";

export default function CheckoutReturn() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { isActive, tier, refresh } = useSubscription();
  const [waited, setWaited] = useState(false);

  // Le webhook met quelques secondes à arriver — on rafraîchit l'abo plusieurs fois.
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const tick = async () => {
      attempts += 1;
      await refresh();
      if (cancelled) return;
      if (!isActive && attempts < 8) {
        setTimeout(tick, 1500);
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
            <p className="text-sm text-muted-foreground">
              {waited
                ? "Le paiement est confirmé mais la mise à jour de ton compte prend un peu de temps. Reviens dans 1 minute ou contacte le support si rien ne change."
                : "On confirme ton paiement..."}
            </p>
            {sessionId && <p className="text-[10px] text-muted-foreground font-mono opacity-60">{sessionId}</p>}
            {waited && (
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/app/profil">Retour au profil</Link>
              </Button>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
// Composant qui monte le Stripe Embedded Checkout inline.
//
// Avant d'afficher le paiement, l'acheteur coche deux cases :
// - il a 18 ans ou plus (un abonnement souscrit par un mineur peut être contesté) ;
// - il demande l'accès immédiat et renonce au délai de rétractation de 14 jours
//   (article L221-28 du Code de la consommation). Sans cette demande expresse,
//   n'importe quel abonné pourrait se faire rembourser après 14 jours d'usage.
// Le serveur (create-checkout) refuse le paiement si ces deux accords manquent.
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  priceId: string;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
}

/** Lit le message d'erreur renvoyé par une edge function, même en cas de statut 4xx/5xx. */
async function readFunctionError(error: unknown, data: unknown): Promise<string | null> {
  const fromData = (data as { message?: string; error?: string } | null);
  if (fromData?.message) return fromData.message;
  const ctx = (error as { context?: Response } | null)?.context;
  if (ctx && typeof ctx.json === "function") {
    try {
      const body = await ctx.clone().json();
      return body?.message ?? body?.error ?? null;
    } catch {
      /* corps non JSON */
    }
  }
  return typeof fromData?.error === "string" ? fromData.error : (error as Error | null)?.message ?? null;
}

export function StripeEmbeddedCheckout({ priceId, customerEmail, userId, returnUrl }: Props) {
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [adult, setAdult] = useState(false);
  const [waive, setWaive] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    setCheckoutError(null);
    const finalReturnUrl =
      returnUrl ?? `${window.location.origin}/app/checkout/return?session_id={CHECKOUT_SESSION_ID}`;
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        priceId,
        customerEmail,
        userId,
        returnUrl: finalReturnUrl,
        environment: getStripeEnvironment(),
        consent: { adult: true, waiveWithdrawal: true },
      },
    });
    if (error || !data?.clientSecret) {
      const detail = await readFunctionError(error, data);
      const message = detail?.includes("Credential not found")
        ? "La connexion Stripe doit être reconnectée avant de pouvoir afficher le paiement."
        : detail || "Impossible de créer la session de paiement";
      setCheckoutError(message);
      throw new Error(message);
    }
    return data.clientSecret as string;
  }, [priceId, customerEmail, userId, returnUrl]);

  if (!confirmed) {
    return (
      <div className="space-y-4 p-4">
        <p className="text-sm text-muted-foreground">Avant de payer, deux confirmations.</p>
        <label className="flex items-start gap-3 text-sm leading-snug cursor-pointer">
          <Checkbox checked={adult} onCheckedChange={(v) => setAdult(v === true)} className="mt-0.5" />
          <span>
            J'ai 18 ans ou plus. Si tu as moins de 18 ans, demande à un parent de souscrire pour toi.
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm leading-snug cursor-pointer">
          <Checkbox checked={waive} onCheckedChange={(v) => setWaive(v === true)} className="mt-0.5" />
          <span>
            Je demande l'accès immédiat à l'abonnement et je renonce à mon droit de rétractation de
            14 jours, comme prévu dans les{" "}
            <Link to="/cgv" target="_blank" className="underline text-primary">conditions de vente</Link>.
            Je peux résilier à tout moment depuis mon profil.
          </span>
        </label>
        <Button className="w-full" disabled={!adult || !waive} onClick={() => setConfirmed(true)}>
          Continuer vers le paiement
        </Button>
      </div>
    );
  }

  return (
    <div id="checkout" className="min-h-[600px]">
      {checkoutError && (
        <div className="m-4 flex items-start gap-3 rounded-md border-2 border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{checkoutError}</p>
        </div>
      )}
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}

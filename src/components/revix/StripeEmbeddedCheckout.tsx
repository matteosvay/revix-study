// Composant qui monte le Stripe Embedded Checkout inline.
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useCallback, useState } from "react";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";

interface Props {
  priceId: string;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
}

export function StripeEmbeddedCheckout({ priceId, customerEmail, userId, returnUrl }: Props) {
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

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
      },
    });
    if (error || !data?.clientSecret) {
      const detail = typeof data?.error === "string" ? data.error : error?.message;
      const message = detail?.includes("Credential not found")
        ? "La connexion Stripe doit être reconnectée avant de pouvoir afficher le paiement."
        : detail || "Impossible de créer la session de paiement";
      setCheckoutError(message);
      throw new Error(message);
    }
    return data.clientSecret as string;
  }, [priceId, customerEmail, userId, returnUrl]);

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
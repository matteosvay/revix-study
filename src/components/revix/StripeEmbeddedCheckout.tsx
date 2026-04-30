// Composant qui monte le Stripe Embedded Checkout inline.
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useCallback } from "react";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  priceId: string;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
}

export function StripeEmbeddedCheckout({ priceId, customerEmail, userId, returnUrl }: Props) {
  const fetchClientSecret = useCallback(async (): Promise<string> => {
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
      throw new Error(error?.message || "Impossible de créer la session de paiement");
    }
    return data.clientSecret as string;
  }, [priceId, customerEmail, userId, returnUrl]);

  return (
    <div id="checkout" className="min-h-[600px]">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
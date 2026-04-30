// Crée une session Stripe Embedded Checkout pour s'abonner à Pro ou Max.
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CheckoutBody {
  priceId: string;
  quantity?: number;
  customerEmail?: string;
  userId?: string;
  returnUrl: string;
  environment: StripeEnv;
}

async function createCheckoutSession(opts: CheckoutBody): Promise<string | null> {
  if (!/^[a-zA-Z0-9_-]+$/.test(opts.priceId)) throw new Error("Invalid priceId");
  if (opts.environment !== "sandbox" && opts.environment !== "live") {
    throw new Error("Invalid environment");
  }
  const stripe = createStripeClient(opts.environment);

  let prices;
  try {
    prices = await stripe.prices.list({
    lookup_keys: [opts.priceId],
      active: true,
      limit: 10,
    });
  } catch (e) {
    console.error("create-checkout prices.list threw:", e);
    throw new Error("Connexion Stripe indisponible. Réessaie dans un instant.");
  }
  // The connector gateway can return an error envelope with status 200 instead of throwing.
  if (prices && !Array.isArray((prices as any).data) && (prices as any).type) {
    console.error("create-checkout gateway error:", JSON.stringify(prices));
    const msg = (prices as any).message || "Erreur passerelle Stripe";
    throw new Error(`Passerelle Stripe: ${msg}`);
  }
  if (!prices || !Array.isArray(prices.data) || prices.data.length === 0) {
    throw new Error(`Price not found for lookup_key '${opts.priceId}'. Vérifie que le produit existe dans Stripe (${opts.environment}).`);
  }
  const stripePrice = prices.data[0];
  const isRecurring = stripePrice.type === "recurring";

  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: stripePrice.id, quantity: opts.quantity || 1 }],
    mode: isRecurring ? "subscription" : "payment",
    ui_mode: "embedded_page",
    return_url: opts.returnUrl,
    managed_payments: { enabled: true },
    ...(opts.customerEmail && { customer_email: opts.customerEmail }),
    ...(opts.userId && {
      metadata: { userId: opts.userId, managed_payments: "true" },
      ...(isRecurring && {
        subscription_data: { metadata: { userId: opts.userId } },
      }),
    }),
  });

  return session.client_secret;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }
  try {
    const body = (await req.json()) as CheckoutBody;
    if (!body.priceId || !body.returnUrl || !body.environment) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const clientSecret = await createCheckoutSession(body);
    return new Response(JSON.stringify({ clientSecret }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-checkout error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
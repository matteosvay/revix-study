// Crée une session Stripe Embedded Checkout pour s'abonner à Pro ou Max.
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ALLOWED_ORIGINS = [
  "https://revix-study.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
];

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

/**
 * Liste blanche des origines autorisées pour le returnUrl.
 * Empêche un attaquant d'utiliser cette fonction comme open redirect / phishing.
 */
const ALLOWED_RETURN_HOSTS = [
  "revix-study.lovable.app",
  "lovable.app",
  "lovableproject.com",
  "localhost",
  "127.0.0.1",
];
function isAllowedReturnUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.hostname !== "localhost" && u.hostname !== "127.0.0.1") return false;
    return ALLOWED_RETURN_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith("." + h));
  } catch {
    return false;
  }
}

interface CheckoutBody {
  priceId: string;
  quantity?: number;
  returnUrl: string;
  environment: StripeEnv;
}

interface CheckoutOpts extends CheckoutBody {
  userId: string;
  customerEmail: string | null;
}

/**
 * Whitelist explicite des lookup_keys Stripe acceptés par cette fonction.
 * Sans cette liste, n'importe quel lookup_key existant dans le compte Stripe
 * est utilisable — y compris un futur prix de test à 0,01€ qu'on aurait oublié
 * de désarchiver. Toute évolution de tarification doit passer par une mise à
 * jour de cette constante.
 */
const ALLOWED_PRICE_LOOKUP_KEYS = new Set<string>([
  "pro_monthly",
  "max_monthly",
]);

async function createCheckoutSession(opts: CheckoutOpts): Promise<string | null> {
  if (!ALLOWED_PRICE_LOOKUP_KEYS.has(opts.priceId)) {
    throw new Error(`Invalid priceId '${opts.priceId}'. Plans autorisés : ${[...ALLOWED_PRICE_LOOKUP_KEYS].join(", ")}`);
  }
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

  // Ensure the product has a tax_code (required by Managed Payments).
  // SaaS / digital subscription → txcd_10103001 (Software as a Service).
  const productId = typeof stripePrice.product === "string"
    ? stripePrice.product
    : stripePrice.product?.id;
  if (productId) {
    try {
      const product = await stripe.products.retrieve(productId);
      if (!product.tax_code) {
        await stripe.products.update(productId, { tax_code: "txcd_10103001" });
      }
    } catch (e) {
      console.error("create-checkout tax_code ensure failed:", e);
    }
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: stripePrice.id, quantity: opts.quantity || 1 }],
    mode: isRecurring ? "subscription" : "payment",
    ui_mode: "embedded_page",
    return_url: opts.returnUrl,
    managed_payments: { enabled: true },
    ...(opts.customerEmail && { customer_email: opts.customerEmail }),
    metadata: { userId: opts.userId, managed_payments: "true" },
    ...(isRecurring && {
      subscription_data: { metadata: { userId: opts.userId } },
    }),
  });

  return session.client_secret;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders(req) });
  }
  try {
    // 1) Auth obligatoire — on ne peut PAS lier un abonnement au compte d'un autre user.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: u, error: uErr } = await sb.auth.getUser(authHeader.replace("Bearer ", ""));
    if (uErr || !u?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as CheckoutBody;
    if (!body.priceId || !body.returnUrl || !body.environment) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }
    if (!isAllowedReturnUrl(body.returnUrl)) {
      return new Response(JSON.stringify({ error: "returnUrl not allowed" }), {
        status: 400,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const clientSecret = await createCheckoutSession({
      priceId: body.priceId,
      quantity: body.quantity,
      returnUrl: body.returnUrl,
      environment: body.environment,
      userId: u.user.id,
      customerEmail: u.user.email ?? null,
    });
    return new Response(JSON.stringify({ clientSecret }), {
      status: 200,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-checkout error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
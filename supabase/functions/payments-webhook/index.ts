// Reçoit les événements Stripe (subscription created/updated/deleted) et synchronise la table subscriptions.
// Le trigger PG `subscriptions_sync_profile_plan` met ensuite à jour profiles.plan automatiquement.
//
// Sécurité :
//  - signature Stripe vérifiée à temps constant via verifyWebhook (cf. _shared/stripe.ts)
//  - idempotence : chaque event.id est inséré dans processed_webhook_events ; si déjà présent,
//    on renvoie 200 sans rejouer l'event (Stripe re-livre en cas de 5xx).
//  - colonne tier explicite déduite du lookup_key au moment de l'écriture, pour éviter le
//    parsing fragile côté client.
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

/**
 * Déduit le tier ('pro' | 'max' | null) à partir d'un lookup_key Stripe.
 * Renvoie null si on ne reconnaît pas le préfixe → la colonne tier reste null
 * et le client utilisera le fallback de get_user_tier.
 */
function tierFromPriceId(priceId: string | null | undefined): "pro" | "max" | null {
  if (!priceId) return null;
  if (priceId.startsWith("max")) return "max";
  if (priceId.startsWith("pro")) return "pro";
  return null;
}

/**
 * Tente de marquer l'event comme déjà traité. Retourne true si c'était la première fois,
 * false si l'event avait déjà été traité (et qu'il faut renvoyer 200 sans rejouer).
 */
async function markEventProcessed(eventId: string, eventType: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from("processed_webhook_events")
    .insert({ event_id: eventId, source: "stripe", event_type: eventType });
  if (!error) return true;
  if ((error as { code?: string }).code === "23505") return false;
  console.error("[webhook] markEventProcessed failed (continuing):", error);
  return true;
}

async function handleSubscriptionCreated(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.lookup_key
    || item?.price?.metadata?.lovable_external_id
    || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  const tier = tierFromPriceId(priceId);

  const { error } = await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: productId,
      price_id: priceId,
      tier,
      status: subscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
  if (error) {
    console.error("[webhook] subscription upsert failed:", error);
    throw new Error(`DB upsert failed: ${error.message}`);
  }
}

async function handleSubscriptionUpdated(subscription: any, env: StripeEnv) {
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.lookup_key
    || item?.price?.metadata?.lovable_external_id
    || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  const tier = tierFromPriceId(priceId);

  const { error } = await getSupabase()
    .from("subscriptions")
    .update({
      status: subscription.status,
      product_id: productId,
      price_id: priceId,
      tier,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
  if (error) {
    console.error("[webhook] subscription update failed:", error);
    throw new Error(`DB update failed: ${error.message}`);
  }
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  const { error } = await getSupabase()
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
  if (error) {
    console.error("[webhook] subscription delete failed:", error);
    throw new Error(`DB delete failed: ${error.message}`);
  }
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env) as { id?: string; type: string; data: { object: any } };

  // Idempotence : si l'event a déjà été traité, on renvoie 200 sans rejouer.
  if (event.id) {
    const isFirst = await markEventProcessed(event.id, event.type);
    if (!isFirst) {
      console.log(`[webhook] event ${event.id} already processed, skipping`);
      return;
    }
  }

  switch (event.type) {
    case "customer.subscription.created":
      await handleSubscriptionCreated(event.data.object, env);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object, env);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    console.error("Webhook received with invalid env:", rawEnv);
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    await handleWebhook(req, rawEnv);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});

// Résiliation directe de l'abonnement, sans passer par le portail Stripe.
//
// Obligation légale « résiliation en 3 clics » (article L215-1-1 du Code de la
// consommation) : une fonction de résiliation directe, puis une confirmation qui
// indique la date d'effet. L'abonnement reste actif jusqu'à la fin de la période
// déjà payée, puis s'arrête sans nouveau prélèvement.
import { authenticate, jsonResponse, sendEmail, serveWithCors } from "../_shared/mod.ts";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

serveWithCors(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, { status: 405 }, req);

  try {
    const auth = await authenticate(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    const environment = body?.environment as StripeEnv;
    if (environment !== "sandbox" && environment !== "live") {
      return jsonResponse({ error: "Invalid environment" }, { status: 400 }, req);
    }

    // Lecture en service role, mais filtrée sur l'utilisateur authentifié :
    // impossible de résilier l'abonnement de quelqu'un d'autre.
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: sub } = await admin
      .from("subscriptions")
      .select("id, stripe_subscription_id, status, cancel_at_period_end, current_period_end")
      .eq("user_id", auth.userId)
      .eq("environment", environment)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_subscription_id) {
      return jsonResponse({ error: "no_active_subscription", message: "Aucun abonnement actif à résilier." }, { status: 404 }, req);
    }

    const stripe = createStripeClient(environment);
    const updated: any = await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    const endUnix: number | undefined =
      updated?.cancel_at ?? updated?.items?.data?.[0]?.current_period_end ?? undefined;
    const endsAt = endUnix
      ? new Date(endUnix * 1000).toISOString()
      : (sub.current_period_end ?? null);

    // Mise à jour immédiate pour l'affichage. Le webhook Stripe confirmera ensuite.
    await admin
      .from("subscriptions")
      .update({ cancel_at_period_end: true, ...(endsAt ? { current_period_end: endsAt } : {}) })
      .eq("id", sub.id);

    const endLabel = endsAt
      ? new Date(endsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      : "la fin de ta période en cours";

    const { data: userData } = await admin.auth.admin.getUserById(auth.userId);
    const emailSent = await sendEmail(
      userData?.user?.email ?? "",
      "Ta résiliation Diplo est enregistrée",
      [
        "Bonjour,",
        "",
        "Nous confirmons la résiliation de ton abonnement Diplo.",
        `Il reste actif jusqu'au ${endLabel}. Aucun prélèvement ne sera fait après cette date.`,
        "Ton compte, tes cours et tes fiches restent accessibles avec l'offre gratuite.",
        "",
        `Date de la demande : ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}`,
        `Référence : ${sub.stripe_subscription_id}`,
        "",
        "L'équipe Diplo",
      ].join("\n"),
    );

    return jsonResponse({
      ok: true,
      endsAt,
      requestedAt: new Date().toISOString(),
      reference: sub.stripe_subscription_id,
      emailSent,
    }, {}, req);
  } catch (e) {
    console.error("[cancel-subscription]", e);
    return jsonResponse({ error: "cancel_failed", message: "La résiliation n'a pas pu être enregistrée. Réessaie, ou écris-nous." }, { status: 500 }, req);
  }
});

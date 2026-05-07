// Supprime définitivement le compte de l'utilisateur authentifié.
// Conforme RGPD article 17 (droit à l'effacement).
//
// Flux :
//  1. Authenticate the JWT (l'utilisateur ne peut supprimer QUE son propre compte).
//  2. Avec la service_role key, appelle auth.admin.deleteUser(userId).
//  3. Le ON DELETE CASCADE sur auth.users efface automatiquement profiles, courses,
//     fiches, quizzes, attempts, planning, oral_sessions, subscriptions, etc.
//
// Note : on ne fait PAS d'archivage avant suppression. Si on veut un délai de grâce,
// il faudra introduire une table pending_deletions + un cron Supabase.
import { authenticate, corsHeaders, jsonResponse } from "../_shared/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST" && req.method !== "DELETE") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const auth = await authenticate(req);
    if (!auth.ok) return auth.response;

    // Confirmation explicite : le client doit envoyer un body { confirm: "DELETE" }
    // pour éviter qu'un appel accidentel ne supprime un compte.
    const body = await req.json().catch(() => ({}));
    if (body?.confirm !== "DELETE") {
      return jsonResponse(
        { error: "missing_confirmation", message: "Le champ confirm doit valoir 'DELETE'" },
        { status: 400 },
      );
    }

    // Client admin (service_role) — seul moyen d'appeler auth.admin.deleteUser
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await adminClient.auth.admin.deleteUser(auth.userId);
    if (error) {
      console.error("[delete-account] auth.admin.deleteUser failed:", error);
      return jsonResponse(
        { error: "deletion_failed", message: error.message },
        { status: 500 },
      );
    }

    console.log(`[delete-account] user ${auth.userId} deleted at ${new Date().toISOString()}`);
    return jsonResponse({ success: true });
  } catch (e) {
    console.error("[delete-account] unexpected error:", e);
    return jsonResponse({ error: "unexpected_error" }, { status: 500 });
  }
});

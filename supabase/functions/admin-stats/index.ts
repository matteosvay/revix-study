// Aggregate stats for admin dashboard. Requires the caller to have role 'admin'.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { authenticate, corsHeaders, jsonResponse } from "../_shared/mod.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  const auth = await authenticate(req);
  if (!auth.ok) return auth.response;

  // AdminGuard: verify the caller is an admin via has_role()
  const { data: isAdmin, error: roleErr } = await auth.supabase.rpc("has_role", {
    _user_id: auth.userId,
    _role: "admin",
  });
  if (roleErr) {
    console.error("[admin-stats] has_role failed:", roleErr);
    return jsonResponse({ error: "Role check failed" }, { status: 500 });
  }
  if (!isAdmin) {
    return jsonResponse({ error: "Forbidden — admin only" }, { status: 403 });
  }

  // Use service-role client for global aggregates (bypass RLS for counts).
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [profilesAll, profilesPro, profilesUltra, usageWeek] = await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("profiles").select("id", { count: "exact", head: true }).eq("plan", "pro"),
      admin.from("profiles").select("id", { count: "exact", head: true }).eq("plan", "ultra"),
      admin
        .from("usage_counters")
        .select("action_type, count")
        .eq("period_type", "daily")
        .gte("updated_at", sevenDaysAgo),
    ]);

    // Aggregate usage by action_type over the last 7 days
    const byAction: Record<string, number> = {};
    for (const row of usageWeek.data ?? []) {
      const a = (row as any).action_type as string;
      byAction[a] = (byAction[a] ?? 0) + ((row as any).count ?? 0);
    }

    return jsonResponse({
      users: {
        total: profilesAll.count ?? 0,
        pro: profilesPro.count ?? 0,
        ultra: profilesUltra.count ?? 0,
        free: (profilesAll.count ?? 0) - (profilesPro.count ?? 0) - (profilesUltra.count ?? 0),
      },
      usage_last_7d: byAction,
      generated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[admin-stats] error:", e);
    return jsonResponse({ error: "Stats query failed" }, { status: 500 });
  }
});
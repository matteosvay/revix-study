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
    const today = new Date();
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    const minDay = days[0];

    const [profilesAll, profilesPro, profilesUltra, dailyStats, topUsers] = await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("profiles").select("id", { count: "exact", head: true }).eq("plan", "pro"),
      admin.from("profiles").select("id", { count: "exact", head: true }).eq("plan", "ultra"),
      admin.from("admin_daily_stats").select("*").gte("day", minDay),
      admin.from("admin_user_stats").select("*").limit(20),
    ]);

    // Pivot daily stats into { day, fiche, quiz_ia, ..., total, cost }
    type Row = { day: string; action_type: string; total_calls: number; estimated_cost_eur: number };
    const byDay: Record<string, Record<string, number>> = {};
    for (const d of days) byDay[d] = { fiche: 0, quiz_ia: 0, coach: 0, correction: 0, planning: 0, total: 0, cost: 0 };
    for (const row of (dailyStats.data ?? []) as Row[]) {
      const slot = byDay[row.day];
      if (!slot) continue;
      slot[row.action_type] = (slot[row.action_type] ?? 0) + Number(row.total_calls ?? 0);
      slot.total += Number(row.total_calls ?? 0);
      slot.cost = +((slot.cost ?? 0) + Number(row.estimated_cost_eur ?? 0)).toFixed(4);
    }
    const timeline = days.map((day) => ({ day, ...byDay[day] }));

    // Aggregated last-7d totals
    const usage_last_7d: Record<string, number> = {};
    let total_cost_7d = 0;
    for (const slot of Object.values(byDay)) {
      for (const k of ["fiche", "quiz_ia", "coach", "correction", "planning"]) {
        usage_last_7d[k] = (usage_last_7d[k] ?? 0) + (slot[k] ?? 0);
      }
      total_cost_7d += slot.cost ?? 0;
    }

    return jsonResponse({
      users: {
        total: profilesAll.count ?? 0,
        pro: profilesPro.count ?? 0,
        ultra: profilesUltra.count ?? 0,
        free: (profilesAll.count ?? 0) - (profilesPro.count ?? 0) - (profilesUltra.count ?? 0),
      },
      usage_last_7d,
      total_cost_7d_eur: +total_cost_7d.toFixed(4),
      timeline,
      top_users: topUsers.data ?? [],
      generated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[admin-stats] error:", e);
    return jsonResponse({ error: "Stats query failed" }, { status: 500 });
  }
});
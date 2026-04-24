import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "no_auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "ai_not_configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "not_authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const { room_id, course_id, selection, question } = body ?? {};
    if (!room_id || typeof selection !== "string" || selection.trim().length < 2) {
      return new Response(JSON.stringify({ error: "bad_request" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Vérifie l'appartenance à la salle
    const { data: membership } = await supabase
      .from("room_members")
      .select("id")
      .eq("room_id", room_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership) {
      return new Response(JSON.stringify({ error: "not_in_room" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Charge le contexte du cours (résumé)
    let context = "";
    let courseTitle = "";
    if (course_id) {
      const { data: course } = await supabase
        .from("courses")
        .select("title, summary, source_content")
        .eq("id", course_id)
        .maybeSingle();
      if (course) {
        courseTitle = course.title ?? "";
        const summary = typeof course.summary === "string" ? course.summary : JSON.stringify(course.summary ?? "");
        context = (summary || course.source_content || "").slice(0, 3000);
      }
    }

    const userQ = (typeof question === "string" && question.trim().length > 0)
      ? question.trim().slice(0, 300)
      : `Explique clairement ce point pour qu'on le comprenne tous.`;

    const sys = `Tu es Coach Revix, un coach pédagogique pour étudiants français. On est dans une salle d'étude collaborative. Un membre te pose une question sur un point précis d'une fiche partagée. Réponds en français, de façon claire, structurée et concise (max 8 lignes), avec un exemple si utile. Utilise du markdown léger (gras, listes courtes). Adresse-toi au groupe ("on", "vous").`;

    const userMsg = `Fiche : ${courseTitle || "(sans titre)"}\n\nContexte de la fiche :\n"""${context || "(non fourni)"}"""\n\nPoint sélectionné par l'étudiant :\n"""${selection.slice(0, 800)}"""\n\nQuestion : ${userQ}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, { role: "user", content: userMsg }],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "credits_exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "ai_error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiJson = await aiResp.json();
    const explanation: string = aiJson?.choices?.[0]?.message?.content ?? "Pas de réponse.";

    // Poste dans le chat de la salle comme message système (visible par tous)
    const truncated = explanation.length > 1500 ? explanation.slice(0, 1500) + "…" : explanation;
    const formatted = `🤖 **Coach IA** — sur "${selection.slice(0, 60)}${selection.length > 60 ? "…" : ""}"\n\n${truncated}`;

    const { error: insertErr } = await supabase.from("room_messages").insert({
      room_id,
      user_id: user.id,
      content: formatted,
      is_system: true,
    });
    if (insertErr) {
      console.error("Insert error", insertErr);
      return new Response(JSON.stringify({ error: "insert_failed", details: insertErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, explanation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
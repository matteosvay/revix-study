import {
  authenticate,
  callClaude,
  claudeErrorResponse,
  corsHeaders,
  enforceLimit,
  jsonResponse,
} from "../_shared/mod.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });

  try {
    const auth = await authenticate(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    const { room_id, course_id, selection, question } = body ?? {};
    if (!room_id || typeof selection !== "string" || selection.trim().length < 2) {
      return jsonResponse({ error: "bad_request" }, { status: 400 });
    }

    const { data: membership } = await auth.supabase
      .from("room_members")
      .select("id")
      .eq("room_id", room_id)
      .eq("user_id", auth.userId)
      .maybeSingle();
    if (!membership) {
      return jsonResponse({ error: "not_in_room" }, { status: 403 });
    }

    // Counts as a coach interaction.
    const limit = await enforceLimit(auth.supabase, auth.userId, "coach");
    if (!limit.allowed) return limit.response;

    let context = "";
    let courseTitle = "";
    if (course_id) {
      const { data: course } = await auth.supabase
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

    let explanation = "Pas de réponse.";
    try {
      const result = await callClaude({
        system: sys,
        messages: [{ role: "user", content: userMsg }],
        maxTokens: 500,
        temperature: 0.5,
      });
      explanation = result.text || explanation;
    } catch (e) {
      return claudeErrorResponse(e);
    }

    const truncated = explanation.length > 1500 ? explanation.slice(0, 1500) + "…" : explanation;
    const formatted = `🤖 **Coach IA** — sur "${selection.slice(0, 60)}${selection.length > 60 ? "…" : ""}"\n\n${truncated}`;

    const { error: insertErr } = await auth.supabase.from("room_messages").insert({
      room_id,
      user_id: auth.userId,
      content: formatted,
      is_system: true,
    });
    if (insertErr) {
      console.error("Insert error", insertErr);
      return jsonResponse({ error: "insert_failed", details: insertErr.message }, { status: 500 });
    }

    return jsonResponse({ success: true, explanation });
  } catch (e) {
    console.error("[room-explain]", e);
    return claudeErrorResponse(e);
  }
});
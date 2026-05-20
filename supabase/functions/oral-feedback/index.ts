import { authenticate, corsHeaders, enforceLimit, jsonResponse } from "../_shared/mod.ts";

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  try {
    const auth = await authenticate(req);
    if (!auth.ok) return auth.response;

    const limit = await enforceLimit(auth.supabase, auth.userId, "oral");
    if (!limit.allowed) return limit.response;

    const { topic, transcript, courseContent } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
    if (!transcript || transcript.trim().length < 10) {
      return jsonResponse({ error: "Réponse trop courte." }, { status: 400 });
    }

    const system = `Tu es un examinateur bienveillant pour le grand oral français.
Tu évalues la prestation orale d'un étudiant sur un sujet donné.
Tu donnes : note /20, points forts, axes d'amélioration, et une question de suivi pour pousser la réflexion.
Tu utilises "tu" et restes encourageant mais exigeant.`;

    const userPrompt = `Sujet : ${topic}
${courseContent ? `Cours de référence : """${courseContent.slice(0, 4000)}"""` : ""}

Transcription de la réponse orale :
"""
${transcript.slice(0, 6000)}
"""`;

    const resp = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "system", content: system }, { role: "user", content: userPrompt }],
        tools: [{
          type: "function",
          function: {
            name: "save_feedback",
            description: "Enregistre le feedback oral",
            parameters: {
              type: "object",
              properties: {
                score: { type: "integer", minimum: 0, maximum: 20 },
                strengths: { type: "array", items: { type: "string" } },
                improvements: { type: "array", items: { type: "string" } },
                follow_up: { type: "string" },
                summary: { type: "string" },
              },
              required: ["score", "strengths", "improvements", "follow_up", "summary"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_feedback" } },
      }),
    });

    if (resp.status === 429) return jsonResponse({ error: "Trop de requêtes." }, { status: 429 });
    if (resp.status === 402) return jsonResponse({ error: "Crédits IA épuisés." }, { status: 402 });
    if (!resp.ok) {
      console.error("AI error", resp.status, await resp.text());
      return jsonResponse({ error: "Erreur IA" }, { status: 500 });
    }
    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    return jsonResponse(parsed);
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: "Erreur interne" }, { status: 500 });
  }
});
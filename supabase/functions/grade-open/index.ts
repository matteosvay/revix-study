import {
  authenticate,
  callClaude,
  claudeErrorResponse,
  corsHeaders,
  enforceLimit,
  jsonResponse,
  type ClaudeTool,
} from "../_shared/mod.ts";

const GRADE_TOOL: ClaudeTool = {
  name: "grade",
  description: "Donne la note et le feedback",
  input_schema: {
    type: "object",
    properties: {
      correct: { type: "boolean" },
      feedback: { type: "string" },
    },
    required: ["correct", "feedback"],
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = await authenticate(req);
    if (!auth.ok) return auth.response;

    const { question, userAnswer, expectedAnswer, acceptedAnswers } = await req.json();
    if (!question || !userAnswer) {
      return jsonResponse({ error: "Question / réponse manquante" }, { status: 400 });
    }

    const limit = await enforceLimit(auth.supabase, auth.userId, "correction");
    if (!limit.allowed) return limit.response;

    const system = `Tu es un correcteur français bienveillant et exigeant. Tu évalues une réponse d'étudiant à une question ouverte.
Tu décides si la réponse est correcte (booléen "correct" : true si globalement juste, false sinon).
Tu donnes un retour court (1-2 phrases) en français. Utilise "tu". Pas d'emoji.`;

    const userPrompt = `Question : ${question}
Réponse modèle attendue : ${expectedAnswer ?? "(non fournie)"}
Reformulations valides : ${(acceptedAnswers ?? []).join(" / ") || "(aucune)"}

Réponse de l'étudiant : """${userAnswer}"""

Évalue.`;

    try {
      const result = await callClaude({
        system,
        messages: [{ role: "user", content: userPrompt }],
        maxTokens: 200,
        temperature: 0.3,
        tools: [GRADE_TOOL],
        toolChoice: { type: "tool", name: "grade" },
      });
      const parsed = (result.toolInput as { correct?: boolean; feedback?: string }) ?? {};
      return jsonResponse({ correct: !!parsed.correct, feedback: parsed.feedback ?? "" });
    } catch (e) {
      return claudeErrorResponse(e);
    }
  } catch (e) {
    console.error("[grade-open]", e);
    return claudeErrorResponse(e);
  }
});
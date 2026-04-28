import {
  authenticate,
  callClaude,
  claudeErrorResponse,
  corsHeaders,
  enforceLimit,
  jsonResponse,
  type ClaudeTool,
} from "../_shared/mod.ts";

const PLANNING_TOOL: ClaudeTool = {
  name: "save_planning",
  description: "Enregistre le planning",
  input_schema: {
    type: "object",
    properties: {
      tasks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            task_date: { type: "string", description: "YYYY-MM-DD" },
            start_time: { type: "string", description: "HH:MM" },
            end_time: { type: "string", description: "HH:MM" },
            subject: { type: "string" },
            title: { type: "string" },
          },
          required: ["task_date", "start_time", "end_time", "subject", "title"],
        },
      },
    },
    required: ["tasks"],
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = await authenticate(req);
    if (!auth.ok) return auth.response;

    const { hoursPerDay, examDate, subjects, startDate } = await req.json();

    const limit = await enforceLimit(auth.supabase, auth.userId, "planning");
    if (!limit.allowed) return limit.response;

    const system = `Tu es un coach de révisions français. Tu construis un planning hebdomadaire réaliste, équilibré et motivant.
Réponds en français, utilise "tu". Crée des blocs de 1 à 2h, avec 3 à 6 blocs / jour selon les heures dispo.
Inclus des pauses raisonnables. Distribue les matières prioritaires plus souvent.`;

    const userPrompt = `Heures dispo / jour : ${hoursPerDay ?? 3}
Date d'examen : ${examDate ?? "non précisée"}
Date de début : ${startDate ?? new Date().toISOString().slice(0, 10)}
Matières prioritaires : ${(subjects ?? []).join(", ") || "non précisées"}

Crée un planning sur 7 jours à partir de la date de début.`;

    try {
      const result = await callClaude({
        system,
        messages: [{ role: "user", content: userPrompt }],
        maxTokens: 600,
        temperature: 0.4,
        tools: [PLANNING_TOOL],
        toolChoice: { type: "tool", name: "save_planning" },
      });
      const tasks = (result.toolInput as { tasks?: unknown[] })?.tasks ?? [];
      return jsonResponse({ tasks });
    } catch (e) {
      return claudeErrorResponse(e);
    }
  } catch (e) {
    console.error("[generate-planning]", e);
    return claudeErrorResponse(e);
  }
});
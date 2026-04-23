const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { hoursPerDay, examDate, subjects, startDate } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const system = `Tu es un coach de révisions français. Tu construis un planning hebdomadaire réaliste, équilibré et motivant.
Réponds en français, utilise "tu". Crée des blocs de 1 à 2h, avec 3 à 6 blocs / jour selon les heures dispo.
Inclus des pauses raisonnables. Distribue les matières prioritaires plus souvent.`;

    const userPrompt = `Heures dispo / jour : ${hoursPerDay ?? 3}
Date d'examen : ${examDate ?? "non précisée"}
Date de début : ${startDate ?? new Date().toISOString().slice(0, 10)}
Matières prioritaires : ${(subjects ?? []).join(", ") || "non précisées"}

Crée un planning sur 7 jours à partir de la date de début.`;

    const resp = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, { role: "user", content: userPrompt }],
        tools: [{
          type: "function",
          function: {
            name: "save_planning",
            description: "Enregistre le planning",
            parameters: {
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
          },
        }],
        tool_choice: { type: "function", function: { name: "save_planning" } },
      }),
    });

    if (resp.status === 429) return new Response(JSON.stringify({ error: "Trop de requêtes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402) return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!resp.ok) { console.error("AI error", resp.status, await resp.text()); return new Response(JSON.stringify({ error: "Erreur IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    return new Response(JSON.stringify({ tasks: parsed?.tasks ?? [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
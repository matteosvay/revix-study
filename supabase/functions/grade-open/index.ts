const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { question, userAnswer, expectedAnswer, acceptedAnswers } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
    if (!question || !userAnswer) {
      return new Response(JSON.stringify({ error: "Question / réponse manquante" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const system = `Tu es un correcteur français bienveillant et exigeant. Tu évalues une réponse d'étudiant à une question ouverte.
Tu décides si la réponse est correcte, partiellement correcte, ou incorrecte (booléen "correct" : true si globalement juste, false sinon).
Tu donnes un retour court (1-2 phrases) en français, qui dit ce qui est bon, ce qui manque ou ce qui est faux. Utilise "tu". Pas d'emoji.`;

    const userPrompt = `Question : ${question}
Réponse modèle attendue : ${expectedAnswer ?? "(non fournie)"}
Reformulations valides : ${(acceptedAnswers ?? []).join(" / ") || "(aucune)"}

Réponse de l'étudiant : """${userAnswer}"""

Évalue.`;

    const resp = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, { role: "user", content: userPrompt }],
        tools: [{
          type: "function",
          function: {
            name: "grade",
            description: "Donne la note et le feedback",
            parameters: {
              type: "object",
              properties: {
                correct: { type: "boolean" },
                feedback: { type: "string" },
              },
              required: ["correct", "feedback"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "grade" } },
      }),
    });

    if (resp.status === 429) return new Response(JSON.stringify({ error: "Trop de requêtes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402) return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!resp.ok) {
      console.error("Grade error:", resp.status, await resp.text());
      return new Response(JSON.stringify({ error: "Erreur IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    return new Response(JSON.stringify({ correct: !!parsed?.correct, feedback: parsed?.feedback ?? "" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
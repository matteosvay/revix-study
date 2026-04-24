import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function requireAuth(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data, error } = await sb.auth.getUser(authHeader.replace("Bearer ", ""));
  if (error || !data?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const unauthorized = await requireAuth(req);
    if (unauthorized) return unauthorized;
    const { content, subject, level, title, count = 10, quizType = "qcm" } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
    if (!content || content.trim().length < 20) {
      return new Response(JSON.stringify({ error: "Contenu trop court" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const safeCount = Math.max(3, Math.min(30, Number(count) || 10));
    const allowedTypes = ["qcm", "vrai_faux", "ouvert", "trous"];
    const type = allowedTypes.includes(quizType) ? quizType : "qcm";

    const typeInstructions: Record<string, string> = {
      qcm: `Génère des QCM. Chaque question a EXACTEMENT 4 réponses (A/B/C/D), UNE SEULE correcte.
Renseigne "type":"qcm", "answers" (4 strings), "correct_index" (0-3), "explanation" (1-2 phrases).`,
      vrai_faux: `Génère des affirmations à juger Vrai ou Faux.
Renseigne "type":"vrai_faux", "answers":["Vrai","Faux"], "correct_index" (0 si l'affirmation est vraie, 1 si fausse), "explanation" (justifie).`,
      ouvert: `Génère des questions OUVERTES qui demandent une réponse rédigée courte (1 à 3 phrases).
Renseigne "type":"ouvert", "accepted_answers" (3 à 5 reformulations valides de la bonne réponse, mots-clés essentiels inclus), "explanation" (la réponse modèle complète).
Ne renseigne PAS answers ni correct_index.`,
      trous: `Génère des phrases à TROUS. La question contient un ou plusieurs "____" à compléter.
Renseigne "type":"trous", "accepted_answers" (toutes les variantes valides du mot/expression à insérer, en minuscule), "explanation" (la phrase complète corrigée).
Ne renseigne PAS answers ni correct_index.`,
    };

    const system = `Tu es un examinateur français pour étudiants ${level ?? ""}.
Tu crées des questions rigoureuses en français, basées sur le cours fourni.
Niveau de difficulté progressif (facile -> difficile). Pas de question piège ridicule. Utilise "tu".

Format demandé : ${typeInstructions[type]}`;

    const userPrompt = `Matière : ${subject ?? "non précisée"}
Titre : ${title ?? "Cours"}
Génère EXACTEMENT ${safeCount} questions à partir de ce cours :
"""
${content.slice(0, 12000)}
"""`;

    const resp = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, { role: "user", content: userPrompt }],
        tools: [{
          type: "function",
          function: {
            name: "save_quiz",
            description: "Enregistre le quizz",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      type: { type: "string", enum: ["qcm", "vrai_faux", "ouvert", "trous"] },
                      answers: { type: "array", items: { type: "string" } },
                      correct_index: { type: "integer", minimum: 0 },
                      accepted_answers: { type: "array", items: { type: "string" } },
                      explanation: { type: "string" },
                    },
                    required: ["question", "type", "explanation"],
                  },
                },
              },
              required: ["questions"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_quiz" } },
      }),
    });

    if (resp.status === 429) return new Response(JSON.stringify({ error: "Trop de requêtes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402) return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!resp.ok) {
      console.error("AI error:", resp.status, await resp.text());
      return new Response(JSON.stringify({ error: "Erreur IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    return new Response(JSON.stringify({ questions: parsed?.questions ?? [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
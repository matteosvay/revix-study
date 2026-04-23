const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { content, subject, level, title } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
    if (!content || content.trim().length < 20) {
      return new Response(JSON.stringify({ error: "Contenu trop court" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const system = `Tu es un assistant pédagogique français pour étudiants ${level ?? ""}.
À partir d'un cours, tu produis DEUX choses :

1) Un RÉSUMÉ DE COURS structuré, vivant et clair, en français — pas un simple texte plat.
   Le résumé est une liste de SECTIONS. Chaque section contient un titre court et des "blocs" parmi :
     - {"kind":"paragraph","text":"..."} : phrase ou paragraphe explicatif (peut contenir des marqueurs **mot** pour mettre en gras les mots clés).
     - {"kind":"definition","term":"...","text":"..."} : définition d'un concept clé.
     - {"kind":"key_point","text":"..."} : idée à retenir absolument (sera surlignée en couleur).
     - {"kind":"example","text":"..."} : exemple concret, illustration, mini cas pratique.
     - {"kind":"tip","text":"..."} : astuce / mémo / piège à éviter.
     - {"kind":"list","items":["...","..."]} : liste à puces.
   Vise 3 à 6 sections, chacune avec 3 à 7 blocs. Mélange les types pour rendre le cours vivant.
   Reformule, organise et hiérarchise — ne recopie pas brutalement le texte source.

2) 6 à 10 FLASHCARDS de révision (front = question/concept court, back = réponse 1-3 phrases).

Tu utilises "tu" et un ton motivant. Pas d'emoji.`;

    const userPrompt = `Matière : ${subject ?? "non précisée"}
Titre : ${title ?? "Cours"}

Cours :
"""
${content.slice(0, 12000)}
"""

Génère les fiches.`;

    const resp = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, { role: "user", content: userPrompt }],
        tools: [{
          type: "function",
          function: {
            name: "save_course",
            description: "Enregistre le résumé structuré et les flashcards générés",
            parameters: {
              type: "object",
              properties: {
                summary: {
                  type: "object",
                  properties: {
                    intro: { type: "string", description: "1 à 2 phrases d'introduction motivante" },
                    sections: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          blocks: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                kind: { type: "string", enum: ["paragraph", "definition", "key_point", "example", "tip", "list"] },
                                text: { type: "string" },
                                term: { type: "string" },
                                items: { type: "array", items: { type: "string" } },
                              },
                              required: ["kind"],
                            },
                          },
                        },
                        required: ["title", "blocks"],
                      },
                    },
                  },
                  required: ["sections"],
                },
                flashcards: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { front: { type: "string" }, back: { type: "string" } },
                    required: ["front", "back"],
                  },
                },
              },
              required: ["summary", "flashcards"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_course" } },
      }),
    });

    if (resp.status === 429) return new Response(JSON.stringify({ error: "Trop de requêtes, réessaie dans un instant." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402) return new Response(JSON.stringify({ error: "Crédits IA épuisés. Recharge ton workspace Lovable." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI error:", resp.status, t);
      return new Response(JSON.stringify({ error: "Erreur IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    return new Response(JSON.stringify({
      summary: parsed?.summary ?? null,
      flashcards: parsed?.flashcards ?? [],
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
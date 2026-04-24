const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Découpe le cours en morceaux d'environ ~14k caractères, en respectant les
// frontières naturelles (paragraphes) pour ne couper aucune notion en deux.
function chunkContent(raw: string, maxChars = 14000): string[] {
  const text = raw.trim();
  if (text.length <= maxChars) return [text];

  // Sépare d'abord par double saut de ligne (paragraphes / sections)
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = "";

  for (const p of paragraphs) {
    // Paragraphe géant → on le coupe sur les phrases
    if (p.length > maxChars) {
      if (current) { chunks.push(current); current = ""; }
      const sentences = p.split(/(?<=[.!?])\s+/);
      for (const s of sentences) {
        if ((current + " " + s).length > maxChars && current) {
          chunks.push(current);
          current = s;
        } else {
          current = current ? current + " " + s : s;
        }
      }
      continue;
    }
    if ((current + "\n\n" + p).length > maxChars && current) {
      chunks.push(current);
      current = p;
    } else {
      current = current ? current + "\n\n" + p : p;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

const SUMMARY_TOOL = {
  type: "function" as const,
  function: {
    name: "save_course",
    description: "Enregistre la fiche de cours structurée et exhaustive",
    parameters: {
      type: "object",
      properties: {
        summary: {
          type: "object",
          properties: {
            intro: { type: "string", description: "1 à 2 phrases d'introduction" },
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
      },
      required: ["summary"],
    },
  },
};

async function callAI(apiKey: string, system: string, userPrompt: string) {
  const resp = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: system }, { role: "user", content: userPrompt }],
      tools: [SUMMARY_TOOL],
      tool_choice: { type: "function", function: { name: "save_course" } },
    }),
  });
  return resp;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { content, subject, level, title } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
    if (!content || content.trim().length < 20) {
      return new Response(JSON.stringify({ error: "Contenu trop court" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const system = `Tu es un PROFESSEUR PARTICULIER d'élite, en français, pour étudiants ${level ?? ""}.
Ta mission : produire UNE FICHE DE COURS EXHAUSTIVE, COMPLÈTE et RÉELLEMENT PROFONDE à partir du cours fourni.

RÈGLES CRITIQUES — lis-les bien :
1. NE LAISSE RIEN PASSER. Couvre **chaque concept, chaque définition, chaque formule, chaque mécanisme, chaque exemple, chaque cas particulier** présent dans le cours source. Si le cours contient 12 notions, ta fiche en couvre 12 — pas 5 "grandes idées".
2. EXPLIQUE en profondeur, comme un prof qui veut que l'élève comprenne vraiment, pas juste qu'il récite. Détaille le "pourquoi" et le "comment", pas seulement le "quoi".
3. REFORMULE avec tes mots, structure, hiérarchise — mais ne sacrifie AUCUNE information du cours pour faire court. Une fiche longue et complète vaut mieux qu'une fiche courte et superficielle.
4. Pour les sciences (maths, physique, chimie, bio…) : garde toutes les formules, conditions d'application, démonstrations clés et notations.
5. Pour les matières littéraires/SHS : garde les auteurs, dates, références, citations, écoles de pensée, nuances.

FORMAT — la fiche est une liste de SECTIONS. Chaque section a un titre court + des "blocs" choisis parmi :
  - {"kind":"paragraph","text":"..."} : explication détaillée (utilise **mot** pour mettre en gras les termes clés).
  - {"kind":"definition","term":"...","text":"..."} : définition rigoureuse d'un concept.
  - {"kind":"key_point","text":"..."} : idée absolument à retenir (mise en valeur).
  - {"kind":"example","text":"..."} : exemple concret, cas d'application, démonstration.
  - {"kind":"tip","text":"..."} : astuce mémo, piège classique, point de vigilance.
  - {"kind":"list","items":["...","..."]} : énumération (étapes, propriétés, caractéristiques…).

VOLUME ATTENDU : autant de sections que nécessaire pour couvrir TOUT le cours (typiquement 5 à 12 sections selon la densité), chaque section avec 4 à 10 blocs riches. Une "intro" de 2-3 phrases situe le sujet et son enjeu.

Tu utilises "tu" et un ton clair, motivant, jamais condescendant. Pas d'emoji dans le texte.`;

    // Découpe le cours pour qu'AUCUN morceau ne soit ignoré
    const chunks = chunkContent(content);
    console.log(`[generate-fiches] ${content.length} chars → ${chunks.length} chunk(s)`);

    // Traite tous les chunks EN PARALLÈLE pour rester sous le timeout (150s)
    const results = await Promise.all(chunks.map(async (chunk, i) => {
      const isMulti = chunks.length > 1;
      const partInfo = isMulti
        ? `\n\nIMPORTANT : ce cours est volumineux et a été découpé en ${chunks.length} parties. Tu traites ici la PARTIE ${i + 1}/${chunks.length}. Couvre EXHAUSTIVEMENT cette partie (toutes les notions qu'elle contient), sans résumer en survol. ${i === 0 ? "Commence par une courte intro situant le sujet global." : "N'écris PAS d'intro (déjà faite dans la partie 1), commence directement par les sections."}`
        : "";

      const userPrompt = `Matière : ${subject ?? "non précisée"}
Titre : ${title ?? "Cours"}${partInfo}

Cours${isMulti ? ` (partie ${i + 1}/${chunks.length})` : ""} :
"""
${chunk}
"""

Produis la fiche de cours complète et exhaustive pour ${isMulti ? "cette partie" : "ce cours"}.`;

      const resp = await callAI(apiKey, system, userPrompt);
      return { i, resp };
    }));

    const allSections: any[] = [];
    let intro: string | undefined;

    for (const { i, resp } of results) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Trop de requêtes, réessaie dans un instant." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "Crédits IA épuisés. Recharge ton workspace Lovable." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (!resp.ok) {
        const t = await resp.text();
        console.error(`[generate-fiches] AI error chunk ${i + 1}:`, resp.status, t);
        return new Response(JSON.stringify({ error: "Erreur IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await resp.json();
      const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      const parsed = typeof args === "string" ? JSON.parse(args) : args;
      const partSummary = parsed?.summary;
      if (!partSummary?.sections?.length) {
        console.error(`[generate-fiches] no sections returned for chunk ${i + 1}`);
        continue;
      }
      if (i === 0 && partSummary.intro) intro = partSummary.intro;
      for (const s of partSummary.sections) allSections.push(s);
    }

    if (!allSections.length) {
      return new Response(JSON.stringify({ error: "L'IA n'a pas pu générer la fiche." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      summary: { intro, sections: allSections },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
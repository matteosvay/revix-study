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

// Découpe le cours en morceaux d'environ ~14k caractères, en respectant les
// frontières naturelles (paragraphes) pour ne couper aucune notion en deux.
function chunkContent(raw: string, maxChars = 9000): string[] {
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
      model: "google/gemini-2.5-pro",
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
    const unauthorized = await requireAuth(req);
    if (unauthorized) return unauthorized;
    const { content, subject, level, title } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
    if (!content || content.trim().length < 20) {
      return new Response(JSON.stringify({ error: "Contenu trop court" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const system = `Tu es un PROFESSEUR PARTICULIER d'élite, en français, pour étudiants ${level ?? ""}.
Ta mission : produire UNE FICHE DE COURS EXHAUSTIVE, COMPLÈTE et RÉELLEMENT PROFONDE à partir du cours fourni.

🚨 RÈGLE ABSOLUE SUR LES CHAPITRES — la plus importante :
Tu DOIS respecter À LA LETTRE la structure de chapitres du cours source.
- Détecte les chapitres / parties / sections existants dans le texte (titres, "Chapitre X", "Partie X", "I.", "1.", "A.", numérotations, titres en gras…).
- Crée UNE section dans la fiche pour CHAQUE chapitre du cours, dans le MÊME ORDRE, avec EXACTEMENT le même titre (recopie-le tel quel).
- ⛔ N'INVENTE PAS de nouveaux chapitres. Ne fusionne pas deux chapitres en un. Ne SCINDE PAS un chapitre en plusieurs. Ne transforme pas une sous-partie en chapitre principal.
- Les sous-parties d'un chapitre restent À L'INTÉRIEUR de la section de ce chapitre (utilise des blocs paragraph/key_point/list pour les structurer, pas de nouvelle section).
- Si le cours n'a aucune structure de chapitres détectable, alors (et seulement alors) tu peux créer toi-même un découpage logique.

AUTRES RÈGLES CRITIQUES :
1. NE LAISSE RIEN PASSER. Couvre **chaque concept, chaque définition, chaque formule, chaque mécanisme, chaque exemple, chaque cas particulier** présent dans le cours source.
2. EXPLIQUE en profondeur, comme un prof qui veut que l'élève comprenne vraiment, pas juste qu'il récite. Détaille le "pourquoi" et le "comment".
3. REFORMULE avec tes mots, structure, hiérarchise — mais ne sacrifie AUCUNE information du cours pour faire court.
4. Pour les sciences : garde toutes les formules, conditions d'application, démonstrations clés et notations.
5. Pour les matières littéraires/SHS : garde les auteurs, dates, références, citations, écoles de pensée, nuances.

FORMAT — la fiche est une liste de SECTIONS (= chapitres du cours). Chaque section a un titre (= titre exact du chapitre source) + des "blocs" choisis parmi :
  - {"kind":"paragraph","text":"..."} : explication détaillée (utilise **mot** pour mettre en gras les termes clés).
  - {"kind":"definition","term":"...","text":"..."} : définition rigoureuse d'un concept.
  - {"kind":"key_point","text":"..."} : idée absolument à retenir.
  - {"kind":"example","text":"..."} : exemple concret, cas d'application, démonstration.
  - {"kind":"tip","text":"..."} : astuce mémo, piège classique, point de vigilance.
  - {"kind":"list","items":["...","..."]} : énumération (étapes, propriétés, sous-parties d'un chapitre…).

VOLUME : chaque section (chapitre) doit contenir 4 à 12 blocs riches selon la densité du chapitre. Une "intro" de 2-3 phrases situe le sujet global et son enjeu.

Tu utilises "tu" et un ton clair, motivant, jamais condescendant. Pas d'emoji dans le texte.`;

    // Découpe le cours pour qu'AUCUN morceau ne soit ignoré.
    // Les chunks ne sont qu'une contrainte technique : on l'explique au modèle pour qu'il
    // continue de respecter la structure de chapitres SOURCE (pas de sous-parties promues).
    const chunks = chunkContent(content);
    console.log(`[generate-fiches] ${content.length} chars → ${chunks.length} chunk(s)`);

    const results = await Promise.all(chunks.map(async (chunk, i) => {
      const isMulti = chunks.length > 1;
      const partInfo = isMulti
        ? `\n\n⚙️ CONTEXTE TECHNIQUE : le cours est volumineux et a dû être découpé en ${chunks.length} morceaux pour des raisons techniques. Tu reçois ici le MORCEAU ${i + 1}/${chunks.length}.
- Ce découpage technique N'EST PAS une structure de chapitres. Ne le mentionne JAMAIS.
- Crée UNIQUEMENT des sections correspondant aux VRAIS chapitres présents dans CE morceau (titres explicites du cours).
- Si un chapitre est partagé entre deux morceaux, traite seulement la portion présente ici sous le titre de ce chapitre — la fusion sera faite ensuite.
- ${i === 0 ? "Commence par une courte intro situant le sujet global." : "N'écris PAS d'intro (déjà faite dans le morceau 1), commence directement par les sections."}`
        : "";

      const userPrompt = `Matière : ${subject ?? "non précisée"}
Titre du cours : ${title ?? "Cours"}${partInfo}

Cours :
"""
${chunk}
"""

Produis la fiche en respectant SCRUPULEUSEMENT la structure de chapitres du cours source.`;

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

    // Fusion : si plusieurs chunks ont retourné le même titre de chapitre,
    // on regroupe les blocs sous une seule section (cas où un chapitre est à cheval).
    const merged: Record<string, { title: string; blocks: any[] }> = {};
    const order: string[] = [];
    for (const s of allSections) {
      const key = (s.title ?? "").trim().toLowerCase();
      if (!merged[key]) {
        merged[key] = { title: s.title, blocks: [...(s.blocks ?? [])] };
        order.push(key);
      } else {
        merged[key].blocks.push(...(s.blocks ?? []));
      }
    }
    const finalSections = order.map(k => merged[k]);

    if (!allSections.length) {
      return new Response(JSON.stringify({ error: "L'IA n'a pas pu générer la fiche." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      summary: { intro, sections: finalSections },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
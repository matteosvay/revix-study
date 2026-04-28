import {
  authenticate,
  callClaude,
  claudeErrorResponse,
  corsHeaders,
  enforceLimit,
  jsonResponse,
  type ClaudeTool,
} from "../_shared/mod.ts";

function chunkContent(raw: string, maxChars = 9000): string[] {
  const text = raw.trim();
  if (text.length <= maxChars) return [text];
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = "";
  for (const p of paragraphs) {
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

const SUMMARY_TOOL: ClaudeTool = {
  name: "save_course",
  description: "Enregistre la fiche de cours structurée et exhaustive",
  input_schema: {
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
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await authenticate(req);
    if (!auth.ok) return auth.response;

    const { content, subject, level, title } = await req.json();
    if (!content || content.trim().length < 20) {
      return jsonResponse({ error: "Contenu trop court" }, { status: 400 });
    }

    const limit = await enforceLimit(auth.supabase, auth.userId, "fiche");
    if (!limit.allowed) return limit.response;

    const system = `Tu es un PROFESSEUR PARTICULIER d'élite, en français, pour étudiants ${level ?? ""}.
Ta mission : produire UNE FICHE DE COURS EXHAUSTIVE, COMPLÈTE et RÉELLEMENT PROFONDE à partir du cours fourni.

🚨 RÈGLE ABSOLUE SUR LES CHAPITRES — la plus importante :
Tu DOIS respecter À LA LETTRE la structure de chapitres du cours source.
- Détecte les chapitres / parties / sections existants dans le texte (titres, "Chapitre X", "Partie X", "I.", "1.", "A.", numérotations, titres en gras…).
- Crée UNE section dans la fiche pour CHAQUE chapitre du cours, dans le MÊME ORDRE, avec EXACTEMENT le même titre (recopie-le tel quel).
- ⛔ N'INVENTE PAS de nouveaux chapitres. Ne fusionne pas deux chapitres en un. Ne SCINDE PAS un chapitre en plusieurs.
- Les sous-parties d'un chapitre restent À L'INTÉRIEUR de la section de ce chapitre (utilise des blocs paragraph/key_point/list).
- Si le cours n'a aucune structure de chapitres détectable, alors (et seulement alors) tu peux créer toi-même un découpage logique.

AUTRES RÈGLES CRITIQUES :
1. ⛔ EXHAUSTIVITÉ TOTALE — couvre chaque concept, chaque définition, chaque formule, chaque exemple, chaque chiffre, chaque date, chaque nom propre, chaque acronyme du cours source.
2. Ne résume JAMAIS une énumération en "etc.". Si le cours liste 7 éléments, la fiche en liste 7.
3. EXPLIQUE en profondeur le "pourquoi" et le "comment".
4. REFORMULE avec tes mots, structure, hiérarchise — sans sacrifier d'information.
5. Marketing / gestion / éco / SHS : garde TOUS les auteurs, dates, modèles, typologies, exemples, chiffres.
6. Sciences : garde toutes les formules, conditions d'application, démonstrations clés et notations.

FORMAT — chaque section a un titre + des "blocs" parmi :
  - {"kind":"paragraph","text":"..."} (utilise **mot** pour le gras)
  - {"kind":"definition","term":"...","text":"..."}
  - {"kind":"key_point","text":"..."}
  - {"kind":"example","text":"..."}
  - {"kind":"tip","text":"..."}
  - {"kind":"list","items":["...","..."]}

VOLUME : chaque section doit contenir AU MOINS 6 blocs, jusqu'à 20 si le chapitre est dense.
Tu utilises "tu" et un ton clair, motivant, jamais condescendant. Pas d'emoji dans le texte.`;

    const chunks = chunkContent(content);
    console.log(`[generate-fiches] ${content.length} chars → ${chunks.length} chunk(s)`);

    const results = await Promise.all(chunks.map(async (chunk, i) => {
      const isMulti = chunks.length > 1;
      const partInfo = isMulti
        ? `\n\n⚙️ CONTEXTE TECHNIQUE : le cours est volumineux, découpé en ${chunks.length} morceaux. Tu reçois le MORCEAU ${i + 1}/${chunks.length}.
- Ce découpage technique N'EST PAS une structure de chapitres. Ne le mentionne JAMAIS.
- Crée UNIQUEMENT des sections correspondant aux VRAIS chapitres présents dans CE morceau.
- ${i === 0 ? "Commence par une courte intro situant le sujet global." : "N'écris PAS d'intro, commence directement par les sections."}`
        : "";

      const userPrompt = `Matière : ${subject ?? "non précisée"}
Titre du cours : ${title ?? "Cours"}${partInfo}

Cours :
"""
${chunk}
"""

Produis la fiche en respectant SCRUPULEUSEMENT la structure de chapitres du cours source.`;

      try {
        const result = await callClaude({
          system,
          messages: [{ role: "user", content: userPrompt }],
          maxTokens: 1500,
          temperature: 0.4,
          tools: [SUMMARY_TOOL],
          toolChoice: { type: "tool", name: "save_course" },
        });
        return { i, ok: true as const, input: result.toolInput };
      } catch (e) {
        return { i, ok: false as const, error: e };
      }
    }));

    const allSections: any[] = [];
    let intro: string | undefined;

    for (const r of results) {
      if (!r.ok) return claudeErrorResponse(r.error);
      const partSummary = (r.input as any)?.summary;
      if (!partSummary?.sections?.length) {
        console.error(`[generate-fiches] no sections returned for chunk ${r.i + 1}`);
        continue;
      }
      if (r.i === 0 && partSummary.intro) intro = partSummary.intro;
      for (const s of partSummary.sections) allSections.push(s);
    }

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
      return jsonResponse({ error: "L'IA n'a pas pu générer la fiche." }, { status: 500 });
    }

    return jsonResponse({ summary: { intro, sections: finalSections } });
  } catch (e) {
    console.error("[generate-fiches]", e);
    return claudeErrorResponse(e);
  }
});
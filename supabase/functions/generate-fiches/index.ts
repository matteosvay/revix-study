import {
  authenticate,
  callClaude,
  claudeErrorResponse,
  corsHeaders,
  enforceLimit,
  jsonResponse,
  type ClaudeTool,
} from "../_shared/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Tool de génération groupée pour la banque de questions
const QUIZ_BANK_TOOL: ClaudeTool = {
  name: "save_quiz_bank",
  description: "Enregistre une banque de 15 questions de quizz variées",
  input_schema: {
    type: "object",
    properties: {
      questions: {
        type: "array",
        minItems: 15,
        maxItems: 15,
        items: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["qcm", "vrai_faux", "ouvert"] },
            question: { type: "string" },
            options: { type: "array", items: { type: "string" } },
            answer: { type: "string" },
            difficulty: { type: "integer", minimum: 1, maximum: 3 },
          },
          required: ["type", "question", "answer", "difficulty"],
        },
      },
    },
    required: ["questions"],
  },
};

/** Best-effort : génère 15 questions et insère dans quiz_bank. N'échoue jamais (logge seulement). */
async function generateQuizBank(opts: {
  userId: string;
  courseId: string;
  content: string;
  subject?: string;
  title?: string;
}) {
  try {
    const truncated = opts.content.slice(0, 12000);
    const system = `Tu es un générateur de quizz pour étudiants français. À partir du contenu de cours fourni, génère exactement 15 questions variées :
- 8 QCM (4 options chacun, une seule bonne réponse — la valeur de "answer" doit être EXACTEMENT l'une des options)
- 4 Vrai/Faux (answer = "vrai" ou "faux")
- 3 Questions ouvertes courtes (answer = réponse modèle concise)

Varie les niveaux de difficulté (1=facile, 2=moyen, 3=difficile). Les questions doivent couvrir l'ensemble du contenu.`;

    const userPrompt = `Matière : ${opts.subject ?? "non précisée"}
Titre du cours : ${opts.title ?? "Cours"}

Cours :
"""
${truncated}
"""

Génère exactement 15 questions (8 QCM + 4 Vrai/Faux + 3 Ouvertes).`;

    const result = await callClaude({
      system,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 2500,
      temperature: 0.5,
      tools: [QUIZ_BANK_TOOL],
      toolChoice: { type: "tool", name: "save_quiz_bank" },
    });
    const questions = (result.toolInput as any)?.questions;
    if (!Array.isArray(questions) || questions.length === 0) {
      console.warn("[quiz_bank] no questions returned");
      return;
    }

    // Insertion via service role pour bypasser RLS
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const rows = questions.slice(0, 15).map((q: any) => ({
      course_id: opts.courseId,
      user_id: opts.userId,
      question: String(q.question ?? "").slice(0, 1000),
      answer: String(q.answer ?? "").slice(0, 1000),
      question_type: q.type === "vrai_faux" ? "vrai_faux" : q.type === "ouvert" ? "ouvert" : "qcm",
      options: Array.isArray(q.options) ? q.options.slice(0, 4) : null,
      difficulty: Math.max(1, Math.min(3, Number(q.difficulty) || 1)),
    })).filter((r) => r.question && r.answer);

    if (rows.length === 0) return;
    const { error } = await admin.from("quiz_bank").insert(rows);
    if (error) console.error("[quiz_bank] insert failed", error);
    else console.log(`[quiz_bank] inserted ${rows.length} questions for course ${opts.courseId}`);
  } catch (e) {
    console.error("[quiz_bank] failed", e);
  }
}

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

    const summary = { intro, sections: finalSections };

    // Lecture du courseId optionnel pour pré-générer la banque de quiz (best-effort, non bloquant)
    // Le frontend peut passer course_id si la fiche est déjà créée, ou l'orchestrer ensuite.
    return jsonResponse({ summary });
  } catch (e) {
    console.error("[generate-fiches]", e);
    return claudeErrorResponse(e);
  }
});

// Export pour pouvoir réutiliser depuis ailleurs (ex: appel via Upload après création du course)
export { generateQuizBank };
import {
  authenticate,
  callClaude,
  claudeErrorResponse,
  corsHeaders,
  enforceLimit,
  jsonResponse,
  type ClaudeTool,
} from "../_shared/mod.ts";

const QUIZ_TOOL: ClaudeTool = {
  name: "save_quiz",
  description: "Enregistre le quizz",
  input_schema: {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            type: { type: "string", enum: ["qcm", "qcm_multi", "vrai_faux", "ouvert", "trous", "ordre", "association"] },
            answers: { type: "array", items: { type: "string" } },
            correct_index: { type: "integer", minimum: 0 },
            correct_indices: { type: "array", items: { type: "integer", minimum: 0 } },
            correct_order: { type: "array", items: { type: "integer", minimum: 0 } },
            accepted_answers: { type: "array", items: { type: "string" } },
            pairs: {
              type: "array",
              items: {
                type: "object",
                properties: { left: { type: "string" }, right: { type: "string" } },
                required: ["left", "right"],
              },
            },
            explanation: { type: "string" },
            chapter: { type: "string" },
          },
          required: ["question", "type", "explanation"],
        },
      },
    },
    required: ["questions"],
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = await authenticate(req);
    if (!auth.ok) return auth.response;

    const { content, subject, level, title, count = 10, quizType = "qcm", chapter = null, chapters = [], difficulty = "mixte", avoidQuestions = [] } = await req.json();
    if (!content || content.trim().length < 20) {
      return jsonResponse({ error: "Contenu trop court" }, { status: 400 });
    }

    const limit = await enforceLimit(auth.supabase, auth.userId, "quiz_ia");
    if (!limit.allowed) return limit.response;

    const safeCount = Math.max(3, Math.min(50, Number(count) || 10));
    const allowedTypes = ["qcm", "qcm_multi", "vrai_faux", "ouvert", "trous", "ordre", "association"];
    const type = allowedTypes.includes(quizType) ? quizType : "qcm";
    const allowedDiff = ["facile", "moyen", "difficile", "expert", "mixte"];
    const diff = allowedDiff.includes(difficulty) ? difficulty : "mixte";

    const difficultyInstructions: Record<string, string> = {
      facile: `Niveau FACILE : mémorisation directe.`,
      moyen: `Niveau MOYEN : compréhension et application.`,
      difficile: `Niveau DIFFICILE : analyse, mise en relation, distracteurs plausibles.`,
      expert: `Niveau EXPERT : synthèse, exceptions, pièges subtils, niveau examen exigeant.`,
      mixte: `Difficulté PROGRESSIVE : ~30% facile, 40% moyen, 30% difficile.`,
    };

    const typeInstructions: Record<string, string> = {
      qcm: `Génère des QCM. Chaque question a EXACTEMENT 4 réponses (A/B/C/D), UNE SEULE correcte.
Renseigne "type":"qcm", "answers" (4 strings), "correct_index" (0-3), "explanation" (1-2 phrases).`,
      qcm_multi: `Génère des QCM à RÉPONSES MULTIPLES. 4 ou 5 réponses, 2 à 4 correctes.
Renseigne "type":"qcm_multi", "answers", "correct_indices" (0-based), "explanation".`,
      vrai_faux: `Affirmations Vrai/Faux.
Renseigne "type":"vrai_faux", "answers":["Vrai","Faux"], "correct_index" (0 ou 1), "explanation".`,
      ouvert: `Questions OUVERTES (réponse 1-3 phrases).
Renseigne "type":"ouvert", "accepted_answers" (3-5 reformulations), "explanation" (réponse modèle).`,
      trous: `Phrases à TROUS avec "____".
Renseigne "type":"trous", "accepted_answers" (variantes en minuscule), "explanation" (phrase corrigée).`,
      ordre: `Mise en ORDRE.
Renseigne "type":"ordre", "answers" (4-6 éléments mélangés), "correct_order" (indices 0-based), "explanation".`,
      association: `Exercices d'ASSOCIATION.
Renseigne "type":"association", "pairs" (4-6 {left,right}), "explanation".`,
    };

    const chapterList = Array.isArray(chapters) && chapters.length ? chapters : (chapter ? [chapter] : []);
    const chapterInstruction = chapterList.length
      ? `\n\nIMPORTANT — renseigne "chapter" en choisissant EXACTEMENT un libellé parmi :\n${chapterList.map((c: string) => `- ${c}`).join("\n")}`
      : `\n\nPour chaque question, renseigne "chapter" avec un titre court (3-6 mots).`;

    const scopeInstruction = chapter ? `\n\nLe quiz porte EXCLUSIVEMENT sur le chapitre "${chapter}".` : "";

    const avoidList = Array.isArray(avoidQuestions) ? avoidQuestions.slice(0, 40) : [];
    const avoidBlock = avoidList.length
      ? `\n\nVARIÉTÉ : NE reformule PAS ces questions déjà posées :\n${avoidList.map((q: string, i: number) => `${i + 1}. ${String(q).slice(0, 180)}`).join("\n")}`
      : "";

    const seed = Math.floor(Math.random() * 1_000_000);
    const antiBiasNote = (type === "qcm" || type === "vrai_faux")
      ? `\n\nANTI-BIAIS : varie l'index correct entre 0, 1, 2 et 3 de façon équilibrée.`
      : "";

    const system = `Tu es un examinateur français pour étudiants ${level ?? ""}.
Tu crées des questions rigoureuses en français basées sur le cours fourni.
${difficultyInstructions[diff]}
Pas de question piège ridicule. Utilise "tu".${scopeInstruction}${chapterInstruction}${avoidBlock}${antiBiasNote}
Couvre tout le cours. Seed: ${seed}.

Format : ${typeInstructions[type]}`;

    const userPrompt = `Matière : ${subject ?? "non précisée"}
Titre : ${title ?? "Cours"}
Génère EXACTEMENT ${safeCount} questions à partir de ce cours :
"""
${content.slice(0, 12000)}
"""`;

    let result;
    try {
      result = await callClaude({
        system,
        messages: [{ role: "user", content: userPrompt }],
        maxTokens: Math.min(8000, 400 + safeCount * 350),
        temperature: 0.6,
        tools: [QUIZ_TOOL],
        toolChoice: { type: "tool", name: "save_quiz" },
      });
    } catch (e) {
      return claudeErrorResponse(e);
    }

    let questions = (result.toolInput as any)?.questions ?? [];
    if (!questions.length) {
      console.error("[generate-quiz] empty questions", {
        stop_reason: result.raw?.stop_reason,
        usage: result.raw?.usage,
        hasToolInput: !!result.toolInput,
      });
      return jsonResponse(
        { error: "Aucune question générée. Réessaie en réduisant le nombre de questions ou la portée." },
        { status: 502 },
      );
    }

    // ANTI-BIAIS — re-shuffle answers server side
    questions = questions.map((q: any) => {
      if (q.type === "qcm" && Array.isArray(q.answers) && typeof q.correct_index === "number" && q.answers.length >= 2) {
        const indices = q.answers.map((_: any, i: number) => i);
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        const newAnswers = indices.map((i: number) => q.answers[i]);
        const newCorrect = indices.indexOf(q.correct_index);
        return { ...q, answers: newAnswers, correct_index: newCorrect };
      }
      if (q.type === "qcm_multi" && Array.isArray(q.answers) && Array.isArray(q.correct_indices) && q.answers.length >= 2) {
        const indices = q.answers.map((_: any, i: number) => i);
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        const newAnswers = indices.map((i: number) => q.answers[i]);
        const oldToNew = new Map<number, number>();
        indices.forEach((oldIdx: number, newIdx: number) => oldToNew.set(oldIdx, newIdx));
        const newCorrect = q.correct_indices.map((i: number) => oldToNew.get(i) ?? i).sort((a: number, b: number) => a - b);
        return { ...q, answers: newAnswers, correct_indices: newCorrect };
      }
      return q;
    });

    return jsonResponse({ questions });
  } catch (e) {
    console.error("[generate-quiz]", e);
    return claudeErrorResponse(e);
  }
});
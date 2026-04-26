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
    const { content, subject, level, title, count = 10, quizType = "qcm", chapter = null, chapters = [], difficulty = "mixte", avoidQuestions = [] } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
    if (!content || content.trim().length < 20) {
      return new Response(JSON.stringify({ error: "Contenu trop court" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const safeCount = Math.max(3, Math.min(50, Number(count) || 10));
    const allowedTypes = ["qcm", "qcm_multi", "vrai_faux", "ouvert", "trous", "ordre", "association"];
    const type = allowedTypes.includes(quizType) ? quizType : "qcm";
    const allowedDiff = ["facile", "moyen", "difficile", "expert", "mixte"];
    const diff = allowedDiff.includes(difficulty) ? difficulty : "mixte";

    const difficultyInstructions: Record<string, string> = {
      facile: `Niveau FACILE uniquement : questions de mémorisation directe (définitions, dates, faits explicitement écrits dans le cours). Vocabulaire simple. Pas de piège.`,
      moyen: `Niveau MOYEN uniquement : compréhension et application. L'étudiant doit avoir compris les concepts, pas juste mémorisé. Quelques reformulations.`,
      difficile: `Niveau DIFFICILE uniquement : analyse, mise en relation entre plusieurs notions du cours, cas concrets, nuances. Distracteurs très plausibles qui forcent à bien lire.`,
      expert: `Niveau EXPERT : synthèse, raisonnement multi-étapes, exceptions, cas limites, pièges subtils basés sur des nuances précises du cours. Niveau examen blanc exigeant.`,
      mixte: `Difficulté PROGRESSIVE : commence facile (mémorisation), passe au moyen (compréhension), puis difficile (analyse) sur la fin. Répartition ~30% facile, 40% moyen, 30% difficile.`,
    };

    const typeInstructions: Record<string, string> = {
      qcm: `Génère des QCM. Chaque question a EXACTEMENT 4 réponses (A/B/C/D), UNE SEULE correcte.
Renseigne "type":"qcm", "answers" (4 strings), "correct_index" (0-3), "explanation" (1-2 phrases).`,
      qcm_multi: `Génère des QCM à RÉPONSES MULTIPLES. Chaque question a EXACTEMENT 4 ou 5 réponses, et entre 2 et 4 réponses CORRECTES (jamais une seule, jamais toutes).
Renseigne "type":"qcm_multi", "answers" (4-5 strings), "correct_indices" (tableau d'indices 0-based des bonnes réponses, longueur 2-4), "explanation" (1-2 phrases qui justifie chaque bonne réponse).
Ne renseigne PAS correct_index.`,
      vrai_faux: `Génère des affirmations à juger Vrai ou Faux.
Renseigne "type":"vrai_faux", "answers":["Vrai","Faux"], "correct_index" (0 si l'affirmation est vraie, 1 si fausse), "explanation" (justifie).`,
      ouvert: `Génère des questions OUVERTES qui demandent une réponse rédigée courte (1 à 3 phrases).
Renseigne "type":"ouvert", "accepted_answers" (3 à 5 reformulations valides de la bonne réponse, mots-clés essentiels inclus), "explanation" (la réponse modèle complète).
Ne renseigne PAS answers ni correct_index.`,
      trous: `Génère des phrases à TROUS. La question contient un ou plusieurs "____" à compléter.
Renseigne "type":"trous", "accepted_answers" (toutes les variantes valides du mot/expression à insérer, en minuscule), "explanation" (la phrase complète corrigée).
Ne renseigne PAS answers ni correct_index.`,
      ordre: `Génère des questions de MISE EN ORDRE. La question demande de remettre des éléments dans l'ordre chronologique, logique ou hiérarchique correct.
Renseigne "type":"ordre", "answers" (4 à 6 éléments, déjà MÉLANGÉS — pas dans le bon ordre), "correct_order" (tableau d'indices 0-based dans l'ordre correct, ex: [2,0,3,1]), "explanation" (justifie l'ordre attendu).
Ne renseigne PAS correct_index.`,
      association: `Génère des exercices d'ASSOCIATION (matching). Chaque "question" est une consigne courte (ex: "Associe chaque terme à sa définition" ou "Relie chaque cause à sa conséquence").
Renseigne "type":"association", "pairs" (un tableau de 4 à 6 paires, chacune {"left":"...", "right":"..."}). Les "left" sont les termes/concepts à relier, les "right" sont les définitions/réponses correspondantes. Sois concis (max 8 mots à droite).
Renseigne aussi "explanation" (1-2 phrases qui rappellent les liens essentiels).
Ne renseigne PAS answers, correct_index, ni accepted_answers.`,
    };

    const chapterList = Array.isArray(chapters) && chapters.length
      ? chapters
      : (chapter ? [chapter] : []);
    const chapterInstruction = chapterList.length
      ? `\n\nIMPORTANT — Pour CHAQUE question, renseigne le champ "chapter" en choisissant EXACTEMENT un libellé parmi cette liste :\n${chapterList.map((c: string) => `- ${c}`).join("\n")}\nN'invente pas de nouveau chapitre, choisis le plus pertinent.`
      : `\n\nPour chaque question, renseigne "chapter" avec un titre court (3-6 mots) qui résume la sous-thématique abordée.`;

    const scopeInstruction = chapter
      ? `\n\nLe quiz doit porter EXCLUSIVEMENT sur le chapitre "${chapter}". Ignore les autres parties du cours.`
      : "";

    const avoidList = Array.isArray(avoidQuestions) ? avoidQuestions.slice(0, 40) : [];
    const avoidBlock = avoidList.length
      ? `\n\nIMPORTANT — VARIÉTÉ : Voici des questions DÉJÀ posées à l'étudiant lors de quizz précédents. Tu dois ABSOLUMENT proposer des questions DIFFÉRENTES (autre angle, autre formulation, autre partie du cours, autre type de raisonnement). N'utilise PAS ces formulations :\n${avoidList.map((q: string, i: number) => `${i + 1}. ${String(q).slice(0, 180)}`).join("\n")}`
      : "";

    const seed = Math.floor(Math.random() * 1_000_000);
    const angles = [
      "définitions et vocabulaire clé",
      "dates, chiffres, ordres de grandeur",
      "causes et conséquences",
      "comparaisons entre notions",
      "exemples concrets et applications",
      "exceptions et cas particuliers",
      "schémas, processus, étapes",
      "auteurs, sources, références",
    ];
    // shuffle deterministically per seed
    const shuffled = [...angles].sort(() => (Math.sin(seed * angles.length) > 0 ? 1 : -1) * (Math.random() - 0.5));
    const anglesBlock = `\n\nVARIE LES ANGLES — couvre plusieurs de ces dimensions à travers tes ${safeCount} questions, ne te focalise pas sur une seule :\n${shuffled.slice(0, 5).map(a => `• ${a}`).join("\n")}`;

    const antiBiasNote = type === "qcm" || type === "vrai_faux"
      ? `\n\nANTI-BIAIS : pour les QCM, NE place PAS systématiquement la bonne réponse à la même position (évite le pattern "toujours C/troisième"). Varie l'index correct entre 0, 1, 2 et 3 au fil des questions, de façon équilibrée.`
      : "";
    const system = `Tu es un examinateur français pour étudiants ${level ?? ""}.
Tu crées des questions rigoureuses en français, basées sur le cours fourni.
${difficultyInstructions[diff]}
Pas de question piège ridicule. Utilise "tu".${scopeInstruction}${chapterInstruction}${anglesBlock}${avoidBlock}${antiBiasNote}

Couvre tout le cours, pas seulement le début. Réparti tes questions sur l'ENSEMBLE du contenu fourni.
Seed de variation : ${seed} (utilise-le mentalement pour explorer des angles différents à chaque génération).

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
        model: "google/gemini-2.5-flash",
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
                      type: { type: "string", enum: ["qcm", "qcm_multi", "vrai_faux", "ouvert", "trous", "ordre"] },
                      answers: { type: "array", items: { type: "string" } },
                      correct_index: { type: "integer", minimum: 0 },
                      correct_indices: { type: "array", items: { type: "integer", minimum: 0 } },
                      correct_order: { type: "array", items: { type: "integer", minimum: 0 } },
                      accepted_answers: { type: "array", items: { type: "string" } },
                      pairs: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            left: { type: "string" },
                            right: { type: "string" },
                          },
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
    let questions = parsed?.questions ?? [];

    // ANTI-BIAIS — Re-shuffle des réponses QCM côté serveur pour casser tout pattern positionnel
    // (le LLM tend à placer la bonne réponse à la 3ème position par défaut).
    questions = questions.map((q: any) => {
      if (q.type === "qcm" && Array.isArray(q.answers) && typeof q.correct_index === "number" && q.answers.length >= 2) {
        const indices = q.answers.map((_: any, i: number) => i);
        // Shuffle Fisher-Yates
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

    return new Response(JSON.stringify({ questions }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
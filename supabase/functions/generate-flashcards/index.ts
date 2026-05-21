// Génère des flashcards SM-2 à partir du contenu d'un cours.
// Chaque carte a un recto (question / concept) et un verso (réponse / définition).
// Les cartes sont insérées dans public.flashcards avec les valeurs SM-2 par défaut.
import {
  authenticate,
  callClaude,
  corsHeaders,
  enforceLimit,
  jsonResponse,
  type ClaudeTool,
} from "../_shared/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const FLASHCARD_TOOL: ClaudeTool = {
  name: "save_flashcards",
  description: "Enregistre un jeu de flashcards pour un cours",
  input_schema: {
    type: "object",
    properties: {
      flashcards: {
        type: "array",
        minItems: 5,
        maxItems: 30,
        items: {
          type: "object",
          properties: {
            front: {
              type: "string",
              description: "Question, terme ou concept — formulé de façon interrogative ou nominale courte. Max 200 caractères.",
            },
            back: {
              type: "string",
              description: "Réponse complète, définition ou explication. Précis et mémorisable. Max 400 caractères.",
            },
          },
          required: ["front", "back"],
        },
      },
    },
    required: ["flashcards"],
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  try {
    const auth = await authenticate(req);
    if (!auth.ok) return auth.response;

    const limit = await enforceLimit(auth.supabase, auth.userId, "fiche");
    if (!limit.allowed) return limit.response;

    const { content, subject, title, courseId, count = 15 } = await req.json();

    if (!content || !courseId) {
      return jsonResponse({ error: "content et courseId sont requis" }, { status: 400 }, req);
    }

    // Vérification ownership du cours
    const { data: course, error: courseErr } = await auth.supabase
      .from("courses")
      .select("id, user_id")
      .eq("id", courseId)
      .eq("user_id", auth.userId)
      .single();

    if (courseErr || !course) {
      return jsonResponse({ error: "Cours introuvable ou accès refusé" }, { status: 403 }, req);
    }

    const cardCount = Math.min(Math.max(5, Number(count) || 15), 30);
    const truncated = String(content).slice(0, 15000);

    const system = `Tu es un expert en mémorisation pour étudiants français. À partir du contenu de cours fourni, génère exactement ${cardCount} flashcards de haute qualité pour la mémorisation par répétition espacée (méthode SM-2).

Règles impératives :
- Recto : terme, concept, date-clé, question directe ou formule. Court et précis (max 200 car.).
- Verso : réponse complète, définition, explication ou valeur. Mémorisable (max 400 car.).
- Couvre l'ensemble du cours de manière équilibrée.
- Varie les types : définitions, applications, exemples, dates, formules, oppositions.
- Évite les cartes trop vagues ("Qu'est-ce que X ?" sans réponse précise).
- Rédige en français académique clair.`;

    const userPrompt = `Matière : ${subject ?? "non précisée"}
Titre : ${title ?? "Cours"}
Nombre de cartes à générer : ${cardCount}

Cours :
"""
${truncated}
"""

Génère ${cardCount} flashcards couvrant les points essentiels du cours.`;

    const result = await callClaude({
      system,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 3000,
      temperature: 0.4,
      tools: [FLASHCARD_TOOL],
      toolChoice: { type: "tool", name: "save_flashcards" },
    });

    const cards = (result.toolInput as any)?.flashcards;
    if (!Array.isArray(cards) || cards.length === 0) {
      return jsonResponse({ error: "Génération échouée — aucune carte produite" }, { status: 502 }, req);
    }

    // Supprimer les anciennes cartes du cours avant d'insérer les nouvelles
    // (regeneration = remplace le deck entier)
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await serviceClient
      .from("flashcards")
      .delete()
      .eq("course_id", courseId)
      .eq("user_id", auth.userId);

    const rows = cards.map((c: { front: string; back: string }, i: number) => ({
      course_id: courseId,
      user_id: auth.userId,
      front: String(c.front).slice(0, 200),
      back: String(c.back).slice(0, 400),
      position: i,
      ease: 2.5,
      interval_days: 0,
      repetitions: 0,
      lapses: 0,
      due_at: null,
    }));

    const { data: inserted, error: insertErr } = await serviceClient
      .from("flashcards")
      .insert(rows)
      .select("id");

    if (insertErr) {
      console.error("[generate-flashcards] insert error:", insertErr);
      return jsonResponse({ error: "Erreur d'insertion en base" }, { status: 500 }, req);
    }

    return jsonResponse({
      count: inserted?.length ?? 0,
      flashcards: cards,
    }, { status: 200 }, req);

  } catch (e) {
    console.error("[generate-flashcards] error:", e);
    return jsonResponse({ error: "Erreur interne" }, { status: 500 }, req);
  }
});

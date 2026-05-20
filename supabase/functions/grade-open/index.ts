// Grade an open-ended (free-text) student answer with Claude.
// Returns a structured score (0-100), feedback, and improvement tips.
import {
  authenticate,
  callClaude,
  claudeErrorResponse,
  corsHeaders,
  enforceLimit,
  extractJSON,
  jsonResponse,
} from "../_shared/mod.ts";

interface Body {
  question: string;
  expectedAnswer?: string;
  studentAnswer: string;
  subject?: string;
  level?: string;
}

interface Grade {
  score: number;
  verdict: "correct" | "partial" | "incorrect";
  feedback: string;
  strengths: string[];
  improvements: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, { status: 405 });

  const auth = await authenticate(req);
  if (!auth.ok) return auth.response;

  const limit = await enforceLimit(auth.supabase, auth.userId, "correction");
  if (!limit.allowed) return limit.response;

  let body: Body;
  try { body = await req.json(); }
  catch { return jsonResponse({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.question?.trim() || !body.studentAnswer?.trim()) {
    return jsonResponse({ error: "question et studentAnswer sont requis" }, { status: 400 });
  }

  const system = `Tu es un correcteur scolaire bienveillant et rigoureux pour des élèves francophones${
    body.level ? ` de niveau ${body.level}` : ""
  }${body.subject ? ` en ${body.subject}` : ""}. Tu corriges des réponses ouvertes en évaluant le fond, la précision et la clarté. Réponds uniquement en JSON valide, sans texte autour.`;

  const userPrompt = `Question: ${body.question}
${body.expectedAnswer ? `Réponse attendue (référence): ${body.expectedAnswer}\n` : ""}Réponse de l'élève: ${body.studentAnswer}

Évalue la réponse de l'élève. Retourne un JSON strict de la forme:
{
  "score": <entier 0-100>,
  "verdict": "correct" | "partial" | "incorrect",
  "feedback": "<2-3 phrases de feedback constructif>",
  "strengths": ["<point fort>", ...],
  "improvements": ["<piste d'amélioration concrète>", ...]
}`;

  try {
    const result = await callClaude({
      system,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 800,
      temperature: 0.3,
    });
    const grade = extractJSON<Grade>(result.text);
    if (!grade || typeof grade.score !== "number") {
      console.error("[grade-open] could not parse grade:", result.text.slice(0, 300));
      return jsonResponse({ error: "Réponse IA invalide" }, { status: 502 });
    }
    grade.score = Math.max(0, Math.min(100, Math.round(grade.score)));
    return jsonResponse({ grade, usage: limit.usage });
  } catch (e) {
    console.error("[grade-open] error:", e);
    return claudeErrorResponse(e);
  }
});
import {
  authenticate,
  callClaude,
  claudeErrorResponse,
  corsHeaders,
  enforceLimit,
  jsonResponse,
  type ClaudeTool,
} from "../_shared/mod.ts";

const SYSTEM_PROMPT = `Tu es Revix Coach, un assistant de révision bienveillant et direct pour étudiants français.
Tu parles en "tu", ton style est chaleureux, encourageant, jamais condescendant.
Tu es concis : MAXIMUM 4 phrases par réponse dans le chat.
Tu utilises des emojis avec parcimonie (1-2 max par réponse).
Tu donnes des conseils actionnables, pas théoriques.
Tu ne fais JAMAIS de listes à puces dans le chat — tu parles naturellement.
Si l'étudiant est stressé, commence toujours par valider son émotion avant de conseiller.
Tu te bases sur des techniques réelles : Pomodoro, spaced repetition, active recall, Feynman, blurting.
Tu ne donnes jamais de plans détaillés en chat — si l'utilisateur demande un plan, dis-lui d'utiliser le bouton "Fais-moi un planning".`;

const PLAN_TOOL: ClaudeTool = {
  name: "generate_study_plan",
  description: "Génère un plan de révision structuré jour par jour pour l'étudiant.",
  input_schema: {
    type: "object",
    properties: {
      plan_title: { type: "string" },
      subject: { type: "string" },
      days: {
        type: "array",
        items: {
          type: "object",
          properties: {
            day_label: { type: "string" },
            date_iso: { type: "string", description: "YYYY-MM-DD" },
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  duration_min: { type: "number" },
                  technique: {
                    type: "string",
                    enum: ["ACTIVE RECALL", "RELECTURE", "QUIZZ", "FEYNMAN", "RÉPÉTITION", "EXAM BLANC", "POMODORO", "BLURTING"],
                  },
                },
                required: ["description", "duration_min", "technique"],
              },
            },
          },
          required: ["day_label", "date_iso", "tasks"],
        },
      },
      coach_note: { type: "string" },
    },
    required: ["plan_title", "subject", "days", "coach_note"],
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await authenticate(req);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { messages, mode, context } = body as {
      messages: { role: "user" | "assistant"; content: string }[];
      mode?: "chat" | "plan";
      context?: {
        cursus?: string | null;
        weakSubjects?: string[];
        nextExam?: { subject: string; date: string; daysLeft: number } | null;
        streak?: number;
        currentTime?: string;
        startDate?: string;
        durationDays?: number;
      };
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return jsonResponse({ error: "messages requis" }, { status: 400 });
    }

    const isPlan = mode === "plan";

    // Rate-limit: chat counts under 'coach', plans under 'planning'.
    const limit = await enforceLimit(auth.supabase, auth.userId, isPlan ? "planning" : "coach");
    if (!limit.allowed) return limit.response;

    const ctxParts: string[] = [];
    if (context?.cursus) ctxParts.push(`Filière: ${context.cursus}`);
    if (context?.weakSubjects?.length) ctxParts.push(`Matières faibles: ${context.weakSubjects.join(", ")}`);
    if (context?.nextExam) ctxParts.push(`Prochain exam: ${context.nextExam.subject} dans ${context.nextExam.daysLeft} jours (${context.nextExam.date})`);
    if (typeof context?.streak === "number") ctxParts.push(`Streak: ${context.streak} jours`);
    if (context?.currentTime) ctxParts.push(`Heure: ${context.currentTime}`);
    const contextBlock = ctxParts.length ? `\n\nContexte étudiant:\n- ${ctxParts.join("\n- ")}` : "";

    const systemPrompt = isPlan
      ? `${SYSTEM_PROMPT}${contextBlock}\n\nL'utilisateur veut un plan de révision structuré. Utilise OBLIGATOIREMENT l'outil generate_study_plan. Date de début: ${context?.startDate ?? "aujourd'hui"}. Durée: ${context?.durationDays ?? 5} jours.`
      : `${SYSTEM_PROMPT}${contextBlock}`;

    try {
      const result = await callClaude({
        system: systemPrompt,
        messages,
        maxTokens: isPlan ? 600 : 400,
        temperature: isPlan ? 0.4 : 0.7,
        tools: isPlan ? [PLAN_TOOL] : undefined,
        toolChoice: isPlan ? { type: "tool", name: "generate_study_plan" } : undefined,
      });

      if (isPlan) {
        const plan = result.toolInput;
        if (!plan) return jsonResponse({ error: "Plan non généré" }, { status: 500 });
        return jsonResponse({ type: "plan", plan });
      }

      return jsonResponse({ type: "chat", reply: result.text || "Hmm, j'ai pas compris. Reformule ?" });
    } catch (e) {
      return claudeErrorResponse(e);
    }
  } catch (e) {
    console.error("coach-chat error", e);
    return claudeErrorResponse(e);
  }
});
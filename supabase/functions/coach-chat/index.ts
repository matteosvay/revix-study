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

    // ---- Résumé glissant (mode chat seulement) ----
    // On ne garde QUE les 4 derniers messages + un résumé condensé de tout le reste.
    // Le résumé est mis à jour tous les 6 messages, en background, via service-role.
    let effectiveMessages = messages;
    let effectiveSystem = systemPrompt;
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (!isPlan && messages.length > 4) {
      try {
        const { data: state } = await admin
          .from("coach_conversation_state")
          .select("summary, summary_until_count")
          .eq("user_id", auth.userId)
          .maybeSingle();

        const summary: string = (state as any)?.summary ?? "";
        const summarizedUntil: number = (state as any)?.summary_until_count ?? 0;
        const tail = messages.slice(-4);

        if (summary) {
          effectiveSystem = `${systemPrompt}\n\n[Résumé de la conversation jusqu'ici] ${summary}`;
        }
        effectiveMessages = tail;

        // Tous les 6 messages, on rafraîchit le résumé en background
        const total = messages.length;
        if (total - summarizedUntil >= 6) {
          // @ts-ignore
          const wait = (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil)
            ? EdgeRuntime.waitUntil.bind(EdgeRuntime)
            : ((p: Promise<unknown>) => p.catch(() => {}));
          // garde tout sauf les 2 derniers (qui resteront dans la fenêtre récente)
          const toSummarize = messages.slice(0, total - 2);
          wait((async () => {
            try {
              const transcript = toSummarize
                .map((m) => `${m.role === "user" ? "Étudiant" : "Coach"}: ${m.content}`)
                .join("\n")
                .slice(0, 4000);
              const sumRes = await callClaude({
                system: "Tu condenses une conversation entre un étudiant et son coach de révision en UNE SEULE phrase factuelle (max 30 mots), en français, à la 3e personne. Capte les sujets abordés, les difficultés évoquées et les conseils donnés.",
                messages: [{ role: "user", content: `Conversation à résumer :\n${transcript}` }],
                maxTokens: 100,
                temperature: 0.3,
              });
              const newSummary = (sumRes.text || "").trim().slice(0, 500);
              if (newSummary) {
                await admin.from("coach_conversation_state").upsert({
                  user_id: auth.userId,
                  summary: newSummary,
                  summary_until_count: total - 2,
                  updated_at: new Date().toISOString(),
                });
              }
            } catch (e) {
              console.error("[coach summary] failed", e);
            }
          })());
        }
      } catch (e) {
        console.error("[coach summary] read failed", e);
      }
    }

    try {
      const result = await callClaude({
        system: isPlan ? systemPrompt : effectiveSystem,
        messages: isPlan ? messages : effectiveMessages,
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
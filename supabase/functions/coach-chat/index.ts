// Edge function: Revix Coach IA — chat + génération de plans
// Modèle: google/gemini-2.5-flash via Lovable AI Gateway

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Tu es Revix Coach, un assistant de révision bienveillant et direct pour étudiants français.
Tu parles en "tu", ton style est chaleureux, encourageant, jamais condescendant.
Tu es concis : MAXIMUM 4 phrases par réponse dans le chat.
Tu utilises des emojis avec parcimonie (1-2 max par réponse).
Tu donnes des conseils actionnables, pas théoriques.
Tu ne fais JAMAIS de listes à puces dans le chat — tu parles naturellement.
Si l'étudiant est stressé, commence toujours par valider son émotion avant de conseiller.
Tu te bases sur des techniques réelles : Pomodoro, spaced repetition, active recall, Feynman, blurting.
Tu ne donnes jamais de plans détaillés en chat — si l'utilisateur demande un plan, dis-lui d'utiliser le bouton "Fais-moi un planning" pour avoir une vraie structure.`;

const PLAN_TOOL = {
  type: "function",
  function: {
    name: "generate_study_plan",
    description: "Génère un plan de révision structuré jour par jour pour l'étudiant.",
    parameters: {
      type: "object",
      properties: {
        plan_title: { type: "string", description: "Titre court du plan, ex: 'Marketing — 5 jours'" },
        subject: { type: "string" },
        days: {
          type: "array",
          items: {
            type: "object",
            properties: {
              day_label: { type: "string", description: "Ex: 'LUNDI 28 AVR'" },
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
                  additionalProperties: false,
                },
              },
            },
            required: ["day_label", "date_iso", "tasks"],
            additionalProperties: false,
          },
        },
        coach_note: { type: "string", description: "Une phrase d'encouragement personnalisée." },
      },
      required: ["plan_title", "subject", "days", "coach_note"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY non configuré" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
        startDate?: string; // for plans
        durationDays?: number; // for plans
      };
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ctxParts: string[] = [];
    if (context?.cursus) ctxParts.push(`Filière: ${context.cursus}`);
    if (context?.weakSubjects?.length) ctxParts.push(`Matières faibles: ${context.weakSubjects.join(", ")}`);
    if (context?.nextExam) ctxParts.push(`Prochain exam: ${context.nextExam.subject} dans ${context.nextExam.daysLeft} jours (${context.nextExam.date})`);
    if (typeof context?.streak === "number") ctxParts.push(`Streak: ${context.streak} jours`);
    if (context?.currentTime) ctxParts.push(`Heure: ${context.currentTime}`);

    const contextBlock = ctxParts.length ? `\n\nContexte étudiant:\n- ${ctxParts.join("\n- ")}` : "";

    const isPlan = mode === "plan";
    const systemPrompt = isPlan
      ? `${SYSTEM_PROMPT}${contextBlock}\n\nL'utilisateur veut un plan de révision structuré. Utilise OBLIGATOIREMENT l'outil generate_study_plan. Date de début: ${context?.startDate ?? "aujourd'hui"}. Durée: ${context?.durationDays ?? 5} jours.`
      : `${SYSTEM_PROMPT}${contextBlock}`;

    const payload: Record<string, unknown> = {
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: isPlan ? 0.4 : 0.7,
      max_tokens: isPlan ? 1200 : 350,
    };

    if (isPlan) {
      payload.tools = [PLAN_TOOL];
      payload.tool_choice = { type: "function", function: { name: "generate_study_plan" } };
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes — réessaie dans 1 min." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés — recharge ton workspace Lovable AI." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const txt = await aiRes.text();
      console.error("AI error", aiRes.status, txt);
      return new Response(JSON.stringify({ error: "Erreur IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const choice = data?.choices?.[0];

    if (isPlan) {
      const toolCall = choice?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) {
        return new Response(JSON.stringify({ error: "Plan non généré" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const plan = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ type: "plan", plan }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reply = choice?.message?.content ?? "Hmm, j'ai pas compris. Reformule ?";
    return new Response(JSON.stringify({ type: "chat", reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("coach-chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
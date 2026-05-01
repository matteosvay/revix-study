import { authenticate, corsHeaders, enforceLimit, jsonResponse } from "../_shared/mod.ts";

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = await authenticate(req);
    if (!auth.ok) return auth.response;

    const limit = await enforceLimit(auth.supabase, auth.userId, "transcription");
    if (!limit.allowed) return limit.response;

    const { audioBase64, mimeType = "audio/webm" } = await req.json();
    if (!audioBase64 || typeof audioBase64 !== "string" || audioBase64.length < 100) {
      return jsonResponse({ error: "Audio manquant ou trop court" }, { status: 400 });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const resp = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Tu es un transcripteur audio précis. Transcris fidèlement en français ce que dit l'étudiant. Renvoie uniquement le texte transcrit, sans commentaire ni ponctuation excessive.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcris cet audio en français :" },
              { type: "input_audio", input_audio: { data: audioBase64, format: mimeType.includes("mp3") ? "mp3" : "webm" } },
            ],
          },
        ],
      }),
    });

    if (resp.status === 429) return jsonResponse({ error: "Trop de requêtes" }, { status: 429 });
    if (resp.status === 402) return jsonResponse({ error: "Crédits IA épuisés" }, { status: 402 });
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI error", resp.status, t);
      // Ne PAS leaker le message brut de l'API IA au client.
      return jsonResponse({ error: "Erreur IA" }, { status: 500 });
    }

    const data = await resp.json();
    const transcript = data.choices?.[0]?.message?.content?.toString().trim() ?? "";
    return jsonResponse({ transcript });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: "Erreur interne" }, { status: 500 });
  }
});
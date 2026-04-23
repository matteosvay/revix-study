const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Extract text from an image (or photo of course) using Gemini vision capabilities.
// For PDFs, the client extracts text with pdfjs and sends it as text directly to generate-fiches.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { imageBase64, mimeType } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
    if (!imageBase64) return new Response(JSON.stringify({ error: "Image manquante" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const resp = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Tu es un expert en OCR pour notes manuscrites et imprimées. Extrais TOUT le texte de l'image fournie en français, en conservant la structure (titres, listes, paragraphes). Ne commente pas, retourne uniquement le texte extrait." },
          { role: "user", content: [
            { type: "text", text: "Extrais le texte de cette image de cours." },
            { type: "image_url", image_url: { url: `data:${mimeType ?? "image/jpeg"};base64,${imageBase64}` } },
          ] },
        ],
      }),
    });

    if (resp.status === 429) return new Response(JSON.stringify({ error: "Trop de requêtes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402) return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!resp.ok) { console.error("OCR error", resp.status, await resp.text()); return new Response(JSON.stringify({ error: "Erreur OCR" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
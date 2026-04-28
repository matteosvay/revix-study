import {
  authenticate,
  callClaudeVision,
  claudeErrorResponse,
  corsHeaders,
  jsonResponse,
} from "../_shared/mod.ts";

// OCR for handwritten/printed notes (and photos of courses) using Claude Haiku 4.5 vision.
// PDFs continue to be parsed client-side via pdfjs and sent as text directly to generate-fiches.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = await authenticate(req);
    if (!auth.ok) return auth.response;

    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) {
      return jsonResponse({ error: "Image manquante" }, { status: 400 });
    }

    // Note: extract-pdf is not metered as a separate IA action — it is part of the
    // upload-then-fiche pipeline. The 'fiche' rate limit is enforced in generate-fiches.

    try {
      const text = await callClaudeVision({
        system: "Tu es un expert en OCR pour notes manuscrites et imprimées. Extrais TOUT le texte de l'image fournie en français, en conservant la structure (titres, listes, paragraphes). Ne commente pas, retourne uniquement le texte extrait.",
        prompt: "Extrais le texte de cette image de cours.",
        imageBase64,
        mimeType: mimeType ?? "image/jpeg",
        maxTokens: 2000,
      });
      return jsonResponse({ text });
    } catch (e) {
      return claudeErrorResponse(e);
    }
  } catch (e) {
    console.error("[extract-pdf]", e);
    return claudeErrorResponse(e);
  }
});
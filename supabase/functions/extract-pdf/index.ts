import {
  authenticate,
  callClaudeVision,
  claudeErrorResponse,
  corsHeaders,
  enforceLimit,
  jsonResponse,
} from "../_shared/mod.ts";

// OCR pour notes manuscrites/imprimées et photos de cours via Claude Haiku 4.5 vision.
// PDF parsés client-side via pdfjs et envoyés en texte directement à generate-fiches.
//
// Sécurité : déclenche un appel Claude Vision (coûteux). Doit être rate-limité au même
// titre que les autres actions IA. On le compte sur le quota 'fiche' car c'est la
// première étape du pipeline d'upload.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = await authenticate(req);
    if (!auth.ok) return auth.response;

    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) {
      return jsonResponse({ error: "Image manquante" }, { status: 400 });
    }

    // ----- Rate limit (quota 'fiche') -----
    const limit = await enforceLimit(auth.supabase, auth.userId, "fiche");
    if (!limit.allowed) return limit.response;

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
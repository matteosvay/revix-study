import {
  authenticate,
  callClaudeVision,
  claudeErrorResponse,
  corsHeaders,
  enforceLimit,
  jsonResponse,
} from "../_shared/mod.ts";

// Magic-bytes signatures for allowed image formats.
const MAGIC_SIGNATURES: Array<{ prefix: string; mime: string }> = [
  { prefix: "FFD8FF",   mime: "image/jpeg" },
  { prefix: "89504E47", mime: "image/png"  },
  { prefix: "47494638", mime: "image/gif"  },
  { prefix: "52494646", mime: "image/webp" }, // RIFF header (WebP)
];

function detectMimeFromBase64(base64: string): string | null {
  try {
    const raw = base64.replace(/^data:[^;]+;base64,/, "");
    const bytes = atob(raw.slice(0, 16));
    const hex = Array.from(bytes).slice(0, 4)
      .map((b) => b.charCodeAt(0).toString(16).padStart(2, "0").toUpperCase())
      .join("");
    for (const { prefix, mime } of MAGIC_SIGNATURES) {
      if (hex.startsWith(prefix)) return mime;
    }
    return null;
  } catch { return null; }
}

// OCR pour notes manuscrites/imprimées et photos de cours via Claude Haiku 4.5 vision.
// PDF parsés client-side via pdfjs et envoyés en texte directement à generate-fiches.
//
// Sécurité : déclenche un appel Claude Vision (coûteux). Doit être rate-limité au même
// titre que les autres actions IA. On le compte sur le quota 'fiche' car c'est la
// première étape du pipeline d'upload.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  try {
    const auth = await authenticate(req);
    if (!auth.ok) return auth.response;

    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) {
      return jsonResponse({ error: "Image manquante" }, { status: 400 });
    }

    const detectedMime = detectMimeFromBase64(imageBase64);
    if (!detectedMime) {
      return jsonResponse({ error: "Format d'image non reconnu (JPEG, PNG, GIF ou WebP uniquement)" }, { status: 400 });
    }

    // ----- Rate limit (quota 'fiche') -----
    const limit = await enforceLimit(auth.supabase, auth.userId, "fiche");
    if (!limit.allowed) return limit.response;

    try {
      const text = await callClaudeVision({
        system: "Tu es un expert en OCR pour notes manuscrites et imprimées. Extrais TOUT le texte de l'image fournie en français, en conservant la structure (titres, listes, paragraphes). Ne commente pas, retourne uniquement le texte extrait.",
        prompt: "Extrais le texte de cette image de cours.",
        imageBase64,
        mimeType: detectedMime,
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
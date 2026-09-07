// Shared utilities for Diplo edge functions.
// - CORS headers
// - JWT auth check (with the calling user's Supabase client)
// - Claude (Anthropic) wrapper with text + tool_use support
// - Vision helper for extract-pdf

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const EXTRA_ORIGINS = (Deno.env.get("EXTRA_ALLOWED_ORIGINS") ?? "")
  .split(",").map((o) => o.trim()).filter(Boolean);

const ALLOWED_ORIGINS = [
  "https://revix-study.lovable.app",
  "https://diplo.lovable.app",
  ...EXTRA_ORIGINS,
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
];

function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get("Origin") ?? "";
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

const CORS_HEADERS_NAMES =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

export function corsHeaders(req: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(req),
    "Access-Control-Allow-Headers": CORS_HEADERS_NAMES,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

export function jsonResponse(body: unknown, init: ResponseInit = {}, req?: Request) {
  const cors = req ? corsHeaders(req) : { "Access-Control-Allow-Origin": ALLOWED_ORIGINS[0] };
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...cors, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

/** Verify the JWT in the Authorization header. Returns user + supabase client scoped to that user. */
export async function authenticate(req: Request): Promise<
  | { ok: true; userId: string; supabase: SupabaseClient; authHeader: string }
  | { ok: false; response: Response }
> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, response: jsonResponse({ error: "Unauthorized" }, { status: 401 }) };
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data, error } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (error || !data?.user) {
    return { ok: false, response: jsonResponse({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true, userId: data.user.id, supabase, authHeader };
}

// =====================================================================
// Claude (Anthropic) wrapper
// =====================================================================

export const CLAUDE_MODEL = "claude-haiku-4-5-20251001";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

/**
 * Extract a JSON object/array from a Claude text response.
 * Tolerates code fences (```json ... ```) and surrounding prose.
 * Returns null if no valid JSON can be parsed.
 */
export function extractJSON<T = unknown>(text: string): T | null {
  if (!text) return null;
  // Strip code fences first
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1] : text;
  // Try direct parse
  try { return JSON.parse(candidate.trim()) as T; } catch { /* fall through */ }
  // Find first { or [ and matching last } or ]
  const firstObj = candidate.indexOf("{");
  const firstArr = candidate.indexOf("[");
  const start = firstArr === -1 ? firstObj : firstObj === -1 ? firstArr : Math.min(firstObj, firstArr);
  if (start === -1) return null;
  const isArr = candidate[start] === "[";
  const end = isArr ? candidate.lastIndexOf("]") : candidate.lastIndexOf("}");
  if (end <= start) return null;
  try { return JSON.parse(candidate.slice(start, end + 1)) as T; } catch { return null; }
}

export type ClaudeMessage = { role: "user" | "assistant"; content: string | unknown };

export interface ClaudeTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface ClaudeCallParams {
  system: string;
  messages: ClaudeMessage[];
  maxTokens: number;
  temperature?: number;
  tools?: ClaudeTool[];
  /** When provided, force the model to call this tool. */
  toolChoice?: { type: "tool"; name: string };
}

export interface ClaudeRawResponse {
  text: string;
  toolInput: Record<string, unknown> | null;
  raw: any;
}

/**
 * Call Claude. Returns the first text block + the first tool_use input (if any).
 * Throws on non-2xx with a structured error object so callers can map to HTTP status.
 */
export async function callClaude(params: ClaudeCallParams): Promise<ClaudeRawResponse> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw Object.assign(new Error("ANTHROPIC_API_KEY not configured"), { status: 500 });

  const body: Record<string, unknown> = {
    model: CLAUDE_MODEL,
    max_tokens: params.maxTokens,
    temperature: params.temperature ?? 0.7,
    system: params.system,
    messages: params.messages,
  };
  if (params.tools?.length) body.tools = params.tools;
  if (params.toolChoice) body.tool_choice = params.toolChoice;

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[claude] ${res.status} ${text.slice(0, 500)}`);
    throw Object.assign(new Error(`Claude API error ${res.status}`), { status: res.status, body: text });
  }

  const data = await res.json();
  let text = "";
  let toolInput: Record<string, unknown> | null = null;
  for (const block of data.content ?? []) {
    if (block.type === "text") text += block.text;
    else if (block.type === "tool_use" && !toolInput) toolInput = block.input ?? {};
  }

  // Si le modele a atteint max_tokens au milieu d'un bloc structure, l'input est
  // partiel ou vide. Sans ce test, l'appelant conclut a tort "rien genere".
  if (data.stop_reason === "max_tokens") {
    console.error("[claude] TRONQUE", { max_tokens: params.maxTokens, usage: data.usage });
    throw Object.assign(new Error("Reponse IA tronquee (max_tokens atteint)"), {
      status: 507,
      truncated: true,
    });
  }

  return { text, toolInput, raw: data };
}

/**
 * Vision call: send an image (base64) + a text instruction in a single user message.
 */
export async function callClaudeVision(params: {
  system: string;
  prompt: string;
  imageBase64: string;
  mimeType: string;
  maxTokens: number;
}): Promise<string> {
  const result = await callClaude({
    system: params.system,
    maxTokens: params.maxTokens,
    temperature: 0.2,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: params.mimeType, data: params.imageBase64 },
          },
          { type: "text", text: params.prompt },
        ],
      } as ClaudeMessage,
    ],
  });
  return result.text;
}

/** Translate Claude error status into the same shape we used to return from Lovable AI Gateway. */
export function claudeErrorResponse(err: unknown, req?: Request): Response {
  const e = err as { status?: number; truncated?: boolean; message?: string };
  if (e?.truncated) {
    return jsonResponse(
      {
        error: "ai_truncated",
        message: "Ce cours est trop dense pour une seule passe. Reessaie avec moins de questions, ou decoupe le cours.",
      },
      { status: 507 },
      req,
    );
  }
  if (e?.status === 429) return jsonResponse({ error: "Trop de requetes, reessaie dans un instant." }, { status: 429 }, req);
  if (e?.status === 402) return jsonResponse({ error: "Credits IA epuises." }, { status: 402 }, req);
  if (e?.status === 403) return jsonResponse({ error: "Acces IA refuse (cle ou permissions)." }, { status: 500 }, req);
  if (e?.status === 401) return jsonResponse({ error: "Configuration IA invalide." }, { status: 500 }, req);
  return jsonResponse({ error: "Erreur IA", message: e?.message }, { status: 500 }, req);
}

// =====================================================================
// Rate limiting
// =====================================================================

export type ActionType = "fiche" | "quiz_ia" | "coach" | "correction" | "planning" | "oral" | "transcription" | "ocr";
export type Tier = "free" | "pro" | "max";

interface Limits {
  daily: number;
  weekly: number;
}

// Quotas calibrés pour la rentabilité : même à 100 % d'usage, un payant coûte
// moins cher que son abonnement (Pro ≈ 3 €/mois d'IA vs 4,99 € ; Max ≈ 6,6 € vs 8,99 €).
// La contrainte hebdomadaire borne le coût mensuel ; le quota journalier autorise de bonnes sessions.
const TIER_LIMITS: Record<Tier, Record<ActionType, Limits>> = {
  free: {
    fiche:      { daily: 1,  weekly: 1 },
    quiz_ia:    { daily: 3,  weekly: 7 },
    coach:      { daily: 3,  weekly: 5 },
    correction: { daily: 2,  weekly: 4 },
    planning:   { daily: 1,  weekly: 1 },
    oral:          { daily: 1,  weekly: 3 },
    transcription: { daily: 3,  weekly: 8 },
    ocr:           { daily: 6,  weekly: 12 },
  },
  pro: {
    fiche:      { daily: 2,  weekly: 3 },
    quiz_ia:    { daily: 12, weekly: 35 },
    coach:      { daily: 16, weekly: 46 },
    correction: { daily: 10, weekly: 23 },
    planning:   { daily: 1,  weekly: 2 },
    oral:          { daily: 4,  weekly: 15 },
    transcription: { daily: 12, weekly: 45 },
    ocr:           { daily: 20, weekly: 60 },
  },
  max: {
    fiche:      { daily: 4,  weekly: 7 },
    quiz_ia:    { daily: 25, weekly: 70 },
    coach:      { daily: 40, weekly: 115 },
    correction: { daily: 25, weekly: 58 },
    planning:   { daily: 3,  weekly: 8 },
    oral:          { daily: 12, weekly: 40 },
    transcription: { daily: 30, weekly: 120 },
    ocr:           { daily: 50, weekly: 150 },
  },
};

export function getLimits(tier: Tier, action: ActionType): Limits {
  return TIER_LIMITS[tier][action];
}

export function getUserTier(plan: string | null | undefined): Tier {
  if (plan === "max" || plan === "ultra") return "max";
  if (plan === "pro") return "pro";
  return "free";
}

/**
 * Check + atomically increment usage counters for the current user.
 * Returns either { allowed: true, ... } or a Response (HTTP 429) ready to return to the client.
 */
export async function enforceLimit(
  supabase: SupabaseClient,
  userId: string,
  action: ActionType,
): Promise<{ allowed: true; usage: any } | { allowed: false; response: Response }> {
  // PHASE DE TEST : le client force le tier "max" pour tout le monde
  // (useSubscription.tsx / useUsage.ts). Tant que le paywall n'est pas rallume,
  // le serveur doit appliquer le MEME tier, sinon l'app affiche un quota et le
  // serveur en applique un autre. Au lancement payant : passer FREE_ACCESS_TIER
  // a vide (ou supprimer la variable) et rallumer le paywall cote client.
  const forcedTier = (Deno.env.get("FREE_ACCESS_TIER") ?? "max").trim();
  let tier: Tier = "free";
  if (forcedTier === "max" || forcedTier === "pro") {
    tier = forcedTier as Tier;
  } else {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", userId)
        .maybeSingle();
      tier = getUserTier(profile?.plan ?? null);
    } catch (e) {
      console.error("[enforceLimit] profile read failed", e);
    }
  }
  const limits = getLimits(tier, action);

  const { data, error } = await supabase.rpc("check_and_increment_usage", {
    p_user_id: userId,
    p_action_type: action,
    p_daily_limit: limits.daily,
    p_weekly_limit: limits.weekly,
  });

  if (error) {
    console.error("[enforceLimit] rpc failed", error);
    // Fail-CLOSED: on refuse plutôt que de laisser passer en cas d'erreur DB.
    return {
      allowed: false,
      response: jsonResponse(
        { error: "limit_check_failed", message: "Service de quota indisponible, réessaie dans un instant." },
        { status: 503 },
      ),
    };
  }

  if (data?.allowed === false) {
    return {
      allowed: false,
      response: jsonResponse(
        {
          error: "limit_reached",
          tier,
          action,
          reason: data.reason,
          daily_used: data.daily_used,
          daily_limit: data.daily_limit,
          weekly_used: data.weekly_used,
          weekly_limit: data.weekly_limit,
        },
        { status: 429 },
      ),
    };
  }

  return { allowed: true, usage: { tier, action, ...data } };
}
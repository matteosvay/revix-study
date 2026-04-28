// Helper to detect & broadcast IA rate-limit responses from edge functions.
// Usage:
//   const { data, error } = await supabase.functions.invoke("generate-fiches", { body });
//   if (handleAiLimit(error, data)) return; // limit modal will show automatically

import { toast } from "sonner";

export interface AiLimitInfo {
  action: string;
  reason: "daily_limit" | "weekly_limit" | string;
  daily_used?: number;
  daily_limit?: number;
  weekly_used?: number;
  weekly_limit?: number;
  tier?: string;
}

export const AI_LIMIT_EVENT = "revix:ai-limit-reached";

/**
 * Returns true if the response was a rate-limit response (and shows toast + modal).
 * Pass both the supabase error and the function response data — supabase.functions.invoke
 * sets `error` for non-2xx but the JSON body is still in the FunctionsHttpError.context.
 */
export function handleAiLimit(error: unknown, data: unknown): boolean {
  // 1) Body returned directly (function status 200 with custom error)
  const body = (data ?? null) as { error?: string } & Partial<AiLimitInfo> | null;
  if (body && body.error === "limit_reached") {
    broadcastLimit(body as AiLimitInfo);
    return true;
  }

  // 2) Supabase FunctionsHttpError on 429 — the JSON body is on error.context.body (Response)
  if (error && typeof error === "object" && "context" in error) {
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx === "object" && typeof (ctx as Response).json === "function") {
      // We can't await here in a sync helper, so kick off async parse
      (ctx as Response).clone().json().then((parsed) => {
        if (parsed?.error === "limit_reached") broadcastLimit(parsed as AiLimitInfo);
      }).catch(() => {});
      // Don't claim limit yet — return false so caller still sees the error;
      // but in practice the modal will appear within ms.
    }
  }

  return false;
}

function broadcastLimit(info: AiLimitInfo) {
  const label = info.reason === "weekly_limit" ? "hebdomadaire" : "quotidienne";
  const used = info.reason === "weekly_limit" ? info.weekly_used : info.daily_used;
  const limit = info.reason === "weekly_limit" ? info.weekly_limit : info.daily_limit;
  toast.error(`Limite ${label} atteinte`, {
    description: typeof used === "number" && typeof limit === "number"
      ? `Tu as utilisé ${used}/${limit} générations.`
      : "Passe à une formule supérieure pour continuer.",
  });
  window.dispatchEvent(new CustomEvent(AI_LIMIT_EVENT, { detail: info }));
}
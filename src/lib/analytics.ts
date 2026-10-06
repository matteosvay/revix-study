// Mesure d'audience, désactivée par défaut.
//
// Elle ne se charge que si VITE_ANALYTICS_DOMAIN est défini (par exemple
// "diplo.lovable.app"). Le script visé par défaut est celui de Plausible :
// hébergé dans l'UE, sans cookie, sans donnée personnelle, ce qui le rend
// compatible avec l'exemption de consentement de la CNIL pour la mesure
// d'audience. Par prudence, on ne le charge pas non plus si la personne a
// refusé dans la bannière cookies.
//
// Pour l'activer : ajouter VITE_ANALYTICS_DOMAIN dans les variables du projet,
// et, si on change d'outil, VITE_ANALYTICS_SRC (penser alors à la CSP de index.html).

const DOMAIN = (import.meta.env.VITE_ANALYTICS_DOMAIN as string | undefined)?.trim() ?? "";
const SRC =
  (import.meta.env.VITE_ANALYTICS_SRC as string | undefined)?.trim() || "https://plausible.io/js/script.js";

export const ANALYTICS_ENABLED = DOMAIN.length > 0;

type PlausibleFn = ((event: string, options?: { props?: Record<string, string | number | boolean> }) => void) & {
  q?: unknown[];
};

declare global {
  interface Window {
    plausible?: PlausibleFn;
  }
}

function userDeclined(): boolean {
  try {
    return localStorage.getItem("revix_cookie_consent") === "declined";
  } catch {
    return false;
  }
}

let started = false;

export function initAnalytics() {
  if (started || !ANALYTICS_ENABLED || typeof document === "undefined" || userDeclined()) return;
  started = true;
  // File d'attente : les événements envoyés avant la fin du chargement ne sont pas perdus.
  window.plausible =
    window.plausible ||
    (function (this: unknown, ...args: unknown[]) {
      (window.plausible!.q = window.plausible!.q || []).push(args);
    } as PlausibleFn);
  const s = document.createElement("script");
  s.defer = true;
  s.src = SRC;
  s.dataset.domain = DOMAIN;
  document.head.appendChild(s);
}

/**
 * Événement personnalisé (inscription, premier cours importé...).
 * Ne jamais y mettre d'email, de nom ou d'identifiant utilisateur.
 */
export function track(event: string, props?: Record<string, string | number | boolean>) {
  if (!started || !window.plausible) return;
  try {
    window.plausible(event, props ? { props } : undefined);
  } catch {
    /* la mesure d'audience ne doit jamais casser l'app */
  }
}

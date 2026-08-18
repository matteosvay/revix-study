import { useEffect, useState } from "react";

/**
 * Personnalisation de Diplo : la couleur de sa toque.
 * Choisie par l'élève, mémorisée en local, et diffusée à tous les Diplo de l'appli
 * via un événement global (revix:diplo-cap).
 */
export type ToqueRarity = "common" | "rare" | "epic" | "legend";
export type Toque = { id: string; name: string; rarity: ToqueRarity; cap: string };

/** Catalogue des toques. `cap` = valeur de `fill` SVG (couleur solide ou dégradé url(#…)). */
export const TOQUES: Toque[] = [
  { id: "revix",    name: "Bleu Revix",         rarity: "common", cap: "#2456d6" },
  { id: "encre",    name: "Encre",              rarity: "common", cap: "#28324a" },
  { id: "emeraude", name: "Émeraude",           rarity: "common", cap: "#1f9d57" },
  { id: "corail",   name: "Corail",             rarity: "common", cap: "#e2564b" },
  { id: "ardoise",  name: "Ardoise",            rarity: "common", cap: "#64748b" },
  { id: "prune",    name: "Prune",              rarity: "rare",   cap: "#7a3b8c" },
  { id: "ocean",    name: "Océan",              rarity: "rare",   cap: "#0ea5b7" },
  { id: "rose",     name: "Rose bonbon",        rarity: "rare",   cap: "#e0559a" },
  { id: "nuit",     name: "Nuit étoilée",       rarity: "rare",   cap: "#3b2f6b" },
  { id: "aurore",   name: "Aurore",             rarity: "epic",   cap: "url(#dcap-aurore)" },
  { id: "sunset",   name: "Coucher de soleil",  rarity: "epic",   cap: "url(#dcap-sunset)" },
  { id: "menthe",   name: "Menthe glacée",      rarity: "epic",   cap: "url(#dcap-menthe)" },
  { id: "dore",     name: "Dorée",              rarity: "legend", cap: "url(#dcap-gold)" },
  { id: "holo",     name: "Holographique",      rarity: "legend", cap: "url(#dcap-holo)" },
];

export const TOQUE_RARITY_LABEL: Record<ToqueRarity, string> = {
  common: "Commun",
  rare: "Rare",
  epic: "Épique",
  legend: "Légendaire",
};

export const TOQUE_RARITY_COLOR: Record<ToqueRarity, string> = {
  common: "#8a97ad",
  rare: "#2f79e0",
  epic: "#9b51e0",
  legend: "#e8a319",
};

const KEY = "revix-diplo-cap";
const DEFAULT_ID = "revix";

export function getDiploCapId(): string {
  try {
    return localStorage.getItem(KEY) || DEFAULT_ID;
  } catch {
    return DEFAULT_ID;
  }
}

export function setDiploCapId(id: string) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("revix:diplo-cap", { detail: { id } }));
  }
}

export function toqueById(id: string): Toque {
  return TOQUES.find((t) => t.id === id) ?? TOQUES[0];
}

export function capColorFor(id: string): string {
  return toqueById(id).cap;
}

/** Renvoie l'id de toque courant et se met à jour quand l'élève en change. */
export function useDiploCapId(): string {
  const [id, setId] = useState<string>(getDiploCapId());
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { id?: string };
      if (detail?.id) setId(detail.id);
    };
    window.addEventListener("revix:diplo-cap", handler);
    return () => window.removeEventListener("revix:diplo-cap", handler);
  }, []);
  return id;
}

/**
 * Visual mapping for cosmetic items.
 * item_key → CSS recipe (frame ring/border, background gradient/pattern).
 */
import type { CSSProperties } from "react";
import { BG_SRC } from "./cosmetics-assets";

export type Rarity = "common" | "rare" | "epic" | "legendary" | "creator" | "queen";

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Commun", rare: "Rare", epic: "Épique", legendary: "Légendaire", creator: "Créateur", queen: "Reine",
};

/**
 * Display order from lowest to highest rarity.
 * `queen` is the most prestigious tier — exclusive, above creator.
 */
export const RARITY_ORDER: Rarity[] = ["common", "rare", "epic", "legendary", "creator", "queen"];

/** Numeric rank — higher = more prestigious. Useful for sorting (desc). */
export function rarityRank(r: Rarity | null | undefined): number {
  if (!r) return -1;
  const i = RARITY_ORDER.indexOf(r);
  return i < 0 ? -1 : i;
}

export const RARITY_RING: Record<Rarity, string> = {
  common: "ring-muted-foreground/40",
  rare: "ring-blue-400",
  epic: "ring-purple-500",
  legendary: "ring-yellow-400",
  creator: "ring-amber-300",
  queen: "ring-pink-300",
};
export const RARITY_TEXT: Record<Rarity, string> = {
  common: "text-muted-foreground",
  rare: "text-blue-500",
  epic: "text-purple-500",
  legendary: "text-yellow-500",
  creator: "text-amber-400",
  queen: "text-pink-500",
};
export const RARITY_BORDER: Record<Rarity, string> = {
  common: "border-muted-foreground/40",
  rare: "border-blue-400",
  epic: "border-purple-500",
  legendary: "border-yellow-400",
  creator: "border-amber-300",
  queen: "border-pink-300",
};
export const CATEGORY_LABEL: Record<string, string> = {
  frame: "Cadre", background: "Fond", sticker: "Sticker", title: "Titre",
};

export function frameStyle(itemKey: string | null | undefined): { className: string; style: CSSProperties } {
  if (!itemKey) return { className: "", style: {} };
  const k = itemKey;
  /* ===== Creator-exclusive ===== */
  if (k === "frame_origine") {
    return {
      className: "rounded-full shadow-[0_0_28px_hsl(40_100%_55%/0.45)]",
      style: {},
    };
  }
  /* ===== Queen-exclusive (Léna) ===== */
  if (k === "frame_reine") {
    return {
      className: "rounded-full shadow-[0_0_28px_hsl(330_100%_75%/0.55)]",
      style: {},
    };
  }
  // All other frames are rendered as <img> ring overlays by FrameDecor.
  // The avatar element itself stays neutral; no CSS ring on the avatar.
  return { className: "", style: {} };
}

export function backgroundStyle(itemKey: string | null | undefined): CSSProperties {
  if (!itemKey) return {};
  const k = itemKey;
  /* ===== Creator-exclusive ===== */
  if (k === "bg_origine") return {
    background:
      "radial-gradient(ellipse at 30% 20%, hsl(45 100% 55% / 0.25), transparent 55%)," +
      "radial-gradient(ellipse at 75% 75%, hsl(35 90% 45% / 0.25), transparent 55%)," +
      "linear-gradient(160deg, #1a0f02 0%, #0e0700 50%, #1a0f02 100%)",
  };
  /* ===== Queen-exclusive (Léna) ===== */
  if (k === "bg_reine") return {
    background:
      // soft golden glow top-left
      "radial-gradient(ellipse at 25% 20%, hsl(45 100% 75% / 0.55), transparent 55%)," +
      // dusty rose glow bottom-right
      "radial-gradient(ellipse at 75% 80%, hsl(335 90% 78% / 0.55), transparent 55%)," +
      // hint of deep rose center
      "radial-gradient(circle at 50% 50%, hsl(345 70% 60% / 0.25), transparent 60%)," +
      // base velvet
      "linear-gradient(160deg, #fff1f4 0%, #fde7ef 35%, #f9d7e3 65%, #f3c0d3 100%)",
  };
  /* ===== All other backgrounds → generated WebP image ===== */
  const url = BG_SRC[k];
  if (url) {
    return {
      backgroundImage: `url(${url})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }
  return { background: "hsl(var(--muted))" };
}

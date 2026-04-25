/**
 * Visual mapping for cosmetic items.
 * item_key → CSS recipe (frame ring/border, background gradient/pattern).
 */
import type { CSSProperties } from "react";

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
  if (k === "frame_paper")    return { className: "ring-2 ring-muted-foreground/30", style: {} };
  if (k === "frame_kraft")    return { className: "ring-[3px]", style: { boxShadow: "0 0 0 3px hsl(35 50% 60%)" } };
  if (k === "frame_dotted")   return { className: "ring-2 ring-dashed ring-foreground", style: {} };
  if (k === "frame_dashed")   return { className: "ring-2 ring-dashed ring-foreground/70", style: {} };
  if (k === "frame_notebook") return { className: "ring-2 ring-blue-300", style: {} };
  if (k === "frame_grid")     return { className: "ring-2 ring-foreground/40", style: {} };
  if (k === "frame_pencil")   return { className: "ring-2 ring-foreground/60", style: {} };
  if (k === "frame_scotch")   return { className: "ring-[3px] ring-yellow-300", style: {} };
  if (k === "frame_sticker")  return { className: "ring-[3px] ring-pink-400", style: {} };
  if (k === "frame_postit_yellow") return { className: "ring-[3px] ring-yellow-400", style: {} };
  if (k === "frame_marker_yellow") return { className: "ring-[3px] ring-yellow-500", style: {} };
  if (k === "frame_marker_orange") return { className: "ring-[3px] ring-orange-500", style: {} };
  if (k === "frame_polaroid") return { className: "ring-4 ring-white shadow-[0_2px_8px_rgba(0,0,0,0.25)]", style: {} };
  if (k === "frame_neon")     return { className: "ring-2 ring-cyan-400 shadow-[0_0_12px_hsl(190_100%_60%)]", style: {} };
  if (k === "frame_neon_blue") return { className: "ring-2 ring-blue-500 shadow-[0_0_14px_hsl(220_100%_60%)]", style: {} };
  if (k === "frame_neon_green") return { className: "ring-2 ring-green-400 shadow-[0_0_14px_hsl(130_90%_55%)]", style: {} };
  if (k === "frame_neon_pink") return { className: "ring-2 ring-pink-500 shadow-[0_0_14px_hsl(330_100%_60%)]", style: {} };
  if (k === "frame_floral")   return { className: "ring-[3px] ring-pink-300", style: {} };
  if (k === "frame_ice")      return { className: "ring-2 ring-sky-300 shadow-[0_0_10px_hsl(200_100%_70%)]", style: {} };
  if (k === "frame_fire")     return { className: "ring-2 ring-orange-500 shadow-[0_0_14px_hsl(20_100%_55%)]", style: {} };
  if (k === "frame_lightning") return { className: "ring-2 ring-yellow-400 shadow-[0_0_14px_hsl(50_100%_55%)]", style: {} };
  if (k === "frame_gold")     return { className: "ring-[3px] ring-yellow-400 shadow-[0_0_18px_hsl(45_100%_55%)]", style: {} };
  if (k === "frame_rainbow")  return { className: "p-[3px] rounded-full", style: { background: "conic-gradient(from 0deg, #ff0080, #ff8c00, #ffd000, #00d084, #00b8ff, #b400ff, #ff0080)" } };
  if (k === "frame_aurora")   return { className: "p-[3px] rounded-full", style: { background: "linear-gradient(135deg, #00ffd1, #b388ff, #ff80ab)" } };
  if (k === "frame_galaxy")   return { className: "p-[3px] rounded-full", style: { background: "linear-gradient(135deg, #1a0040, #6a00ff, #00b8ff, #1a0040)" } };
  if (k === "frame_holo")     return { className: "p-[3px] rounded-full", style: { background: "linear-gradient(135deg, #ff00cc, #00ffff, #ffff00, #00ffaa)" } };
  if (k === "frame_diamond")  return { className: "p-[3px] rounded-full shadow-[0_0_18px_hsl(190_100%_70%)]", style: { background: "linear-gradient(135deg, #e0f7fa, #b2ebf2, #80deea, #e0f7fa)" } };
  if (k === "frame_phoenix")  return { className: "p-[3px] rounded-full shadow-[0_0_18px_hsl(20_100%_55%)]", style: { background: "linear-gradient(135deg, #ff0000, #ff8c00, #ffd000, #ff0000)" } };
  if (k === "frame_dragon")   return { className: "p-[3px] rounded-full shadow-[0_0_16px_hsl(140_100%_45%)]", style: { background: "linear-gradient(135deg, #003300, #00b300, #66ff66, #003300)" } };
  if (k === "frame_cosmic")   return { className: "p-[3px] rounded-full shadow-[0_0_18px_hsl(280_100%_60%)]", style: { background: "linear-gradient(135deg, #000033, #6600cc, #ff00ff, #000033)" } };
  if (k === "frame_celestial") return { className: "p-[3px] rounded-full shadow-[0_0_18px_hsl(50_100%_70%)]", style: { background: "linear-gradient(135deg, #fff5cc, #ffd700, #ffaa00, #fff5cc)" } };
  if (k === "frame_thunder")  return { className: "p-[3px] rounded-full shadow-[0_0_18px_hsl(60_100%_60%)]", style: { background: "linear-gradient(135deg, #1a1a40, #ffff00, #ffffff, #1a1a40)" } };
  /* ===== Phase 2 — new frames ===== */
  if (k === "frame_emerald")  return { className: "p-[3px] rounded-full shadow-[0_0_16px_hsl(150_85%_45%)]", style: { background: "linear-gradient(135deg, #064e3b, #10b981, #6ee7b7, #064e3b)" } };
  if (k === "frame_ruby")     return { className: "p-[3px] rounded-full shadow-[0_0_16px_hsl(0_85%_55%)]",   style: { background: "linear-gradient(135deg, #7f1d1d, #ef4444, #fca5a5, #7f1d1d)" } };
  if (k === "frame_sapphire") return { className: "p-[3px] rounded-full shadow-[0_0_16px_hsl(220_85%_55%)]", style: { background: "linear-gradient(135deg, #1e3a8a, #3b82f6, #93c5fd, #1e3a8a)" } };
  if (k === "frame_sun")      return { className: "p-[3px] rounded-full shadow-[0_0_18px_hsl(40_100%_55%)]", style: { background: "radial-gradient(circle, #fef3c7, #f59e0b, #b45309)" } };
  if (k === "frame_moon")     return { className: "p-[3px] rounded-full shadow-[0_0_16px_hsl(220_60%_75%)]", style: { background: "radial-gradient(circle, #f1f5f9, #94a3b8, #475569)" } };
  if (k === "frame_shooting_stars") return { className: "ring-2 ring-indigo-400 shadow-[0_0_14px_hsl(240_80%_60%)]", style: {} };
  if (k === "frame_crystal_blue")   return { className: "p-[3px] rounded-full shadow-[0_0_14px_hsl(195_100%_60%)]", style: { background: "linear-gradient(135deg, #0e7490, #22d3ee, #cffafe, #0e7490)" } };
  if (k === "frame_pixel")    return { className: "ring-[3px] ring-emerald-400 shadow-[0_0_10px_hsl(150_85%_45%)]", style: {} };
  if (k === "frame_marker_pink") return { className: "ring-[3px] ring-pink-400", style: {} };
  /* ===== Creator-exclusive ===== */
  if (k === "frame_origine") {
    // The ornate ring is rendered by the PNG overlay (FrameDecor "above" layer).
    // Here we only add a subtle warm glow so the avatar feels lit from within,
    // without competing with the photoreal liquid-gold ring on top.
    return {
      className: "rounded-full shadow-[0_0_28px_hsl(40_100%_55%/0.45)]",
      style: {},
    };
  }
  /* ===== Queen-exclusive (Léna) ===== */
  if (k === "frame_reine") {
    // The ornate rose-gold ring + crown are rendered by FrameDecor (PNG overlay).
    // Here we only add a soft pink-gold glow so the avatar feels lit from within.
    return {
      className: "rounded-full shadow-[0_0_28px_hsl(330_100%_75%/0.55)]",
      style: {},
    };
  }
  return { className: "ring-2 ring-offset-2 ring-offset-background ring-primary/40", style: {} };
}

export function backgroundStyle(itemKey: string | null | undefined): CSSProperties {
  if (!itemKey) return {};
  const k = itemKey;
  if (k === "bg_paper_white")  return { background: "hsl(45 30% 96%)" };
  if (k === "bg_paper_kraft")  return { background: "hsl(35 40% 80%)" };
  if (k === "bg_dotted")       return { backgroundColor: "hsl(45 30% 96%)", backgroundImage: "radial-gradient(hsl(0 0% 0% / 0.15) 1px, transparent 1px)", backgroundSize: "12px 12px" };
  if (k === "bg_grid")         return { backgroundColor: "hsl(45 30% 96%)", backgroundImage: "linear-gradient(hsl(0 0% 0% / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 0% / 0.1) 1px, transparent 1px)", backgroundSize: "16px 16px" };
  if (k === "bg_lined")        return { backgroundColor: "hsl(210 60% 98%)", backgroundImage: "linear-gradient(hsl(210 80% 70% / 0.5) 1px, transparent 1px)", backgroundSize: "100% 18px" };
  if (k === "bg_corkboard")    return { background: "repeating-radial-gradient(circle at 20% 30%, hsl(30 40% 55%), hsl(30 40% 50%) 2px), hsl(30 40% 55%)" };
  if (k === "bg_chalkboard")   return { background: "linear-gradient(180deg, hsl(150 25% 18%), hsl(150 30% 12%))" };
  if (k === "bg_pastel_pink")  return { background: "linear-gradient(135deg, hsl(340 100% 92%), hsl(310 100% 88%))" };
  if (k === "bg_pastel_blue")  return { background: "linear-gradient(135deg, hsl(200 100% 92%), hsl(220 100% 88%))" };
  if (k === "bg_pastel_mint")  return { background: "linear-gradient(135deg, hsl(150 70% 90%), hsl(170 70% 86%))" };
  if (k === "bg_cherry")       return { background: "linear-gradient(135deg, hsl(340 100% 70%), hsl(0 80% 60%))" };
  if (k === "bg_sunset")       return { background: "linear-gradient(135deg, #ff6a00, #ee0979)" };
  if (k === "bg_sunrise")      return { background: "linear-gradient(135deg, #ffe259, #ffa751)" };
  if (k === "bg_ocean")        return { background: "linear-gradient(135deg, #2193b0, #6dd5ed)" };
  if (k === "bg_forest")       return { background: "linear-gradient(135deg, #134e5e, #71b280)" };
  if (k === "bg_library")      return { background: "linear-gradient(135deg, #654321, #8b6f47)" };
  if (k === "bg_galaxy")       return { background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)" };
  if (k === "bg_galaxy_swirl") return { background: "conic-gradient(from 180deg at 50% 50%, #1a0040, #6a00ff, #00b8ff, #1a0040)" };
  if (k === "bg_starfield")    return { backgroundColor: "#000020", backgroundImage: "radial-gradient(white 1px, transparent 1px), radial-gradient(white 1px, transparent 1px)", backgroundSize: "30px 30px, 50px 50px", backgroundPosition: "0 0, 15px 25px" };
  if (k === "bg_aurora")       return { background: "linear-gradient(135deg, #00ffd1, #b388ff, #ff80ab)" };
  if (k === "bg_nebula")       return { background: "radial-gradient(circle at 30% 40%, #ff00cc, transparent 50%), radial-gradient(circle at 70% 60%, #00ffff, transparent 50%), #1a0040" };
  if (k === "bg_neon_city")    return { background: "linear-gradient(180deg, #1a0033, #ff00aa)" };
  if (k === "bg_underwater")   return { background: "linear-gradient(180deg, #006994, #00aaff)" };
  if (k === "bg_lightning")    return { background: "linear-gradient(135deg, #232526, #ffd700)" };
  if (k === "bg_volcano")      return { background: "linear-gradient(180deg, #1a0000, #ff4500, #ffaa00)" };
  if (k === "bg_holographic")  return { background: "linear-gradient(135deg, #ff00cc, #00ffff, #ffff00, #00ffaa)" };
  if (k === "bg_cosmic_void")  return { background: "radial-gradient(circle at 50% 50%, #6600cc, #000033)" };
  if (k === "bg_crystal_cave") return { background: "linear-gradient(135deg, #4a148c, #00bcd4, #4a148c)" };
  if (k === "bg_dimension")    return { background: "conic-gradient(from 90deg at 50% 50%, #ff00cc, #00ffff, #ffff00, #00ffaa, #ff00cc)" };
  if (k === "bg_phoenix_fire") return { background: "radial-gradient(ellipse at 50% 100%, #ffd700, #ff4500, #8b0000)" };
  if (k === "bg_celestial_temple") return { background: "linear-gradient(180deg, #fff5cc, #ffd700, #ffaa00)" };
  /* ===== Phase 2 — new backgrounds (rich CSS gradients) ===== */
  if (k === "bg_tropical_sunset") return { background: "linear-gradient(180deg, #fef3c7 0%, #fb923c 35%, #db2777 65%, #4c1d95 100%)" };
  if (k === "bg_polar_dawn")      return { background: "linear-gradient(180deg, #fbcfe8 0%, #c4b5fd 40%, #93c5fd 75%, #e0f2fe 100%)" };
  if (k === "bg_mountain_mist")   return { background: "linear-gradient(180deg, #e0f2fe 0%, #cbd5e1 50%, #64748b 100%)" };
  if (k === "bg_enchanted_forest") return { background: "radial-gradient(ellipse at 30% 20%, hsl(150 60% 60% / 0.4), transparent 50%), radial-gradient(ellipse at 70% 80%, hsl(280 60% 50% / 0.3), transparent 50%), linear-gradient(180deg, #064e3b 0%, #022c22 100%)" };
  if (k === "bg_deep_sea")        return { background: "radial-gradient(ellipse at 50% 30%, hsl(190 80% 50% / 0.5), transparent 60%), linear-gradient(180deg, #0c4a6e 0%, #082f49 50%, #020617 100%)" };
  if (k === "bg_golden_desert")   return { background: "linear-gradient(180deg, #fef08a 0%, #fbbf24 35%, #d97706 70%, #78350f 100%)" };
  if (k === "bg_violet_crystal")  return { background: "radial-gradient(ellipse at 30% 50%, hsl(280 100% 60% / 0.6), transparent 50%), radial-gradient(ellipse at 70% 60%, hsl(220 100% 50% / 0.5), transparent 55%), linear-gradient(135deg, #1e1b4b 0%, #0f0a2e 100%)" };
  if (k === "bg_thunderstorm")    return { background: "radial-gradient(ellipse at 50% 30%, hsl(220 50% 30% / 0.8), transparent 50%), linear-gradient(180deg, #1e293b 0%, #0f172a 60%, #020617 100%)" };
  if (k === "bg_pastel_lavender") return { background: "linear-gradient(135deg, hsl(270 100% 92%), hsl(290 100% 88%))" };
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
  return { background: "hsl(var(--muted))" };
}

/**
 * Visual mapping for cosmetic items.
 * item_key → CSS recipe (frame ring/border, background gradient/pattern).
 */
import type { CSSProperties } from "react";

export type Rarity = "common" | "rare" | "epic" | "legendary";

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Commun", rare: "Rare", epic: "Épique", legendary: "Légendaire",
};
export const RARITY_RING: Record<Rarity, string> = {
  common: "ring-muted-foreground/40",
  rare: "ring-blue-400",
  epic: "ring-purple-500",
  legendary: "ring-yellow-400",
};
export const RARITY_TEXT: Record<Rarity, string> = {
  common: "text-muted-foreground",
  rare: "text-blue-500",
  epic: "text-purple-500",
  legendary: "text-yellow-500",
};
export const RARITY_BORDER: Record<Rarity, string> = {
  common: "border-muted-foreground/40",
  rare: "border-blue-400",
  epic: "border-purple-500",
  legendary: "border-yellow-400",
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
  return { background: "hsl(var(--muted))" };
}

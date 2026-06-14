/**
 * Static maps from cosmetic item_key → generated WebP asset URL.
 * Uses Vite's import.meta.glob so all images are bundled and hashed automatically.
 */

const stickerMods = import.meta.glob(
  "/src/assets/cosmetics/gen_opt/sticker/*.webp",
  { eager: true, query: "?url", import: "default" },
) as Record<string, string>;

const frameMods = import.meta.glob(
  "/src/assets/cosmetics/gen_opt/frame/*.webp",
  { eager: true, query: "?url", import: "default" },
) as Record<string, string>;

const bgMods = import.meta.glob(
  "/src/assets/cosmetics/gen_opt/background/*.webp",
  { eager: true, query: "?url", import: "default" },
) as Record<string, string>;

function toKey(path: string): string {
  const file = path.split("/").pop() ?? "";
  return file.replace(/\.webp$/, "");
}

function buildMap(mods: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, url] of Object.entries(mods)) out[toKey(path)] = url;
  return out;
}

export const STICKER_SRC: Record<string, string> = buildMap(stickerMods);
export const FRAME_SRC: Record<string, string> = buildMap(frameMods);
export const BG_SRC: Record<string, string> = buildMap(bgMods);

/** Legendary tier — strongest glow. */
export const LEGENDARY_STICKERS = new Set([
  "sticker_crown_royal", "sticker_dragon", "sticker_galaxy", "sticker_lion", "sticker_phoenix",
]);
export const LEGENDARY_FRAMES = new Set([
  "frame_cosmic", "frame_diamond", "frame_dragon", "frame_phoenix",
]);

/** Epic tier — medium glow. */
export const EPIC_STICKERS = new Set([
  "sticker_cosmic_eye", "sticker_crown", "sticker_diamond", "sticker_fire_heart",
  "sticker_infinity", "sticker_meteor", "sticker_ninja", "sticker_third_eye",
  "sticker_trophy_gold", "sticker_unicorn", "sticker_wizard",
]);
export const EPIC_FRAMES = new Set([
  "frame_aurora", "frame_celestial", "frame_fire", "frame_galaxy", "frame_gold",
  "frame_holo", "frame_lightning", "frame_rainbow",
  "frame_summer_gold_sun", "frame_summer_lagoon", "frame_summer_neon", "frame_thunder",
]);

/** Per-key glow recipe for legendary items (semantic colors). */
export const STICKER_GLOW: Record<string, string> = {
  sticker_phoenix:     "drop-shadow(0 0 4px hsl(20 100% 55% / 0.85)) drop-shadow(0 0 10px hsl(35 100% 55% / 0.55))",
  sticker_dragon:      "drop-shadow(0 0 4px hsl(140 100% 45% / 0.85)) drop-shadow(0 0 10px hsl(150 80% 40% / 0.5))",
  sticker_crown_royal: "drop-shadow(0 0 4px hsl(45 100% 55% / 0.9)) drop-shadow(0 0 10px hsl(45 90% 50% / 0.5))",
  sticker_galaxy:      "drop-shadow(0 0 4px hsl(280 100% 65% / 0.85)) drop-shadow(0 0 10px hsl(220 100% 60% / 0.5))",
  sticker_lion:        "drop-shadow(0 0 4px hsl(35 100% 55% / 0.9)) drop-shadow(0 0 10px hsl(20 100% 50% / 0.55))",
};

export const FRAME_GLOW: Record<string, string> = {
  frame_phoenix: "drop-shadow(0 0 6px hsl(20 100% 55% / 0.85)) drop-shadow(0 0 14px hsl(35 100% 55% / 0.55))",
  frame_dragon:  "drop-shadow(0 0 6px hsl(140 100% 45% / 0.85)) drop-shadow(0 0 14px hsl(150 80% 40% / 0.5))",
  frame_diamond: "drop-shadow(0 0 6px hsl(200 100% 80% / 0.9)) drop-shadow(0 0 14px hsl(220 100% 70% / 0.55))",
  frame_cosmic:  "drop-shadow(0 0 6px hsl(280 100% 65% / 0.85)) drop-shadow(0 0 14px hsl(220 100% 60% / 0.5))",
  frame_galaxy:  "drop-shadow(0 0 6px hsl(280 100% 65% / 0.85)) drop-shadow(0 0 14px hsl(220 100% 60% / 0.5))",
  frame_gold:    "drop-shadow(0 0 6px hsl(45 100% 60% / 0.9)) drop-shadow(0 0 14px hsl(38 100% 55% / 0.5))",
};

/** Default soft glow for epic items without a per-key entry. */
export const EPIC_DEFAULT_GLOW =
  "drop-shadow(0 0 4px hsl(280 50% 55% / 0.5)) drop-shadow(0 0 10px hsl(280 50% 55% / 0.3))";

/** Default soft shadow for common/rare items so they pop slightly. */
export const SOFT_SHADOW =
  "drop-shadow(0 2px 4px hsl(0 0% 0% / 0.25))";

export function stickerGlow(itemKey: string): string {
  if (STICKER_GLOW[itemKey]) return STICKER_GLOW[itemKey];
  if (LEGENDARY_STICKERS.has(itemKey)) return STICKER_GLOW.sticker_phoenix;
  if (EPIC_STICKERS.has(itemKey)) return EPIC_DEFAULT_GLOW;
  return SOFT_SHADOW;
}

export function frameGlow(itemKey: string): string {
  if (FRAME_GLOW[itemKey]) return FRAME_GLOW[itemKey];
  if (LEGENDARY_FRAMES.has(itemKey)) return FRAME_GLOW.frame_phoenix;
  if (EPIC_FRAMES.has(itemKey)) return EPIC_DEFAULT_GLOW;
  return SOFT_SHADOW;
}
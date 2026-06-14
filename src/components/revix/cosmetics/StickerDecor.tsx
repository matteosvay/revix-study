import { STICKER_SRC, stickerGlow } from "@/lib/cosmetics-assets";

/** Tells caller whether this item_key has a dedicated visual (vs. emoji fallback). */
export function hasCustomSticker(itemKey?: string | null) {
  if (!itemKey) return false;
  if (itemKey === "sticker_origine") return true;
  return itemKey in STICKER_SRC;
}

/**
 * Renders the equipped sticker. For all generated stickers, this is just an
 * <img> with a rarity-tuned glow. The creator-exclusive `sticker_origine` is
 * still rendered as an animated SVG.
 */
export function StickerDecor({
  itemKey,
  className = "",
}: {
  itemKey?: string | null;
  className?: string;
}) {
  if (!itemKey) return null;

  if (itemKey === "sticker_origine") {
    return (
      <svg viewBox="0 0 32 32" className={className} aria-hidden>
        <defs>
          <linearGradient id="ori-st-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff7c2" />
            <stop offset="50%" stopColor="#ffd166" />
            <stop offset="100%" stopColor="#7a4a00" />
          </linearGradient>
          <radialGradient id="ori-st-aura" cx="50%" cy="50%" r="50%">
            <stop offset="55%" stopColor="#ffd166" stopOpacity="0" />
            <stop offset="100%" stopColor="#ffaa00" stopOpacity="0.55" />
          </radialGradient>
        </defs>
        <circle cx="16" cy="16" r="15" fill="url(#ori-st-aura)">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx="16" cy="16" r="13" fill="#1a0d00" stroke="url(#ori-st-gold)" strokeWidth="1.2" />
        <circle cx="16" cy="16" r="11" fill="none" stroke="#ffd166" strokeWidth="0.4" strokeDasharray="1 1.5" />
        <text x="16" y="22" textAnchor="middle" fontFamily="serif" fontWeight="800" fontSize="16" fill="url(#ori-st-gold)" stroke="#7a4a00" strokeWidth="0.4">M</text>
      </svg>
    );
  }

  const src = STICKER_SRC[itemKey];
  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      draggable={false}
      className={className}
      style={{ filter: stickerGlow(itemKey), objectFit: "contain" }}
    />
  );
}
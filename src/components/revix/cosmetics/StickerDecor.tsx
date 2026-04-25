import phoenixImg from "@/assets/cosmetics/sticker_phoenix.webp";
import dragonImg from "@/assets/cosmetics/sticker_dragon.webp";
import crownRoyalImg from "@/assets/cosmetics/sticker_crown_royal.webp";
import diamondImg from "@/assets/cosmetics/sticker_diamond.webp";
import galaxyImg from "@/assets/cosmetics/sticker_galaxy.webp";
import meteorImg from "@/assets/cosmetics/sticker_meteor.webp";
import infinityImg from "@/assets/cosmetics/sticker_infinity.webp";
import cosmicEyeImg from "@/assets/cosmetics/sticker_cosmic_eye.webp";
import lionImg from "@/assets/cosmetics/sticker_lion.webp";
import thirdEyeImg from "@/assets/cosmetics/sticker_third_eye.webp";
import wizardHatImg from "@/assets/cosmetics/sticker_wizard_hat.webp";
import fireHeartImg from "@/assets/cosmetics/sticker_fire_heart.webp";

/** Photoreal PNG/webp stickers (premium legendary) — keyed by item_key. */
const PNG_STICKERS: Record<string, { src: string; glow: string }> = {
  sticker_phoenix:     { src: phoenixImg,    glow: "drop-shadow(0 0 6px hsl(20 100% 55% / 0.9)) drop-shadow(0 0 14px hsl(35 100% 55% / 0.7))" },
  sticker_dragon:      { src: dragonImg,     glow: "drop-shadow(0 0 6px hsl(140 100% 45% / 0.9)) drop-shadow(0 0 12px hsl(150 80% 40% / 0.6))" },
  sticker_crown_royal: { src: crownRoyalImg, glow: "drop-shadow(0 0 6px hsl(45 100% 55% / 0.9)) drop-shadow(0 0 12px hsl(45 90% 50% / 0.5))" },
  sticker_diamond:     { src: diamondImg,    glow: "drop-shadow(0 0 6px hsl(200 100% 75% / 0.95)) drop-shadow(0 0 14px hsl(220 100% 65% / 0.6))" },
  sticker_galaxy:      { src: galaxyImg,     glow: "drop-shadow(0 0 8px hsl(300 100% 65% / 0.85)) drop-shadow(0 0 16px hsl(280 100% 60% / 0.5))" },
  sticker_meteor:      { src: meteorImg,     glow: "drop-shadow(0 0 6px hsl(25 100% 55% / 0.95)) drop-shadow(0 0 14px hsl(45 100% 60% / 0.6))" },
  sticker_infinity:    { src: infinityImg,   glow: "drop-shadow(0 0 6px hsl(180 100% 60% / 0.85)) drop-shadow(0 0 14px hsl(320 100% 65% / 0.55))" },
  sticker_cosmic_eye:  { src: cosmicEyeImg,  glow: "drop-shadow(0 0 6px hsl(280 100% 65% / 0.9)) drop-shadow(0 0 14px hsl(45 100% 55% / 0.5))" },
  sticker_lion:        { src: lionImg,       glow: "drop-shadow(0 0 6px hsl(35 100% 55% / 0.95)) drop-shadow(0 0 14px hsl(20 100% 50% / 0.6))" },
  sticker_third_eye:   { src: thirdEyeImg,   glow: "drop-shadow(0 0 6px hsl(220 100% 70% / 0.9)) drop-shadow(0 0 14px hsl(280 100% 65% / 0.55))" },
  sticker_wizard_hat:  { src: wizardHatImg,  glow: "drop-shadow(0 0 6px hsl(280 100% 60% / 0.9)) drop-shadow(0 0 14px hsl(45 100% 55% / 0.5))" },
  sticker_fire_heart:  { src: fireHeartImg,  glow: "drop-shadow(0 0 6px hsl(15 100% 55% / 0.95)) drop-shadow(0 0 14px hsl(35 100% 55% / 0.65))" },
};

/** SVG-only custom stickers (still drawn inline) */
const SVG_STICKERS = new Set([
  "sticker_crown", "sticker_crown_simple", "sticker_unicorn", "sticker_wizard",
  "sticker_ninja", "sticker_alien", "sticker_trophy_gold",
  "sticker_lightning", "sticker_rocket", "sticker_medal", "sticker_trophy_bronze",
  "sticker_trophy_silver", "sticker_sparkles", "sticker_origine",
]);

export function hasCustomSticker(itemKey?: string | null) {
  return !!itemKey && (itemKey in PNG_STICKERS || SVG_STICKERS.has(itemKey));
}

/**
 * Custom SVG sticker rendered as a self-contained inline element (uses currentSize via wrapper).
 * For epic+ stickers, we replace the plain emoji with a richly drawn animated SVG.
 * Returns null for stickers we don't have a custom design for (caller falls back to emoji).
 */
export function StickerDecor({ itemKey, className }: { itemKey?: string | null; className?: string }) {
  if (!itemKey) return null;
  const wrap = `inline-block ${className ?? ""}`;

  // Photoreal PNG sticker — wraps in a span with subtle glow + breathing animation
  if (itemKey in PNG_STICKERS) {
    const { src, glow } = PNG_STICKERS[itemKey];
    return (
      <span className={`${wrap} relative`}>
        <img
          src={src}
          alt=""
          loading="lazy"
          width={256}
          height={256}
          className="block w-full h-full object-contain animate-cosmetic-breathe"
          style={{ filter: glow }}
          draggable={false}
        />
      </span>
    );
  }

  switch (itemKey) {
    /* =========== EPIC =========== */
    case "sticker_crown":
    case "sticker_crown_simple":
      return (
        <span className={wrap}>
          <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible">
            <path d="M5 22 L7 12 L12 17 L16 8 L20 17 L25 12 L27 22 Z" fill="#fde047" stroke="#7c2d12" strokeWidth="0.8" />
            <rect x="5" y="22" width="22" height="3" fill="#facc15" stroke="#7c2d12" strokeWidth="0.8" />
            <circle cx="16" cy="8" r="1.4" fill="#ef4444" stroke="#7f1d1d" strokeWidth="0.3" />
          </svg>
        </span>
      );

    case "sticker_unicorn":
      return (
        <span className={wrap}>
          <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="st-uc-horn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <ellipse cx="16" cy="20" rx="11" ry="9" fill="#fff" stroke="#7c3aed" strokeWidth="0.8" />
            <circle cx="11" cy="18" r="1.2" fill="#000" />
            <path d="M19 16 Q 22 19 22 22" stroke="#000" strokeWidth="1" fill="none" />
            <path d="M14 8 L16 2 L18 8 Z" fill="url(#st-uc-horn)" stroke="#581c87" strokeWidth="0.5" />
            <path d="M8 12 Q 6 8 4 6" stroke="#f472b6" strokeWidth="2" fill="none" />
            <path d="M8 12 Q 6 12 5 14" stroke="#22d3ee" strokeWidth="2" fill="none" />
          </svg>
        </span>
      );

    case "sticker_wizard":
      return (
        <span className={wrap}>
          <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible">
            <path d="M16 3 L24 18 L8 18 Z" fill="#4c1d95" stroke="#1e1b4b" strokeWidth="0.6" />
            <circle cx="20" cy="10" r="0.6" fill="#fde047" />
            <circle cx="14" cy="14" r="0.5" fill="#fff" />
            <circle cx="18" cy="15" r="0.4" fill="#22d3ee" />
            <ellipse cx="16" cy="22" rx="8" ry="6" fill="#fde2c4" stroke="#7c2d12" strokeWidth="0.6" />
            <path d="M10 26 Q 16 30 22 26" stroke="#7c2d12" strokeWidth="0.6" fill="#7c2d12" />
            <circle cx="13" cy="22" r="0.6" fill="#000" />
            <circle cx="19" cy="22" r="0.6" fill="#000" />
          </svg>
        </span>
      );

    case "sticker_ninja":
      return (
        <span className={wrap}>
          <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible">
            <circle cx="16" cy="16" r="12" fill="#1f2937" stroke="#000" strokeWidth="0.8" />
            <rect x="4" y="14" width="24" height="4" fill="#111" />
            <ellipse cx="11" cy="16" rx="2.5" ry="1.5" fill="#fff" />
            <ellipse cx="21" cy="16" rx="2.5" ry="1.5" fill="#fff" />
            <circle cx="11" cy="16" r="0.8" fill="#000" />
            <circle cx="21" cy="16" r="0.8" fill="#000" />
          </svg>
        </span>
      );

    case "sticker_alien":
      return (
        <span className={wrap}>
          <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible">
            <ellipse cx="16" cy="16" rx="9" ry="11" fill="#86efac" stroke="#14532d" strokeWidth="0.8" />
            <ellipse cx="12" cy="14" rx="2.4" ry="3.5" fill="#000" />
            <ellipse cx="20" cy="14" rx="2.4" ry="3.5" fill="#000" />
            <ellipse cx="11" cy="13" rx="0.6" ry="1" fill="#fff" />
            <ellipse cx="19" cy="13" rx="0.6" ry="1" fill="#fff" />
            <path d="M13 22 Q 16 24 19 22" stroke="#14532d" strokeWidth="0.8" fill="none" />
          </svg>
        </span>
      );

    case "sticker_trophy_gold":
      return (
        <span className={wrap}>
          <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible">
            <path d="M10 6 L22 6 L21 16 Q 16 22 11 16 Z" fill="#fde047" stroke="#7c2d12" strokeWidth="0.8" />
            <path d="M10 8 Q 5 8 5 12 Q 5 16 10 16" stroke="#7c2d12" strokeWidth="0.8" fill="none" />
            <path d="M22 8 Q 27 8 27 12 Q 27 16 22 16" stroke="#7c2d12" strokeWidth="0.8" fill="none" />
            <rect x="14" y="20" width="4" height="4" fill="#fde047" stroke="#7c2d12" strokeWidth="0.6" />
            <rect x="10" y="24" width="12" height="3" fill="#fde047" stroke="#7c2d12" strokeWidth="0.6" />
            <text x="16" y="14" textAnchor="middle" fontSize="6" fontWeight="900" fill="#7c2d12">1</text>
          </svg>
        </span>
      );

    /* =========== RARE =========== */
    case "sticker_lightning":
      return (
        <span className={wrap}>
          <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible">
            <path d="M18 2 L8 18 L14 18 L12 30 L24 12 L18 12 Z" fill="#fde047" stroke="#7c2d12" strokeWidth="0.8" />
          </svg>
        </span>
      );

    case "sticker_rocket":
      return (
        <span className={wrap}>
          <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible">
            <path d="M16 2 Q 22 8 22 18 L 22 24 L 10 24 L 10 18 Q 10 8 16 2 Z" fill="#e5e7eb" stroke="#000" strokeWidth="0.8" />
            <circle cx="16" cy="14" r="2.5" fill="#22d3ee" stroke="#000" strokeWidth="0.6" />
            <path d="M10 20 L 6 26 L 10 24 Z" fill="#ef4444" stroke="#000" strokeWidth="0.6" />
            <path d="M22 20 L 26 26 L 22 24 Z" fill="#ef4444" stroke="#000" strokeWidth="0.6" />
            <path d="M14 24 Q 16 30 18 24" fill="#fb923c">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="0.5s" repeatCount="indefinite" />
            </path>
          </svg>
        </span>
      );

    case "sticker_medal":
    case "sticker_trophy_bronze":
    case "sticker_trophy_silver": {
      const c = itemKey === "sticker_trophy_silver" ? "#cbd5e1" : itemKey === "sticker_medal" ? "#facc15" : "#cd7f32";
      const dark = itemKey === "sticker_trophy_silver" ? "#475569" : itemKey === "sticker_medal" ? "#7c2d12" : "#5a3a1a";
      return (
        <span className={wrap}>
          <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible">
            <path d="M12 2 L20 2 L18 12 L14 12 Z" fill="#ef4444" stroke={dark} strokeWidth="0.6" />
            <circle cx="16" cy="20" r="9" fill={c} stroke={dark} strokeWidth="0.8" />
            <circle cx="16" cy="20" r="6" fill="none" stroke={dark} strokeWidth="0.5" />
            <text x="16" y="23" textAnchor="middle" fontSize="6" fontWeight="900" fill={dark}>★</text>
          </svg>
        </span>
      );
    }

    case "sticker_sparkles":
      return (
        <span className={wrap}>
          <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible">
            <path d="M16 2 L18 14 L30 16 L18 18 L16 30 L14 18 L2 16 L14 14 Z" fill="#fde047" stroke="#a16207" strokeWidth="0.6">
              <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="8s" repeatCount="indefinite" />
            </path>
            <circle cx="6" cy="6" r="1.2" fill="#fff" />
            <circle cx="26" cy="26" r="1" fill="#fff" />
          </svg>
        </span>
      );

    /* =========== CREATOR (exclusive) =========== */
    case "sticker_origine":
      return (
        <span className={wrap}>
          <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible">
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
            {/* Aura */}
            <circle cx="16" cy="16" r="15" fill="url(#ori-st-aura)">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="2.4s" repeatCount="indefinite" />
            </circle>
            {/* Wax-seal disc */}
            <circle cx="16" cy="16" r="13" fill="#1a0d00" stroke="url(#ori-st-gold)" strokeWidth="1.2" />
            <circle cx="16" cy="16" r="11" fill="none" stroke="#ffd166" strokeWidth="0.4" strokeDasharray="1 1.5" />
            {/* Calligraphic M */}
            <text x="16" y="22" textAnchor="middle" fontFamily="serif" fontWeight="800" fontSize="16" fill="url(#ori-st-gold)" stroke="#7a4a00" strokeWidth="0.4">M</text>
            {/* Sparkles */}
            {[
              { x: 6,  y: 6,  d: 0   },
              { x: 26, y: 7,  d: 0.4 },
              { x: 27, y: 25, d: 0.8 },
              { x: 5,  y: 26, d: 1.2 },
            ].map((s, i) => (
              <g key={i} transform={`translate(${s.x} ${s.y})`}>
                <path d="M0 -2 L0.6 -0.6 L2 0 L0.6 0.6 L0 2 L-0.6 0.6 L-2 0 L-0.6 -0.6 Z" fill="#fff7c2">
                  <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" begin={`${s.d}s`} repeatCount="indefinite" />
                  <animateTransform attributeName="transform" type="scale" values="0.6;1.2;0.6" dur="2s" begin={`${s.d}s`} repeatCount="indefinite" additive="sum" />
                </path>
              </g>
            ))}
          </svg>
        </span>
      );

    /* =========== COMMON — slightly stylized but lightweight =========== */
    default:
      return null;
  }
}
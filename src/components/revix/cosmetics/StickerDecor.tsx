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

/** SVG-only custom stickers. Rich materials with notebook hand-drawn outlines. */
const SVG_STICKERS = new Set([
  // Epic
  "sticker_crown", "sticker_unicorn", "sticker_wizard", "sticker_ninja", "sticker_alien", "sticker_trophy_gold",
  // Rare
  "sticker_crown_simple", "sticker_lightning", "sticker_rocket", "sticker_medal",
  "sticker_trophy_bronze", "sticker_trophy_silver", "sticker_sparkles",
  "sticker_summer_cocktail", "sticker_summer_dolphin", "sticker_summer_flamingo",
  "sticker_summer_jelly", "sticker_summer_pineapple", "sticker_summer_surf",
  // Common
  "sticker_apple", "sticker_book", "sticker_brain", "sticker_check", "sticker_fire",
  "sticker_heart", "sticker_pen", "sticker_pencil", "sticker_smiley", "sticker_star",
  "sticker_thumbs", "sticker_summer_flipflop", "sticker_summer_icecream",
  "sticker_summer_palm", "sticker_summer_sun",
  // Creator
  "sticker_origine",
]);

export function hasCustomSticker(itemKey?: string | null) {
  return !!itemKey && (itemKey in PNG_STICKERS || SVG_STICKERS.has(itemKey));
}

const INK = "#1a1a1a";
const PAPER_FILTER = "url(#sk-rough)";

/** Reusable hand-drawn paper filter + gold/silver gradients */
function CommonDefs() {
  return (
    <defs>
      <filter id="sk-rough" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
        <feDisplacementMap in="SourceGraphic" scale="0.4" />
      </filter>
      <linearGradient id="sk-gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff4b8" />
        <stop offset="45%" stopColor="#ffd34a" />
        <stop offset="100%" stopColor="#a86a00" />
      </linearGradient>
      <linearGradient id="sk-silver" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="50%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <linearGradient id="sk-bronze" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f5c187" />
        <stop offset="50%" stopColor="#c87a2c" />
        <stop offset="100%" stopColor="#5a3a1a" />
      </linearGradient>
      <radialGradient id="sk-ruby" cx="35%" cy="35%" r="70%">
        <stop offset="0%" stopColor="#ffe1e1" />
        <stop offset="40%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#7f1d1d" />
      </radialGradient>
      <linearGradient id="sk-flame" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="50%" stopColor="#fb923c" />
        <stop offset="100%" stopColor="#dc2626" />
      </linearGradient>
      <linearGradient id="sk-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#bae6fd" />
        <stop offset="100%" stopColor="#0ea5e9" />
      </linearGradient>
    </defs>
  );
}

function Wrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-block ${className ?? ""}`}>{children}</span>;
}

/**
 * Custom SVG sticker — rich materials, notebook-style ink outlines.
 */
export function StickerDecor({ itemKey, className }: { itemKey?: string | null; className?: string }) {
  if (!itemKey) return null;
  const wrap = `inline-block ${className ?? ""}`;

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

  // ====== Helper SVG wrapper ======
  const svg = (children: React.ReactNode) => (
    <span className={wrap}>
      <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible">
        <CommonDefs />
        {children}
      </svg>
    </span>
  );

  switch (itemKey) {
    /* ============================ EPIC ============================ */

    // EPIC crown — tall, ornate, with jewels and velvet band (clearly grander than the rare one)
    case "sticker_crown":
      return svg(
        <g filter={PAPER_FILTER}>
          {/* Velvet band */}
          <rect x="4" y="22" width="24" height="5" rx="0.6" fill="#7f1d1d" stroke={INK} strokeWidth="0.8" />
          <rect x="4" y="25" width="24" height="0.6" fill="#fbbf24" />
          {/* Crown body — five points with curved valleys */}
          <path
            d="M4 22 L6 10 Q 8 14 10 11 L13 6 Q 14.5 10 16 6 L19 6 Q 20.5 10 22 11 L26 10 L28 22 Z"
            fill="url(#sk-gold)"
            stroke={INK}
            strokeWidth="0.9"
            strokeLinejoin="round"
          />
          {/* Specular highlight */}
          <path d="M6.5 14 Q 9 11 10 13" stroke="#fff8c4" strokeWidth="0.6" fill="none" opacity="0.8" />
          {/* Jewels on points */}
          <circle cx="6" cy="10" r="1.4" fill="url(#sk-ruby)" stroke={INK} strokeWidth="0.4" />
          <circle cx="16" cy="6" r="1.6" fill="#10b981" stroke={INK} strokeWidth="0.4" />
          <circle cx="26" cy="10" r="1.4" fill="#3b82f6" stroke={INK} strokeWidth="0.4" />
          {/* Pearls on band */}
          <circle cx="9"  cy="24.5" r="0.7" fill="#fef3c7" stroke={INK} strokeWidth="0.3" />
          <circle cx="16" cy="24.5" r="0.9" fill="url(#sk-ruby)" stroke={INK} strokeWidth="0.3" />
          <circle cx="23" cy="24.5" r="0.7" fill="#fef3c7" stroke={INK} strokeWidth="0.3" />
          {/* Tiny sparkle */}
          <path d="M16 3 L16.4 4.6 L18 5 L16.4 5.4 L16 7 L15.6 5.4 L14 5 L15.6 4.6 Z" fill="#fff8c4" />
        </g>
      );

    // EPIC unicorn — proper horse silhouette w/ mane
    case "sticker_unicorn":
      return svg(
        <g filter={PAPER_FILTER}>
          <defs>
            <linearGradient id="uc-horn" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
            <linearGradient id="uc-mane" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
            <radialGradient id="uc-body" cx="40%" cy="40%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e9d5ff" />
            </radialGradient>
          </defs>
          {/* Neck + head silhouette (profile, facing right) */}
          <path
            d="M5 26 Q 4 16 9 14 Q 11 9 16 9 Q 19 9 21 11 Q 26 12 27 18 L 27 22 Q 26 25 23 26 L 22 26 L 21 23 L 20 26 L 13 26 L 12 23 L 11 26 Z"
            fill="url(#uc-body)"
            stroke={INK}
            strokeWidth="0.9"
            strokeLinejoin="round"
          />
          {/* Mane flowing back */}
          <path d="M9 14 Q 6 12 4 14 Q 6 15 5 17 Q 7 17 6 19 Q 8 19 7 21" stroke="url(#uc-mane)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          {/* Ear */}
          <path d="M13 10 L14 7 L15 10 Z" fill="#e9d5ff" stroke={INK} strokeWidth="0.5" />
          {/* Horn — spiraled */}
          <path d="M16 9 L17.5 3 L19 9 Z" fill="url(#uc-horn)" stroke={INK} strokeWidth="0.5" />
          <path d="M16.7 7.5 L18.3 7.5 M16.9 6 L18.1 6 M17.1 4.5 L17.9 4.5" stroke={INK} strokeWidth="0.3" />
          {/* Eye + nostril */}
          <circle cx="22" cy="14.5" r="0.7" fill={INK} />
          <circle cx="22.3" cy="14.2" r="0.2" fill="#fff" />
          <ellipse cx="26.2" cy="17.5" rx="0.5" ry="0.7" fill={INK} />
          {/* Sparkle near horn */}
          <path d="M20 5 L20.3 6 L21 6.3 L20.3 6.6 L20 7.6 L19.7 6.6 L19 6.3 L19.7 6 Z" fill="#fff8c4" />
        </g>
      );

    // EPIC wizard — full robed sage with staff
    case "sticker_wizard":
      return svg(
        <g filter={PAPER_FILTER}>
          <defs>
            <linearGradient id="wz-robe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6d28d9" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>
            <radialGradient id="wz-orb" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#fff8c4" />
              <stop offset="60%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#7c2d12" />
            </radialGradient>
          </defs>
          {/* Robe */}
          <path d="M10 28 L10 18 Q 16 14 22 18 L 22 28 Z" fill="url(#wz-robe)" stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
          {/* Robe trim stars */}
          <circle cx="13" cy="22" r="0.4" fill="#fde047" />
          <circle cx="19" cy="24" r="0.4" fill="#fde047" />
          <circle cx="16" cy="26" r="0.3" fill="#fff" />
          {/* Beard */}
          <path d="M13 16 Q 16 22 19 16 Q 18 20 16 20 Q 14 20 13 16 Z" fill="#f1f5f9" stroke={INK} strokeWidth="0.5" />
          {/* Face */}
          <ellipse cx="16" cy="14" rx="3" ry="3.2" fill="#fcd9b6" stroke={INK} strokeWidth="0.6" />
          {/* Eyes (closed wise) */}
          <path d="M14.2 14 Q 14.7 13.6 15.2 14" stroke={INK} strokeWidth="0.5" fill="none" />
          <path d="M16.8 14 Q 17.3 13.6 17.8 14" stroke={INK} strokeWidth="0.5" fill="none" />
          {/* Hat */}
          <path d="M11 11 Q 16 -1 21 11 Z" fill="url(#wz-robe)" stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
          <path d="M10.5 11 L21.5 11" stroke={INK} strokeWidth="0.8" />
          {/* Hat band + star */}
          <rect x="10.5" y="10" width="11" height="1.4" fill="#fbbf24" stroke={INK} strokeWidth="0.4" />
          <path d="M16 4 L16.5 5.4 L17.9 5.6 L16.9 6.6 L17.2 8 L16 7.3 L14.8 8 L15.1 6.6 L14.1 5.6 L15.5 5.4 Z" fill="#fde047" stroke={INK} strokeWidth="0.3" />
          {/* Staff with orb */}
          <line x1="24" y1="6" x2="27" y2="28" stroke="#7c2d12" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="23.5" cy="5" r="2.2" fill="url(#wz-orb)" stroke={INK} strokeWidth="0.5">
            <animate attributeName="r" values="2.0;2.4;2.0" dur="2.4s" repeatCount="indefinite" />
          </circle>
          {/* Sparkles */}
          <circle cx="20" cy="3" r="0.5" fill="#fff8c4" />
          <circle cx="27" cy="9" r="0.4" fill="#fff8c4" />
        </g>
      );

    case "sticker_ninja":
      return svg(
        <g filter={PAPER_FILTER}>
          <defs>
            <radialGradient id="nj-skin" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#374151" />
              <stop offset="100%" stopColor="#0b0f19" />
            </radialGradient>
          </defs>
          <circle cx="16" cy="16" r="12" fill="url(#nj-skin)" stroke={INK} strokeWidth="0.9" />
          {/* Mask band */}
          <path d="M3 14 L29 14 L29 18 L3 18 Z" fill="#0b0f19" stroke={INK} strokeWidth="0.5" />
          {/* Tied knot at left */}
          <path d="M3 16 L0 14 L1 17 L0 19 L3 17 Z" fill="#0b0f19" stroke={INK} strokeWidth="0.5" />
          {/* Eyes — sharp almond */}
          <path d="M9 16 Q 11.5 14.5 14 16 Q 11.5 17.5 9 16 Z" fill="#fff" stroke={INK} strokeWidth="0.4" />
          <path d="M18 16 Q 20.5 14.5 23 16 Q 20.5 17.5 18 16 Z" fill="#fff" stroke={INK} strokeWidth="0.4" />
          <circle cx="11.5" cy="16" r="0.7" fill={INK} />
          <circle cx="20.5" cy="16" r="0.7" fill={INK} />
          {/* Highlight */}
          <ellipse cx="11" cy="9" rx="3" ry="1.2" fill="#fff" opacity="0.15" />
        </g>
      );

    case "sticker_alien":
      return svg(
        <g filter={PAPER_FILTER}>
          <defs>
            <radialGradient id="al-skin" cx="50%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#d9f99d" />
              <stop offset="60%" stopColor="#65a30d" />
              <stop offset="100%" stopColor="#1a2e05" />
            </radialGradient>
          </defs>
          {/* Big head */}
          <ellipse cx="16" cy="15" rx="9" ry="11" fill="url(#al-skin)" stroke={INK} strokeWidth="0.9" />
          {/* Cheek shadow */}
          <ellipse cx="11" cy="10" rx="3" ry="1.4" fill="#fff" opacity="0.18" />
          {/* Big black almond eyes */}
          <path d="M9 13 Q 8 19 13 19 Q 14 13 9 13 Z" fill="#000" stroke={INK} strokeWidth="0.4" />
          <path d="M23 13 Q 24 19 19 19 Q 18 13 23 13 Z" fill="#000" stroke={INK} strokeWidth="0.4" />
          <ellipse cx="10.5" cy="14.5" rx="0.5" ry="1" fill="#fff" />
          <ellipse cx="21.5" cy="14.5" rx="0.5" ry="1" fill="#fff" />
          {/* Tiny mouth */}
          <path d="M14 23 Q 16 24 18 23" stroke={INK} strokeWidth="0.6" fill="none" />
          {/* Antenna */}
          <line x1="16" y1="4" x2="16" y2="1" stroke={INK} strokeWidth="0.6" />
          <circle cx="16" cy="1" r="0.8" fill="#86efac" stroke={INK} strokeWidth="0.4" />
        </g>
      );

    case "sticker_trophy_gold":
      return svg(
        <g filter={PAPER_FILTER}>
          {/* Cup */}
          <path d="M10 5 L22 5 L21 16 Q 16 23 11 16 Z" fill="url(#sk-gold)" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
          {/* Handles */}
          <path d="M10 7 Q 5 7 5 12 Q 5 16 10 16" stroke={INK} strokeWidth="1" fill="none" />
          <path d="M22 7 Q 27 7 27 12 Q 27 16 22 16" stroke={INK} strokeWidth="1" fill="none" />
          {/* Stem + base */}
          <rect x="14" y="20" width="4" height="3" fill="url(#sk-gold)" stroke={INK} strokeWidth="0.6" />
          <path d="M9 23 L23 23 L21 27 L11 27 Z" fill="url(#sk-gold)" stroke={INK} strokeWidth="0.7" strokeLinejoin="round" />
          {/* Star inside */}
          <path d="M16 9 L17 12 L20 12 L17.7 14 L18.6 17 L16 15.3 L13.4 17 L14.3 14 L12 12 L15 12 Z" fill="#fff8c4" stroke={INK} strokeWidth="0.4" />
          {/* Highlight */}
          <path d="M11.5 8 Q 13 12 13 15" stroke="#fff8c4" strokeWidth="0.7" fill="none" opacity="0.8" />
        </g>
      );

    /* ============================ RARE ============================ */

    // RARE crown — small simple tiara, clearly different from epic
    case "sticker_crown_simple":
      return svg(
        <g filter={PAPER_FILTER}>
          {/* Tiara band */}
          <path d="M5 22 L7 14 L12 18 L16 12 L20 18 L25 14 L27 22 Z" fill="url(#sk-gold)" stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
          <rect x="5" y="22" width="22" height="2.4" fill="url(#sk-gold)" stroke={INK} strokeWidth="0.7" />
          {/* Single jewel */}
          <circle cx="16" cy="13" r="1.2" fill="url(#sk-ruby)" stroke={INK} strokeWidth="0.4" />
          {/* Tiny dots */}
          <circle cx="7" cy="14" r="0.5" fill="#fff8c4" />
          <circle cx="25" cy="14" r="0.5" fill="#fff8c4" />
        </g>
      );

    case "sticker_lightning":
      return svg(
        <g filter={PAPER_FILTER}>
          <path d="M19 2 L8 18 L14 18 L11 30 L24 12 L17 12 Z" fill="url(#sk-flame)" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
          <path d="M17 6 L13 14" stroke="#fff8c4" strokeWidth="0.6" fill="none" opacity="0.8" />
        </g>
      );

    case "sticker_rocket":
      return svg(
        <g filter={PAPER_FILTER}>
          <defs>
            <linearGradient id="rk-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>
          <path d="M16 2 Q 22 8 22 18 L 22 23 L 10 23 L 10 18 Q 10 8 16 2 Z" fill="url(#rk-body)" stroke={INK} strokeWidth="0.9" />
          <circle cx="16" cy="13" r="2.6" fill="url(#sk-sky)" stroke={INK} strokeWidth="0.6" />
          <circle cx="15" cy="12" r="0.8" fill="#fff" opacity="0.8" />
          <path d="M10 19 L 5 26 L 10 23 Z" fill="#ef4444" stroke={INK} strokeWidth="0.6" />
          <path d="M22 19 L 27 26 L 22 23 Z" fill="#ef4444" stroke={INK} strokeWidth="0.6" />
          {/* Flame */}
          <path d="M13 23 Q 14 30 16 27 Q 18 30 19 23 Z" fill="url(#sk-flame)" stroke={INK} strokeWidth="0.5">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="0.6s" repeatCount="indefinite" />
          </path>
        </g>
      );

    case "sticker_medal":
    case "sticker_trophy_bronze":
    case "sticker_trophy_silver": {
      const grad = itemKey === "sticker_trophy_silver" ? "url(#sk-silver)" : itemKey === "sticker_medal" ? "url(#sk-gold)" : "url(#sk-bronze)";
      const dark = itemKey === "sticker_trophy_silver" ? "#334155" : itemKey === "sticker_medal" ? "#7c2d12" : "#5a3a1a";
      return svg(
        <g filter={PAPER_FILTER}>
          {/* Ribbon */}
          <path d="M11 2 L21 2 L18 13 L14 13 Z" fill="#dc2626" stroke={INK} strokeWidth="0.7" strokeLinejoin="round" />
          <path d="M14 13 L11 2 L13 2 L16 11 Z" fill="#7f1d1d" opacity="0.7" />
          {/* Disc */}
          <circle cx="16" cy="21" r="9" fill={grad} stroke={INK} strokeWidth="0.9" />
          <circle cx="16" cy="21" r="6.5" fill="none" stroke={dark} strokeWidth="0.5" strokeDasharray="0.4 0.6" />
          {/* Star */}
          <path d="M16 16.5 L17.2 19.6 L20.4 19.8 L17.8 21.7 L18.7 24.8 L16 23 L13.3 24.8 L14.2 21.7 L11.6 19.8 L14.8 19.6 Z" fill="#fff8c4" stroke={dark} strokeWidth="0.4" />
          <path d="M11 17 Q 13 21 13 25" stroke="#fff" strokeWidth="0.6" fill="none" opacity="0.6" />
        </g>
      );
    }

    case "sticker_sparkles":
      return svg(
        <g filter={PAPER_FILTER}>
          <path d="M16 2 L18 14 L30 16 L18 18 L16 30 L14 18 L2 16 L14 14 Z" fill="url(#sk-gold)" stroke={INK} strokeWidth="0.7">
            <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="10s" repeatCount="indefinite" />
          </path>
          <circle cx="6" cy="6" r="1.2" fill="#fff8c4" stroke={INK} strokeWidth="0.3" />
          <circle cx="26" cy="26" r="1" fill="#fff8c4" stroke={INK} strokeWidth="0.3" />
          <circle cx="27" cy="6" r="0.7" fill="#fff" />
        </g>
      );

    /* ====== RARE — Summer set ====== */
    case "sticker_summer_cocktail":
      return svg(
        <g filter={PAPER_FILTER}>
          <defs>
            <linearGradient id="ck-liq" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#be123c" />
            </linearGradient>
          </defs>
          {/* Glass */}
          <path d="M6 8 L26 8 L17 20 L17 27 L22 28 L10 28 L15 27 L15 20 Z" fill="#e0f2fe" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" opacity="0.85" />
          {/* Drink */}
          <path d="M9 10 L23 10 L17 18 L15 18 Z" fill="url(#ck-liq)" stroke={INK} strokeWidth="0.5" />
          {/* Lemon slice */}
          <path d="M22 8 A 3 3 0 0 1 28 8 L25 8 Z" fill="#fde047" stroke={INK} strokeWidth="0.5" />
          {/* Straw */}
          <line x1="20" y1="4" x2="14" y2="18" stroke="#22d3ee" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="20" y1="4" x2="14" y2="18" stroke={INK} strokeWidth="0.4" strokeDasharray="0.6 0.6" />
          {/* Cherry */}
          <circle cx="20" cy="4" r="1.2" fill="#dc2626" stroke={INK} strokeWidth="0.4" />
        </g>
      );

    case "sticker_summer_dolphin":
      return svg(
        <g filter={PAPER_FILTER}>
          <defs>
            <linearGradient id="dl" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          <path d="M3 22 Q 8 8 18 8 Q 24 8 28 14 Q 24 14 22 11 Q 22 18 17 22 Q 28 22 28 26 Q 18 28 12 26 Q 5 27 3 22 Z" fill="url(#dl)" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
          {/* Belly */}
          <path d="M8 22 Q 14 26 22 23" stroke="#bae6fd" strokeWidth="1.2" fill="none" opacity="0.7" />
          {/* Eye */}
          <circle cx="22" cy="13" r="0.7" fill={INK} />
          <circle cx="22.2" cy="12.8" r="0.2" fill="#fff" />
          {/* Water splash */}
          <circle cx="6" cy="26" r="0.5" fill="#bae6fd" />
          <circle cx="9" cy="28" r="0.4" fill="#bae6fd" />
        </g>
      );

    case "sticker_summer_flamingo":
      return svg(
        <g filter={PAPER_FILTER}>
          <defs>
            <linearGradient id="fl" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fda4af" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>
          {/* Body */}
          <ellipse cx="14" cy="18" rx="7" ry="5" fill="url(#fl)" stroke={INK} strokeWidth="0.8" />
          {/* Neck */}
          <path d="M19 14 Q 22 8 20 4 Q 24 4 23 9 Q 27 10 25 13" stroke={INK} strokeWidth="1.2" fill="none" />
          <path d="M19 14 Q 22 8 20 4 Q 24 4 23 9 Q 27 10 25 13" stroke="url(#fl)" strokeWidth="2.4" fill="none" opacity="0.9" />
          {/* Beak */}
          <path d="M22 4 L26 5 L23 6 Z" fill="#fde047" stroke={INK} strokeWidth="0.4" />
          <path d="M24 5 L26 5.5" stroke={INK} strokeWidth="0.5" />
          {/* Eye */}
          <circle cx="22" cy="5" r="0.4" fill={INK} />
          {/* Legs */}
          <line x1="13" y1="22" x2="13" y2="29" stroke={INK} strokeWidth="0.7" />
          <line x1="16" y1="22" x2="16" y2="29" stroke={INK} strokeWidth="0.7" />
          <path d="M11 29 L15 29 M14 29 L18 29" stroke={INK} strokeWidth="0.7" />
          {/* Wing detail */}
          <path d="M10 17 Q 14 19 17 17" stroke={INK} strokeWidth="0.5" fill="none" />
        </g>
      );

    case "sticker_summer_jelly":
      return svg(
        <g filter={PAPER_FILTER}>
          <defs>
            <radialGradient id="jl" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#f5d0fe" />
              <stop offset="60%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#6b21a8" />
            </radialGradient>
          </defs>
          {/* Bell */}
          <path d="M5 16 Q 5 5 16 5 Q 27 5 27 16 Q 27 18 25 18 L 7 18 Q 5 18 5 16 Z" fill="url(#jl)" stroke={INK} strokeWidth="0.9" />
          {/* Bell highlight */}
          <path d="M9 9 Q 12 7 14 8" stroke="#fff" strokeWidth="0.6" fill="none" opacity="0.7" />
          {/* Spots */}
          <circle cx="13" cy="13" r="1" fill="#f0abfc" />
          <circle cx="19" cy="11" r="1.2" fill="#f0abfc" />
          <circle cx="22" cy="14" r="0.8" fill="#f0abfc" />
          {/* Tentacles */}
          <path d="M8 18 Q 9 24 7 28" stroke="#c084fc" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <path d="M12 18 Q 13 26 11 30" stroke="#c084fc" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <path d="M16 18 Q 17 25 15 30" stroke="#c084fc" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <path d="M20 18 Q 19 26 21 30" stroke="#c084fc" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <path d="M24 18 Q 25 24 23 28" stroke="#c084fc" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        </g>
      );

    case "sticker_summer_pineapple":
      return svg(
        <g filter={PAPER_FILTER}>
          <defs>
            <linearGradient id="pn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#a16207" />
            </linearGradient>
          </defs>
          {/* Leaves */}
          <path d="M16 2 L13 9 L17 7 L14 11 L18 9 L15 13 L19 11 L16 14 L20 13 L17 9 L19 6 L16 8 L18 3 L16 5 Z" fill="#22c55e" stroke={INK} strokeWidth="0.5" strokeLinejoin="round" />
          {/* Body */}
          <ellipse cx="16" cy="20" rx="8" ry="10" fill="url(#pn)" stroke={INK} strokeWidth="0.9" />
          {/* Diamond pattern */}
          <g stroke={INK} strokeWidth="0.4" fill="none">
            <line x1="11" y1="14" x2="21" y2="24" />
            <line x1="9" y1="18" x2="19" y2="28" />
            <line x1="13" y1="14" x2="23" y2="24" />
            <line x1="21" y1="14" x2="11" y2="24" />
            <line x1="23" y1="18" x2="13" y2="28" />
            <line x1="19" y1="14" x2="9" y2="24" />
          </g>
          {/* Dots */}
          {[[14,17],[18,17],[12,21],[16,21],[20,21],[14,25],[18,25]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r="0.5" fill="#7c2d12" />
          ))}
        </g>
      );

    case "sticker_summer_surf":
      return svg(
        <g filter={PAPER_FILTER}>
          <defs>
            <linearGradient id="sb" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="50%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          {/* Wave behind */}
          <path d="M0 24 Q 8 18 16 22 Q 24 26 32 20 L 32 32 L 0 32 Z" fill="url(#sk-sky)" stroke={INK} strokeWidth="0.6" />
          <path d="M2 22 Q 8 19 14 21" stroke="#fff" strokeWidth="0.6" fill="none" opacity="0.7" />
          {/* Board */}
          <g transform="rotate(-30 16 14)">
            <ellipse cx="16" cy="14" rx="3" ry="11" fill="url(#sb)" stroke={INK} strokeWidth="0.8" />
            <line x1="16" y1="4" x2="16" y2="24" stroke={INK} strokeWidth="0.4" strokeDasharray="0.6 0.6" />
            <path d="M16 22 L 17 24 L 15 24 Z" fill="#fb7185" stroke={INK} strokeWidth="0.4" />
          </g>
        </g>
      );

    /* ============================ COMMON ============================ */

    case "sticker_apple":
      return svg(
        <g filter={PAPER_FILTER}>
          <defs>
            <radialGradient id="ap" cx="35%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#fecaca" />
              <stop offset="60%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </radialGradient>
          </defs>
          <path d="M16 9 Q 8 9 8 18 Q 8 28 16 28 Q 24 28 24 18 Q 24 9 16 9 Z" fill="url(#ap)" stroke={INK} strokeWidth="0.9" />
          <path d="M12 13 Q 14 11 15 13" stroke="#fff" strokeWidth="0.6" fill="none" opacity="0.7" />
          {/* Stem + leaf */}
          <path d="M16 9 Q 16 5 18 4" stroke="#7c2d12" strokeWidth="0.9" fill="none" />
          <path d="M18 4 Q 22 4 21 8 Q 18 8 18 4 Z" fill="#22c55e" stroke={INK} strokeWidth="0.5" />
        </g>
      );

    case "sticker_book":
      return svg(
        <g filter={PAPER_FILTER}>
          <defs>
            <linearGradient id="bk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#172554" />
            </linearGradient>
          </defs>
          {/* Cover */}
          <path d="M5 6 L16 8 L27 6 L27 26 L16 28 L5 26 Z" fill="url(#bk)" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
          {/* Spine */}
          <line x1="16" y1="8" x2="16" y2="28" stroke={INK} strokeWidth="0.7" />
          {/* Pages */}
          <path d="M6 8 L16 10 L26 8 L26 24 L16 26 L6 24 Z" fill="#fef3c7" stroke={INK} strokeWidth="0.4" />
          {/* Lines */}
          <line x1="8" y1="13" x2="14" y2="14" stroke="#7c2d12" strokeWidth="0.3" />
          <line x1="8" y1="16" x2="14" y2="17" stroke="#7c2d12" strokeWidth="0.3" />
          <line x1="8" y1="19" x2="14" y2="20" stroke="#7c2d12" strokeWidth="0.3" />
          <line x1="18" y1="14" x2="24" y2="13" stroke="#7c2d12" strokeWidth="0.3" />
          <line x1="18" y1="17" x2="24" y2="16" stroke="#7c2d12" strokeWidth="0.3" />
          <line x1="18" y1="20" x2="24" y2="19" stroke="#7c2d12" strokeWidth="0.3" />
          {/* Bookmark */}
          <path d="M22 6 L22 14 L20 12 L18 14 L18 6 Z" fill="#dc2626" stroke={INK} strokeWidth="0.4" />
        </g>
      );

    case "sticker_brain":
      return svg(
        <g filter={PAPER_FILTER}>
          <defs>
            <radialGradient id="br" cx="50%" cy="40%" r="70%">
              <stop offset="0%" stopColor="#fbcfe8" />
              <stop offset="100%" stopColor="#be185d" />
            </radialGradient>
          </defs>
          {/* Two hemispheres */}
          <path d="M16 6 Q 6 6 6 16 Q 4 22 10 24 Q 12 28 16 26 Z" fill="url(#br)" stroke={INK} strokeWidth="0.9" />
          <path d="M16 6 Q 26 6 26 16 Q 28 22 22 24 Q 20 28 16 26 Z" fill="url(#br)" stroke={INK} strokeWidth="0.9" />
          {/* Folds */}
          <path d="M11 10 Q 9 13 11 15 Q 9 17 11 19" stroke={INK} strokeWidth="0.5" fill="none" />
          <path d="M21 10 Q 23 13 21 15 Q 23 17 21 19" stroke={INK} strokeWidth="0.5" fill="none" />
          <line x1="16" y1="6" x2="16" y2="26" stroke={INK} strokeWidth="0.5" />
          <path d="M14 13 Q 12 14 14 16" stroke={INK} strokeWidth="0.4" fill="none" />
          <path d="M18 13 Q 20 14 18 16" stroke={INK} strokeWidth="0.4" fill="none" />
        </g>
      );

    case "sticker_check":
      return svg(
        <g filter={PAPER_FILTER}>
          <defs>
            <radialGradient id="ck" cx="40%" cy="40%" r="70%">
              <stop offset="0%" stopColor="#86efac" />
              <stop offset="100%" stopColor="#15803d" />
            </radialGradient>
          </defs>
          <circle cx="16" cy="16" r="12" fill="url(#ck)" stroke={INK} strokeWidth="0.9" />
          <path d="M9 17 L14 22 L23 11" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 17 L14 22 L23 11" stroke={INK} strokeWidth="0.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );

    case "sticker_fire":
      return svg(
        <g filter={PAPER_FILTER}>
          <path d="M16 2 Q 22 8 22 14 Q 26 14 26 20 Q 26 28 16 30 Q 6 28 6 20 Q 6 14 10 14 Q 10 10 16 2 Z" fill="url(#sk-flame)" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
          {/* Inner flame */}
          <path d="M16 12 Q 19 16 18 22 Q 16 26 14 22 Q 13 16 16 12 Z" fill="#fef3c7" opacity="0.85" />
          <circle cx="16" cy="22" r="1.5" fill="#fde047" />
        </g>
      );

    case "sticker_heart":
      return svg(
        <g filter={PAPER_FILTER}>
          <defs>
            <radialGradient id="ht" cx="35%" cy="35%" r="80%">
              <stop offset="0%" stopColor="#fecaca" />
              <stop offset="50%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </radialGradient>
          </defs>
          <path d="M16 28 Q 4 19 4 11 Q 4 4 10 4 Q 14 4 16 8 Q 18 4 22 4 Q 28 4 28 11 Q 28 19 16 28 Z" fill="url(#ht)" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
          <path d="M9 8 Q 11 11 10 14" stroke="#fff" strokeWidth="0.8" fill="none" opacity="0.7" />
        </g>
      );

    case "sticker_pen":
      return svg(
        <g filter={PAPER_FILTER}>
          <defs>
            <linearGradient id="pn-body" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <g transform="rotate(-35 16 16)">
            {/* Body */}
            <rect x="8" y="14" width="16" height="4" rx="0.6" fill="url(#pn-body)" stroke={INK} strokeWidth="0.7" />
            {/* Gold ring */}
            <rect x="20" y="14" width="1.2" height="4" fill="url(#sk-gold)" stroke={INK} strokeWidth="0.3" />
            {/* Tip */}
            <path d="M24 14 L29 16 L24 18 Z" fill="url(#sk-gold)" stroke={INK} strokeWidth="0.6" />
            <line x1="24" y1="16" x2="29" y2="16" stroke={INK} strokeWidth="0.4" />
            {/* Cap clip */}
            <rect x="9" y="13" width="1" height="6" fill="url(#sk-gold)" stroke={INK} strokeWidth="0.3" />
            {/* Highlight */}
            <line x1="10" y1="15.4" x2="20" y2="15.4" stroke="#fff" strokeWidth="0.3" opacity="0.6" />
          </g>
        </g>
      );

    case "sticker_pencil":
      return svg(
        <g filter={PAPER_FILTER}>
          <g transform="rotate(-35 16 16)">
            {/* Wood body */}
            <rect x="6" y="14" width="14" height="4" fill="#fbbf24" stroke={INK} strokeWidth="0.7" />
            {/* Wood tip */}
            <path d="M20 14 L26 16 L20 18 Z" fill="#fde68a" stroke={INK} strokeWidth="0.6" />
            <path d="M24 16 L26 16 L24 17 Z" fill={INK} />
            {/* Ferrule */}
            <rect x="4" y="13.5" width="2" height="5" fill="#94a3b8" stroke={INK} strokeWidth="0.5" />
            <line x1="4.5" y1="14" x2="4.5" y2="18" stroke={INK} strokeWidth="0.3" />
            <line x1="5.5" y1="14" x2="5.5" y2="18" stroke={INK} strokeWidth="0.3" />
            {/* Eraser */}
            <rect x="1" y="13.5" width="3" height="5" rx="0.5" fill="#fb7185" stroke={INK} strokeWidth="0.6" />
            {/* Wood grain */}
            <line x1="8" y1="15" x2="18" y2="15" stroke={INK} strokeWidth="0.2" />
            <line x1="8" y1="17" x2="18" y2="17" stroke={INK} strokeWidth="0.2" />
          </g>
        </g>
      );

    case "sticker_smiley":
      return svg(
        <g filter={PAPER_FILTER}>
          <defs>
            <radialGradient id="sm" cx="40%" cy="40%" r="70%">
              <stop offset="0%" stopColor="#fef9c3" />
              <stop offset="100%" stopColor="#ca8a04" />
            </radialGradient>
          </defs>
          <circle cx="16" cy="16" r="12" fill="url(#sm)" stroke={INK} strokeWidth="0.9" />
          <ellipse cx="9" cy="11" rx="3" ry="1.2" fill="#fff8c4" opacity="0.6" />
          <circle cx="12" cy="14" r="1.2" fill={INK} />
          <circle cx="20" cy="14" r="1.2" fill={INK} />
          <circle cx="11.6" cy="13.6" r="0.4" fill="#fff" />
          <circle cx="19.6" cy="13.6" r="0.4" fill="#fff" />
          <path d="M10 19 Q 16 24 22 19" stroke={INK} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </g>
      );

    case "sticker_star":
      return svg(
        <g filter={PAPER_FILTER}>
          <path d="M16 3 L19.5 12 L29 12.5 L21.5 18.5 L24 28 L16 22.5 L8 28 L10.5 18.5 L3 12.5 L12.5 12 Z" fill="url(#sk-gold)" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
          <path d="M14 8 Q 11 12 12 16" stroke="#fff" strokeWidth="0.6" fill="none" opacity="0.7" />
        </g>
      );

    case "sticker_thumbs":
      return svg(
        <g filter={PAPER_FILTER}>
          <defs>
            <radialGradient id="th" cx="40%" cy="40%" r="70%">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#a16207" />
            </radialGradient>
          </defs>
          {/* Thumb up */}
          <path d="M11 14 L13 6 Q 14 4 16 6 L 16 13 L 24 13 Q 27 13 26 16 L 25 25 Q 24 28 21 28 L 13 28 L 11 28 Z" fill="url(#th)" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
          {/* Cuff */}
          <rect x="7" y="20" width="5" height="9" rx="0.6" fill="#1e3a8a" stroke={INK} strokeWidth="0.7" />
          {/* Knuckle lines */}
          <path d="M16 16 L24 16" stroke={INK} strokeWidth="0.4" />
          <path d="M16 19 L25 19" stroke={INK} strokeWidth="0.4" />
          <path d="M16 22 L25 22" stroke={INK} strokeWidth="0.4" />
        </g>
      );

    case "sticker_summer_flipflop":
      return svg(
        <g filter={PAPER_FILTER}>
          <ellipse cx="16" cy="20" rx="8" ry="10" fill="#22d3ee" stroke={INK} strokeWidth="0.9" />
          <ellipse cx="16" cy="20" rx="6.5" ry="8.5" fill="#67e8f9" stroke={INK} strokeWidth="0.4" />
          {/* Strap */}
          <path d="M16 12 L 12 18" stroke="#dc2626" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M16 12 L 20 18" stroke="#dc2626" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="16" cy="12" r="1" fill="#fde047" stroke={INK} strokeWidth="0.4" />
        </g>
      );

    case "sticker_summer_icecream":
      return svg(
        <g filter={PAPER_FILTER}>
          <defs>
            <linearGradient id="ic-c" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#a16207" />
            </linearGradient>
          </defs>
          {/* Cone */}
          <path d="M10 16 L22 16 L16 30 Z" fill="url(#ic-c)" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
          {/* Waffle */}
          <g stroke={INK} strokeWidth="0.4">
            <line x1="11" y1="20" x2="21" y2="20" />
            <line x1="13" y1="24" x2="19" y2="24" />
            <line x1="13" y1="16" x2="16" y2="28" />
            <line x1="19" y1="16" x2="16" y2="28" />
          </g>
          {/* Swirl */}
          <path d="M9 16 Q 8 12 12 11 Q 11 7 16 7 Q 21 7 20 11 Q 24 12 23 16 Z" fill="#fef3c7" stroke={INK} strokeWidth="0.9" />
          <path d="M11 13 Q 16 10 21 13" stroke="#fbbf24" strokeWidth="0.5" fill="none" />
          {/* Cherry */}
          <circle cx="16" cy="6" r="1.4" fill="#dc2626" stroke={INK} strokeWidth="0.4" />
          <path d="M16 5 Q 18 3 19 4" stroke="#22c55e" strokeWidth="0.5" fill="none" />
        </g>
      );

    case "sticker_summer_palm":
      return svg(
        <g filter={PAPER_FILTER}>
          {/* Trunk */}
          <path d="M14 30 Q 13 20 16 12 Q 17 20 18 30 Z" fill="#92400e" stroke={INK} strokeWidth="0.7" />
          <path d="M15 27 L17 27 M14.5 23 L17.5 23 M15 19 L17 19" stroke={INK} strokeWidth="0.4" />
          {/* Leaves */}
          <path d="M16 12 Q 8 10 4 14 Q 9 13 16 13 Z" fill="#22c55e" stroke={INK} strokeWidth="0.6" />
          <path d="M16 12 Q 24 10 28 14 Q 23 13 16 13 Z" fill="#22c55e" stroke={INK} strokeWidth="0.6" />
          <path d="M16 12 Q 12 4 6 4 Q 12 6 16 12 Z" fill="#16a34a" stroke={INK} strokeWidth="0.6" />
          <path d="M16 12 Q 20 4 26 4 Q 20 6 16 12 Z" fill="#16a34a" stroke={INK} strokeWidth="0.6" />
          {/* Coconuts */}
          <circle cx="14" cy="13" r="1.2" fill="#7c2d12" stroke={INK} strokeWidth="0.4" />
          <circle cx="18" cy="13" r="1.2" fill="#7c2d12" stroke={INK} strokeWidth="0.4" />
        </g>
      );

    case "sticker_summer_sun":
      return svg(
        <g filter={PAPER_FILTER}>
          <defs>
            <radialGradient id="su" cx="40%" cy="40%" r="70%">
              <stop offset="0%" stopColor="#fff8c4" />
              <stop offset="60%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#b45309" />
            </radialGradient>
          </defs>
          {/* Rays */}
          <g stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round">
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="16" y1="26" x2="16" y2="30" />
            <line x1="2" y1="16" x2="6" y2="16" />
            <line x1="26" y1="16" x2="30" y2="16" />
            <line x1="6" y1="6" x2="9" y2="9" />
            <line x1="23" y1="23" x2="26" y2="26" />
            <line x1="6" y1="26" x2="9" y2="23" />
            <line x1="23" y1="9" x2="26" y2="6" />
          </g>
          <circle cx="16" cy="16" r="8" fill="url(#su)" stroke={INK} strokeWidth="0.9" />
          <ellipse cx="13" cy="13" rx="2" ry="1" fill="#fff8c4" opacity="0.7" />
          {/* Smiley */}
          <circle cx="13" cy="15" r="0.6" fill={INK} />
          <circle cx="19" cy="15" r="0.6" fill={INK} />
          <path d="M13 18 Q 16 21 19 18" stroke={INK} strokeWidth="0.7" fill="none" strokeLinecap="round" />
        </g>
      );

    /* ============================ CREATOR ============================ */
    case "sticker_origine":
      return svg(
        <g>
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
        </g>
      );

    default:
      return null;
  }
}

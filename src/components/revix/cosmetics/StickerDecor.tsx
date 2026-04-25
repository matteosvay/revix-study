/**
 * Custom SVG sticker rendered as a self-contained inline element (uses currentSize via wrapper).
 * For epic+ stickers, we replace the plain emoji with a richly drawn animated SVG.
 * Returns null for stickers we don't have a custom design for (caller falls back to emoji).
 */
export function StickerDecor({ itemKey, className }: { itemKey?: string | null; className?: string }) {
  if (!itemKey) return null;
  const wrap = `inline-block ${className ?? ""}`;

  switch (itemKey) {
    /* =========== LEGENDARY =========== */
    case "sticker_phoenix":
      return (
        <span className={wrap}>
          <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="st-phx-flame" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ffd166" />
                <stop offset="60%" stopColor="#ff5b1f" />
                <stop offset="100%" stopColor="#7a0000" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="st-phx-glow" cx="50%" cy="50%" r="50%">
                <stop offset="20%" stopColor="#fde047" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#ff5b1f" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="16" cy="16" r="14" fill="url(#st-phx-glow)" />
            <path d="M16 28 C 8 24 6 16 10 10 C 12 14 14 14 16 12 C 18 14 20 14 22 10 C 26 16 24 24 16 28 Z" fill="url(#st-phx-flame)" stroke="#7a0000" strokeWidth="0.6" />
            <path d="M16 6 L18 12 L24 10 L20 14 L26 16 L20 18 L24 22 L18 20 L16 26 L14 20 L8 22 L12 18 L6 16 L12 14 L8 10 L14 12 Z" fill="#ff8c00" stroke="#7a0000" strokeWidth="0.4">
              <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="20s" repeatCount="indefinite" />
            </path>
            <circle cx="16" cy="16" r="1.5" fill="#fff" />
          </svg>
        </span>
      );

    case "sticker_dragon":
      return (
        <span className={wrap}>
          <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible">
            <defs>
              <radialGradient id="st-drg-glow" cx="50%" cy="50%" r="50%">
                <stop offset="40%" stopColor="#22c55e" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="16" cy="16" r="14" fill="url(#st-drg-glow)" />
            <path d="M6 18 Q 10 8 16 12 Q 22 8 26 18 Q 22 22 16 18 Q 10 22 6 18 Z" fill="#15803d" stroke="#052e16" strokeWidth="0.8" />
            <circle cx="11" cy="14" r="1.4" fill="#fde047" />
            <circle cx="11" cy="14" r="0.6" fill="#000" />
            <circle cx="21" cy="14" r="1.4" fill="#fde047" />
            <circle cx="21" cy="14" r="0.6" fill="#000" />
            <path d="M14 18 L18 18 L17 20 L15 20 Z" fill="#7f1d1d" />
            <path d="M16 22 Q 16 26 14 26" stroke="#ff5b1f" strokeWidth="1.2" fill="none">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="1.4s" repeatCount="indefinite" />
            </path>
          </svg>
        </span>
      );

    case "sticker_crown_royal":
      return (
        <span className={wrap}>
          <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="st-crn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#a16207" />
              </linearGradient>
            </defs>
            <path d="M5 22 L7 10 L12 16 L16 6 L20 16 L25 10 L27 22 Z" fill="url(#st-crn)" stroke="#451a03" strokeWidth="0.8" />
            <rect x="5" y="22" width="22" height="3" fill="url(#st-crn)" stroke="#451a03" strokeWidth="0.8" />
            <circle cx="7" cy="10" r="1.6" fill="#ef4444" stroke="#7f1d1d" strokeWidth="0.4" />
            <circle cx="16" cy="6" r="1.8" fill="#22d3ee" stroke="#0e7490" strokeWidth="0.4" />
            <circle cx="25" cy="10" r="1.6" fill="#22c55e" stroke="#14532d" strokeWidth="0.4" />
            <circle cx="11" cy="20" r="0.9" fill="#fff">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.6s" repeatCount="indefinite" />
            </circle>
            <circle cx="21" cy="20" r="0.9" fill="#fff">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.6s" begin="0.5s" repeatCount="indefinite" />
            </circle>
          </svg>
        </span>
      );

    case "sticker_diamond":
      return (
        <span className={wrap}>
          <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="st-dia" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#bae6fd" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
            </defs>
            <polygon points="16,3 26,12 16,29 6,12" fill="url(#st-dia)" stroke="#0c4a6e" strokeWidth="0.8" />
            <polyline points="6,12 16,12 26,12" stroke="#0c4a6e" strokeWidth="0.6" fill="none" />
            <polyline points="11,12 16,29 21,12" stroke="#0c4a6e" strokeWidth="0.6" fill="none" />
            <polygon points="16,3 11,12 16,12 21,12" fill="#fff" opacity="0.4" />
            <circle cx="11" cy="8" r="1" fill="#fff">
              <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
            </circle>
          </svg>
        </span>
      );

    case "sticker_galaxy":
      return (
        <span className={wrap}>
          <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible">
            <defs>
              <radialGradient id="st-gal" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fff" />
                <stop offset="30%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#1e1b4b" />
              </radialGradient>
            </defs>
            <circle cx="16" cy="16" r="14" fill="url(#st-gal)" stroke="#1e1b4b" strokeWidth="0.6" />
            <g transform="translate(16 16)">
              {[0, 90, 180, 270].map((d) => (
                <ellipse key={d} rx="11" ry="3" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.6" transform={`rotate(${d})`} />
              ))}
              <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="10s" repeatCount="indefinite" additive="sum" />
            </g>
            <circle cx="16" cy="16" r="2" fill="#fff" />
          </svg>
        </span>
      );

    case "sticker_meteor":
      return (
        <span className={wrap}>
          <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="st-met" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fde047" stopOpacity="0" />
                <stop offset="60%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#7c2d12" />
              </linearGradient>
            </defs>
            <path d="M2 4 L18 20 L14 24 L0 8 Z" fill="url(#st-met)" />
            <circle cx="22" cy="22" r="6" fill="#7c2d12" stroke="#1c0a05" strokeWidth="0.6" />
            <circle cx="20" cy="20" r="1.2" fill="#1c0a05" />
            <circle cx="24" cy="23" r="0.8" fill="#1c0a05" />
            <circle cx="22" cy="22" r="6" fill="none" stroke="#fde047" strokeWidth="0.6" opacity="0.7">
              <animate attributeName="r" values="6;9;6" dur="1.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0;0.7" dur="1.4s" repeatCount="indefinite" />
            </circle>
          </svg>
        </span>
      );

    case "sticker_infinity":
      return (
        <span className={wrap}>
          <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="st-inf" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="50%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#a855f7" />
                <animate attributeName="x1" values="0;1;0" dur="4s" repeatCount="indefinite" />
              </linearGradient>
            </defs>
            <path d="M8 16 C 8 10 14 10 16 16 C 18 22 24 22 24 16 C 24 10 18 10 16 16 C 14 22 8 22 8 16 Z" fill="none" stroke="url(#st-inf)" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </span>
      );

    case "sticker_cosmic_eye":
      return (
        <span className={wrap}>
          <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible">
            <ellipse cx="16" cy="16" rx="14" ry="9" fill="#1e1b4b" stroke="#a855f7" strokeWidth="0.8" />
            <circle cx="16" cy="16" r="6" fill="#a855f7" />
            <circle cx="16" cy="16" r="3.5" fill="#000" />
            <circle cx="14" cy="14" r="1.2" fill="#fff" />
            <circle cx="16" cy="16" r="6" fill="none" stroke="#22d3ee" strokeWidth="0.6">
              <animate attributeName="r" values="6;7.5;6" dur="2s" repeatCount="indefinite" />
            </circle>
          </svg>
        </span>
      );

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

    /* =========== COMMON — slightly stylized but lightweight =========== */
    default:
      return null;
  }
}
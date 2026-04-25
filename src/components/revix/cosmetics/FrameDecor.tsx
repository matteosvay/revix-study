import { CSSProperties } from "react";
import phoenixRing from "@/assets/cosmetics/frame_phoenix_ring.webp";
import dragonRing from "@/assets/cosmetics/frame_dragon_ring.webp";
import diamondRing from "@/assets/cosmetics/frame_diamond_ring.webp";
import cosmicRing from "@/assets/cosmetics/frame_cosmic_ring.webp";
import origineRing from "@/assets/cosmetics/frame_origine_ring.png";

/** Photoreal PNG rings overlaid on top of the avatar for legendary frames. */
const PNG_RINGS: Record<string, { src: string; glow: string }> = {
  frame_phoenix: { src: phoenixRing, glow: "drop-shadow(0 0 8px hsl(20 100% 55% / 0.85)) drop-shadow(0 0 18px hsl(35 100% 55% / 0.55))" },
  frame_dragon:  { src: dragonRing,  glow: "drop-shadow(0 0 8px hsl(140 100% 45% / 0.85)) drop-shadow(0 0 16px hsl(150 80% 40% / 0.5))" },
  frame_diamond: { src: diamondRing, glow: "drop-shadow(0 0 6px hsl(200 100% 80% / 0.9)) drop-shadow(0 0 18px hsl(220 100% 70% / 0.55))" },
  frame_cosmic:  { src: cosmicRing,  glow: "drop-shadow(0 0 8px hsl(280 100% 65% / 0.85)) drop-shadow(0 0 18px hsl(220 100% 60% / 0.5))" },
  frame_galaxy:  { src: cosmicRing,  glow: "drop-shadow(0 0 8px hsl(280 100% 65% / 0.85)) drop-shadow(0 0 18px hsl(220 100% 60% / 0.5))" },
};

/**
 * Animated SVG overlay rendered ON TOP of the avatar (pointer-events:none).
 * Adds particles, flames, sparkles depending on the equipped frame.
 * Sized via container, the SVG fills 100% of the parent (which must be relative).
 */
export function FrameDecor({
  itemKey,
  size = "md",
  layer = "below",
}: {
  itemKey?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  /** "below" = behind the avatar (auras, rings). "above" = on top of the avatar (e.g. real crown). */
  layer?: "below" | "above";
}) {
  if (!itemKey) return null;

  // ===== Above-avatar overlays (rendered ON TOP of the photo) =====
  if (layer === "above") {
    if (itemKey === "frame_origine") {
      // Photoreal liquid-gold crown + ring overlay (ABOVE the avatar).
      // The PNG includes both the dripping gold ring AND the baroque crown on top.
      // It is rendered BEHIND the avatar (z-0) so the photo stays fully visible —
      // only the crown peaks rise above the head and the dripping ring frames the avatar.
      // Scale extends generously OUTWARD so the gold circle is wider than the avatar
      // and the crown towers higher above it.
      const WRAP: Record<string, string> = {
        sm: "-top-5 -left-3 -right-3 -bottom-3",
        md: "-top-8 -left-4 -right-4 -bottom-4",
        lg: "-top-12 -left-6 -right-6 -bottom-6",
        xl: "-top-16 -left-8 -right-8 -bottom-8",
      };
      const SPARK_COUNT = 14;
      return (
        <div className={`absolute ${WRAP[size]} pointer-events-none z-0`}>
          <img
            src={origineRing}
            alt=""
            loading="lazy"
            width={1024}
            height={1024}
            draggable={false}
            className="block w-full h-full object-contain animate-cosmetic-breathe"
            style={{
              filter:
                "drop-shadow(0 0 6px hsl(45 100% 65% / 0.85)) " +
                "drop-shadow(0 0 18px hsl(38 100% 55% / 0.55)) " +
                "drop-shadow(0 4px 10px hsl(30 80% 25% / 0.45))",
            }}
          />
          {/* Floating gold motes */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible">
            {Array.from({ length: SPARK_COUNT }).map((_, i) => {
              const a = (i * (360 / SPARK_COUNT) * Math.PI) / 180;
              const r = 47 + (i % 3) * 1.2;
              const cx = 50 + Math.cos(a) * r;
              const cy = 50 + Math.sin(a) * r;
              return (
                <circle key={i} cx={cx} cy={cy} r="0.8" fill="#fff7c2"
                  style={{ filter: "drop-shadow(0 0 3px #ffd166)" }}>
                  <animate attributeName="opacity" values="0.15;1;0.15" dur="2.4s" begin={`${i * 0.14}s`} repeatCount="indefinite" />
                  <animate attributeName="r" values="0.4;1.3;0.4" dur="2.4s" begin={`${i * 0.14}s`} repeatCount="indefinite" />
                </circle>
              );
            })}
          </svg>
        </div>
      );
    }
    return null;
  }

  // ===== Below-avatar overlays (legacy behaviour) =====
  // Outer scale so particles can extend beyond the avatar
  const SCALE: Record<string, string> = {
    sm: "-inset-1.5",
    md: "-inset-2",
    lg: "-inset-2.5",
    xl: "-inset-3",
  };
  const wrap: CSSProperties = { pointerEvents: "none" };

  // Photoreal PNG ring overlay for legendary frames (with subtle breathing & particles)
  if (itemKey in PNG_RINGS) {
    const { src, glow } = PNG_RINGS[itemKey];
    // Sparks/particles layer for extra life
    const SparkLayer = () => {
      // Phoenix → embers, Dragon → green motes, Diamond → white sparkles, Cosmic → stars
      const cfg = {
        frame_phoenix: { color: "#ffd166", count: 8 },
        frame_dragon:  { color: "#86efac", count: 6 },
        frame_diamond: { color: "#ffffff", count: 10 },
        frame_cosmic:  { color: "#ffffff", count: 12 },
        frame_galaxy:  { color: "#ffffff", count: 12 },
      }[itemKey as keyof typeof PNG_RINGS] ?? { color: "#fff", count: 8 };
      return (
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
          {Array.from({ length: cfg.count }).map((_, i) => {
            const a = (i * (360 / cfg.count) * Math.PI) / 180;
            const r = 48;
            const cx = 50 + Math.cos(a) * r;
            const cy = 50 + Math.sin(a) * r;
            return (
              <circle key={i} cx={cx} cy={cy} r="0.9" fill={cfg.color} style={{ filter: `drop-shadow(0 0 3px ${cfg.color})` }}>
                <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" begin={`${i * 0.18}s`} repeatCount="indefinite" />
                <animate attributeName="r" values="0.5;1.4;0.5" dur="2s" begin={`${i * 0.18}s`} repeatCount="indefinite" />
              </circle>
            );
          })}
        </svg>
      );
    };
    return (
      <div className={`absolute ${SCALE[size]} pointer-events-none`} style={wrap}>
        <img
          src={src}
          alt=""
          loading="lazy"
          width={384}
          height={384}
          draggable={false}
          className="block w-full h-full object-contain animate-cosmetic-breathe"
          style={{ filter: glow }}
        />
        <SparkLayer />
      </div>
    );
  }

  switch (itemKey) {
    /* ===================== LEGENDARY ===================== */
    case "frame_phoenix":
      return (
        <div className={`absolute ${SCALE[size]} pointer-events-none`} style={wrap}>
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <radialGradient id="phx-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffe066" stopOpacity="0" />
                <stop offset="60%" stopColor="#ff7a00" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#7a0000" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="phx-flame" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ffd166" />
                <stop offset="50%" stopColor="#ff5b1f" />
                <stop offset="100%" stopColor="#7a0000" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#phx-glow)">
              <animate attributeName="r" values="46;52;46" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2.4s" repeatCount="indefinite" />
            </circle>
            {Array.from({ length: 10 }).map((_, i) => {
              const a = (i * 36 * Math.PI) / 180;
              const cx = 50 + Math.cos(a) * 46;
              const cy = 50 + Math.sin(a) * 46;
              return (
                <g key={i} transform={`translate(${cx} ${cy}) rotate(${(i * 36) + 90} 0 0)`}>
                  <path d="M0,-2 C-3,-7 -3,-12 0,-16 C3,-12 3,-7 0,-2 Z" fill="url(#phx-flame)" opacity="0.9">
                    <animateTransform attributeName="transform" type="scale" values="0.7;1.25;0.7" dur="1.4s" begin={`${i * 0.12}s`} repeatCount="indefinite" additive="sum" />
                    <animate attributeName="opacity" values="0.4;1;0.4" dur="1.4s" begin={`${i * 0.12}s`} repeatCount="indefinite" />
                  </path>
                </g>
              );
            })}
          </svg>
        </div>
      );

    case "frame_dragon":
      return (
        <div className={`absolute ${SCALE[size]} pointer-events-none`} style={wrap}>
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <radialGradient id="drg-glow" cx="50%" cy="50%" r="50%">
                <stop offset="50%" stopColor="#00ff88" stopOpacity="0" />
                <stop offset="100%" stopColor="#00ff88" stopOpacity="0.45" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#drg-glow)" />
            {Array.from({ length: 18 }).map((_, i) => {
              const a = (i * 20 * Math.PI) / 180;
              const r = 46;
              const cx = 50 + Math.cos(a) * r;
              const cy = 50 + Math.sin(a) * r;
              return (
                <path key={i} d={`M ${cx} ${cy} l -4 -2 l 0 4 z`} fill="#0fa958" stroke="#003a1a" strokeWidth="0.5" transform={`rotate(${(i * 20)} ${cx} ${cy})`}>
                  <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" begin={`${i * 0.05}s`} repeatCount="indefinite" />
                </path>
              );
            })}
            <circle cx="50" cy="50" r="46" fill="none" stroke="#0fa958" strokeWidth="1.2" strokeDasharray="3 4">
              <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="14s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      );

    case "frame_cosmic":
    case "frame_galaxy":
      return (
        <div className={`absolute ${SCALE[size]} pointer-events-none`} style={wrap}>
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <radialGradient id="csm-glow" cx="50%" cy="50%" r="50%">
                <stop offset="60%" stopColor="#7c3aed" stopOpacity="0" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.55" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#csm-glow)" />
            <g>
              <ellipse cx="50" cy="50" rx="49" ry="49" fill="none" stroke="#a855f7" strokeWidth="0.8" opacity="0.9">
                <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="8s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="50" cy="50" rx="48" ry="48" fill="none" stroke="#22d3ee" strokeWidth="0.6" opacity="0.7" strokeDasharray="3 4" transform="rotate(60 50 50)">
                <animateTransform attributeName="transform" type="rotate" from="60 50 50" to="420 50 50" dur="10s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="50" cy="50" rx="47" ry="47" fill="none" stroke="#f472b6" strokeWidth="0.6" opacity="0.7" strokeDasharray="2 5" transform="rotate(120 50 50)">
                <animateTransform attributeName="transform" type="rotate" from="120 50 50" to="480 50 50" dur="12s" repeatCount="indefinite" />
              </ellipse>
            </g>
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i * 30 * Math.PI) / 180;
              const cx = 50 + Math.cos(a) * 47;
              const cy = 50 + Math.sin(a) * 47;
              return (
                <circle key={i} cx={cx} cy={cy} r="0.8" fill="#fff">
                  <animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" begin={`${i * 0.15}s`} repeatCount="indefinite" />
                </circle>
              );
            })}
          </svg>
        </div>
      );

    case "frame_diamond":
      return (
        <div className={`absolute ${SCALE[size]} pointer-events-none`} style={wrap}>
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <radialGradient id="dia-glow" cx="50%" cy="50%" r="50%">
                <stop offset="55%" stopColor="#7dd3fc" stopOpacity="0" />
                <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.7" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#dia-glow)" />
            {[0, 60, 120, 180, 240, 300].map((deg, i) => {
              const a = (deg * Math.PI) / 180;
              const cx = 50 + Math.cos(a) * 46;
              const cy = 50 + Math.sin(a) * 46;
              return (
                <g key={i} transform={`translate(${cx} ${cy}) rotate(${deg + 45})`}>
                  <rect x="-2.5" y="-2.5" width="5" height="5" fill="#bae6fd" stroke="#0369a1" strokeWidth="0.6">
                    <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" begin={`${i * 0.18}s`} repeatCount="indefinite" />
                  </rect>
                  <rect x="-1" y="-1" width="2" height="2" fill="#fff">
                    <animate attributeName="opacity" values="0.2;1;0.2" dur="1.4s" begin={`${i * 0.18}s`} repeatCount="indefinite" />
                  </rect>
                </g>
              );
            })}
          </svg>
        </div>
      );

    case "frame_aurora":
      return (
        <div className={`absolute ${SCALE[size]} pointer-events-none`} style={wrap}>
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="aur-1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00ffd1" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#b388ff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ff80ab" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="none" stroke="url(#aur-1)" strokeWidth="3" opacity="0.85">
              <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="9s" repeatCount="indefinite" />
            </circle>
            <circle cx="50" cy="50" r="46" fill="none" stroke="url(#aur-1)" strokeWidth="1.5" opacity="0.6" strokeDasharray="6 4">
              <animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="14s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      );

    case "frame_celestial":
      return (
        <div className={`absolute ${SCALE[size]} pointer-events-none`} style={wrap}>
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <radialGradient id="cel-glow" cx="50%" cy="50%" r="50%">
                <stop offset="55%" stopColor="#fde047" stopOpacity="0" />
                <stop offset="100%" stopColor="#facc15" stopOpacity="0.7" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#cel-glow)" />
            <g>
              <circle cx="50" cy="50" r="49" fill="none" stroke="#facc15" strokeWidth="1.2" strokeDasharray="2 3">
                <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="20s" repeatCount="indefinite" />
              </circle>
            </g>
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i * 45 * Math.PI) / 180;
              const cx = 50 + Math.cos(a) * 49;
              const cy = 50 + Math.sin(a) * 49;
              return (
                <g key={i} transform={`translate(${cx} ${cy})`}>
                  <path d="M0 -3 L1 -1 L3 0 L1 1 L0 3 L-1 1 L-3 0 L-1 -1 Z" fill="#fef9c3" stroke="#facc15" strokeWidth="0.4">
                    <animateTransform attributeName="transform" type="scale" values="0.7;1.3;0.7" dur="2.2s" begin={`${i * 0.18}s`} repeatCount="indefinite" />
                  </path>
                </g>
              );
            })}
          </svg>
        </div>
      );

    case "frame_holo":
      return (
        <div className={`absolute ${SCALE[size]} pointer-events-none`} style={wrap}>
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="holo-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ff00cc" />
                <stop offset="33%" stopColor="#00ffff" />
                <stop offset="66%" stopColor="#ffff00" />
                <stop offset="100%" stopColor="#00ffaa" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="none" stroke="url(#holo-grad)" strokeWidth="3.5">
              <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="6s" repeatCount="indefinite" />
            </circle>
            <circle cx="50" cy="50" r="46" fill="none" stroke="url(#holo-grad)" strokeWidth="1" strokeDasharray="2 3" opacity="0.7">
              <animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="9s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      );

    /* ===================== EPIC ===================== */
    case "frame_fire":
      return (
        <div className={`absolute ${SCALE[size]} pointer-events-none`} style={wrap}>
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="fr-flame" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ffd166" />
                <stop offset="60%" stopColor="#ff5b1f" />
                <stop offset="100%" stopColor="#7a0000" stopOpacity="0" />
              </linearGradient>
            </defs>
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i * 45 * Math.PI) / 180;
              const cx = 50 + Math.cos(a) * 47;
              const cy = 50 + Math.sin(a) * 47;
              return (
                <g key={i} transform={`translate(${cx} ${cy}) rotate(${i * 45 + 90})`}>
                  <path d="M0,-1 C-2,-5 -2,-9 0,-12 C2,-9 2,-5 0,-1 Z" fill="url(#fr-flame)">
                    <animateTransform attributeName="transform" type="scale" values="0.7;1.2;0.7" dur="1.2s" begin={`${i * 0.1}s`} repeatCount="indefinite" additive="sum" />
                  </path>
                </g>
              );
            })}
          </svg>
        </div>
      );

    case "frame_ice":
      return (
        <div className={`absolute ${SCALE[size]} pointer-events-none`} style={wrap}>
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i * 45 * Math.PI) / 180;
              const cx = 50 + Math.cos(a) * 48;
              const cy = 50 + Math.sin(a) * 48;
              return (
                <g key={i} transform={`translate(${cx} ${cy}) rotate(${i * 45})`}>
                  <g stroke="#7dd3fc" strokeWidth="0.8" strokeLinecap="round">
                    <line x1="-3" y1="0" x2="3" y2="0" />
                    <line x1="0" y1="-3" x2="0" y2="3" />
                    <line x1="-2" y1="-2" x2="2" y2="2" />
                    <line x1="-2" y1="2" x2="2" y2="-2" />
                  </g>
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="2.4s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
                </g>
              );
            })}
          </svg>
        </div>
      );

    case "frame_lightning":
    case "frame_thunder":
      return (
        <div className={`absolute ${SCALE[size]} pointer-events-none`} style={wrap}>
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            {[0, 90, 180, 270].map((deg, i) => {
              const a = (deg * Math.PI) / 180;
              const cx = 50 + Math.cos(a) * 48;
              const cy = 50 + Math.sin(a) * 48;
              return (
                <path key={i} d={`M ${cx - 2} ${cy - 4} L ${cx + 1} ${cy - 1} L ${cx - 1} ${cy + 1} L ${cx + 2} ${cy + 4}`} stroke="#fde047" strokeWidth="1.2" fill="none" strokeLinecap="round">
                  <animate attributeName="opacity" values="0;1;0" dur="0.8s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
                </path>
              );
            })}
          </svg>
        </div>
      );

    case "frame_gold":
      return (
        <div className={`absolute ${SCALE[size]} pointer-events-none`} style={wrap}>
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <radialGradient id="gld-glow" cx="50%" cy="50%" r="50%">
                <stop offset="55%" stopColor="#fde047" stopOpacity="0" />
                <stop offset="100%" stopColor="#facc15" stopOpacity="0.6" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#gld-glow)" />
            <circle cx="50" cy="50" r="48" fill="none" stroke="#facc15" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="48" fill="none" stroke="#fff8b0" strokeWidth="0.6" strokeDasharray="3 6">
              <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="10s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      );

    case "frame_rainbow":
      return (
        <div className={`absolute ${SCALE[size]} pointer-events-none`} style={wrap}>
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="rnb-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ff0080" />
                <stop offset="20%" stopColor="#ff8c00" />
                <stop offset="40%" stopColor="#ffd000" />
                <stop offset="60%" stopColor="#00d084" />
                <stop offset="80%" stopColor="#00b8ff" />
                <stop offset="100%" stopColor="#b400ff" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="none" stroke="url(#rnb-grad)" strokeWidth="3">
              <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="5s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      );

    case "frame_floral":
      return (
        <div className={`absolute ${SCALE[size]} pointer-events-none`} style={wrap}>
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            {Array.from({ length: 6 }).map((_, i) => {
              const a = (i * 60 * Math.PI) / 180;
              const cx = 50 + Math.cos(a) * 48;
              const cy = 50 + Math.sin(a) * 48;
              return (
                <g key={i} transform={`translate(${cx} ${cy})`}>
                  {[0, 72, 144, 216, 288].map((d) => (
                    <ellipse key={d} cx="0" cy="-2.5" rx="1.6" ry="2.6" fill="#fbcfe8" stroke="#ec4899" strokeWidth="0.4" transform={`rotate(${d})`} />
                  ))}
                  <circle cx="0" cy="0" r="1.2" fill="#fde047" />
                  <animateTransform attributeName="transform" type="rotate" from={`0 0 0`} to="360 0 0" dur="8s" begin={`${i * 0.4}s`} repeatCount="indefinite" additive="sum" />
                </g>
              );
            })}
          </svg>
        </div>
      );

    /* ===================== RARE — neon glow rings ===================== */
    case "frame_neon":
    case "frame_neon_blue":
    case "frame_neon_green":
    case "frame_neon_pink": {
      const c =
        itemKey === "frame_neon_blue" ? "#3b82f6" :
        itemKey === "frame_neon_green" ? "#22c55e" :
        itemKey === "frame_neon_pink" ? "#ec4899" : "#22d3ee";
      return (
        <div className={`absolute ${SCALE[size]} pointer-events-none`} style={wrap}>
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <circle cx="50" cy="50" r="48" fill="none" stroke={c} strokeWidth="2" style={{ filter: `drop-shadow(0 0 6px ${c}) drop-shadow(0 0 14px ${c})` }}>
              <animate attributeName="opacity" values="0.7;1;0.7" dur="1.6s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      );
    }

    /* ===================== PHASE 2 — Gem & Celestial frames ===================== */
    case "frame_emerald":
    case "frame_ruby":
    case "frame_sapphire": {
      const palette = {
        frame_emerald:  { core: "#10b981", light: "#a7f3d0", dark: "#064e3b" },
        frame_ruby:     { core: "#ef4444", light: "#fecaca", dark: "#7f1d1d" },
        frame_sapphire: { core: "#3b82f6", light: "#bfdbfe", dark: "#1e3a8a" },
      }[itemKey];
      return (
        <div className={`absolute ${SCALE[size]} pointer-events-none`} style={wrap}>
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <radialGradient id={`gem-${itemKey}-glow`} cx="50%" cy="50%" r="50%">
                <stop offset="55%" stopColor={palette.core} stopOpacity="0" />
                <stop offset="100%" stopColor={palette.core} stopOpacity="0.55" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill={`url(#gem-${itemKey}-glow)`} />
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i * 30 * Math.PI) / 180;
              const cx = 50 + Math.cos(a) * 47;
              const cy = 50 + Math.sin(a) * 47;
              return (
                <g key={i} transform={`translate(${cx} ${cy}) rotate(${i * 30 + 45})`}>
                  <polygon points="0,-3 3,0 0,3 -3,0" fill={palette.light} stroke={palette.dark} strokeWidth="0.5">
                    <animate attributeName="opacity" values="0.4;1;0.4" dur="2.2s" begin={`${i * 0.15}s`} repeatCount="indefinite" />
                  </polygon>
                  <polygon points="0,-1.2 1.2,0 0,1.2 -1.2,0" fill="#fff">
                    <animate attributeName="opacity" values="0.2;0.9;0.2" dur="1.5s" begin={`${i * 0.15}s`} repeatCount="indefinite" />
                  </polygon>
                </g>
              );
            })}
          </svg>
        </div>
      );
    }

    case "frame_sun":
      return (
        <div className={`absolute ${SCALE[size]} pointer-events-none`} style={wrap}>
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
                <stop offset="55%" stopColor="#fbbf24" stopOpacity="0" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.7" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#sun-glow)" />
            <g>
              {Array.from({ length: 16 }).map((_, i) => {
                const a = (i * 22.5 * Math.PI) / 180;
                const r1 = 48;
                const r2 = 54;
                const x1 = 50 + Math.cos(a) * r1;
                const y1 = 50 + Math.sin(a) * r1;
                const x2 = 50 + Math.cos(a) * r2;
                const y2 = 50 + Math.sin(a) * r2;
                return (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fde047" strokeWidth="1.4" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 3px #fbbf24)" }}>
                    <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" begin={`${i * 0.08}s`} repeatCount="indefinite" />
                  </line>
                );
              })}
              <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="40s" repeatCount="indefinite" />
            </g>
          </svg>
        </div>
      );

    case "frame_moon":
      return (
        <div className={`absolute ${SCALE[size]} pointer-events-none`} style={wrap}>
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <radialGradient id="moon-glow" cx="50%" cy="50%" r="50%">
                <stop offset="55%" stopColor="#cbd5e1" stopOpacity="0" />
                <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.7" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#moon-glow)" />
            <circle cx="50" cy="50" r="48" fill="none" stroke="#e2e8f0" strokeWidth="1.5" opacity="0.6" />
            {[15, 50, 80, 35, 70].map((cx, i) => {
              const cy = 35 + (i % 3) * 18;
              return (
                <circle key={i} cx={cx} cy={cy} r={1 + (i % 3) * 0.4} fill="#fff" opacity="0.9">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
                </circle>
              );
            })}
          </svg>
        </div>
      );

    case "frame_shooting_stars":
      return (
        <div className={`absolute ${SCALE[size]} pointer-events-none`} style={wrap}>
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="ss-trail" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#fff" stopOpacity="0" />
                <stop offset="100%" stopColor="#a5b4fc" stopOpacity="1" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="none" stroke="#6366f1" strokeWidth="1.2" opacity="0.6" />
            {[0, 90, 180, 270].map((deg, i) => {
              const a = (deg * Math.PI) / 180;
              const cx = 50 + Math.cos(a) * 48;
              const cy = 50 + Math.sin(a) * 48;
              return (
                <g key={i} transform={`translate(${cx} ${cy}) rotate(${deg})`}>
                  <line x1="0" y1="0" x2="-10" y2="0" stroke="url(#ss-trail)" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="0" cy="0" r="1.5" fill="#fff" style={{ filter: "drop-shadow(0 0 3px #a5b4fc)" }} />
                  <animate attributeName="opacity" values="0;1;0" dur="2s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
                </g>
              );
            })}
          </svg>
        </div>
      );

    case "frame_crystal_blue":
      return (
        <div className={`absolute ${SCALE[size]} pointer-events-none`} style={wrap}>
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i * 45 * Math.PI) / 180;
              const cx = 50 + Math.cos(a) * 47;
              const cy = 50 + Math.sin(a) * 47;
              return (
                <g key={i} transform={`translate(${cx} ${cy}) rotate(${i * 45})`}>
                  <polygon points="0,-4 2,-1 2,2 0,4 -2,2 -2,-1" fill="#cffafe" stroke="#0e7490" strokeWidth="0.5" opacity="0.85">
                    <animate attributeName="opacity" values="0.5;1;0.5" dur="2.4s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
                  </polygon>
                </g>
              );
            })}
          </svg>
        </div>
      );

    case "frame_pixel":
      return (
        <div className={`absolute ${SCALE[size]} pointer-events-none`} style={wrap}>
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" shapeRendering="crispEdges">
            {Array.from({ length: 24 }).map((_, i) => {
              const a = (i * 15 * Math.PI) / 180;
              const cx = 50 + Math.cos(a) * 48;
              const cy = 50 + Math.sin(a) * 48;
              const colors = ["#22c55e", "#16a34a", "#facc15", "#fb923c"];
              return (
                <rect key={i} x={cx - 1.5} y={cy - 1.5} width="3" height="3" fill={colors[i % 4]}>
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="1.4s" begin={`${i * 0.06}s`} repeatCount="indefinite" />
                </rect>
              );
            })}
          </svg>
        </div>
      );

    /* ===================== CREATOR (exclusive) ===================== */
    case "frame_origine":
      return (
        <div className={`absolute ${SCALE[size]} pointer-events-none`} style={wrap}>
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <radialGradient id="orig-aura" cx="50%" cy="50%" r="50%">
                <stop offset="60%" stopColor="#ffd166" stopOpacity="0" />
                <stop offset="100%" stopColor="#ffaa00" stopOpacity="0.55" />
              </radialGradient>
            </defs>
            {/* Soft pulsing golden halo only — the actual ornate ring & crown
                are rendered by the photoreal PNG in the ABOVE layer. */}
            <circle cx="50" cy="50" r="48" fill="url(#orig-aura)">
              <animate attributeName="r" values="46;54;46" dur="3.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;1;0.6" dur="3.2s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      );

    default:
      return null;
  }
}
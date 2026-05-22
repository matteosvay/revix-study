import { useEffect, useMemo, useRef, useState } from "react";
import { X, ChevronRight } from "lucide-react";
import { CosmeticAvatar } from "@/components/revix/CosmeticAvatar";
import { BackgroundDecor } from "@/components/revix/cosmetics/BackgroundDecor";
import { StickerDecor, hasCustomSticker } from "@/components/revix/cosmetics/StickerDecor";
import { backgroundStyle, RARITY_LABEL, RARITY_ORDER, type Rarity } from "@/lib/cosmetics";
import { cn } from "@/lib/utils";

const POWERUP_LABELS: Record<string, { name: string; emoji: string }> = {
  power_5050: { name: "50 / 50", emoji: "✂️" },
  power_skip:  { name: "Skip question", emoji: "⏭️" },
  power_time:  { name: "+30 sec", emoji: "⏱️" },
};

type Reward = {
  xp: number;
  streak_token: boolean;
  powerup: string | null;
  cosmetic: { key: string; name: string; emoji: string | null; rarity: string; category: string } | null;
  extras?: Array<{ key: string; name: string; emoji: string | null; rarity: string; category: string }>;
};

type Card =
  | { kind: "xp"; xp: number }
  | { kind: "token" }
  | { kind: "powerup"; key: string }
  | { kind: "cosmetic"; key: string; name: string; emoji: string | null; rarity: Rarity; category: string };

/* ─── Rarity themes ─────────────────────────────────────────────────────── */

// Card display (ring / glow / aura on dark cinematic bg)
const RARITY_THEME: Record<Rarity, { ring: string; glow: string; aura: string; label: string; text: string }> = {
  common:    { ring: "ring-slate-400",    glow: "shadow-[0_0_30px_hsl(0_0%_70%/0.55)]",    aura: "rare-aura",      label: "bg-slate-500 text-white",    text: "text-slate-300" },
  rare:      { ring: "ring-blue-400",     glow: "shadow-[0_0_45px_hsl(220_100%_60%/0.65)]", aura: "rare-aura",      label: "bg-blue-500 text-white",     text: "text-blue-400" },
  epic:      { ring: "ring-purple-500",   glow: "shadow-[0_0_55px_hsl(280_100%_60%/0.75)]", aura: "epic-aura",      label: "bg-purple-600 text-white",   text: "text-purple-400" },
  legendary: { ring: "ring-yellow-400",   glow: "shadow-[0_0_70px_hsl(45_100%_55%/0.85)]",  aura: "legendary-aura", label: "bg-amber-500 text-white",    text: "text-yellow-400" },
  creator:   { ring: "ring-amber-300",    glow: "shadow-[0_0_80px_hsl(38_100%_58%/0.90)]",  aura: "legendary-aura", label: "bg-amber-400 text-black",    text: "text-amber-400" },
  queen:     { ring: "ring-pink-400",     glow: "shadow-[0_0_90px_hsl(335_90%_68%/0.92)]",  aura: "legendary-aura", label: "bg-pink-500 text-white",     text: "text-pink-400" },
};

// Solid colors for the rarity banner — shown on dark backgrounds, no gradient text
const BANNER: Record<Rarity, { color: string; glow: string }> = {
  common:    { color: "hsl(0 0% 82%)",    glow: "rgba(200,210,220,0.40)" },
  rare:      { color: "hsl(217 91% 72%)", glow: "rgba(96,165,250,0.42)" },
  epic:      { color: "hsl(276 85% 76%)", glow: "rgba(167,139,250,0.42)" },
  legendary: { color: "hsl(45 96% 64%)",  glow: "rgba(252,211,77,0.48)" },
  creator:   { color: "hsl(38 96% 64%)",  glow: "rgba(251,191,36,0.48)" },
  queen:     { color: "hsl(335 90% 76%)", glow: "rgba(244,114,182,0.48)" },
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function rewardToCards(r: Reward): Card[] {
  const cards: Card[] = [];
  if (r.cosmetic)
    cards.push({ kind: "cosmetic", key: r.cosmetic.key, name: r.cosmetic.name, emoji: r.cosmetic.emoji, rarity: (r.cosmetic.rarity as Rarity) ?? "common", category: r.cosmetic.category });
  if (Array.isArray(r.extras))
    for (const e of r.extras)
      cards.push({ kind: "cosmetic", key: e.key, name: e.name, emoji: e.emoji, rarity: (e.rarity as Rarity) ?? "common", category: e.category });
  if (r.powerup) cards.push({ kind: "powerup", key: r.powerup });
  if (r.streak_token) cards.push({ kind: "token" });
  if (r.xp > 0) cards.push({ kind: "xp", xp: r.xp });
  return cards;
}

function highestRarity(cards: Card[]): Rarity {
  let best: Rarity = "common";
  for (const c of cards) {
    if (c.kind === "cosmetic" && RARITY_ORDER.indexOf(c.rarity) > RARITY_ORDER.indexOf(best)) best = c.rarity;
    if ((c.kind === "powerup" || c.kind === "token") && RARITY_ORDER.indexOf("rare") > RARITY_ORDER.indexOf(best)) best = "rare";
  }
  return best;
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function CountUp({ target, duration = 1300 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    let t0: number | null = null;
    const tick = (ts: number) => {
      if (t0 === null) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return <>{count}</>;
}

function Confetti({ rarity }: { rarity: Rarity }) {
  const palette =
    rarity === "legendary" || rarity === "creator" || rarity === "queen"
      ? ["#fde047", "#f97316", "#ec4899", "#a855f7", "#22d3ee", "#ffffff"]
      : rarity === "epic"   ? ["#a855f7", "#ec4899", "#3b82f6", "#fde047"]
      : rarity === "rare"   ? ["#3b82f6", "#22d3ee", "#fde047", "#ffffff"]
      : ["#cbd5e1", "#94a3b8", "#fde047", "#ffffff"];

  const pieces = useMemo(() => Array.from({ length: 90 }).map((_, i) => ({
    left:  `${(i * 14 + Math.random() * 6) % 100}%`,
    delay: `${Math.random() * 0.55}s`,
    color: palette[i % palette.length],
    size:  5 + Math.random() * 7,
    drift: `${(Math.random() - 0.5) * 230}px`,
    dur:   `${(1.9 + Math.random() * 1.2).toFixed(1)}s`,
    shape: i % 3 === 0 ? "50%" : "2px",
  })), [rarity]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span key={i} className="confetti-piece absolute top-0" style={{
          left: p.left, width: p.size, height: p.size,
          background: p.color, borderRadius: p.shape,
          animationDelay: p.delay, animationDuration: p.dur,
          "--cf-x": p.drift,
        } as React.CSSProperties & { "--cf-x": string }} />
      ))}
    </div>
  );
}

function Rays({ rarity }: { rarity: Rarity }) {
  const color = BANNER[rarity].color;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="ray-spin">
        <svg viewBox="-100 -100 200 200" className="w-[140vw] h-[140vw] max-w-[1100px] max-h-[1100px] ray-pulse">
          {Array.from({ length: 16 }).map((_, i) => (
            <polygon key={i} points="0,0 -8,-100 8,-100"
              fill={color} opacity={i % 2 ? 0.28 : 0.52}
              transform={`rotate(${(360 / 16) * i})`} />
          ))}
        </svg>
      </div>
    </div>
  );
}

// The mystery box — stays yellow/orange to preserve surprise until burst
function BoxIcon({ lidFly = false, showSeamGlow = false }: { lidFly?: boolean; showSeamGlow?: boolean }) {
  return (
    <div className="relative">
      {/* Seam light leak — energy escaping from inside before burst */}
      {showSeamGlow && (
        <div
          className="seam-leak absolute pointer-events-none"
          style={{
            top: "41%",
            left: "12%",
            right: "12%",
            height: "3px",
            background: "hsl(45 100% 78%)",
            filter: "blur(10px)",
            boxShadow: "0 0 30px 16px hsl(45 100% 62% / 0.85)",
          }}
        />
      )}
      <svg viewBox="0 0 120 120" className="w-44 h-44 drop-shadow-2xl overflow-visible">
        <defs>
          <linearGradient id="lb-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <linearGradient id="lb-lid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="100%" stopColor="#fde047" />
          </linearGradient>
        </defs>
        {/* Drop shadow */}
        <ellipse cx="60" cy="112" rx="34" ry="4" fill="#000" opacity="0.32" />
        {/* Body */}
        <rect x="20" y="50" width="80" height="55" rx="6" fill="url(#lb-body)" stroke="#000" strokeWidth="3" />
        {/* Ribbon on body */}
        <rect x="55" y="50" width="10" height="55" fill="#ec4899" stroke="#000" strokeWidth="2" />
        {/* Lid group (flies off during burst) */}
        <g className={lidFly ? "lid-fly" : ""}>
          <rect x="15" y="38" width="90" height="18" rx="4" fill="url(#lb-lid)" stroke="#000" strokeWidth="3" />
          <rect x="55" y="38" width="10" height="18" fill="#ec4899" stroke="#000" strokeWidth="2" />
          <path d="M40 38 Q50 16 60 38 Q70 16 80 38 Z" fill="#ec4899" stroke="#000" strokeWidth="2.5" />
          <circle cx="60" cy="38" r="4" fill="#fde047" stroke="#000" strokeWidth="2" />
        </g>
        {/* Ambient sparkle dots */}
        <circle cx="18" cy="20" r="2" fill="#fff">
          <animate attributeName="opacity" values="0;0.9;0" dur="1.3s" repeatCount="indefinite" />
        </circle>
        <circle cx="103" cy="28" r="1.8" fill="#fff">
          <animate attributeName="opacity" values="0;0.9;0" dur="1.5s" begin="0.45s" repeatCount="indefinite" />
        </circle>
        <circle cx="107" cy="82" r="1.5" fill="#fff">
          <animate attributeName="opacity" values="0;0.9;0" dur="1.1s" begin="0.85s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

function RarityBanner({ card }: { card: Card }) {
  const rarity: Rarity =
    card.kind === "cosmetic" ? card.rarity :
    card.kind === "powerup" || card.kind === "token" ? "rare" : "common";
  const isBig = rarity === "epic" || rarity === "legendary" || rarity === "creator" || rarity === "queen";
  const { color, glow } = BANNER[rarity];

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Solid Archivo Black — no gradient text (design ban) */}
      <p
        className="font-display uppercase rarity-slam leading-none tracking-[0.06em] text-center"
        style={{
          fontSize: isBig ? "clamp(3rem, 13vw, 4.5rem)" : "clamp(2.2rem, 10vw, 3.2rem)",
          color,
          textShadow: `0 0 55px ${glow}, 0 3px 0 rgba(0,0,0,0.65)`,
        }}
      >
        {RARITY_LABEL[rarity]}
      </p>
      {/* Expanding underbar */}
      <div className="rarity-bar-in h-[3px] rounded-full" style={{ background: color }} />
      {isBig && (
        <p className="text-white/50 font-mono text-[10px] uppercase tracking-[0.35em] animate-fade-in">
          Récompense obtenue
        </p>
      )}
    </div>
  );
}

function CardReveal({ card }: { card: Card }) {
  const rarity: Rarity =
    card.kind === "cosmetic" ? card.rarity :
    card.kind === "powerup" || card.kind === "token" ? "rare" : "common";
  const theme = RARITY_THEME[rarity];
  const isHigh = rarity === "epic" || rarity === "legendary" || rarity === "creator" || rarity === "queen";

  const renderVisual = () => {
    if (card.kind === "cosmetic") {
      if (card.category === "frame")
        return <CosmeticAvatar fallback="✨" frame={card.key} size="xl" />;
      if (card.category === "background")
        return (
          <div className="w-40 h-28 rounded-md border-[2.5px] border-foreground overflow-hidden relative" style={backgroundStyle(card.key)}>
            <BackgroundDecor itemKey={card.key} />
          </div>
        );
      if (card.category === "sticker")
        return hasCustomSticker(card.key)
          ? <StickerDecor itemKey={card.key} className="block w-32 h-32" />
          : <span className="text-8xl drop-shadow-lg">{card.emoji ?? "✨"}</span>;
      if (card.category === "title")
        return card.key === "title_owner"
          ? <p className="owner-title text-3xl">{card.name}</p>
          : <p className={cn("font-mono uppercase tracking-widest text-2xl font-bold", theme.text)}>{card.name}</p>;
    }
    if (card.kind === "xp")      return <p className="text-7xl font-display xp-slam">+<CountUp target={card.xp} /></p>;
    if (card.kind === "token")   return <span className="text-8xl">📎</span>;
    if (card.kind === "powerup") return <span className="text-8xl">{POWERUP_LABELS[card.key]?.emoji ?? "⚡"}</span>;
    return null;
  };

  const title =
    card.kind === "cosmetic" ? card.name :
    card.kind === "xp"      ? "Bonus XP" :
    card.kind === "token"   ? "Pass de streak" :
    POWERUP_LABELS[(card as any).key]?.name ?? "Power-up";

  const subtitle =
    card.kind === "cosmetic" ? `${RARITY_LABEL[rarity]} · ${card.category}` :
    card.kind === "xp"      ? "Expérience gagnée" :
    card.kind === "token"   ? "Protège ton streak" : "Pouvoir spécial";

  return (
    <div className="card-rise-in relative">
      <div className={cn("relative rounded-2xl border-[3px] border-foreground bg-card p-6 w-72 sm:w-80 card-idle-float", theme.glow)}>
        <div className={cn("absolute inset-0 rounded-2xl pointer-events-none", theme.aura)} />

        {/* Corner sparkles on rare+ */}
        {isHigh && (
          <>
            <div className="absolute -top-3 -left-3 w-4 h-4 rounded-full bg-yellow-300 sparkle-twinkle" style={{ animationDelay: "0s" }} />
            <div className="absolute -top-2 -right-4 w-3.5 h-3.5 rounded-full bg-pink-300 sparkle-twinkle" style={{ animationDelay: "0.4s" }} />
            <div className="absolute -bottom-3 -left-2 w-3.5 h-3.5 rounded-full bg-purple-300 sparkle-twinkle" style={{ animationDelay: "0.72s" }} />
            <div className="absolute -bottom-2 -right-3 w-4 h-4 rounded-full bg-amber-300 sparkle-twinkle" style={{ animationDelay: "1.05s" }} />
          </>
        )}

        {/* Rarity pill */}
        <div className={cn(
          "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest border-2 border-foreground",
          theme.label
        )}>
          {RARITY_LABEL[rarity]}
        </div>

        <div className="relative h-44 flex items-center justify-center">
          {renderVisual()}
        </div>
        <p className="font-display text-xl text-center mt-4 leading-tight">{title}</p>
        <p className="text-xs text-center text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

/* ─── Main reveal component ──────────────────────────────────────────────── */

export function LootBoxReveal({ reward, onClose }: { reward: Reward; onClose: () => void }) {
  const cards      = useMemo(() => rewardToCards(reward), [reward]);
  const peakRarity = useMemo(() => highestRarity(cards), [cards]);

  type Phase    = "enter" | "glow" | "burst" | "reveal";
  type SubPhase = "banner" | "card";

  const [phase,       setPhase]       = useState<Phase>("enter");
  const [revealIdx,   setRevealIdx]   = useState(0);
  const [subPhase,    setSubPhase]    = useState<SubPhase>("banner");
  const [showConfetti, setShowConfetti] = useState(false);

  // ── Main cinematic timeline: 1.2 s to first card (was 3.3 s) ──────────
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("glow"),  380);
    const t2 = setTimeout(() => setPhase("burst"), 930);
    const t3 = setTimeout(() => {
      setPhase("reveal");
      setShowConfetti(true);
    }, 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // ── Banner → card transition on each reveal ────────────────────────────
  useEffect(() => {
    if (phase !== "reveal") return;
    setSubPhase("banner");
    const t = setTimeout(() => setSubPhase("card"), 680);
    return () => clearTimeout(t);
  }, [revealIdx, phase]);

  const next = () => {
    if (revealIdx < cards.length - 1) setRevealIdx(i => i + 1);
    else onClose();
  };

  const bgTint =
    peakRarity === "queen"     ? "from-pink-900/95 via-rose-900/95 to-amber-950/98"    :
    peakRarity === "creator"   ? "from-amber-900/95 via-yellow-900/95 to-rose-950/98"  :
    peakRarity === "legendary" ? "from-amber-900/95 via-rose-900/95 to-purple-950/98"  :
    peakRarity === "epic"      ? "from-purple-950/95 via-fuchsia-900/95 to-indigo-950/98" :
    peakRarity === "rare"      ? "from-blue-950/95 via-indigo-900/95 to-slate-950/98"  :
    "from-slate-900/95 via-slate-800/95 to-slate-950/98";

  return (
    <div className={cn(
      "fixed inset-0 z-[100] overflow-hidden bg-gradient-to-br animate-fade-in",
      bgTint,
      phase === "burst" && "screen-shake"
    )}>

      {/* ── Star field ──────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none opacity-45">
        <svg className="w-full h-full">
          {Array.from({ length: 55 }).map((_, i) => (
            <circle key={i}
              cx={`${(i * 17 + 5) % 100}%`} cy={`${(i * 13 + 8) % 100}%`}
              r={i % 7 === 0 ? 1.8 : 1} fill="#fff" opacity={0.25 + (i % 4) * 0.18}>
              <animate attributeName="opacity" values="0.1;0.95;0.1"
                dur={`${1.2 + (i % 5) * 0.32}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      </div>

      {/* ── Close ───────────────────────────────────────────────────────── */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
        aria-label="Fermer"
      >
        <X className="h-5 w-5" />
      </button>

      {/* ── Reveal: rotating light rays ─────────────────────────────────── */}
      {phase === "reveal" && <Rays rarity={peakRarity} />}

      {/* ── Burst effects ───────────────────────────────────────────────── */}
      {phase === "burst" && (
        <>
          <div className="absolute inset-0 flash-chromatic pointer-events-none" />
          <div className="shockwave-ring" />
          <div className="shockwave-ring delay-1" />
          <div className="shockwave-ring delay-2" />
          <div className="shockwave-ring delay-3" />
          <div className="shockwave-ring delay-4" />
          <div className="shockwave-ring delay-5" />
        </>
      )}

      {/* ── Main content area ───────────────────────────────────────────── */}
      <div className="relative z-20 h-full w-full flex flex-col items-center justify-center px-5">

        {/* Pre-reveal: box stages */}
        {phase !== "reveal" && (
          <div className="flex flex-col items-center gap-6 relative">

            {/* Orbital energy particles during glow phase */}
            {phase === "glow" && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {Array.from({ length: 8 }).map((_, i) => (
                  <span key={i} className="particle-orbit" style={{
                    "--orbit-r": `${66 + (i % 3) * 18}px`,
                    animationDelay: `${i * 0.14}s`,
                    animationDuration: `${1.45 + (i % 3) * 0.22}s`,
                  } as React.CSSProperties & { "--orbit-r": string }}>
                    <span className="block w-2.5 h-2.5 rounded-full" style={{
                      background:
                        i % 3 === 0 ? "hsl(45 100% 65%)"  :
                        i % 3 === 1 ? "hsl(280 90% 70%)"  :
                                      "hsl(220 90% 65%)",
                      boxShadow: "0 0 10px currentColor",
                    }} />
                  </span>
                ))}
              </div>
            )}

            {/* Box — enters from below, glows, explodes */}
            <div className={cn(
              phase === "enter" && "box-enter",
              phase === "glow"  && "heartbeat",
              phase === "burst" && "box-explode",
            )}>
              <BoxIcon lidFly={phase === "burst"} showSeamGlow={phase === "glow"} />
            </div>

            {/* Status copy */}
            <p className={cn(
              "font-display text-xl text-white/90 tracking-wide transition-opacity duration-150",
              phase === "burst" ? "opacity-0" : "opacity-100"
            )}>
              {phase === "enter" && "Boîte mystère"}
              {phase === "glow"  && "⚡ Ouverture…"}
            </p>
          </div>
        )}

        {/* Reveal stage */}
        {phase === "reveal" && cards[revealIdx] && (
          <div className="flex flex-col items-center">

            {/* Rarity banner (solid color text, no gradient-text ban violation) */}
            {subPhase === "banner" && <RarityBanner card={cards[revealIdx]} />}

            {/* Card rise-in (spring up from below, no nauseating rotateY) */}
            {subPhase === "card" && <CardReveal key={revealIdx} card={cards[revealIdx]} />}

            {/* Progress + action */}
            {subPhase === "card" && (
              <div className="mt-7 flex flex-col items-center gap-3.5">

                {/* Dot progress indicators (replaces "1 / N" text) */}
                {cards.length > 1 && (
                  <div className="flex items-center gap-2">
                    {cards.map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "rounded-full h-1.5 transition-all duration-300",
                          i === revealIdx
                            ? "w-6 bg-white dot-pill-in"
                            : i < revealIdx
                            ? "w-1.5 bg-white/40"
                            : "w-1.5 bg-white/20"
                        )}
                      />
                    ))}
                  </div>
                )}

                {/* Action button — bounces in from below */}
                <button
                  onClick={next}
                  className="btn-bounce-in px-7 py-3 rounded-md border-[2.5px] border-foreground bg-white text-foreground font-bold uppercase tracking-wide text-sm shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm transition-all flex items-center gap-2"
                >
                  {revealIdx < cards.length - 1
                    ? <>Suivant <ChevronRight className="h-4 w-4" /></>
                    : "Terminer ✨"
                  }
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showConfetti && <Confetti rarity={peakRarity} />}
    </div>
  );
}

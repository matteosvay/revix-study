import { useEffect, useMemo, useState } from "react";
import { X, ChevronRight } from "lucide-react";
import { CosmeticAvatar } from "@/components/revix/CosmeticAvatar";
import { BackgroundDecor } from "@/components/revix/cosmetics/BackgroundDecor";
import { StickerDecor, hasCustomSticker } from "@/components/revix/cosmetics/StickerDecor";
import { backgroundStyle, RARITY_LABEL, RARITY_ORDER, RARITY_TEXT, type Rarity } from "@/lib/cosmetics";
import { cn } from "@/lib/utils";

const POWERUP_LABELS: Record<string, { name: string; emoji: string }> = {
  power_5050: { name: "50 / 50", emoji: "✂️" },
  power_skip: { name: "Skip question", emoji: "⏭️" },
  power_time: { name: "+30 sec", emoji: "⏱️" },
};

type Reward = {
  xp: number;
  streak_token: boolean;
  powerup: string | null;
  cosmetic: { key: string; name: string; emoji: string | null; rarity: string; category: string } | null;
};

type Card =
  | { kind: "xp"; xp: number }
  | { kind: "token" }
  | { kind: "powerup"; key: string }
  | { kind: "cosmetic"; key: string; name: string; emoji: string | null; rarity: Rarity; category: string };

const RARITY_THEME: Record<Rarity, { ring: string; glow: string; aura: string; label: string; text: string; gradient: string }> = {
  common: {
    ring: "ring-muted-foreground",
    glow: "shadow-[0_0_30px_hsl(0_0%_70%/0.6)]",
    aura: "rare-aura",
    label: "bg-muted text-foreground",
    text: "text-foreground",
    gradient: "from-slate-300 to-slate-500",
  },
  rare: {
    ring: "ring-blue-400",
    glow: "shadow-[0_0_45px_hsl(220_100%_60%/0.7)]",
    aura: "rare-aura",
    label: "bg-blue-500 text-white",
    text: "text-blue-500",
    gradient: "from-sky-300 to-blue-600",
  },
  epic: {
    ring: "ring-purple-500",
    glow: "shadow-[0_0_55px_hsl(280_100%_60%/0.8)]",
    aura: "epic-aura",
    label: "bg-purple-600 text-white",
    text: "text-purple-500",
    gradient: "from-fuchsia-400 to-purple-700",
  },
  legendary: {
    ring: "ring-yellow-400",
    glow: "shadow-[0_0_70px_hsl(45_100%_55%/0.9)]",
    aura: "legendary-aura",
    label: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white",
    text: "text-yellow-500",
    gradient: "from-yellow-300 via-orange-400 to-rose-500",
  },
  creator: {
    ring: "ring-amber-300",
    glow: "shadow-[0_0_80px_hsl(45_100%_60%/0.95)]",
    aura: "legendary-aura",
    label: "bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 text-black",
    text: "text-amber-400",
    gradient: "from-amber-200 via-yellow-400 to-amber-600",
  },
  queen: {
    ring: "ring-pink-300",
    glow: "shadow-[0_0_90px_hsl(330_100%_75%/0.95)]",
    aura: "legendary-aura",
    label: "bg-gradient-to-r from-pink-300 via-rose-400 to-amber-300 text-white",
    text: "text-pink-500",
    gradient: "from-pink-300 via-rose-400 to-amber-300",
  },
};

function rewardToCards(r: Reward): Card[] {
  const cards: Card[] = [];
  if (r.cosmetic) {
    cards.push({ kind: "cosmetic", key: r.cosmetic.key, name: r.cosmetic.name, emoji: r.cosmetic.emoji, rarity: (r.cosmetic.rarity as Rarity) ?? "common", category: r.cosmetic.category });
  }
  if (r.powerup) cards.push({ kind: "powerup", key: r.powerup });
  if (r.streak_token) cards.push({ kind: "token" });
  if (r.xp > 0) cards.push({ kind: "xp", xp: r.xp });
  return cards;
}

function highestRarity(cards: Card[]): Rarity {
  const order = RARITY_ORDER;
  let best: Rarity = "common";
  for (const c of cards) {
    if (c.kind === "cosmetic" && order.indexOf(c.rarity) > order.indexOf(best)) best = c.rarity;
    if (c.kind === "powerup" && order.indexOf("rare") > order.indexOf(best)) best = "rare";
    if (c.kind === "token" && order.indexOf("rare") > order.indexOf(best)) best = "rare";
  }
  return best;
}

function Confetti({ rarity }: { rarity: Rarity }) {
  const colors =
    rarity === "legendary" ? ["#fde047", "#f97316", "#ec4899", "#a855f7", "#22d3ee"] :
    rarity === "epic" ? ["#a855f7", "#ec4899", "#3b82f6", "#fde047"] :
    rarity === "rare" ? ["#3b82f6", "#22d3ee", "#fde047"] :
    ["#cbd5e1", "#94a3b8", "#fde047"];
  const pieces = useMemo(() => Array.from({ length: 60 }).map((_, i) => ({
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.6}s`,
    color: colors[i % colors.length],
    size: 6 + Math.random() * 8,
    drift: `${(Math.random() - 0.5) * 200}px`,
    rot: Math.random() > 0.5 ? "circle" : "rect",
  })), [rarity]);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece absolute top-0"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.rot === "circle" ? "50%" : "2px",
            animationDelay: p.delay,
            // @ts-ignore
            "--cf-x": p.drift,
          } as any}
        />
      ))}
    </div>
  );
}

function Rays({ rarity }: { rarity: Rarity }) {
  const color =
    rarity === "legendary" ? "hsl(45 100% 60%)" :
    rarity === "epic" ? "hsl(280 90% 65%)" :
    rarity === "rare" ? "hsl(220 90% 60%)" :
    "hsl(0 0% 70%)";
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="ray-spin">
        <svg viewBox="-100 -100 200 200" className="w-[140vw] h-[140vw] max-w-[1200px] max-h-[1200px] ray-pulse">
          {Array.from({ length: 16 }).map((_, i) => (
            <polygon
              key={i}
              points="0,0 -8,-100 8,-100"
              fill={color}
              opacity={i % 2 ? 0.45 : 0.7}
              transform={`rotate(${(360 / 16) * i})`}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

function CardReveal({ card }: { card: Card }) {
  const rarity: Rarity =
    card.kind === "cosmetic" ? card.rarity :
    card.kind === "powerup" ? "rare" :
    card.kind === "token" ? "rare" :
    "common";
  const theme = RARITY_THEME[rarity];

  const renderVisual = () => {
    if (card.kind === "cosmetic") {
      if (card.category === "frame") {
        return <CosmeticAvatar fallback="✨" frame={card.key} size="xl" />;
      }
      if (card.category === "background") {
        return (
          <div className="w-40 h-28 rounded-md border-[2.5px] border-foreground overflow-hidden relative" style={backgroundStyle(card.key)}>
            <BackgroundDecor itemKey={card.key} />
          </div>
        );
      }
      if (card.category === "sticker") {
        return hasCustomSticker(card.key)
          ? <StickerDecor itemKey={card.key} className="block w-32 h-32" />
          : <span className="text-8xl drop-shadow-lg">{card.emoji ?? "✨"}</span>;
      }
      if (card.category === "title") {
        if (card.key === "title_owner") {
          return <p className="owner-title text-3xl">{card.name}</p>;
        }
        return <p className={cn("font-mono uppercase tracking-widest text-2xl font-bold", theme.text)}>{card.name}</p>;
      }
    }
    if (card.kind === "xp") return <p className="text-7xl font-display">+{card.xp}</p>;
    if (card.kind === "token") return <span className="text-8xl">📎</span>;
    if (card.kind === "powerup") return <span className="text-8xl">{POWERUP_LABELS[card.key]?.emoji ?? "⚡"}</span>;
    return null;
  };

  const title =
    card.kind === "cosmetic" ? card.name :
    card.kind === "xp" ? "Bonus XP" :
    card.kind === "token" ? "Pass de streak" :
    card.kind === "powerup" ? POWERUP_LABELS[card.key]?.name ?? "Power-up" :
    "";

  const subtitle =
    card.kind === "cosmetic" ? `${RARITY_LABEL[rarity]} · ${card.category}` :
    card.kind === "xp" ? "Expérience gagnée" :
    card.kind === "token" ? "Protège ton streak" :
    card.kind === "powerup" ? "Pouvoir spécial" :
    "";

  return (
    <div className="card-flip relative">
      <div className={cn("relative rounded-2xl border-[3px] border-foreground bg-card p-6 w-72 sm:w-80", theme.glow)}>
        <div className={cn("absolute inset-0 rounded-2xl pointer-events-none", theme.aura)} />
        <div className={cn("absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest border-2 border-foreground", theme.label)}>
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

export function LootBoxReveal({ reward, onClose }: { reward: Reward; onClose: () => void }) {
  const cards = useMemo(() => rewardToCards(reward), [reward]);
  const peakRarity = useMemo(() => {
    const order = RARITY_ORDER;
    let best: Rarity = "common";
    for (const c of cards) {
      if (c.kind === "cosmetic" && order.indexOf(c.rarity) > order.indexOf(best)) best = c.rarity;
    }
    if (best === "common" && cards.some(c => c.kind === "powerup" || c.kind === "token")) best = "rare";
    return best;
  }, [cards]);

  // Phases: 0 box-shake | 1 burst flash | 2 reveal cards (one by one)
  const [phase, setPhase] = useState<"shake" | "burst" | "reveal">("shake");
  const [revealIdx, setRevealIdx] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("burst"), 1400);
    const t2 = setTimeout(() => {
      setPhase("reveal");
      setShowConfetti(true);
    }, 2050);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const next = () => {
    if (revealIdx < cards.length - 1) setRevealIdx((i) => i + 1);
    else onClose();
  };

  // Background tint by rarity
  const bgTint =
    peakRarity === "legendary" ? "from-amber-900/95 via-rose-900/95 to-purple-950/98" :
    peakRarity === "epic" ? "from-purple-950/95 via-fuchsia-900/95 to-indigo-950/98" :
    peakRarity === "rare" ? "from-blue-950/95 via-indigo-900/95 to-slate-950/98" :
    "from-slate-900/95 via-slate-800/95 to-slate-950/98";

  return (
    <div className={cn("fixed inset-0 z-[100] overflow-hidden bg-gradient-to-br animate-fade-in", bgTint)}>
      {/* Star background */}
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <svg className="w-full h-full">
          {Array.from({ length: 80 }).map((_, i) => (
            <circle key={i} cx={`${(i * 13) % 100}%`} cy={`${(i * 17) % 100}%`} r={i % 6 === 0 ? 2 : 1} fill="#fff" opacity={0.4 + (i % 4) * 0.15}>
              <animate attributeName="opacity" values="0.2;1;0.2" dur={`${1 + (i % 5) * 0.4}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-background/20 hover:bg-background/40 backdrop-blur-sm flex items-center justify-center text-white"
        aria-label="Fermer"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Light rays during reveal */}
      {phase === "reveal" && <Rays rarity={peakRarity} />}

      {/* Burst flash */}
      {phase === "burst" && (
        <div className="absolute inset-0 bg-white flash-bang" />
      )}

      <div className="relative z-20 h-full w-full flex flex-col items-center justify-center px-5">
        {/* Phase 1: shaking box */}
        {phase !== "reveal" && (
          <div className="flex flex-col items-center gap-5">
            <div className={cn(phase === "shake" ? "box-shake" : "box-burst")}>
              <BoxIcon rarity={peakRarity} />
            </div>
            <p className="font-display text-2xl text-white drop-shadow-lg tracking-wide">
              {phase === "shake" ? "Ouverture..." : ""}
            </p>
          </div>
        )}

        {/* Phase 2: reveal cards one by one */}
        {phase === "reveal" && cards[revealIdx] && (
          <>
            <CardReveal key={revealIdx} card={cards[revealIdx]} />
            <div className="mt-8 flex flex-col items-center gap-3">
              <p className="text-xs font-mono uppercase tracking-widest text-white/70">
                {revealIdx + 1} / {cards.length}
              </p>
              <button
                onClick={next}
                className="px-6 py-3 rounded-md border-[2.5px] border-foreground bg-white text-foreground font-bold uppercase tracking-wide text-sm shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm transition-all flex items-center gap-2"
              >
                {revealIdx < cards.length - 1 ? <>Suivant <ChevronRight className="h-4 w-4" /></> : "Terminer ✨"}
              </button>
            </div>
          </>
        )}
      </div>

      {showConfetti && <Confetti rarity={peakRarity} />}
    </div>
  );
}

function BoxIcon({ rarity }: { rarity: Rarity }) {
  const theme = RARITY_THEME[rarity];
  return (
    <div className={cn("relative rounded-2xl", theme.glow)}>
      <svg viewBox="0 0 120 120" className="w-44 h-44 drop-shadow-2xl">
        <defs>
          <linearGradient id="box-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <linearGradient id="box-lid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="100%" stopColor="#fde047" />
          </linearGradient>
        </defs>
        {/* shadow */}
        <ellipse cx="60" cy="110" rx="38" ry="4" fill="#000" opacity="0.4" />
        {/* body */}
        <rect x="20" y="50" width="80" height="55" rx="6" fill="url(#box-body)" stroke="#000" strokeWidth="3" />
        {/* ribbon vertical body */}
        <rect x="55" y="50" width="10" height="55" fill="#ec4899" stroke="#000" strokeWidth="2" />
        {/* lid */}
        <rect x="15" y="38" width="90" height="18" rx="4" fill="url(#box-lid)" stroke="#000" strokeWidth="3" />
        {/* ribbon vertical lid */}
        <rect x="55" y="38" width="10" height="18" fill="#ec4899" stroke="#000" strokeWidth="2" />
        {/* bow */}
        <path d="M40 38 Q 50 18 60 38 Q 70 18 80 38 Z" fill="#ec4899" stroke="#000" strokeWidth="2.5" />
        <circle cx="60" cy="38" r="4" fill="#fde047" stroke="#000" strokeWidth="2" />
        {/* sparkles */}
        <g>
          <circle cx="20" cy="20" r="2" fill="#fff">
            <animate attributeName="opacity" values="0;1;0" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="100" cy="30" r="2" fill="#fff">
            <animate attributeName="opacity" values="0;1;0" dur="1.4s" begin="0.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="105" cy="80" r="1.6" fill="#fff">
            <animate attributeName="opacity" values="0;1;0" dur="1.1s" begin="0.7s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    </div>
  );
}
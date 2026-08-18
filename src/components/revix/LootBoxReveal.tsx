import { useEffect, useMemo, useRef, useState } from "react";
import { X, ChevronRight, Shield, Zap } from "lucide-react";
import { CosmeticAvatar } from "@/components/revix/CosmeticAvatar";
import { BackgroundDecor } from "@/components/revix/cosmetics/BackgroundDecor";
import { StickerDecor, hasCustomSticker } from "@/components/revix/cosmetics/StickerDecor";
import { backgroundStyle, RARITY_LABEL, RARITY_ORDER, type Rarity } from "@/lib/cosmetics";
import { cn } from "@/lib/utils";
import { playShimmer, playUnwrap, playReveal, playPop, unlock } from "@/lib/sfx";

const POWERUP_LABELS: Record<string, { name: string }> = {
  power_5050: { name: "50 / 50" },
  power_skip: { name: "Passer une question" },
  power_time: { name: "+30 secondes" },
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

/* ─── Thème papier par rareté ─────────────────────────────────────────────── */
const PAPER: Record<Rarity, { stamp: string; tape: string; foil: boolean; scraps: string[] }> = {
  common:    { stamp: "#8a97ad", tape: "#cfd6e0", foil: false, scraps: ["#cbd5e1", "#94a3b8", "#ffe14d", "#ffffff"] },
  rare:      { stamp: "#2f79e0", tape: "#bfe0e6", foil: false, scraps: ["#2456d6", "#0ea5b7", "#ffe14d", "#ffffff"] },
  epic:      { stamp: "#9b51e0", tape: "#d9c6f2", foil: false, scraps: ["#8b5cf6", "#3b82f6", "#ec4899", "#ffe14d"] },
  legendary: { stamp: "#e8a319", tape: "#ffe9a8", foil: true,  scraps: ["#ffe14d", "#f6c945", "#ff9f43", "#ffffff", "#ffd23a"] },
  creator:   { stamp: "#e8862a", tape: "#ffdcb0", foil: true,  scraps: ["#f59e0b", "#ffd23a", "#ff9f43", "#ffffff"] },
  queen:     { stamp: "#e0559a", tape: "#ffcfe4", foil: true,  scraps: ["#ec4899", "#f6c945", "#ffffff", "#ffb0c8"] },
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
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

function cardRarity(card: Card): Rarity {
  if (card.kind === "cosmetic") return card.rarity;
  if (card.kind === "powerup" || card.kind === "token") return "rare";
  return "common";
}

function highestRarity(cards: Card[]): Rarity {
  let best: Rarity = "common";
  for (const c of cards) {
    const r = cardRarity(c);
    if (RARITY_ORDER.indexOf(r) > RARITY_ORDER.indexOf(best)) best = r;
  }
  return best;
}

function CountUp({ target, duration = 1200 }: { target: number; duration?: number }) {
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

/* ─── Paquet-cadeau papier ───────────────────────────────────────────────── */
function PaperBox({ state }: { state: "idle" | "shake" | "burst" }) {
  return (
    <svg viewBox="0 0 180 200" width="240" height="266" className="overflow-visible">
      <g className={cn("lb-box", state === "idle" && "is-idle", state === "shake" && "is-shake", state === "burst" && "is-burst")}>
        <ellipse cx="90" cy="188" rx="62" ry="9" fill="hsl(var(--foreground))" opacity="0.14" />
        <g className="lb-body">
          <rect x="30" y="82" width="120" height="96" rx="12" fill="#fffdf6" stroke="#1e2c47" strokeWidth="4" />
          <rect x="78" y="82" width="24" height="96" fill="hsl(var(--primary))" opacity="0.9" stroke="#1e2c47" strokeWidth="2" />
          <rect x="78" y="82" width="24" height="96" fill="url(#lb-stripes)" />
        </g>
        <g className="lb-lid">
          <rect x="22" y="62" width="136" height="30" rx="8" fill="#fffdf6" stroke="#1e2c47" strokeWidth="4" />
          <rect x="78" y="62" width="24" height="30" fill="hsl(var(--primary))" opacity="0.9" stroke="#1e2c47" strokeWidth="2" />
          <path d="M90 62 C70 48 52 48 54 34 C56 22 84 30 90 58 Z" fill="#ffe14d" stroke="#1e2c47" strokeWidth="3" strokeLinejoin="round" />
          <path d="M90 62 C110 48 128 48 126 34 C124 22 96 30 90 58 Z" fill="#ffe14d" stroke="#1e2c47" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="90" cy="54" r="8" fill="#f6c945" stroke="#1e2c47" strokeWidth="3" />
        </g>
      </g>
      <defs>
        <pattern id="lb-stripes" width="12" height="12" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <rect width="6" height="12" fill="rgba(255,255,255,0.25)" />
        </pattern>
      </defs>
    </svg>
  );
}

/* ─── Diplo qui jubile (cap = couleur principale) ────────────────────────── */
function DiploCheer() {
  return (
    <svg viewBox="0 0 140 156" width="80" height="88" className="overflow-visible">
      <g className="diplo-bob">
        <path d="M56 134 v9 M84 134 v9" stroke="#1e2c47" strokeWidth="5.5" strokeLinecap="round" />
        <path d="M40 106 c-8 -6 -12 -14 -11 -22 M100 106 c8 -6 12 -14 11 -22" fill="none" stroke="#1e2c47" strokeWidth="5" strokeLinecap="round" />
        <rect x="38" y="60" width="64" height="78" rx="30" fill="#fffdf6" stroke="#1e2c47" strokeWidth="4.5" />
        <ellipse cx="52" cy="106" rx="6.5" ry="4.5" fill="#ffb0c8" opacity="0.85" />
        <ellipse cx="88" cy="106" rx="6.5" ry="4.5" fill="#ffb0c8" opacity="0.85" />
        <g className="diplo-eyes">
          <path d="M50 96 q7 -9 14 0" fill="none" stroke="#1e2c47" strokeWidth="3.6" strokeLinecap="round" />
          <path d="M76 96 q7 -9 14 0" fill="none" stroke="#1e2c47" strokeWidth="3.6" strokeLinecap="round" />
        </g>
        <path d="M58 108 q12 13 24 0" fill="none" stroke="#1e2c47" strokeWidth="3.8" strokeLinecap="round" />
        <ellipse cx="70" cy="58" rx="35" ry="12" fill="hsl(var(--primary))" stroke="#1e2c47" strokeWidth="4" />
        <path d="M70 28 L118 50 L70 72 L22 50 Z" fill="hsl(var(--primary))" stroke="#1e2c47" strokeWidth="4" strokeLinejoin="round" />
        <circle cx="70" cy="50" r="3.4" fill="#f6c945" />
        <g className="diplo-tassel">
          <path d="M70 50 C96 52 108 56 108 66" fill="none" stroke="#f6c945" strokeWidth="3.2" />
          <path d="M103 64 h10 l-2.5 15 h-5 z" fill="#f6c945" stroke="#1e2c47" strokeWidth="2" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
}

/* ─── Visuel de la récompense (réutilise les cosmétiques existants) ───────── */
function RewardVisual({ card }: { card: Card }) {
  const rarity = cardRarity(card);
  if (card.kind === "cosmetic") {
    if (card.category === "frame") return <CosmeticAvatar fallback="" frame={card.key} size="xl" />;
    if (card.category === "background")
      return (
        <div className="w-40 h-28 rounded-md border-[2.5px] border-foreground overflow-hidden relative" style={backgroundStyle(card.key)}>
          <BackgroundDecor itemKey={card.key} />
        </div>
      );
    if (card.category === "sticker")
      return hasCustomSticker(card.key)
        ? <StickerDecor itemKey={card.key} className="block w-28 h-28" />
        : <span className="text-7xl drop-shadow-lg">{card.emoji ?? ""}</span>;
    if (card.category === "title")
      return <p className="font-mono uppercase tracking-widest text-2xl font-bold text-center" style={{ color: PAPER[rarity].stamp }}>{card.name}</p>;
  }
  if (card.kind === "xp") return <p className="text-6xl font-display">+<CountUp target={card.xp} /></p>;
  if (card.kind === "token") return <Shield className="h-20 w-20 text-primary" strokeWidth={2} />;
  if (card.kind === "powerup") return <Zap className="h-20 w-20 text-accent-foreground" strokeWidth={2} />;
  return null;
}

/* ─── Confetti papier + étoiles (Web Animations API) ─────────────────────── */
function firePaperConfetti(scraps: string[]) {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight * 0.4;
  for (let i = 0; i < 60; i++) {
    const el = document.createElement("div");
    const star = Math.random() > 0.55;
    const col = scraps[Math.floor(Math.random() * scraps.length)];
    el.style.cssText = `position:fixed;z-index:120;pointer-events:none;left:${cx}px;top:${cy}px`;
    if (star) {
      el.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="${col}"><path d="M12 3l2.5 5.5L20 9.3l-4 4 .9 5.7-4.9-2.8L7 19l.9-5.7-4-4 5.6-.8L12 3Z"/></svg>`;
    } else {
      el.style.width = `${6 + Math.random() * 7}px`;
      el.style.height = `${9 + Math.random() * 9}px`;
      el.style.background = col;
      el.style.borderRadius = "1px";
    }
    document.body.appendChild(el);
    const ang = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * 220;
    const dx = Math.cos(ang) * dist;
    const dy = Math.sin(ang) * dist - 60;
    const rot = Math.random() * 720 - 360;
    const dur = 1300 + Math.random() * 1100;
    el.animate(
      [
        { transform: "translate(-50%,-50%) rotate(0)", opacity: 1 },
        { transform: `translate(${dx - 8}px,${dy}px) rotate(${rot / 2}deg)`, opacity: 1, offset: 0.7 },
        { transform: `translate(${dx}px,${dy + 240}px) rotate(${rot}deg)`, opacity: 0 },
      ],
      { duration: dur, easing: "cubic-bezier(.2,.7,.3,1)" }
    ).onfinish = () => el.remove();
  }
}

/* ─── Composant principal ────────────────────────────────────────────────── */
export function LootBoxReveal({ reward, onClose }: { reward: Reward; onClose: () => void }) {
  const cards = useMemo(() => rewardToCards(reward), [reward]);
  const peak = useMemo(() => highestRarity(cards), [cards]);

  type Phase = "idle" | "shake" | "burst" | "reveal";
  const [phase, setPhase] = useState<Phase>("idle");
  const [revealIdx, setRevealIdx] = useState(0);
  const opening = useRef(false);

  useEffect(() => { unlock(); }, []);

  const open = () => {
    if (opening.current) return;
    opening.current = true;
    setPhase("shake");
    playShimmer();
    window.setTimeout(() => {
      setPhase("burst");
      playUnwrap();
      firePaperConfetti(PAPER[peak].scraps);
    }, 600);
    window.setTimeout(() => {
      setPhase("reveal");
      playReveal(cardRarity(cards[0] ?? { kind: "xp", xp: 0 }));
    }, 1150);
  };

  const next = () => {
    playPop();
    if (revealIdx < cards.length - 1) {
      const ni = revealIdx + 1;
      setRevealIdx(ni);
      playReveal(cardRarity(cards[ni]));
    } else {
      onClose();
    }
  };

  const current = cards[revealIdx];
  const curRarity = current ? cardRarity(current) : "common";
  const theme = PAPER[curRarity];

  const title =
    !current ? "" :
    current.kind === "cosmetic" ? current.name :
    current.kind === "xp" ? "Bonus XP" :
    current.kind === "token" ? "Pass de streak" :
    POWERUP_LABELS[current.key]?.name ?? "Power-up";

  const subtitle =
    !current ? "" :
    current.kind === "cosmetic" ? `${RARITY_LABEL[curRarity]} · ${current.category}` :
    current.kind === "xp" ? "Expérience gagnée" :
    current.kind === "token" ? "Protège ton streak" : "Pouvoir spécial";

  return (
    <div className="lb-backdrop fixed inset-0 z-[100] overflow-hidden animate-fade-in">
      {/* Fermer */}
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="absolute top-4 right-4 z-50 h-10 w-10 rounded-lg border-2 border-foreground bg-card shadow-brutal-sm flex items-center justify-center hover:-translate-y-0.5 transition-transform"
      >
        <X className="h-5 w-5" strokeWidth={2.5} />
      </button>

      <div className="relative z-20 h-full w-full flex flex-col items-center justify-center px-5">
        {phase !== "reveal" && (
          <div className="flex flex-col items-center gap-5">
            {/* Faisceau de lumière au burst */}
            {phase === "burst" && (
              <div
                className="lb-beam absolute left-1/2 top-[12%] w-[150px] h-[55%] -translate-x-1/2 pointer-events-none"
                style={{
                  background: "linear-gradient(to top, hsl(45 92% 62% / 0.7), transparent)",
                  filter: "blur(14px)",
                  clipPath: "polygon(38% 100%, 62% 100%, 80% 0, 20% 0)",
                }}
              />
            )}
            <button type="button" onClick={open} className="cursor-pointer" aria-label="Ouvrir la boîte mystère" style={{ background: "none", border: "none", padding: 0 }}>
              <PaperBox state={phase === "idle" ? "idle" : phase === "shake" ? "shake" : "burst"} />
            </button>
            <p className={cn("font-display text-lg tracking-wide transition-opacity", phase === "idle" ? "opacity-100" : "opacity-0")}>
              Clique pour ouvrir
            </p>
          </div>
        )}

        {phase === "reveal" && current && (
          <div className="flex flex-col items-center gap-3">
            <div
              className="lb-stamp-in font-display uppercase leading-none tracking-[0.06em] text-center"
              style={{
                fontSize: "clamp(2rem, 9vw, 3.2rem)",
                color: theme.stamp,
                border: `4px solid ${theme.stamp}`,
                borderRadius: "8px",
                padding: "2px 14px",
                transform: "rotate(-8deg)",
              }}
            >
              {RARITY_LABEL[curRarity]}
            </div>

            <div className={cn("lb-card-in relative rounded-2xl border-[3px] border-foreground p-6 w-72 shadow-brutal", theme.foil ? "lb-foil" : "bg-card")}>
              <span className="lb-tape absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 border border-black/10 shadow-sm" style={{ background: theme.tape }} />
              <div className="relative h-40 flex items-center justify-center">
                <RewardVisual card={current} />
              </div>
              <p className="font-display text-xl text-center mt-3 leading-tight">{title}</p>
              <p className="text-xs text-center text-muted-foreground mt-1">{subtitle}</p>
            </div>

            {cards.length > 1 && (
              <div className="flex items-center gap-2 mt-1">
                {cards.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-full h-1.5 transition-all duration-300",
                      i === revealIdx ? "w-6 bg-foreground" : i < revealIdx ? "w-1.5 bg-foreground/40" : "w-1.5 bg-foreground/20"
                    )}
                  />
                ))}
              </div>
            )}

            <button
              onClick={next}
              className="mt-2 px-7 py-3 rounded-lg border-[2.5px] border-foreground bg-primary text-primary-foreground font-bold uppercase tracking-wide text-sm shadow-brutal hover:-translate-y-0.5 active:translate-y-0.5 transition-transform flex items-center gap-2"
            >
              {revealIdx < cards.length - 1 ? <>Suivant <ChevronRight className="h-4 w-4" /></> : "Terminer"}
            </button>
          </div>
        )}
      </div>

      {/* Diplo qui jubile pendant la révélation */}
      {phase === "reveal" && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-30 animate-pop-in" style={{ filter: "drop-shadow(0 6px 10px rgba(30,44,71,0.28))" }}>
          <DiploCheer />
        </div>
      )}
    </div>
  );
}

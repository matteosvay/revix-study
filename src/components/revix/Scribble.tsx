import { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Scribble — annotations manuscrites SVG (la signature visuelle Revix).
 * À poser absolument n'importe où dans la page pour habiller un titre,
 * un CTA, un score, etc.
 */

type Color = "primary" | "accent" | "foreground" | "destructive" | "success";
const colorVar: Record<Color, string> = {
  primary: "hsl(var(--primary))",
  accent: "hsl(var(--accent))",
  foreground: "hsl(var(--foreground))",
  destructive: "hsl(var(--destructive))",
  success: "hsl(var(--success))",
};

const baseSvg = "scribble-draw pointer-events-none";

/** Soulignement feutre ondulé sous un mot/phrase. */
export function ScribbleUnderline({
  color = "accent",
  className,
  thickness = 3,
}: { color?: Color; className?: string; thickness?: number }) {
  return (
    <svg
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      className={cn(baseSvg, "block w-full h-2.5", className)}
      style={{ "--scribble-length": "260" } as CSSProperties}
      aria-hidden
    >
      <path
        d="M3 8 Q 25 3, 50 7 T 100 6 T 150 7 T 197 5"
        fill="none"
        stroke={colorVar[color]}
        strokeWidth={thickness}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Flèche manuscrite — peut pointer dans plusieurs directions. */
export function ScribbleArrow({
  color = "accent",
  className,
  direction = "right",
}: { color?: Color; className?: string; direction?: "right" | "down" | "left-down" | "right-down" }) {
  const paths = {
    right: { d: "M3 24 Q 25 4, 60 18", head: "M60 18 L 50 12 M60 18 L 52 26" },
    down: { d: "M30 3 Q 38 25, 30 56", head: "M30 56 L 23 48 M30 56 L 37 48" },
    "left-down": { d: "M58 3 Q 30 30, 5 50", head: "M5 50 L 13 44 M5 50 L 11 56" },
    "right-down": { d: "M3 3 Q 30 30, 58 50", head: "M58 50 L 50 44 M58 50 L 52 56" },
  };
  const view = direction === "down" ? "0 0 60 60" : "0 0 60 30";
  return (
    <svg
      viewBox={view}
      className={cn(baseSvg, className)}
      style={{ "--scribble-length": "120" } as CSSProperties}
      aria-hidden
    >
      <path d={paths[direction].d} fill="none" stroke={colorVar[color]} strokeWidth="2.5" strokeLinecap="round" />
      <path d={paths[direction].head} fill="none" stroke={colorVar[color]} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Cercle manuscrit autour d'un élément (à utiliser absolute). */
export function ScribbleCircle({
  color = "accent",
  className,
  rotate = 0,
}: { color?: Color; className?: string; rotate?: number }) {
  return (
    <svg
      viewBox="0 0 100 60"
      className={cn(baseSvg, className)}
      style={{ transform: `rotate(${rotate}deg)`, "--scribble-length": "260" } as CSSProperties}
      aria-hidden
    >
      <path
        d="M50 5 C 80 5, 95 20, 92 35 C 89 50, 65 56, 45 55 C 20 53, 8 42, 10 28 C 12 14, 28 6, 50 5 Z"
        fill="none"
        stroke={colorVar[color]}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Étoile griffonnée (note positive). */
export function ScribbleStar({
  color = "accent",
  className,
  size = 20,
}: { color?: Color; className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn(baseSvg, className)}
      style={{ "--scribble-length": "80" } as CSSProperties}
      aria-hidden
    >
      <path
        d="M12 2.5 L14.5 9 L21 9.5 L16 14 L17.5 21 L12 17.5 L6.5 21 L8 14 L3 9.5 L9.5 9 Z"
        fill={colorVar[color]}
        stroke="hsl(var(--foreground))"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Tampon "VALIDÉ" / "+50 XP" / "TOP" rotatif. */
export function ScribbleStamp({
  children,
  color = "destructive",
  className,
  rotate = -8,
}: { children: React.ReactNode; color?: Color; className?: string; rotate?: number }) {
  const c = colorVar[color];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-mono font-bold uppercase tracking-widest text-[10px] px-3 py-1 select-none",
        className
      )}
      style={{
        color: c,
        border: `2.5px solid ${c}`,
        borderRadius: 4,
        transform: `rotate(${rotate}deg)`,
        boxShadow: `inset 0 0 0 1.5px ${c}33`,
        background: "hsl(var(--card))",
      }}
    >
      {children}
    </span>
  );
}

/** Coche manuscrite (pour items terminés). */
export function ScribbleCheck({
  color = "success",
  className,
  size = 24,
}: { color?: Color; className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn(baseSvg, className)}
      style={{ "--scribble-length": "60" } as CSSProperties}
      aria-hidden
    >
      <path
        d="M3 13 Q 7 18, 10 19 Q 14 14, 21 5"
        fill="none"
        stroke={colorVar[color]}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Trois petits traits parallèles (insistance manuscrite). */
export function ScribbleEmphasis({
  color = "accent",
  className,
}: { color?: Color; className?: string }) {
  return (
    <svg
      viewBox="0 0 30 20"
      className={cn(baseSvg, className)}
      style={{ "--scribble-length": "40" } as CSSProperties}
      aria-hidden
    >
      <path d="M3 4 L 24 2" stroke={colorVar[color]} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M3 10 L 26 9" stroke={colorVar[color]} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M3 16 L 22 17" stroke={colorVar[color]} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

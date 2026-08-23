import { forwardRef } from "react";
import { Link } from "react-router-dom";

/**
 * Marque Diplo : la tête de la mascotte (visage crème, toque bleue, encre #1e2c47),
 * version compacte et statique pour le logo. Cohérente avec DiploFace.
 */
function DiploHeadMark({ className = "" }: { className?: string }) {
  const ink = "#1e2c47";
  const cream = "#fffdf6";
  const cap = "#2456d6";
  const gold = "#f6c945";
  return (
    <svg viewBox="20 26 100 118" width="26" height="30" className={className} aria-hidden="true" style={{ overflow: "visible", display: "block" }}>
      {/* Corps / visage */}
      <rect x="38" y="60" width="64" height="78" rx="30" fill={cream} stroke={ink} strokeWidth="4.5" />
      <ellipse cx="52" cy="106" rx="6.5" ry="4.5" fill="#ffb0c8" opacity="0.85" />
      <ellipse cx="88" cy="106" rx="6.5" ry="4.5" fill="#ffb0c8" opacity="0.85" />
      {/* Yeux souriants */}
      <path d="M50 96 q7 -9 14 0" fill="none" stroke={ink} strokeWidth="3.6" strokeLinecap="round" />
      <path d="M76 96 q7 -9 14 0" fill="none" stroke={ink} strokeWidth="3.6" strokeLinecap="round" />
      {/* Sourire */}
      <path d="M58 108 q12 13 24 0" fill="none" stroke={ink} strokeWidth="3.8" strokeLinecap="round" />
      {/* Toque */}
      <ellipse cx="70" cy="58" rx="35" ry="12" fill={cap} stroke={ink} strokeWidth="4" />
      <path d="M70 28 L118 50 L70 72 L22 50 Z" fill={cap} stroke={ink} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="70" cy="50" r="3.4" fill={gold} />
      <path d="M70 50 C96 52 108 56 108 66" fill="none" stroke={gold} strokeWidth="3.2" />
      <path d="M103 64 h10 l-2.5 15 h-5 z" fill={gold} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export const Logo = forwardRef<HTMLAnchorElement, { className?: string }>(function Logo({ className = "" }, ref) {
  return (
    <Link ref={ref} to="/" aria-label="Accueil Diplo" className={`group flex items-center gap-2.5 font-display font-bold text-xl ${className}`}>
      <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-accent border-[2.5px] border-foreground shadow-brutal -rotate-3 transition-transform duration-200 group-hover:rotate-0 group-hover:-translate-y-0.5">
        <DiploHeadMark />
      </span>
      <span className="tracking-tight">Diplo</span>
    </Link>
  );
});

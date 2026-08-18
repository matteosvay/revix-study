import { forwardRef } from "react";
import { Link } from "react-router-dom";

/** Marque Revix — toque façon « bureau étudiant », cohérente avec Diplo (encre #1e2c47, bouton doré). */
function CapMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 28" width="24" height="21" fill="none" className={className} aria-hidden="true">
      <path d="M16 3.5 L30 10.5 L16 17.5 L2 10.5 Z" fill="#fffdf6" stroke="#1e2c47" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M9 13 v5.5 c0 2.6 14 2.6 14 0 V13" fill="#fffdf6" stroke="#1e2c47" strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="16" cy="10.5" r="1.9" fill="#f6c945" stroke="#1e2c47" strokeWidth="1.4" />
      <path d="M28 11 v6" stroke="#1e2c47" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="28" cy="18.5" r="2" fill="#f6c945" stroke="#1e2c47" strokeWidth="1.4" />
    </svg>
  );
}

export const Logo = forwardRef<HTMLAnchorElement, { className?: string }>(function Logo({ className = "" }, ref) {
  return (
    <Link ref={ref} to="/" aria-label="Revix — accueil" className={`group flex items-center gap-2.5 font-display font-bold text-xl ${className}`}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-accent border-[2.5px] border-foreground shadow-brutal -rotate-3 transition-transform duration-200 group-hover:rotate-0 group-hover:-translate-y-0.5">
        <CapMark />
      </span>
      <span className="tracking-tight">Revix</span>
    </Link>
  );
});

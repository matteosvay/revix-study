import { useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const POKES = [
  "Salut Matteo !",
  "On révise ?",
  "T'es chaud aujourd'hui !",
  "Objectif niveau sup' !",
  "Encore une fiche ?",
];

/**
 * Diplo — la mascotte de Revix.
 * Personnage-toque de diplômé, présent en bas à gauche sur les écrans /app.
 * Cligne des yeux, se balance, et dit un petit mot au clic.
 */
export const DiploMascot = () => {
  const { pathname } = useLocation();
  const [msg, setMsg] = useState<string | null>(null);
  const idx = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  if (!pathname.startsWith("/app")) return null;

  const poke = () => {
    const m = POKES[idx.current++ % POKES.length];
    setMsg(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 1900);
  };

  return (
    <div
      className="fixed left-3 lg:left-[276px] bottom-24 lg:bottom-4 z-30"
      style={{ pointerEvents: "none" }}
      aria-hidden="false"
    >
      {msg && (
        <div
          className="mb-2 ml-1 inline-block max-w-[200px] rounded-xl border-[2.5px] border-foreground bg-card px-3 py-1.5 font-display text-sm text-foreground shadow-brutal-sm"
          style={{ pointerEvents: "none" }}
        >
          {msg}
        </div>
      )}
      <button
        type="button"
        onClick={poke}
        aria-label="Diplo, ta mascotte"
        style={{
          pointerEvents: "auto",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          filter: "drop-shadow(0 6px 8px rgba(30,44,71,0.28))",
        }}
      >
        <svg viewBox="0 0 140 156" width="84" height="94" style={{ overflow: "visible", display: "block" }}>
          <g className="diplo-bob">
            <path d="M56 134 v9 M84 134 v9" stroke="#1e2c47" strokeWidth="5.5" strokeLinecap="round" />
            <path
              d="M40 110 c-9 2 -14 8 -14 16 M100 110 c9 2 14 8 14 16"
              fill="none"
              stroke="#1e2c47"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <rect x="38" y="60" width="64" height="78" rx="30" fill="#fffdf6" stroke="#1e2c47" strokeWidth="4.5" />
            <ellipse cx="52" cy="106" rx="6.5" ry="4.5" fill="#ffb0c8" opacity="0.85" />
            <ellipse cx="88" cy="106" rx="6.5" ry="4.5" fill="#ffb0c8" opacity="0.85" />
            <g className="diplo-eyes">
              <circle cx="57" cy="95" r="7" fill="#fff" stroke="#1e2c47" strokeWidth="3" />
              <circle cx="83" cy="95" r="7" fill="#fff" stroke="#1e2c47" strokeWidth="3" />
              <circle cx="58.5" cy="96.5" r="3.2" fill="#1e2c47" />
              <circle cx="84.5" cy="96.5" r="3.2" fill="#1e2c47" />
              <circle cx="56" cy="93" r="1.5" fill="#fff" />
              <circle cx="82" cy="93" r="1.5" fill="#fff" />
            </g>
            <path d="M62 110 q8 7 16 0" fill="none" stroke="#1e2c47" strokeWidth="3.8" strokeLinecap="round" />
            <ellipse cx="70" cy="58" rx="35" ry="12" fill="hsl(var(--primary))" stroke="#1e2c47" strokeWidth="4" />
            <path d="M70 28 L118 50 L70 72 L22 50 Z" fill="hsl(var(--primary))" stroke="#1e2c47" strokeWidth="4" strokeLinejoin="round" />
            <circle cx="70" cy="50" r="3.4" fill="#f6c945" />
            <g className="diplo-tassel">
              <path d="M70 50 C96 52 108 56 108 66" fill="none" stroke="#f6c945" strokeWidth="3.2" />
              <path d="M103 64 h10 l-2.5 15 h-5 z" fill="#f6c945" stroke="#1e2c47" strokeWidth="2" strokeLinejoin="round" />
            </g>
          </g>
        </svg>
      </button>
    </div>
  );
};

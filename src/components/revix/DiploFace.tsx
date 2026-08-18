import { capColorFor, useDiploCapId } from "@/lib/diploCap";

export type DiploExpr = "normal" | "happy" | "sad";

/**
 * Dégradés des toques épiques / légendaires.
 * À monter UNE fois dans l'app (via DiploMascot) : les url(#dcap-…) se résolvent
 * ensuite pour tous les Diplo du document.
 */
export function DiploDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" className="absolute pointer-events-none">
      <defs>
        <linearGradient id="dcap-aurore" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" /><stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="dcap-sunset" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fb923c" /><stop offset="1" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="dcap-menthe" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" /><stop offset="1" stopColor="#2f9e5f" />
        </linearGradient>
        <linearGradient id="dcap-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff0b8" /><stop offset=".5" stopColor="#f6c945" /><stop offset="1" stopColor="#c8901f" />
        </linearGradient>
        <linearGradient id="dcap-holo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff5f8f" /><stop offset=".3" stopColor="#ffd23a" /><stop offset=".55" stopColor="#38e08a" /><stop offset=".8" stopColor="#3f8bff" /><stop offset="1" stopColor="#b06bff" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Diplo — composant unique réutilisé partout (mascotte, lootbox, level-up, picker).
 * `cap` force une couleur ; sinon on prend la toque choisie par l'élève.
 * `animClass` pilote l'animation du corps (diplo-bob par défaut, diplo-hop / diplo-party ponctuels).
 */
export function DiploFace({
  cap,
  expr = "normal",
  size = 84,
  animClass = "diplo-bob",
}: {
  cap?: string;
  expr?: DiploExpr;
  size?: number;
  animClass?: string;
}) {
  const storedId = useDiploCapId();
  const capColor = cap ?? capColorFor(storedId);

  return (
    <svg viewBox="0 0 140 156" width={size} height={(size * 156) / 140} style={{ overflow: "visible", display: "block" }}>
      <g className={animClass}>
        <path d="M56 134 v9 M84 134 v9" stroke="#1e2c47" strokeWidth="5.5" strokeLinecap="round" />
        <path d="M40 110 c-9 2 -14 8 -14 16 M100 110 c9 2 14 8 14 16" fill="none" stroke="#1e2c47" strokeWidth="5" strokeLinecap="round" />
        <rect x="38" y="60" width="64" height="78" rx="30" fill="#fffdf6" stroke="#1e2c47" strokeWidth="4.5" />
        <ellipse cx="52" cy="106" rx="6.5" ry="4.5" fill="#ffb0c8" opacity="0.85" />
        <ellipse cx="88" cy="106" rx="6.5" ry="4.5" fill="#ffb0c8" opacity="0.85" />
        <g className="diplo-eyes">
          {expr === "happy" ? (
            <>
              <path d="M50 96 q7 -9 14 0" fill="none" stroke="#1e2c47" strokeWidth="3.6" strokeLinecap="round" />
              <path d="M76 96 q7 -9 14 0" fill="none" stroke="#1e2c47" strokeWidth="3.6" strokeLinecap="round" />
            </>
          ) : expr === "sad" ? (
            <>
              <circle cx="57" cy="97" r="5.5" fill="#1e2c47" />
              <circle cx="83" cy="97" r="5.5" fill="#1e2c47" />
              <path d="M50 89 q7 4 13 0M77 89 q7 4 13 0" fill="none" stroke="#1e2c47" strokeWidth="2.6" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="57" cy="95" r="7" fill="#fff" stroke="#1e2c47" strokeWidth="3" />
              <circle cx="83" cy="95" r="7" fill="#fff" stroke="#1e2c47" strokeWidth="3" />
              <circle cx="58.5" cy="96.5" r="3.2" fill="#1e2c47" />
              <circle cx="84.5" cy="96.5" r="3.2" fill="#1e2c47" />
              <circle cx="56" cy="93" r="1.5" fill="#fff" />
              <circle cx="82" cy="93" r="1.5" fill="#fff" />
            </>
          )}
        </g>
        <path
          d={expr === "happy" ? "M58 108 q12 13 24 0" : expr === "sad" ? "M62 113 q8 -6 16 0" : "M62 110 q8 7 16 0"}
          fill="none"
          stroke="#1e2c47"
          strokeWidth="3.8"
          strokeLinecap="round"
        />
        <ellipse cx="70" cy="58" rx="35" ry="12" fill={capColor} stroke="#1e2c47" strokeWidth="4" />
        <path d="M70 28 L118 50 L70 72 L22 50 Z" fill={capColor} stroke="#1e2c47" strokeWidth="4" strokeLinejoin="round" />
        <circle cx="70" cy="50" r="3.4" fill="#f6c945" />
        <g className="diplo-tassel">
          <path d="M70 50 C96 52 108 56 108 66" fill="none" stroke="#f6c945" strokeWidth="3.2" />
          <path d="M103 64 h10 l-2.5 15 h-5 z" fill="#f6c945" stroke="#1e2c47" strokeWidth="2" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
}

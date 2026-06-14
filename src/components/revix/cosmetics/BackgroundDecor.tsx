/**
 * Animated overlay rendered on top of the background. For generated backgrounds
 * the visual is fully inside the WebP (set as background-image via backgroundStyle).
 * This component only renders extra animated SVG layers for the creator (M)
 * and queen (L) exclusives.
 */
export function BackgroundDecor({ itemKey }: { itemKey?: string | null }) {
  if (!itemKey) return null;

  if (itemKey === "bg_origine") {
    return (
      <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="orig-bg-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff7c2" />
            <stop offset="50%" stopColor="#ffd166" />
            <stop offset="100%" stopColor="#7a4a00" />
          </linearGradient>
          <radialGradient id="orig-bg-vignette" cx="50%" cy="50%" r="70%">
            <stop offset="60%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
          </radialGradient>
        </defs>
        {/* Flowing gold streams */}
        {[
          { d: "M -10 30 C 40 10, 80 70, 130 40 S 220 50, 230 25", dur: 14, op: 0.85 },
          { d: "M -10 70 C 50 90, 90 30, 140 65 S 220 80, 230 55", dur: 18, op: 0.7 },
          { d: "M -10 50 C 60 35, 100 80, 150 50 S 220 30, 230 60", dur: 22, op: 0.6 },
        ].map((p, i) => (
          <path key={i} d={p.d} stroke="url(#orig-bg-gold)" strokeWidth="1.4" fill="none" opacity={p.op} strokeDasharray="2 4">
            <animate attributeName="stroke-dashoffset" from="0" to="120" dur={`${p.dur}s`} repeatCount="indefinite" />
          </path>
        ))}
        {/* Drifting motes */}
        {Array.from({ length: 18 }).map((_, i) => {
          const x = (i * 31) % 200;
          const y = (i * 47) % 100;
          return (
            <circle key={i} cx={x} cy={y} r="0.5" fill="#fff7c2" opacity="0.7">
              <animate attributeName="opacity" values="0.1;0.9;0.1" dur={`${3 + (i % 5) * 0.6}s`} begin={`${i * 0.2}s`} repeatCount="indefinite" />
              <animate attributeName="cy" values={`${y};${y - 4};${y}`} dur={`${5 + (i % 4)}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
        {/* Wax-seal medallion */}
        <g transform="translate(178 82)">
          <circle r="9" fill="#7a1f1f" stroke="#3b0a0a" strokeWidth="0.6" />
          <circle r="7" fill="none" stroke="#ffd166" strokeWidth="0.5" strokeDasharray="1 1.5" />
          <text textAnchor="middle" dominantBaseline="middle" fontSize="9" fontFamily="serif" fontWeight="700" fill="url(#orig-bg-gold)" stroke="#3b0a0a" strokeWidth="0.2">M</text>
        </g>
        <rect width="200" height="100" fill="url(#orig-bg-vignette)" />
      </svg>
    );
  }

  if (itemKey === "bg_reine") {
    return (
      <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="reine-bg-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff5d1" />
            <stop offset="50%" stopColor="#f5c14e" />
            <stop offset="100%" stopColor="#a86b1a" />
          </linearGradient>
          <radialGradient id="reine-bg-vignette" cx="50%" cy="50%" r="70%">
            <stop offset="60%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#7a1342" stopOpacity="0.35" />
          </radialGradient>
        </defs>
        {/* Falling rose petals */}
        {Array.from({ length: 14 }).map((_, i) => {
          const x = (i * 17) % 200;
          const startY = -8 - ((i * 7) % 30);
          const dur = 9 + (i % 5);
          const size = 3.4 + (i % 3) * 0.7;
          return (
            <text key={i} x={x} y={startY} fontSize={size} opacity="0.9" style={{ filter: "drop-shadow(0 1px 1px hsl(330 50% 30% / 0.4))" }}>
              🌸
              <animate attributeName="y" from={startY} to="110" dur={`${dur}s`} begin={`${i * 0.4}s`} repeatCount="indefinite" />
              <animate attributeName="x" values={`${x};${x + 8};${x - 6};${x}`} dur={`${dur}s`} begin={`${i * 0.4}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;1;0" dur={`${dur}s`} begin={`${i * 0.4}s`} repeatCount="indefinite" />
            </text>
          );
        })}
        {/* Sparkles */}
        {Array.from({ length: 22 }).map((_, i) => {
          const x = (i * 29 + 13) % 200;
          const y = (i * 41 + 7) % 100;
          return (
            <circle key={i} cx={x} cy={y} r="0.6" fill="#fde68a" style={{ filter: "drop-shadow(0 0 3px #fbbf24)" }}>
              <animate attributeName="opacity" values="0.2;1;0.2" dur={`${2 + (i % 4) * 0.4}s`} begin={`${i * 0.18}s`} repeatCount="indefinite" />
              <animate attributeName="r" values="0.4;1.2;0.4" dur={`${2 + (i % 4) * 0.4}s`} begin={`${i * 0.18}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
        {/* Wax-seal medallion */}
        <g transform="translate(178 82)">
          <circle r="9" fill="#9d174d" stroke="#4a0d27" strokeWidth="0.6" />
          <circle r="7" fill="none" stroke="#fde68a" strokeWidth="0.5" strokeDasharray="1 1.5" />
          <text textAnchor="middle" dominantBaseline="middle" fontSize="9" fontFamily="serif" fontWeight="700" fill="url(#reine-bg-gold)" stroke="#4a0d27" strokeWidth="0.2">L</text>
        </g>
        <rect width="200" height="100" fill="url(#reine-bg-vignette)" />
      </svg>
    );
  }

  return null;
}
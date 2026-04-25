/**
 * Animated SVG layer rendered ABSOLUTELY inside a positioned container.
 * Use ON TOP of a base color (provided by parent or backgroundStyle) for backgrounds
 * that benefit from particles, stars, swirls, etc.
 */
export function BackgroundDecor({ itemKey }: { itemKey?: string | null }) {
  if (!itemKey) return null;

  switch (itemKey) {
    /* ============== LEGENDARY ============== */
    case "bg_phoenix_fire":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <radialGradient id="bgphx" cx="50%" cy="100%" r="80%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="35%" stopColor="#f97316" />
              <stop offset="70%" stopColor="#7f1d1d" />
              <stop offset="100%" stopColor="#1a0000" />
            </radialGradient>
            <linearGradient id="bgphxFlame" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#ffd166" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#ff5b1f" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#7a0000" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bgphx)" />
          {Array.from({ length: 18 }).map((_, i) => {
            const x = (i / 18) * 200 + (i % 2 ? 5 : 0);
            return (
              <path key={i} d={`M ${x} 100 C ${x - 8} 70 ${x + 8} 50 ${x} 25`} stroke="url(#bgphxFlame)" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.85">
                <animateTransform attributeName="transform" type="translate" values="0 6; 0 -4; 0 6" dur={`${1.2 + (i % 5) * 0.2}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;1;0.5" dur={`${1.2 + (i % 5) * 0.2}s`} repeatCount="indefinite" />
              </path>
            );
          })}
          {Array.from({ length: 30 }).map((_, i) => (
            <circle key={`s${i}`} cx={(i * 13) % 200} cy={20 + ((i * 7) % 50)} r="0.8" fill="#ffefb3">
              <animate attributeName="opacity" values="0;1;0" dur={`${1.5 + (i % 4) * 0.3}s`} begin={`${i * 0.15}s`} repeatCount="indefinite" />
              <animate attributeName="cy" values={`${20 + ((i * 7) % 50)}; ${0 + ((i * 7) % 50)}`} dur={`${1.5 + (i % 4) * 0.3}s`} begin={`${i * 0.15}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      );

    case "bg_galaxy_swirl":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <radialGradient id="bggal" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="40%" stopColor="#3b0764" />
              <stop offset="100%" stopColor="#0b0420" />
            </radialGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bggal)" />
          <g transform="translate(100 50)">
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <ellipse key={deg} rx="80" ry="20" fill="none" stroke="#c084fc" strokeWidth="0.5" opacity="0.5" transform={`rotate(${deg})`} />
            ))}
            <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="40s" repeatCount="indefinite" additive="sum" />
          </g>
          {Array.from({ length: 60 }).map((_, i) => (
            <circle key={i} cx={(i * 17) % 200} cy={(i * 11) % 100} r={i % 4 === 0 ? 1.2 : 0.6} fill="#fff">
              <animate attributeName="opacity" values="0.2;1;0.2" dur={`${1.5 + (i % 4) * 0.4}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      );

    case "bg_cosmic_void":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <radialGradient id="bgvoid" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="60%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#000" />
            </radialGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bgvoid)" />
          <circle cx="100" cy="50" r="22" fill="#000" />
          <circle cx="100" cy="50" r="22" fill="none" stroke="#a855f7" strokeWidth="1" opacity="0.7">
            <animate attributeName="r" values="22;30;22" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0;0.7" dur="3s" repeatCount="indefinite" />
          </circle>
          {Array.from({ length: 40 }).map((_, i) => (
            <circle key={i} cx={(i * 19) % 200} cy={(i * 13) % 100} r="0.6" fill="#fff">
              <animate attributeName="opacity" values="0.1;1;0.1" dur={`${1 + (i % 5) * 0.3}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      );

    case "bg_dimension":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="bgdim" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff00cc" />
              <stop offset="33%" stopColor="#00ffff" />
              <stop offset="66%" stopColor="#ffff00" />
              <stop offset="100%" stopColor="#00ffaa" />
            </linearGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bgdim)">
            <animate attributeName="opacity" values="0.85;1;0.85" dur="3s" repeatCount="indefinite" />
          </rect>
          <g transform="translate(100 50)" opacity="0.7">
            {[0, 30, 60, 90, 120, 150].map((deg) => (
              <line key={deg} x1="-100" y1="0" x2="100" y2="0" stroke="#fff" strokeWidth="0.4" transform={`rotate(${deg})`} />
            ))}
            <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="20s" repeatCount="indefinite" additive="sum" />
          </g>
        </svg>
      );

    case "bg_holographic":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="bgholo" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff00cc" />
              <stop offset="33%" stopColor="#00ffff" />
              <stop offset="66%" stopColor="#ffff00" />
              <stop offset="100%" stopColor="#00ffaa" />
              <animate attributeName="x1" values="0;1;0" dur="6s" repeatCount="indefinite" />
            </linearGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bgholo)" />
          {Array.from({ length: 12 }).map((_, i) => (
            <rect key={i} x={i * 20} y="0" width="4" height="100" fill="#fff" opacity="0.08" />
          ))}
        </svg>
      );

    case "bg_crystal_cave":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="bgcry" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4a148c" />
              <stop offset="50%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#4a148c" />
            </linearGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bgcry)" />
          {[20, 60, 100, 140, 180].map((x, i) => (
            <g key={i}>
              <polygon points={`${x},100 ${x - 8},70 ${x + 8},70`} fill="#22d3ee" opacity="0.7" />
              <polygon points={`${x},100 ${x - 5},80 ${x + 5},80`} fill="#67e8f9" opacity="0.9" />
              <polygon points={`${x},0 ${x - 8},30 ${x + 8},30`} fill="#a855f7" opacity="0.7" />
            </g>
          ))}
        </svg>
      );

    case "bg_celestial_temple":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="bgcel" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#fff5cc" />
              <stop offset="50%" stopColor="#ffd700" />
              <stop offset="100%" stopColor="#ff8800" />
            </linearGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bgcel)" />
          <circle cx="100" cy="50" r="18" fill="#fff" opacity="0.9">
            <animate attributeName="r" values="18;24;18" dur="4s" repeatCount="indefinite" />
          </circle>
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line key={deg} x1="100" y1="50" x2={100 + Math.cos((deg * Math.PI) / 180) * 90} y2={50 + Math.sin((deg * Math.PI) / 180) * 90} stroke="#fff" strokeWidth="0.6" opacity="0.4" />
          ))}
        </svg>
      );

    /* ============== EPIC ============== */
    case "bg_starfield":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <rect width="200" height="100" fill="#000020" />
          {Array.from({ length: 80 }).map((_, i) => (
            <circle key={i} cx={(i * 23) % 200} cy={(i * 17) % 100} r={i % 6 === 0 ? 1.4 : 0.5} fill="#fff">
              <animate attributeName="opacity" values="0.2;1;0.2" dur={`${1 + (i % 5) * 0.3}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      );

    case "bg_aurora":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="bgaur" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00ffd1">
                <animate attributeName="stop-color" values="#00ffd1;#b388ff;#00ffd1" dur="6s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="#b388ff">
                <animate attributeName="stop-color" values="#b388ff;#ff80ab;#b388ff" dur="6s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#ff80ab">
                <animate attributeName="stop-color" values="#ff80ab;#00ffd1;#ff80ab" dur="6s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bgaur)" />
        </svg>
      );

    case "bg_lightning":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="bgltn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bgltn)" />
          <path d="M 60 0 L 70 40 L 55 45 L 75 100" stroke="#fde047" strokeWidth="1.5" fill="none">
            <animate attributeName="opacity" values="0;1;0;1;0" dur="3s" repeatCount="indefinite" />
          </path>
          <path d="M 140 0 L 130 35 L 145 40 L 125 100" stroke="#fff" strokeWidth="1.2" fill="none">
            <animate attributeName="opacity" values="0;0;1;0;0" dur="3s" begin="1.4s" repeatCount="indefinite" />
          </path>
        </svg>
      );

    case "bg_volcano":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="bgvol" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#ffaa00" />
              <stop offset="40%" stopColor="#ff4500" />
              <stop offset="100%" stopColor="#1a0000" />
            </linearGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bgvol)" />
          {Array.from({ length: 14 }).map((_, i) => (
            <circle key={i} cx={(i * 14) + 10} cy="100" r={1 + (i % 3)} fill="#ffea7a">
              <animate attributeName="cy" values="100;-10" dur={`${2 + (i % 4) * 0.6}s`} begin={`${i * 0.2}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0" dur={`${2 + (i % 4) * 0.6}s`} begin={`${i * 0.2}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      );

    case "bg_nebula":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <radialGradient id="bgneb1" cx="30%" cy="40%" r="40%">
              <stop offset="0%" stopColor="#ff00cc" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1a0040" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="bgneb2" cx="70%" cy="60%" r="40%">
              <stop offset="0%" stopColor="#00ffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1a0040" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="200" height="100" fill="#1a0040" />
          <rect width="200" height="100" fill="url(#bgneb1)" />
          <rect width="200" height="100" fill="url(#bgneb2)" />
          {Array.from({ length: 30 }).map((_, i) => (
            <circle key={i} cx={(i * 21) % 200} cy={(i * 13) % 100} r="0.5" fill="#fff" opacity="0.8" />
          ))}
        </svg>
      );

    case "bg_underwater":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="bguw" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00aaff" />
              <stop offset="100%" stopColor="#003366" />
            </linearGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bguw)" />
          {Array.from({ length: 18 }).map((_, i) => (
            <circle key={i} cx={(i * 11) + 5} cy={100 - ((i * 7) % 80)} r={1 + (i % 3)} fill="#bae6fd" opacity="0.7">
              <animate attributeName="cy" values="100;-10" dur={`${3 + (i % 4) * 0.5}s`} begin={`${i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      );

    case "bg_neon_city":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="bgnc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a0033" />
              <stop offset="100%" stopColor="#ff00aa" />
            </linearGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bgnc)" />
          {[15, 35, 55, 80, 105, 130, 155, 180].map((x, i) => (
            <g key={i}>
              <rect x={x - 6} y={50 + (i % 3) * 8} width="12" height="50" fill="#0a001a" stroke="#ff00aa" strokeWidth="0.3" />
              {[0, 1, 2].map((r) => [0, 1].map((c) => (
                <rect key={`${r}${c}`} x={x - 4 + c * 4} y={55 + (i % 3) * 8 + r * 6} width="2" height="2" fill={r === 0 ? "#fde047" : "#22d3ee"}>
                  <animate attributeName="opacity" values="0.3;1;0.3" dur={`${1 + (i + r + c) % 3}s`} repeatCount="indefinite" />
                </rect>
              )))}
            </g>
          ))}
        </svg>
      );

    case "bg_cherry":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="bgch" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fce7f3" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bgch)" />
          {Array.from({ length: 14 }).map((_, i) => (
            <g key={i}>
              {[0, 72, 144, 216, 288].map((d) => (
                <ellipse key={d} cx={(i * 15) + 10} cy={(i * 7) % 100} rx="2" ry="3" fill="#fbcfe8" stroke="#ec4899" strokeWidth="0.3" transform={`rotate(${d} ${(i * 15) + 10} ${(i * 7) % 100})`}>
                  <animateTransform attributeName="transform" type="translate" values="0 -10; 0 110" dur={`${5 + (i % 3)}s`} begin={`${i * 0.4}s`} repeatCount="indefinite" additive="sum" />
                </ellipse>
              ))}
            </g>
          ))}
        </svg>
      );

    /* ============== RARE — themed scenes ============== */
    case "bg_galaxy":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="bgg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0f0c29" />
              <stop offset="50%" stopColor="#302b63" />
              <stop offset="100%" stopColor="#24243e" />
            </linearGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bgg)" />
          {Array.from({ length: 50 }).map((_, i) => (
            <circle key={i} cx={(i * 19) % 200} cy={(i * 11) % 100} r={i % 8 === 0 ? 1.3 : 0.5} fill="#fff">
              <animate attributeName="opacity" values="0.3;1;0.3" dur={`${1.2 + (i % 5) * 0.3}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      );

    case "bg_ocean":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="bgoc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6dd5ed" />
              <stop offset="100%" stopColor="#2193b0" />
            </linearGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bgoc)" />
          {[20, 50, 80].map((y, i) => (
            <path key={i} d={`M 0 ${y} Q 50 ${y - 4} 100 ${y} T 200 ${y}`} stroke="#fff" strokeWidth="0.6" fill="none" opacity="0.5">
              <animateTransform attributeName="transform" type="translate" values="-30 0; 30 0; -30 0" dur={`${4 + i}s`} repeatCount="indefinite" />
            </path>
          ))}
        </svg>
      );

    case "bg_forest":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="bgf" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#71b280" />
              <stop offset="100%" stopColor="#134e5e" />
            </linearGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bgf)" />
          {[20, 50, 80, 110, 140, 170].map((x, i) => (
            <g key={i}>
              <polygon points={`${x},100 ${x - 12},60 ${x + 12},60`} fill="#0f5132" />
              <polygon points={`${x},80 ${x - 9},45 ${x + 9},45`} fill="#1a7f3c" />
              <polygon points={`${x},60 ${x - 6},30 ${x + 6},30`} fill="#22c55e" />
              <rect x={x - 1} y="60" width="2" height="40" fill="#5b3a1f" />
            </g>
          ))}
        </svg>
      );

    case "bg_sunset":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="bgss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c2d12" />
              <stop offset="50%" stopColor="#ee0979" />
              <stop offset="100%" stopColor="#ff6a00" />
            </linearGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bgss)" />
          <circle cx="100" cy="60" r="18" fill="#fde047" opacity="0.9" />
        </svg>
      );

    case "bg_sunrise":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="bgsr" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffe259" />
              <stop offset="100%" stopColor="#ffa751" />
            </linearGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bgsr)" />
          <circle cx="100" cy="70" r="14" fill="#fff7ed" />
        </svg>
      );

    case "bg_chalkboard":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <rect width="200" height="100" fill="#1f2d28" />
          <text x="20" y="30" fill="#fff" opacity="0.5" fontFamily="Caveat, cursive" fontSize="14">a² + b² = c²</text>
          <text x="120" y="55" fill="#fff" opacity="0.5" fontFamily="Caveat, cursive" fontSize="12">π ≈ 3.14</text>
          <text x="30" y="80" fill="#fff" opacity="0.5" fontFamily="Caveat, cursive" fontSize="12">∑ x = ?</text>
        </svg>
      );

    case "bg_corkboard":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <rect width="200" height="100" fill="#a37b50" />
          {Array.from({ length: 80 }).map((_, i) => (
            <circle key={i} cx={(i * 23) % 200} cy={(i * 17) % 100} r="0.8" fill="#7a5a35" opacity="0.7" />
          ))}
          <rect x="20" y="20" width="22" height="22" fill="#fde047" stroke="#ca8a04" strokeWidth="0.5" transform="rotate(-4 31 31)" />
          <rect x="80" y="40" width="20" height="20" fill="#fbcfe8" stroke="#be185d" strokeWidth="0.5" transform="rotate(3 90 50)" />
          <rect x="140" y="20" width="22" height="22" fill="#bbf7d0" stroke="#15803d" strokeWidth="0.5" transform="rotate(-2 151 31)" />
        </svg>
      );

    case "bg_library":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <rect width="200" height="100" fill="#5b3a1f" />
          {[10, 18, 30, 38, 50, 62, 70, 80, 92, 102, 114, 122, 132, 144, 156, 166, 176, 188].map((x, i) => (
            <rect key={i} x={x} y="20" width="6" height="60" fill={["#7f1d1d", "#1e3a8a", "#14532d", "#7c2d12", "#581c87"][i % 5]} stroke="#3a2410" strokeWidth="0.5" />
          ))}
        </svg>
      );

    default:
      return null;
  }
}
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
            {/* Sky → embers → deep */}
            <radialGradient id="bgphx-sky" cx="50%" cy="100%" r="95%">
              <stop offset="0%" stopColor="#fff3a8" />
              <stop offset="20%" stopColor="#fde047" />
              <stop offset="42%" stopColor="#fb923c" />
              <stop offset="68%" stopColor="#9a1900" />
              <stop offset="100%" stopColor="#0a0000" />
            </radialGradient>
            {/* Tall flame gradient with translucent tip */}
            <linearGradient id="bgphx-flame" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%"   stopColor="#fff7c0" stopOpacity="0.95" />
              <stop offset="25%"  stopColor="#ffd166" stopOpacity="0.95" />
              <stop offset="60%"  stopColor="#ff5b1f" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#7a0000" stopOpacity="0" />
            </linearGradient>
            {/* Inner blue-hot core */}
            <linearGradient id="bgphx-core" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%"   stopColor="#fff" stopOpacity="0.9" />
              <stop offset="50%"  stopColor="#fde047" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ff5b1f" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="bgphx-haze" cx="50%" cy="80%" r="60%">
              <stop offset="0%"   stopColor="#ffb84a" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ffb84a" stopOpacity="0" />
            </radialGradient>
            <filter id="bgphx-blur" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="1.6" />
            </filter>
          </defs>
          {/* Base sky */}
          <rect width="200" height="100" fill="url(#bgphx-sky)" />
          {/* Soft heat haze */}
          <rect width="200" height="100" fill="url(#bgphx-haze)">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="4s" repeatCount="indefinite" />
          </rect>
          {/* Distant smoke trails */}
          <g opacity="0.45" filter="url(#bgphx-blur)">
            {Array.from({ length: 6 }).map((_, i) => {
              const x = 20 + i * 30;
              return (
                <path key={`sm${i}`} d={`M ${x} 90 Q ${x - 6} 60 ${x + 4} 30 Q ${x - 4} 10 ${x} -10`} stroke="#3b1303" strokeWidth="6" fill="none" opacity="0.5">
                  <animateTransform attributeName="transform" type="translate" values="0 0; 6 -6; 0 0" dur={`${5 + (i % 3)}s`} repeatCount="indefinite" />
                </path>
              );
            })}
          </g>
          {/* Background diffused flames (large blurred) */}
          <g filter="url(#bgphx-blur)" opacity="0.7">
            {Array.from({ length: 10 }).map((_, i) => {
              const x = (i / 10) * 200 + (i % 2 ? 6 : 0);
              const dur = 1.6 + (i % 4) * 0.25;
              return (
                <path key={`bg${i}`}
                      d={`M ${x} 105 C ${x - 14} 70 ${x + 12} 50 ${x} 18 C ${x - 6} 28 ${x + 6} 28 ${x} 105 Z`}
                      fill="url(#bgphx-flame)">
                  <animateTransform attributeName="transform" type="scale" values="1 0.85; 1 1.12; 1 0.85" dur={`${dur}s`} repeatCount="indefinite" additive="sum" />
                </path>
              );
            })}
          </g>
          {/* Foreground sharp flames */}
          {Array.from({ length: 22 }).map((_, i) => {
            const x = (i / 22) * 200 + (i % 2 ? 4 : 0);
            const h = 30 + (i % 5) * 12;
            const dur = 1.0 + (i % 5) * 0.22;
            return (
              <g key={`f${i}`}>
                <path d={`M ${x} 100 C ${x - 6} ${100 - h * 0.4} ${x + 6} ${100 - h * 0.7} ${x} ${100 - h}`}
                      stroke="url(#bgphx-flame)" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.95">
                  <animateTransform attributeName="transform" type="translate" values="0 4; 0 -3; 0 4" dur={`${dur}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;1;0.5" dur={`${dur}s`} repeatCount="indefinite" />
                </path>
                <path d={`M ${x} 100 C ${x - 2} ${100 - h * 0.4} ${x + 2} ${100 - h * 0.7} ${x} ${100 - h * 0.85}`}
                      stroke="url(#bgphx-core)" strokeWidth="1.5" fill="none" strokeLinecap="round">
                  <animateTransform attributeName="transform" type="translate" values="0 4; 0 -3; 0 4" dur={`${dur}s`} repeatCount="indefinite" />
                </path>
              </g>
            );
          })}
          {/* Rising embers (lots, varied) */}
          {Array.from({ length: 50 }).map((_, i) => {
            const x = (i * 13) % 200;
            const startY = 60 + ((i * 7) % 35);
            const endY = -10 - ((i * 5) % 30);
            const r = (i % 7 === 0) ? 1.4 : (i % 3 === 0 ? 0.9 : 0.55);
            const c = i % 4 === 0 ? "#fff7c0" : i % 3 === 0 ? "#ffd166" : "#ff8a3d";
            const dur = 2.4 + (i % 6) * 0.4;
            return (
              <circle key={`e${i}`} cx={x} cy={startY} r={r} fill={c} opacity="0">
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur={`${dur}s`} begin={`${i * 0.1}s`} repeatCount="indefinite" />
                <animate attributeName="cy" values={`${startY}; ${endY}`} dur={`${dur}s`} begin={`${i * 0.1}s`} repeatCount="indefinite" />
                <animate attributeName="cx" values={`${x}; ${x + (i % 2 ? 8 : -8)}`} dur={`${dur}s`} begin={`${i * 0.1}s`} repeatCount="indefinite" />
              </circle>
            );
          })}
          {/* Bright sparks (small, fast) */}
          {Array.from({ length: 18 }).map((_, i) => (
            <circle key={`sp${i}`} cx={(i * 23) % 200} cy={70 + ((i * 11) % 25)} r="0.4" fill="#fff">
              <animate attributeName="opacity" values="0;1;0" dur={`${0.6 + (i % 4) * 0.2}s`} begin={`${i * 0.07}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      );

    case "bg_galaxy_swirl":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <radialGradient id="bggal-core" cx="50%" cy="50%" r="60%">
              <stop offset="0%"   stopColor="#fff" />
              <stop offset="8%"   stopColor="#fbcfe8" />
              <stop offset="22%"  stopColor="#a855f7" />
              <stop offset="55%"  stopColor="#3b0764" />
              <stop offset="100%" stopColor="#020014" />
            </radialGradient>
            <radialGradient id="bggal-arm" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#f0abfc" stopOpacity="0.95" />
              <stop offset="60%"  stopColor="#a855f7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
            </radialGradient>
            <filter id="bggal-blur"><feGaussianBlur stdDeviation="1.4" /></filter>
          </defs>
          <rect width="200" height="100" fill="#020014" />
          <rect width="200" height="100" fill="url(#bggal-core)" />
          {/* Diffused arms */}
          <g transform="translate(100 50)" filter="url(#bggal-blur)">
            {[0, 90, 180, 270].map((deg) => (
              <ellipse key={`a${deg}`} cx="0" cy="0" rx="90" ry="18" fill="url(#bggal-arm)" opacity="0.65" transform={`rotate(${deg})`} />
            ))}
            <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="80s" repeatCount="indefinite" additive="sum" />
          </g>
          {/* Spiral rings */}
          <g transform="translate(100 50)">
            {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg, i) => (
              <ellipse key={`r${deg}`} cx="0" cy="0" rx={70 - (i % 3) * 10} ry={16 - (i % 3) * 3} fill="none" stroke="#e9d5ff" strokeWidth={(i % 3 === 0) ? 0.6 : 0.3} opacity={0.45 - (i % 4) * 0.06} transform={`rotate(${deg})`} />
            ))}
            <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="40s" repeatCount="indefinite" additive="sum" />
          </g>
          {/* Bright center pulse */}
          <circle cx="100" cy="50" r="6" fill="#fff" opacity="0.9">
            <animate attributeName="r" values="5;8;5" dur="3.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;1;0.6" dur="3.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="100" cy="50" r="14" fill="none" stroke="#fff" strokeWidth="0.4" opacity="0.5">
            <animate attributeName="r" values="10;22;10" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0;0.6" dur="4s" repeatCount="indefinite" />
          </circle>
          {/* Stars (lots, varied with twinkle + colors) */}
          {Array.from({ length: 90 }).map((_, i) => {
            const c = i % 9 === 0 ? "#fbcfe8" : i % 7 === 0 ? "#a5f3fc" : "#fff";
            return (
              <circle key={`s${i}`} cx={(i * 17) % 200} cy={(i * 11) % 100} r={i % 5 === 0 ? 1.3 : 0.5} fill={c}>
                <animate attributeName="opacity" values="0.2;1;0.2" dur={`${1.4 + (i % 6) * 0.35}s`} begin={`${(i % 9) * 0.18}s`} repeatCount="indefinite" />
              </circle>
            );
          })}
        </svg>
      );

    case "bg_cosmic_void":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <radialGradient id="bgvoid-bg" cx="50%" cy="50%" r="80%">
              <stop offset="0%"   stopColor="#1e1240" />
              <stop offset="40%"  stopColor="#0a0420" />
              <stop offset="100%" stopColor="#000" />
            </radialGradient>
            <radialGradient id="bgvoid-disk" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#000" stopOpacity="1" />
              <stop offset="55%"  stopColor="#000" stopOpacity="1" />
              <stop offset="60%"  stopColor="#fde047" stopOpacity="0.9" />
              <stop offset="75%"  stopColor="#fb923c" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="bgvoid-jet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#22d3ee" stopOpacity="0" />
              <stop offset="50%"  stopColor="#22d3ee" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bgvoid-bg)" />
          {/* Accretion disk */}
          <ellipse cx="100" cy="50" rx="42" ry="14" fill="url(#bgvoid-disk)">
            <animateTransform attributeName="transform" type="rotate" from="0 100 50" to="360 100 50" dur="14s" repeatCount="indefinite" />
          </ellipse>
          {/* Black hole event horizon */}
          <circle cx="100" cy="50" r="14" fill="#000" />
          <circle cx="100" cy="50" r="14" fill="none" stroke="#fde047" strokeWidth="0.6" opacity="0.7" />
          {/* Polar jets */}
          <rect x="98" y="0" width="4" height="36" fill="url(#bgvoid-jet)">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2.4s" repeatCount="indefinite" />
          </rect>
          <rect x="98" y="64" width="4" height="36" fill="url(#bgvoid-jet)" transform="rotate(180 100 82)">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2.4s" begin="1.2s" repeatCount="indefinite" />
          </rect>
          {/* Lensing rings */}
          <circle cx="100" cy="50" r="22" fill="none" stroke="#a855f7" strokeWidth="0.8" opacity="0.7">
            <animate attributeName="r" values="20;36;20" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0;0.7" dur="4s" repeatCount="indefinite" />
          </circle>
          {/* Dense starfield */}
          {Array.from({ length: 70 }).map((_, i) => (
            <circle key={i} cx={(i * 19) % 200} cy={(i * 13) % 100} r={i % 8 === 0 ? 1.1 : 0.4} fill="#fff">
              <animate attributeName="opacity" values="0.1;1;0.1" dur={`${1.2 + (i % 6) * 0.3}s`} begin={`${(i % 7) * 0.2}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      );

    case "bg_dimension":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="bgdim-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor="#ff00cc">
                <animate attributeName="stop-color" values="#ff00cc;#00ffff;#ffff00;#00ffaa;#ff00cc" dur="9s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%"  stopColor="#00ffff">
                <animate attributeName="stop-color" values="#00ffff;#ffff00;#00ffaa;#ff00cc;#00ffff" dur="9s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#00ffaa">
                <animate attributeName="stop-color" values="#00ffaa;#ff00cc;#00ffff;#ffff00;#00ffaa" dur="9s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
            <radialGradient id="bgdim-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <filter id="bgdim-blur"><feGaussianBlur stdDeviation="0.6" /></filter>
          </defs>
          <rect width="200" height="100" fill="url(#bgdim-bg)" />
          {/* Concentric warp rings */}
          <g transform="translate(100 50)" opacity="0.85">
            {[10, 22, 36, 52, 70].map((r, i) => (
              <ellipse key={i} cx="0" cy="0" rx={r * 1.6} ry={r * 0.6} fill="none" stroke="#fff" strokeWidth="0.5" opacity={0.7 - i * 0.1}>
                <animate attributeName="rx" values={`${r * 1.5};${r * 1.7};${r * 1.5}`} dur={`${3 + i * 0.5}s`} repeatCount="indefinite" />
              </ellipse>
            ))}
          </g>
          {/* Diagonal rays */}
          <g transform="translate(100 50)" filter="url(#bgdim-blur)">
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={i} x1="-120" y1="0" x2="120" y2="0" stroke="#fff" strokeWidth="0.3" opacity="0.45" transform={`rotate(${i * 30})`} />
            ))}
            <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="30s" repeatCount="indefinite" additive="sum" />
          </g>
          <circle cx="100" cy="50" r="20" fill="url(#bgdim-glow)">
            <animate attributeName="r" values="18;26;18" dur="3s" repeatCount="indefinite" />
          </circle>
          {/* Floating particles */}
          {Array.from({ length: 24 }).map((_, i) => (
            <circle key={i} cx={(i * 17) % 200} cy={(i * 13) % 100} r="0.6" fill="#fff">
              <animate attributeName="opacity" values="0;1;0" dur={`${1.4 + (i % 4) * 0.4}s`} begin={`${i * 0.1}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      );

    case "bg_holographic":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="bgholo-base" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor="#ff00cc">
                <animate attributeName="stop-color" values="#ff00cc;#00ffff;#ffff00;#00ffaa;#ff00cc" dur="10s" repeatCount="indefinite" />
              </stop>
              <stop offset="33%"  stopColor="#00ffff">
                <animate attributeName="stop-color" values="#00ffff;#ffff00;#00ffaa;#ff00cc;#00ffff" dur="10s" repeatCount="indefinite" />
              </stop>
              <stop offset="66%"  stopColor="#ffff00">
                <animate attributeName="stop-color" values="#ffff00;#00ffaa;#ff00cc;#00ffff;#ffff00" dur="10s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#00ffaa">
                <animate attributeName="stop-color" values="#00ffaa;#ff00cc;#00ffff;#ffff00;#00ffaa" dur="10s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
            <linearGradient id="bgholo-shine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#fff" stopOpacity="0" />
              <stop offset="50%"  stopColor="#fff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bgholo-base)" />
          {/* Vertical scanlines */}
          {Array.from({ length: 20 }).map((_, i) => (
            <rect key={i} x={i * 10} y="0" width="2" height="100" fill="#fff" opacity={i % 2 === 0 ? 0.07 : 0.04} />
          ))}
          {/* Horizontal shine sweep */}
          <rect x="-80" y="0" width="80" height="100" fill="url(#bgholo-shine)" opacity="0.7">
            <animate attributeName="x" values="-80;200" dur="4s" repeatCount="indefinite" />
          </rect>
          {/* Diagonal sparkles */}
          {Array.from({ length: 14 }).map((_, i) => (
            <g key={i} transform={`translate(${(i * 17) % 200} ${(i * 11) % 100})`}>
              <path d="M0 -2 L0.5 0 L2 0 L0.5 0.5 L0 2 L-0.5 0.5 L-2 0 L-0.5 0 Z" fill="#fff" opacity="0.85">
                <animate attributeName="opacity" values="0;1;0" dur={`${1.4 + (i % 4) * 0.3}s`} begin={`${i * 0.18}s`} repeatCount="indefinite" />
              </path>
            </g>
          ))}
        </svg>
      );

    case "bg_crystal_cave":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <radialGradient id="bgcry-bg" cx="50%" cy="50%" r="80%">
              <stop offset="0%"   stopColor="#312e81" />
              <stop offset="50%"  stopColor="#0c0a3e" />
              <stop offset="100%" stopColor="#000" />
            </radialGradient>
            <linearGradient id="bgcry-c1" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%"   stopColor="#0e7490" />
              <stop offset="55%"  stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#cffafe" />
            </linearGradient>
            <linearGradient id="bgcry-c2" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%"   stopColor="#581c87" />
              <stop offset="55%"  stopColor="#a855f7" />
              <stop offset="100%" stopColor="#f5d0fe" />
            </linearGradient>
            <radialGradient id="bgcry-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#22d3ee" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bgcry-bg)" />
          <ellipse cx="100" cy="50" rx="80" ry="40" fill="url(#bgcry-glow)">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="4s" repeatCount="indefinite" />
          </ellipse>
          {/* Bottom crystals — varied heights */}
          {[10, 28, 50, 72, 96, 122, 148, 168, 190].map((x, i) => {
            const grad = i % 2 === 0 ? "bgcry-c1" : "bgcry-c2";
            const w = 7 + (i % 4) * 2;
            const h = 22 + ((i * 5) % 28);
            return (
              <g key={`bc${i}`}>
                <polygon points={`${x},100 ${x - w},${100 - h * 0.4} ${x},${100 - h} ${x + w},${100 - h * 0.4}`} fill={`url(#${grad})`} stroke="#0c4a6e" strokeWidth="0.4" opacity="0.95" />
                <polygon points={`${x},100 ${x - w * 0.45},${100 - h * 0.5} ${x},${100 - h}`} fill="#fff" opacity="0.25" />
              </g>
            );
          })}
          {/* Top crystals */}
          {[20, 52, 88, 130, 168].map((x, i) => {
            const grad = i % 2 === 0 ? "bgcry-c2" : "bgcry-c1";
            const w = 6 + (i % 3) * 2;
            const h = 18 + ((i * 7) % 22);
            return (
              <g key={`tc${i}`}>
                <polygon points={`${x},0 ${x - w},${h * 0.4} ${x},${h} ${x + w},${h * 0.4}`} fill={`url(#${grad})`} stroke="#581c87" strokeWidth="0.4" opacity="0.95" />
                <polygon points={`${x},0 ${x - w * 0.45},${h * 0.5} ${x},${h}`} fill="#fff" opacity="0.25" />
              </g>
            );
          })}
          {/* Floating crystal motes */}
          {Array.from({ length: 18 }).map((_, i) => (
            <circle key={i} cx={(i * 17) % 200} cy={30 + ((i * 7) % 40)} r="0.7" fill="#67e8f9">
              <animate attributeName="opacity" values="0.2;1;0.2" dur={`${1.6 + (i % 4) * 0.3}s`} begin={`${i * 0.1}s`} repeatCount="indefinite" />
              <animate attributeName="cy" values={`${30 + ((i * 7) % 40)};${20 + ((i * 7) % 40)};${30 + ((i * 7) % 40)}`} dur={`${4 + (i % 3)}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      );

    case "bg_celestial_temple":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <radialGradient id="bgcel-sky" cx="50%" cy="55%" r="80%">
              <stop offset="0%"   stopColor="#fff" />
              <stop offset="20%"  stopColor="#fff5cc" />
              <stop offset="55%"  stopColor="#ffd700" />
              <stop offset="85%"  stopColor="#ff8800" />
              <stop offset="100%" stopColor="#7c2d12" />
            </radialGradient>
            <radialGradient id="bgcel-sun" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#fff" />
              <stop offset="60%"  stopColor="#fff5cc" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="bgcel-ray" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#fff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bgcel-sky)" />
          {/* Long radiant rays */}
          <g transform="translate(100 55)">
            {Array.from({ length: 24 }).map((_, i) => {
              const deg = (i * 15);
              return (
                <rect key={i} x="-2" y="-100" width="4" height="100" fill="url(#bgcel-ray)" opacity={0.4 - (i % 3) * 0.1} transform={`rotate(${deg})`} />
              );
            })}
            <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="60s" repeatCount="indefinite" additive="sum" />
          </g>
          {/* Sun core */}
          <circle cx="100" cy="55" r="28" fill="url(#bgcel-sun)">
            <animate attributeName="r" values="26;32;26" dur="5s" repeatCount="indefinite" />
          </circle>
          <circle cx="100" cy="55" r="14" fill="#fff" opacity="0.95">
            <animate attributeName="r" values="13;16;13" dur="5s" repeatCount="indefinite" />
          </circle>
          {/* Floating golden particles */}
          {Array.from({ length: 28 }).map((_, i) => (
            <circle key={i} cx={(i * 13) % 200} cy={(i * 11) % 100} r="0.7" fill="#fff5cc">
              <animate attributeName="opacity" values="0.2;1;0.2" dur={`${2 + (i % 5) * 0.3}s`} begin={`${i * 0.12}s`} repeatCount="indefinite" />
              <animate attributeName="cy" values={`${(i * 11) % 100};${((i * 11) % 100) - 10};${(i * 11) % 100}`} dur={`${5 + (i % 3)}s`} repeatCount="indefinite" />
            </circle>
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

    /* ===================== PHASE 2 — New rich backgrounds ===================== */
    case "bg_enchanted_forest":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Tree silhouettes */}
          {[10, 35, 60, 90, 120, 150, 180].map((x, i) => (
            <path key={i} d={`M ${x} 100 L ${x} 60 M ${x - 6} 70 L ${x} 60 L ${x + 6} 70 M ${x - 4} 55 L ${x} 45 L ${x + 4} 55`} stroke="#022c22" strokeWidth="1.5" fill="none" opacity="0.7" />
          ))}
          {/* Fireflies */}
          {Array.from({ length: 18 }).map((_, i) => {
            const cx = 10 + i * 11;
            const cy = 20 + (i % 5) * 15;
            return (
              <circle key={i} cx={cx} cy={cy} r="0.8" fill="#fde047" style={{ filter: "drop-shadow(0 0 3px #fbbf24)" }}>
                <animate attributeName="opacity" values="0.2;1;0.2" dur={`${1.6 + (i % 4) * 0.4}s`} begin={`${i * 0.15}s`} repeatCount="indefinite" />
                <animate attributeName="cy" values={`${cy};${cy - 4};${cy}`} dur={`${3 + (i % 3)}s`} repeatCount="indefinite" />
              </circle>
            );
          })}
        </svg>
      );

    case "bg_deep_sea":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Light rays from top */}
          <defs>
            <linearGradient id="ds-ray" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[20, 60, 110, 160].map((x, i) => (
            <polygon key={i} points={`${x},0 ${x + 10},0 ${x + 30},100 ${x - 10},100`} fill="url(#ds-ray)">
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur={`${4 + i}s`} repeatCount="indefinite" />
            </polygon>
          ))}
          {/* Bubbles */}
          {Array.from({ length: 14 }).map((_, i) => {
            const cx = 15 + i * 14;
            return (
              <circle key={i} cx={cx} cy={90} r={1 + (i % 3) * 0.5} fill="none" stroke="#bae6fd" strokeWidth="0.4" opacity="0.7">
                <animate attributeName="cy" values="95;-5" dur={`${5 + (i % 4)}s`} begin={`${i * 0.4}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;0.7;0" dur={`${5 + (i % 4)}s`} begin={`${i * 0.4}s`} repeatCount="indefinite" />
              </circle>
            );
          })}
        </svg>
      );

    case "bg_violet_crystal":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Floor crystals */}
          {[20, 50, 85, 120, 155, 185].map((x, i) => {
            const h = 18 + (i % 3) * 10;
            return (
              <g key={i}>
                <polygon points={`${x},100 ${x - 6},${100 - h * 0.6} ${x},${100 - h} ${x + 6},${100 - h * 0.6}`} fill="#a78bfa" stroke="#581c87" strokeWidth="0.6" opacity="0.85" />
                <polygon points={`${x},${100 - h} ${x - 6},${100 - h * 0.6} ${x},${100 - h * 0.4}`} fill="#ddd6fe" opacity="0.6" />
              </g>
            );
          })}
          {/* Ceiling crystals (inverted) */}
          {[35, 70, 105, 140, 170].map((x, i) => {
            const h = 14 + (i % 3) * 8;
            return (
              <polygon key={`c${i}`} points={`${x},0 ${x - 4},${h * 0.6} ${x},${h} ${x + 4},${h * 0.6}`} fill="#c4b5fd" stroke="#4c1d95" strokeWidth="0.5" opacity="0.7" />
            );
          })}
          {/* Sparkles */}
          {Array.from({ length: 12 }).map((_, i) => {
            const cx = 10 + i * 16;
            const cy = 30 + (i % 4) * 12;
            return (
              <circle key={i} cx={cx} cy={cy} r="0.6" fill="#fff">
                <animate attributeName="opacity" values="0;1;0" dur="2s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
              </circle>
            );
          })}
        </svg>
      );

    case "bg_thunderstorm":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Rain */}
          {Array.from({ length: 30 }).map((_, i) => {
            const x = (i * 7) % 200;
            return (
              <line key={i} x1={x} y1="0" x2={x - 3} y2="100" stroke="#94a3b8" strokeWidth="0.4" opacity="0.5">
                <animate attributeName="opacity" values="0.2;0.6;0.2" dur="0.8s" begin={`${i * 0.05}s`} repeatCount="indefinite" />
              </line>
            );
          })}
          {/* Lightning bolts */}
          {[60, 130].map((x, i) => (
            <path key={i} d={`M ${x} 5 L ${x - 4} 30 L ${x + 2} 32 L ${x - 6} 60 L ${x + 4} 50 L ${x - 2} 80`} stroke="#fde047" strokeWidth="1.2" fill="none" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 4px #fde047)" }}>
              <animate attributeName="opacity" values="0;0;1;0;0" dur="3.5s" begin={`${i * 1.3}s`} repeatCount="indefinite" />
            </path>
          ))}
          {/* Cloud silhouettes */}
          <ellipse cx="50" cy="15" rx="35" ry="10" fill="#1e293b" opacity="0.9" />
          <ellipse cx="140" cy="12" rx="40" ry="11" fill="#1e293b" opacity="0.9" />
        </svg>
      );

    case "bg_golden_desert":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Sun */}
          <circle cx="160" cy="30" r="14" fill="#fef9c3" style={{ filter: "drop-shadow(0 0 8px #fbbf24)" }}>
            <animate attributeName="opacity" values="0.85;1;0.85" dur="3s" repeatCount="indefinite" />
          </circle>
          {/* Dunes */}
          <path d="M 0 70 Q 40 55 80 65 Q 120 75 160 60 Q 180 55 200 65 L 200 100 L 0 100 Z" fill="#d97706" opacity="0.85" />
          <path d="M 0 80 Q 50 70 100 78 Q 150 86 200 75 L 200 100 L 0 100 Z" fill="#92400e" opacity="0.9" />
          {/* Heat shimmer */}
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={i} x1={20 + i * 22} y1="68" x2={30 + i * 22} y2="68" stroke="#fef3c7" strokeWidth="0.5" opacity="0.5">
              <animate attributeName="opacity" values="0.2;0.7;0.2" dur="2s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
            </line>
          ))}
        </svg>
      );

    case "bg_tropical_sunset":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <circle cx="100" cy="55" r="18" fill="#fef3c7" style={{ filter: "drop-shadow(0 0 12px #fb923c)" }} />
          {/* Palm tree silhouettes */}
          <g fill="#1e1b4b" opacity="0.9">
            <path d="M 25 100 L 25 70 Q 22 60 18 55 M 25 70 Q 28 60 33 56 M 25 70 Q 32 65 38 68 M 25 70 Q 18 65 12 68" stroke="#1e1b4b" strokeWidth="1.2" fill="none" />
            <path d="M 175 100 L 175 70 Q 172 60 168 55 M 175 70 Q 178 60 183 56 M 175 70 Q 182 65 188 68 M 175 70 Q 168 65 162 68" stroke="#1e1b4b" strokeWidth="1.2" fill="none" />
          </g>
          {/* Reflection */}
          <path d="M 0 80 L 200 80 L 200 100 L 0 100 Z" fill="hsl(280 80% 30% / 0.4)" />
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={i} x1={70 + i * 12} y1="85" x2={120 + i * 12} y2="85" stroke="#fbbf24" strokeWidth="0.4" opacity="0.6">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
            </line>
          ))}
        </svg>
      );

    /* ============== CREATOR (exclusive) ============== */
    case "bg_origine":
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
            <filter id="orig-bg-blur"><feGaussianBlur stdDeviation="0.8" /></filter>
          </defs>

          {/* Subtle parchment grain (warm noise via repeating tiny circles) */}
          {Array.from({ length: 60 }).map((_, i) => {
            const x = (i * 37) % 200;
            const y = ((i * 53) % 100);
            return <circle key={`g${i}`} cx={x} cy={y} r="0.5" fill="hsl(40 60% 35% / 0.08)" />;
          })}

          {/* Flowing gold streams (animated dashed bezier) */}
          {[
            { d: "M -10 30 C 40 10, 80 70, 130 40 S 220 50, 230 25", dur: 14, op: 0.85 },
            { d: "M -10 70 C 50 90, 90 30, 140 65 S 220 80, 230 55", dur: 18, op: 0.7 },
            { d: "M -10 50 C 60 35, 100 80, 150 50 S 220 30, 230 60", dur: 22, op: 0.6 },
          ].map((p, i) => (
            <g key={`s${i}`}>
              <path d={p.d} stroke="url(#orig-bg-gold)" strokeWidth="1.4" fill="none" opacity={p.op} strokeDasharray="2 4">
                <animate attributeName="stroke-dashoffset" from="0" to="120" dur={`${p.dur}s`} repeatCount="indefinite" />
              </path>
              <path d={p.d} stroke="#fff7c2" strokeWidth="0.4" fill="none" opacity={p.op * 0.6} filter="url(#orig-bg-blur)" />
            </g>
          ))}

          {/* M constellation (5 stars forming an M) */}
          {[
            { x: 70, y: 35, r: 1.4 },
            { x: 80, y: 55, r: 1.0 },
            { x: 90, y: 40, r: 1.1 },
            { x: 100, y: 55, r: 1.0 },
            { x: 110, y: 35, r: 1.4 },
          ].map((s, i) => (
            <g key={`c${i}`}>
              <circle cx={s.x} cy={s.y} r={s.r} fill="#fff7c2" style={{ filter: "drop-shadow(0 0 3px #ffd166)" }}>
                <animate attributeName="opacity" values="0.5;1;0.5" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
              </circle>
            </g>
          ))}
          {/* Constellation lines */}
          <path d="M 70 35 L 80 55 L 90 40 L 100 55 L 110 35" stroke="#ffd166" strokeWidth="0.4" fill="none" opacity="0.55" strokeDasharray="1 2" />

          {/* Drifting motes background-wide */}
          {Array.from({ length: 18 }).map((_, i) => {
            const x = (i * 31) % 200;
            const y = ((i * 47) % 100);
            return (
              <circle key={`m${i}`} cx={x} cy={y} r="0.5" fill="#fff7c2" opacity="0.7">
                <animate attributeName="opacity" values="0.1;0.9;0.1" dur={`${3 + (i % 5) * 0.6}s`} begin={`${i * 0.2}s`} repeatCount="indefinite" />
                <animate attributeName="cy" values={`${y};${y - 4};${y}`} dur={`${5 + (i % 4)}s`} repeatCount="indefinite" />
              </circle>
            );
          })}

          {/* Wax-seal medallion bottom-right with M */}
          <g transform="translate(178 82)">
            <circle r="9" fill="#7a1f1f" stroke="#3b0a0a" strokeWidth="0.6" />
            <circle r="7" fill="none" stroke="#ffd166" strokeWidth="0.5" strokeDasharray="1 1.5" />
            <text textAnchor="middle" dominantBaseline="middle" fontSize="9" fontFamily="serif" fontWeight="700" fill="url(#orig-bg-gold)" stroke="#3b0a0a" strokeWidth="0.2">M</text>
          </g>

          {/* Vignette */}
          <rect width="200" height="100" fill="url(#orig-bg-vignette)" />
        </svg>
      );

    /* ============== QUEEN (Léna — exclusive) ============== */
    case "bg_reine":
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

          {/* Volutes dorées arabesques */}
          {[
            { d: "M -10 25 C 30 5, 70 55, 110 30 S 200 40, 220 18", dur: 16, op: 0.55 },
            { d: "M -10 75 C 40 95, 90 35, 140 70 S 220 85, 230 55", dur: 22, op: 0.5 },
          ].map((p, i) => (
            <path key={`flo${i}`} d={p.d} stroke="url(#reine-bg-gold)" strokeWidth="0.9" fill="none" opacity={p.op} strokeDasharray="2 5">
              <animate attributeName="stroke-dashoffset" from="0" to="120" dur={`${p.dur}s`} repeatCount="indefinite" />
            </path>
          ))}

          {/* Pétales de rose qui tombent doucement */}
          {Array.from({ length: 14 }).map((_, i) => {
            const x = (i * 17) % 200;
            const startY = -8 - (i * 7) % 30;
            const dur = 9 + (i % 5);
            const size = 3.4 + (i % 3) * 0.7;
            return (
              <text
                key={`p${i}`}
                x={x}
                y={startY}
                fontSize={size}
                opacity="0.9"
                style={{ filter: "drop-shadow(0 1px 1px hsl(330 50% 30% / 0.4))" }}
              >
                🌸
                <animate attributeName="y" from={startY} to="110" dur={`${dur}s`} begin={`${i * 0.4}s`} repeatCount="indefinite" />
                <animate attributeName="x" values={`${x};${x + 8};${x - 6};${x}`} dur={`${dur}s`} begin={`${i * 0.4}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;0" dur={`${dur}s`} begin={`${i * 0.4}s`} repeatCount="indefinite" />
              </text>
            );
          })}

          {/* Scintillements dorés */}
          {Array.from({ length: 22 }).map((_, i) => {
            const x = (i * 29 + 13) % 200;
            const y = (i * 41 + 7) % 100;
            return (
              <circle key={`s${i}`} cx={x} cy={y} r="0.6" fill="#fde68a" style={{ filter: "drop-shadow(0 0 3px #fbbf24)" }}>
                <animate attributeName="opacity" values="0.2;1;0.2" dur={`${2 + (i % 4) * 0.4}s`} begin={`${i * 0.18}s`} repeatCount="indefinite" />
                <animate attributeName="r" values="0.4;1.2;0.4" dur={`${2 + (i % 4) * 0.4}s`} begin={`${i * 0.18}s`} repeatCount="indefinite" />
              </circle>
            );
          })}

          {/* Médaillon de cire rose avec monogramme L (en bas à droite) */}
          <g transform="translate(178 82)">
            <circle r="9" fill="#9d174d" stroke="#4a0d27" strokeWidth="0.6" />
            <circle r="7" fill="none" stroke="#fde68a" strokeWidth="0.5" strokeDasharray="1 1.5" />
            <text textAnchor="middle" dominantBaseline="middle" fontSize="9" fontFamily="serif" fontWeight="700" fill="url(#reine-bg-gold)" stroke="#4a0d27" strokeWidth="0.2">L</text>
          </g>

          {/* Vignette rose */}
          <rect width="200" height="100" fill="url(#reine-bg-vignette)" />
        </svg>
      );

    default:
      return null;
  }
}
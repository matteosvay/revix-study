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
              <stop offset="0%"   stopColor="#7dd3fc" />
              <stop offset="35%"  stopColor="#0284c7" />
              <stop offset="100%" stopColor="#082f49" />
            </linearGradient>
            <linearGradient id="bguw-ray" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="bguw-caustic" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bguw)" />
          {/* God rays from the surface */}
          {[15, 55, 95, 130, 170].map((x, i) => (
            <polygon key={`r${i}`} points={`${x},0 ${x + 8},0 ${x + 24},100 ${x - 8},100`} fill="url(#bguw-ray)" opacity="0.5">
              <animate attributeName="opacity" values="0.25;0.6;0.25" dur={`${5 + i}s`} repeatCount="indefinite" />
            </polygon>
          ))}
          {/* Caustics on the floor */}
          {[30, 90, 150].map((cx, i) => (
            <ellipse key={`c${i}`} cx={cx} cy="92" rx="22" ry="6" fill="url(#bguw-caustic)">
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur={`${4 + i * 0.7}s`} repeatCount="indefinite" />
            </ellipse>
          ))}
          {/* Sea floor with rocks */}
          <path d="M 0 92 Q 30 85 60 90 T 130 88 T 200 92 L 200 100 L 0 100 Z" fill="#0c4a6e" opacity="0.85" />
          {[18, 42, 72, 105, 140, 175].map((x, i) => (
            <ellipse key={`rk${i}`} cx={x} cy={94 + (i % 2)} rx={3 + (i % 3)} ry={1.6} fill="#0c2a3e" opacity="0.85" />
          ))}
          {/* Soft seaweed silhouettes */}
          {[25, 70, 115, 165].map((x, i) => (
            <path key={`sw${i}`} d={`M ${x} 96 Q ${x - 2} 88 ${x + 1} 80 Q ${x - 1} 72 ${x + 2} 66`} stroke="#065f46" strokeWidth="1.4" fill="none" opacity="0.85" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" values={`-3 ${x} 96; 3 ${x} 96; -3 ${x} 96`} dur={`${3 + i * 0.4}s`} repeatCount="indefinite" />
            </path>
          ))}
          {/* Drifting bubbles */}
          {Array.from({ length: 18 }).map((_, i) => (
            <circle key={i} cx={(i * 11) + 5} cy={100 - ((i * 7) % 80)} r={0.8 + (i % 3) * 0.5} fill="none" stroke="#bae6fd" strokeWidth="0.4" opacity="0.85">
              <animate attributeName="cy" values="98;-8" dur={`${5 + (i % 4) * 0.7}s`} begin={`${i * 0.3}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0.85;0" dur={`${5 + (i % 4) * 0.7}s`} begin={`${i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          ))}
          {/* Tiny fish silhouettes drifting across */}
          {[
            { y: 35, dur: 22, dly: 0,  c: "#fbbf24" },
            { y: 52, dur: 28, dly: 4,  c: "#fb923c" },
            { y: 68, dur: 18, dly: 8,  c: "#f59e0b" },
          ].map((f, i) => (
            <g key={`f${i}`}>
              <path d="M 0 0 Q 4 -1.6 7 0 Q 4 1.6 0 0 M 7 0 L 9 -1.4 L 9 1.4 Z" fill={f.c} opacity="0.85">
                <animateMotion dur={`${f.dur}s`} begin={`${f.dly}s`} repeatCount="indefinite" path={`M -10 ${f.y} L 210 ${f.y}`} />
              </path>
            </g>
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
            <linearGradient id="bgf-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#bae6d3" />
              <stop offset="55%" stopColor="#71b280" />
              <stop offset="100%" stopColor="#134e5e" />
            </linearGradient>
            <radialGradient id="bgf-sun" cx="22%" cy="20%" r="35%">
              <stop offset="0%"  stopColor="#fff7c0" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#fde68a" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="bgf-ray" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor="#fff" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="200" height="100" fill="url(#bgf-sky)" />
          <rect width="200" height="100" fill="url(#bgf-sun)" />
          {/* Diagonal light shafts coming from the sun */}
          {[0, 18, 38].map((dx, i) => (
            <polygon key={i} points={`${20 + dx},10 ${50 + dx},10 ${130 + dx},100 ${100 + dx},100`} fill="url(#bgf-ray)" opacity="0.4">
              <animate attributeName="opacity" values="0.2;0.5;0.2" dur={`${5 + i}s`} repeatCount="indefinite" />
            </polygon>
          ))}
          {/* Distant tree silhouettes — receding hills */}
          <path d="M 0 70 Q 30 56 60 64 Q 100 50 140 60 Q 170 54 200 64 L 200 100 L 0 100 Z" fill="#1f6b46" opacity="0.55" />
          <path d="M 0 78 Q 40 68 80 74 Q 120 64 160 72 Q 180 70 200 74 L 200 100 L 0 100 Z" fill="#15543a" opacity="0.7" />
          {/* Foreground stylized pines — multi-layered triangles + textured trunks */}
          {[15, 45, 78, 112, 145, 178].map((x, i) => {
            const big = i % 2 === 0;
            const baseY = 100;
            const trunkH = big ? 10 : 7;
            return (
              <g key={i}>
                {/* Trunk with bark hatch */}
                <rect x={x - 1.4} y={baseY - trunkH} width="2.8" height={trunkH} fill="#5b3a1f" />
                <line x1={x - 1.4} y1={baseY - trunkH + 2} x2={x + 1.4} y2={baseY - trunkH + 2} stroke="#3a2410" strokeWidth="0.3" opacity="0.7" />
                <line x1={x - 1.4} y1={baseY - trunkH + 5} x2={x + 1.4} y2={baseY - trunkH + 5} stroke="#3a2410" strokeWidth="0.3" opacity="0.5" />
                {/* 4 triangle layers from base to top */}
                <polygon points={`${x},${baseY - trunkH - 4} ${x - (big ? 14 : 10)},${baseY - trunkH + 1} ${x + (big ? 14 : 10)},${baseY - trunkH + 1}`} fill="#0f5132" />
                <polygon points={`${x},${baseY - trunkH - 14} ${x - (big ? 12 : 9)},${baseY - trunkH - 4} ${x + (big ? 12 : 9)},${baseY - trunkH - 4}`} fill="#1a7f3c" />
                <polygon points={`${x},${baseY - trunkH - 24} ${x - (big ? 9 : 7)},${baseY - trunkH - 14} ${x + (big ? 9 : 7)},${baseY - trunkH - 14}`} fill="#22c55e" />
                <polygon points={`${x},${baseY - trunkH - 32} ${x - (big ? 6 : 5)},${baseY - trunkH - 24} ${x + (big ? 6 : 5)},${baseY - trunkH - 24}`} fill="#4ade80" />
                {/* Snow/highlight on the right side */}
                <path d={`M ${x},${baseY - trunkH - 32} L ${x + (big ? 5 : 4)},${baseY - trunkH - 24} L ${x + 1},${baseY - trunkH - 24} Z`} fill="#fff" opacity="0.18" />
              </g>
            );
          })}
          {/* Floating leaves */}
          {Array.from({ length: 8 }).map((_, i) => {
            const x = 20 + i * 22;
            return (
              <ellipse key={i} cx={x} cy={20 + (i % 3) * 8} rx="1.2" ry="0.6" fill="#86efac" opacity="0.85" transform={`rotate(${i * 30} ${x} ${20 + (i % 3) * 8})`}>
                <animate attributeName="cy" values={`${20 + (i % 3) * 8};${30 + (i % 3) * 8};${20 + (i % 3) * 8}`} dur={`${4 + i * 0.4}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.95;0.4" dur={`${4 + i * 0.4}s`} repeatCount="indefinite" />
              </ellipse>
            );
          })}
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
          <defs>
            <linearGradient id="cork-base" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#b88858" />
              <stop offset="100%" stopColor="#8e6438" />
            </linearGradient>
            <radialGradient id="cork-vignette" cx="50%" cy="50%" r="70%">
              <stop offset="60%" stopColor="#000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.35" />
            </radialGradient>
          </defs>
          <rect width="200" height="100" fill="url(#cork-base)" />
          {/* Dense cork granule texture (3 sizes for depth) */}
          {Array.from({ length: 220 }).map((_, i) => {
            const x = (i * 13.7) % 200;
            const y = (i * 9.3) % 100;
            const size = i % 7 === 0 ? 1.2 : i % 3 === 0 ? 0.7 : 0.4;
            const c = i % 5 === 0 ? "#5e3e1d" : i % 4 === 0 ? "#caa477" : "#7a5a35";
            return <circle key={i} cx={x} cy={y} r={size} fill={c} opacity={i % 4 === 0 ? 0.9 : 0.55} />;
          })}
          {/* Wood-frame edge */}
          <rect x="2" y="2" width="196" height="96" fill="none" stroke="#5a3a1f" strokeWidth="3" rx="1" />
          <rect x="2" y="2" width="196" height="96" fill="none" stroke="#3a2410" strokeWidth="0.5" rx="1" />
          {/* Pinned post-its with shadow + push-pin */}
          {[
            { x: 20,  y: 20, w: 24, h: 22, fill: "#fde047", stroke: "#ca8a04", rot: -5, txt: "TODO" },
            { x: 80,  y: 40, w: 22, h: 22, fill: "#fbcfe8", stroke: "#be185d", rot: 3,  txt: "♥" },
            { x: 140, y: 20, w: 24, h: 22, fill: "#bbf7d0", stroke: "#15803d", rot: -2, txt: "OK" },
            { x: 50,  y: 60, w: 18, h: 14, fill: "#bae6fd", stroke: "#0369a1", rot: 4,  txt: "" },
            { x: 120, y: 65, w: 20, h: 16, fill: "#fed7aa", stroke: "#c2410c", rot: -3, txt: "★" },
          ].map((s, i) => {
            const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
            return (
              <g key={i} transform={`rotate(${s.rot} ${cx} ${cy})`}>
                {/* Drop shadow */}
                <rect x={s.x + 0.6} y={s.y + 1.2} width={s.w} height={s.h} fill="#000" opacity="0.25" />
                {/* Post-it */}
                <rect x={s.x} y={s.y} width={s.w} height={s.h} fill={s.fill} stroke={s.stroke} strokeWidth="0.4" />
                {s.txt && <text x={cx} y={cy + 1.6} textAnchor="middle" fontSize="5" fontWeight="800" fill={s.stroke} fontFamily="Caveat, cursive">{s.txt}</text>}
                {/* Push pin */}
                <circle cx={cx} cy={s.y + 2.5} r="1.6" fill="#dc2626" stroke="#7f1d1d" strokeWidth="0.3" />
                <circle cx={cx - 0.5} cy={s.y + 2} r="0.5" fill="#fff" opacity="0.7" />
              </g>
            );
          })}
          {/* Vignette to push focus to the avatar/center */}
          <rect width="200" height="100" fill="url(#cork-vignette)" />
        </svg>
      );

    case "bg_library":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="lib-wood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#7c4a20" />
              <stop offset="100%" stopColor="#3a2410" />
            </linearGradient>
            <radialGradient id="lib-lamp" cx="50%" cy="55%" r="50%">
              <stop offset="0%"  stopColor="#fde68a" stopOpacity="0.55" />
              <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="200" height="100" fill="url(#lib-wood)" />
          {/* Top shelf */}
          <rect x="0" y="6" width="200" height="3" fill="#3a2410" />
          <rect x="0" y="6" width="200" height="0.6" fill="#a16742" />
          {/* Bottom shelf */}
          <rect x="0" y="84" width="200" height="3" fill="#3a2410" />
          <rect x="0" y="84" width="200" height="0.6" fill="#a16742" />
          {/* Books — varied widths, heights, leaning, with spine details */}
          {(() => {
            const palettes = [
              { c: "#7f1d1d", d: "#450a0a", l: "#fbbf24" },
              { c: "#1e3a8a", d: "#0c1e4d", l: "#fbbf24" },
              { c: "#14532d", d: "#052e16", l: "#fde68a" },
              { c: "#7c2d12", d: "#3f1108", l: "#fde047" },
              { c: "#581c87", d: "#2e1065", l: "#fbbf24" },
              { c: "#0c4a6e", d: "#0a2540", l: "#fde68a" },
              { c: "#831843", d: "#4c0519", l: "#fde047" },
            ];
            const books: any[] = [];
            let x = 4;
            let i = 0;
            while (x < 196) {
              const w = 5 + ((i * 3) % 6);
              const h = 64 + ((i * 5) % 12);
              const y = 84 - h;
              const p = palettes[i % palettes.length];
              const tilt = i % 11 === 0 ? (i % 2 === 0 ? -4 : 4) : 0;
              books.push(
                <g key={i} transform={tilt ? `rotate(${tilt} ${x + w / 2} 84)` : undefined}>
                  <rect x={x} y={y} width={w} height={h} fill={p.c} stroke={p.d} strokeWidth="0.4" />
                  {/* Spine bands */}
                  <rect x={x} y={y + 4} width={w} height="0.6" fill={p.d} opacity="0.8" />
                  <rect x={x} y={y + h - 5} width={w} height="0.6" fill={p.d} opacity="0.8" />
                  {/* Title gold band */}
                  <rect x={x + 0.6} y={y + h * 0.35} width={w - 1.2} height="3" fill={p.l} opacity="0.4" />
                  <rect x={x + 1.2} y={y + h * 0.36} width={w - 2.4} height="0.4" fill={p.d} opacity="0.7" />
                  {/* Top edge highlight */}
                  <rect x={x} y={y} width={w} height="0.4" fill="#fff" opacity="0.18" />
                </g>
              );
              x += w + 0.4;
              i++;
            }
            return books;
          })()}
          {/* Warm lamp glow centered */}
          <ellipse cx="100" cy="55" rx="90" ry="46" fill="url(#lib-lamp)">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="6s" repeatCount="indefinite" />
          </ellipse>
          {/* Floating dust motes */}
          {Array.from({ length: 12 }).map((_, i) => (
            <circle key={i} cx={20 + i * 14} cy={30 + (i % 3) * 14} r="0.5" fill="#fde68a" opacity="0.7">
              <animate attributeName="opacity" values="0.2;0.9;0.2" dur={`${3 + (i % 4)}s`} repeatCount="indefinite" />
              <animate attributeName="cy" values={`${30 + (i % 3) * 14};${28 + (i % 3) * 14};${30 + (i % 3) * 14}`} dur={`${4 + i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      );

    /* ===================== PHASE 2 — New rich backgrounds ===================== */
    case "bg_enchanted_forest":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="ef-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#1e1b4b" />
              <stop offset="55%" stopColor="#064e3b" />
              <stop offset="100%" stopColor="#022c22" />
            </linearGradient>
            <radialGradient id="ef-moon" cx="78%" cy="22%" r="22%">
              <stop offset="0%"  stopColor="#fef9c3" stopOpacity="1" />
              <stop offset="40%" stopColor="#fde68a" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="ef-mist" cx="50%" cy="80%" r="60%">
              <stop offset="0%"  stopColor="#86efac" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#86efac" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="200" height="100" fill="url(#ef-sky)" />
          {/* Distant moon */}
          <circle cx="158" cy="22" r="10" fill="#fef9c3" opacity="0.95" />
          <circle cx="156" cy="20" r="3" fill="#fde68a" opacity="0.5" />
          <rect width="200" height="100" fill="url(#ef-moon)" />
          {/* Magical mist near the floor */}
          <rect width="200" height="100" fill="url(#ef-mist)" />
          {/* Background trees (silhouettes, blurred feel) */}
          {[8, 26, 50, 75, 100, 125, 150, 172, 192].map((x, i) => {
            const h = 38 + (i * 7) % 18;
            return (
              <g key={`bt${i}`} opacity="0.55">
                <rect x={x - 0.8} y={100 - h * 0.3} width="1.6" height={h * 0.3} fill="#022c22" />
                <path d={`M ${x} ${100 - h} Q ${x - 8} ${100 - h * 0.6} ${x - 7} ${100 - h * 0.4} Q ${x + 8} ${100 - h * 0.6} ${x + 7} ${100 - h * 0.4} Z`} fill="#022c22" />
                <path d={`M ${x} ${100 - h * 1.05} Q ${x - 6} ${100 - h * 0.75} ${x - 5} ${100 - h * 0.55} Q ${x + 6} ${100 - h * 0.75} ${x + 5} ${100 - h * 0.55} Z`} fill="#064e3b" />
              </g>
            );
          })}
          {/* Foreground gnarled trees */}
          {[14, 60, 110, 160].map((x, i) => (
            <g key={`ft${i}`}>
              <path d={`M ${x} 100 Q ${x + 2} 80 ${x - 1} 60 Q ${x - 3} 50 ${x} 40`} stroke="#022c22" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d={`M ${x - 1} 60 Q ${x - 6} 56 ${x - 10} 50`} stroke="#022c22" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              <path d={`M ${x} 50 Q ${x + 6} 46 ${x + 10} 42`} stroke="#022c22" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              {/* Glowing canopy */}
              <circle cx={x} cy={42} r="6" fill="#10b981" opacity="0.55" />
              <circle cx={x - 6} cy={48} r="3.5" fill="#10b981" opacity="0.45" />
              <circle cx={x + 7} cy={44} r="3" fill="#34d399" opacity="0.55" />
            </g>
          ))}
          {/* Glowing mushrooms on the floor */}
          {[30, 75, 132, 178].map((x, i) => (
            <g key={`m${i}`}>
              <ellipse cx={x} cy={97} rx="3" ry="0.8" fill="#000" opacity="0.4" />
              <rect x={x - 0.7} y={94} width="1.4" height="3.5" fill="#fef3c7" />
              <ellipse cx={x} cy={94} rx="2.6" ry="1.5" fill="#a78bfa" stroke="#581c87" strokeWidth="0.3" />
              <circle cx={x - 1} cy={93.6} r="0.3" fill="#fff" />
              <circle cx={x + 0.7} cy={94.2} r="0.3" fill="#fff" />
              <ellipse cx={x} cy={93} rx="3" ry="0.8" fill="#a78bfa" opacity="0.5" style={{ filter: "blur(0.6px)" }} />
            </g>
          ))}
          {/* Fireflies — denser, with halo */}
          {Array.from({ length: 22 }).map((_, i) => {
            const cx = 8 + i * 9;
            const cy = 18 + (i % 5) * 14;
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r="2.4" fill="#fde047" opacity="0.18">
                  <animate attributeName="opacity" values="0.05;0.4;0.05" dur={`${1.6 + (i % 4) * 0.4}s`} begin={`${i * 0.15}s`} repeatCount="indefinite" />
                </circle>
                <circle cx={cx} cy={cy} r="0.85" fill="#fef9c3" style={{ filter: "drop-shadow(0 0 4px #fbbf24)" }}>
                  <animate attributeName="opacity" values="0.2;1;0.2" dur={`${1.6 + (i % 4) * 0.4}s`} begin={`${i * 0.15}s`} repeatCount="indefinite" />
                  <animate attributeName="cy" values={`${cy};${cy - 4};${cy}`} dur={`${3 + (i % 3)}s`} repeatCount="indefinite" />
                </circle>
              </g>
            );
          })}
        </svg>
      );

    case "bg_deep_sea":
      return (
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="ds-ray" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#7dd3fc" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="ds-jelly" cx="50%" cy="40%" r="50%">
              <stop offset="0%"   stopColor="#f0abfc" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#a21caf" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* God rays */}
          {[20, 60, 110, 160].map((x, i) => (
            <polygon key={i} points={`${x},0 ${x + 10},0 ${x + 30},100 ${x - 10},100`} fill="url(#ds-ray)">
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur={`${4 + i}s`} repeatCount="indefinite" />
            </polygon>
          ))}
          {/* Whale silhouette drifting through */}
          <g opacity="0.55">
            <path d="M -30 0 Q -10 -6 6 -2 Q 18 -1 22 -4 Q 26 -1 22 2 Q 18 4 6 4 Q -10 6 -30 0 Z" fill="#0ea5e9">
              <animateMotion dur="40s" repeatCount="indefinite" path="M -30 50 L 230 30" />
            </path>
          </g>
          {/* Jellyfish */}
          {[
            { x: 40,  y: 30, s: 1,    dly: 0 },
            { x: 130, y: 55, s: 0.7,  dly: 2 },
            { x: 170, y: 25, s: 0.85, dly: 4 },
          ].map((j, i) => (
            <g key={`j${i}`} transform={`translate(${j.x} ${j.y}) scale(${j.s})`}>
              <ellipse cx="0" cy="0" rx="9" ry="6" fill="url(#ds-jelly)" />
              <ellipse cx="0" cy="0" rx="9" ry="6" fill="none" stroke="#f0abfc" strokeWidth="0.4" opacity="0.7" />
              {/* Tentacles */}
              {[-5, -2, 1, 4].map((tx, k) => (
                <path key={k} d={`M ${tx} 5 Q ${tx + 1} 12 ${tx - 1} 18 Q ${tx} 24 ${tx + 1} 30`} stroke="#f0abfc" strokeWidth="0.5" fill="none" opacity="0.7">
                  <animateTransform attributeName="transform" type="translate" values="0 0; 0 1; 0 0" dur={`${3 + k}s`} repeatCount="indefinite" />
                </path>
              ))}
              <animateTransform attributeName="transform" type="translate" values={`${j.x} ${j.y}; ${j.x} ${j.y - 4}; ${j.x} ${j.y}`} dur={`${5 + i}s`} begin={`${j.dly}s`} repeatCount="indefinite" additive="replace" />
            </g>
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
          {/* Floor sand silhouette */}
          <path d="M 0 95 Q 50 92 100 94 T 200 95 L 200 100 L 0 100 Z" fill="#0c2a3e" opacity="0.85" />
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
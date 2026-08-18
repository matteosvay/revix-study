/**
 * Moteur audio léger de Revix — sons doux, ronds et discrets.
 * Timbre marimba/cloche (sinus + octave), gamme pentatonique (toujours agréable),
 * volume bas + une petite réverbe pour le côté "produit".
 * Aucune dépendance ; tout est synthétisé via la Web Audio API.
 */
let AC: AudioContext | null = null;
let master: GainNode | null = null;
let reverb: ConvolverNode | null = null;

const STORAGE_KEY = "revix-sound";

export function soundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundEnabled(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    /* ignore */
  }
  if (on) unlock();
}

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!AC) {
    AC = new AudioCtor();
    master = AC.createGain();
    master.gain.value = 0.5;
    const lp = AC.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 4600;
    lp.Q.value = 0.3;
    master.connect(lp);
    lp.connect(AC.destination);
    reverb = AC.createConvolver();
    reverb.buffer = impulse(1.5, 2.6);
    const rev = AC.createGain();
    rev.gain.value = 0.16;
    reverb.connect(rev);
    rev.connect(lp);
  }
  return AC;
}

function impulse(dur: number, decay: number): AudioBuffer {
  const c = AC as AudioContext;
  const len = Math.floor(c.sampleRate * dur);
  const b = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return b;
}

function pluck(freq: number, t0: number, dur = 0.34, vol = 0.13, rev = 0.5) {
  const c = ctx();
  if (!c || !master) return;
  const o1 = c.createOscillator();
  const o2 = c.createOscillator();
  const g = c.createGain();
  const g2 = c.createGain();
  o1.type = "sine";
  o1.frequency.value = freq;
  o2.type = "sine";
  o2.frequency.value = freq * 2;
  g2.gain.value = 0.28;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o1.connect(g);
  o2.connect(g2);
  g2.connect(g);
  g.connect(master);
  if (rev && reverb) {
    const rs = c.createGain();
    rs.gain.value = rev;
    g.connect(rs);
    rs.connect(reverb);
  }
  o1.start(t0);
  o2.start(t0);
  o1.stop(t0 + dur + 0.05);
  o2.stop(t0 + dur + 0.05);
}

/** Débloque / réveille le contexte audio (les navigateurs le suspendent avant interaction). */
export function unlock() {
  const c = ctx();
  if (c && c.state === "suspended") c.resume().catch(() => {});
}

const P = { C5: 523.25, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5 };

export function playPop() {
  if (!soundEnabled()) return;
  unlock();
  const c = ctx();
  if (c) pluck(P.E5, c.currentTime, 0.16, 0.08, 0.35);
}

export function playXp() {
  if (!soundEnabled()) return;
  unlock();
  const c = ctx();
  if (c) pluck(P.A5, c.currentTime, 0.34, 0.1, 0.55);
}

export function playCorrect() {
  if (!soundEnabled()) return;
  unlock();
  const c = ctx();
  if (!c) return;
  const t = c.currentTime;
  [P.E5, P.G5, P.C6].forEach((f, i) => pluck(f, t + i * 0.085, 0.4, 0.11, 0.6));
}

export function playLevel() {
  if (!soundEnabled()) return;
  unlock();
  const c = ctx();
  if (!c) return;
  const t = c.currentTime;
  [P.C5, P.E5, P.G5, P.A5, P.C6].forEach((f, i) => pluck(f, t + i * 0.1, 0.45, 0.11, 0.7));
  pluck(P.E6, t + 0.55, 0.7, 0.05, 0.8);
}

/* ── Effet spécial d'ouverture de lootbox (3 temps) ──────────────────────── */

function noiseBurst(t0: number, dur: number, f0: number, f1: number, vol = 0.1, q = 0.7) {
  const c = ctx();
  if (!c || !master) return;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = c.createBufferSource();
  s.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(f0, t0);
  bp.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  bp.Q.value = q;
  const g = c.createGain();
  g.gain.value = vol;
  s.connect(bp);
  bp.connect(g);
  g.connect(master);
  s.start(t0);
  s.stop(t0 + dur);
}

/** Anticipation — petit scintillement qui monte pendant que le paquet tremble. */
export function playShimmer() {
  if (!soundEnabled()) return;
  unlock();
  const c = ctx();
  if (!c) return;
  const t = c.currentTime;
  [P.C5, P.E5, P.G5, P.C6].forEach((f, i) => pluck(f, t + i * 0.09, 0.18, 0.05, 0.3));
}

/** Déballage — whoosh de papier + pop doux. */
export function playUnwrap() {
  if (!soundEnabled()) return;
  unlock();
  const c = ctx();
  if (!c) return;
  const t = c.currentTime;
  noiseBurst(t, 0.26, 700, 3200, 0.13);
  pluck(220, t + 0.02, 0.14, 0.09, 0.2);
  pluck(660, t + 0.03, 0.12, 0.07, 0.3);
}

/** Révélation — carillon dont l'ampleur grandit avec la rareté. */
export function playReveal(rarity: string) {
  if (!soundEnabled()) return;
  unlock();
  const c = ctx();
  if (!c) return;
  const t = c.currentTime;
  const high = rarity === "legendary" || rarity === "creator" || rarity === "queen";
  if (high) {
    [P.C5, P.E5, P.G5, P.C6, P.E6, 1568].forEach((f, i) => pluck(f, t + i * 0.09, 0.5, 0.12, 0.75));
    for (let i = 0; i < 8; i++) pluck([P.C6, P.E6, 1568][i % 3], t + 0.5 + i * 0.06, 0.4, 0.04, 0.8);
    noiseBurst(t + 0.5, 0.5, 4000, 9000, 0.05);
  } else if (rarity === "epic") {
    [P.E5, P.A5, P.C6, P.E6].forEach((f, i) => pluck(f, t + i * 0.085, 0.42, 0.11, 0.65));
    pluck(1568, t + 0.4, 0.5, 0.05, 0.7);
  } else if (rarity === "rare") {
    [P.E5, P.G5, P.C6].forEach((f, i) => pluck(f, t + i * 0.085, 0.4, 0.1, 0.6));
  } else {
    pluck(P.A5, t, 0.34, 0.1, 0.5);
    pluck(P.C6, t + 0.09, 0.3, 0.07, 0.5);
  }
}

// Débloque l'audio au premier geste de l'utilisateur (contrainte des navigateurs).
if (typeof window !== "undefined") {
  const once = () => {
    if (soundEnabled()) unlock();
    window.removeEventListener("pointerdown", once);
    window.removeEventListener("keydown", once);
  };
  window.addEventListener("pointerdown", once, { once: true });
  window.addEventListener("keydown", once, { once: true });
}

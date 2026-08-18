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

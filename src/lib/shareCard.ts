/**
 * Génère une carte de score partageable (image PNG) façon story, aux couleurs Revix,
 * puis la partage via l'API native (mobile) ou la télécharge (fallback desktop).
 * Tout est dessiné sur un <canvas> — aucune dépendance.
 */

type ScoreData = { score: number; total: number; pct: number };

const INK = "#1e2c47";
const BLUE = "#2456d6";
const CREAM = "#fffdf6";
const PAPER = "#f4f1e8";
const GOLD = "#f6c945";
const GREEN = "#1c9a5f";

/** Diplo en SVG (toque bleue), expression selon le score. */
function diploSvg(happy: boolean): string {
  const mouth = happy ? "M58 108 q12 13 24 0" : "M62 110 q8 7 16 0";
  const eyes = happy
    ? `<path d="M50 96 q7 -9 14 0" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/><path d="M76 96 q7 -9 14 0" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/>`
    : `<circle cx="57" cy="95" r="7" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="83" cy="95" r="7" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="58.5" cy="96.5" r="3.2" fill="${INK}"/><circle cx="84.5" cy="96.5" r="3.2" fill="${INK}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 156" width="140" height="156">
    <path d="M56 134 v9 M84 134 v9" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M40 110 c-9 2 -14 8 -14 16 M100 110 c9 2 14 8 14 16" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <rect x="38" y="60" width="64" height="78" rx="30" fill="${CREAM}" stroke="${INK}" stroke-width="4.5"/>
    <ellipse cx="52" cy="106" rx="6.5" ry="4.5" fill="#ffb0c8" opacity="0.85"/><ellipse cx="88" cy="106" rx="6.5" ry="4.5" fill="#ffb0c8" opacity="0.85"/>
    ${eyes}
    <path d="${mouth}" fill="none" stroke="${INK}" stroke-width="3.8" stroke-linecap="round"/>
    <ellipse cx="70" cy="58" rx="35" ry="12" fill="${BLUE}" stroke="${INK}" stroke-width="4"/>
    <path d="M70 28 L118 50 L70 72 L22 50 Z" fill="${BLUE}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="70" cy="50" r="3.4" fill="${GOLD}"/>
    <path d="M70 50 C96 52 108 56 108 66" fill="none" stroke="${GOLD}" stroke-width="3.2"/>
    <path d="M103 64 h10 l-2.5 15 h-5 z" fill="${GOLD}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
  </svg>`;
}

function loadImg(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, fill: string) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? R : R * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

export async function makeScoreCard({ score, total, pct }: ScoreData): Promise<Blob> {
  const W = 1080, H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // fond papier
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // carte centrale
  const cardX = 70, cardY = 150, cardW = W - 140, cardH = H - 300;
  ctx.fillStyle = INK;
  roundRect(ctx, cardX + 12, cardY + 14, cardW, cardH, 42); ctx.fill(); // ombre
  ctx.fillStyle = CREAM;
  roundRect(ctx, cardX, cardY, cardW, cardH, 42); ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();

  // bandeau bleu (logo)
  ctx.save();
  roundRect(ctx, cardX, cardY, cardW, 132, 42); ctx.clip();
  ctx.fillStyle = BLUE; ctx.fillRect(cardX, cardY, cardW, 132);
  ctx.restore();
  ctx.fillStyle = "#fff";
  ctx.font = "700 46px 'Space Grotesk', system-ui, sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("REVIX", W / 2, cardY + 66);
  ctx.font = "600 22px 'JetBrains Mono', monospace";
  ctx.fillText("MON SCORE", W / 2, cardY + 104);

  // Diplo
  const happy = pct >= 50;
  try {
    const img = await loadImg(diploSvg(happy));
    const dw = 300, dh = (dw * 156) / 140;
    ctx.drawImage(img, W / 2 - dw / 2, cardY + 150, dw, dh);
  } catch { /* pas grave si Diplo ne charge pas */ }

  // score géant
  const scoreColor = pct >= 80 ? GREEN : pct >= 50 ? BLUE : "#e2564b";
  ctx.fillStyle = INK;
  ctx.font = "700 150px 'Space Grotesk', system-ui, sans-serif";
  ctx.fillText(`${score}/${total}`, W / 2, cardY + 560);
  ctx.fillStyle = scoreColor;
  ctx.font = "700 96px 'Space Grotesk', system-ui, sans-serif";
  ctx.fillText(`${pct}%`, W / 2, cardY + 680);

  // étoiles
  const stars = Math.max(1, Math.round((pct / 100) * 5));
  const sy = cardY + 780, sgap = 92, sx0 = W / 2 - (5 - 1) * sgap / 2;
  for (let i = 0; i < 5; i++) star(ctx, sx0 + i * sgap, sy, 34, i < stars ? GOLD : "#e7e2d3");

  // tagline
  ctx.fillStyle = INK;
  ctx.font = "600 34px 'Inter', system-ui, sans-serif";
  const msg = pct === 100 ? "Sans-faute ! 🎯" : pct >= 80 ? "Bien joué !" : pct >= 50 ? "En progression !" : "On révise et on y retourne !";
  ctx.fillText(msg.replace(" 🎯", ""), W / 2, cardY + cardH - 150);
  ctx.fillStyle = "#5a6478";
  ctx.font = "500 26px 'Inter', system-ui, sans-serif";
  ctx.fillText("Révise tes cours avec l'IA · revix", W / 2, cardY + cardH - 100);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b as Blob), "image/png", 0.95));
}

/** Partage (mobile) ou télécharge (desktop) la carte de score. */
export async function shareScoreCard(data: ScoreData): Promise<"shared" | "downloaded"> {
  const blob = await makeScoreCard(data);
  const file = new File([blob], "revix-score.png", { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: any) => boolean; share?: (d: any) => Promise<void> };
  if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "Mon score Revix", text: `J'ai fait ${data.pct}% sur Revix ! 📚` });
      return "shared";
    } catch { /* annulé → on tente le téléchargement */ }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "revix-score.png";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}

/**
 * Burst de confettis en papier + étoiles (Web Animations API).
 * Réutilisé pour les récompenses, montées de niveau, etc.
 */
export function firePaperConfetti(
  scraps: string[] = ["#2456d6", "#ffe14d", "#28a866", "#e2564b", "#3f7bff", "#f6c945"],
  count = 64,
  originY = 0.4
) {
  if (typeof window === "undefined") return;
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight * originY;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    const star = Math.random() > 0.55;
    const col = scraps[Math.floor(Math.random() * scraps.length)];
    el.style.cssText = `position:fixed;z-index:120;pointer-events:none;left:${cx}px;top:${cy}px`;
    if (star) {
      el.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="${col}"><path d="M12 3l2.5 5.5L20 9.3l-4 4 .9 5.7-4.9-2.8L7 19l.9-5.7-4-4 5.6-.8L12 3Z"/></svg>`;
    } else {
      el.style.width = `${6 + Math.random() * 7}px`;
      el.style.height = `${9 + Math.random() * 9}px`;
      el.style.background = col;
      el.style.borderRadius = "1px";
    }
    document.body.appendChild(el);
    const ang = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * 220;
    const dx = Math.cos(ang) * dist;
    const dy = Math.sin(ang) * dist - 60;
    const rot = Math.random() * 720 - 360;
    const dur = 1300 + Math.random() * 1100;
    el.animate(
      [
        { transform: "translate(-50%,-50%) rotate(0)", opacity: 1 },
        { transform: `translate(${dx - 8}px,${dy}px) rotate(${rot / 2}deg)`, opacity: 1, offset: 0.7 },
        { transform: `translate(${dx}px,${dy + 240}px) rotate(${rot}deg)`, opacity: 0 },
      ],
      { duration: dur, easing: "cubic-bezier(.2,.7,.3,1)" }
    ).onfinish = () => el.remove();
  }
}

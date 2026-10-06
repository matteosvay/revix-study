import { useEffect, useRef, useState } from "react";

/**
 * Compteur animé qui interpole de 0 → `value` en `duration` ms.
 * Easing : easeOutCubic, parfait pour effet "Duolingo".
 */
export function AnimatedNumber({
  value,
  duration = 900,
  className,
  suffix = "",
  animateOnMount = true,
}: {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
  /**
   * false : le nombre s'affiche directement à l'arrivée sur l'écran, et ne
   * s'anime que s'il change ensuite. Pour les écrans du quotidien (accueil,
   * stats, profil), où un compteur qui défile à chaque visite fait du bruit.
   */
  animateOnMount?: boolean;
}) {
  const [display, setDisplay] = useState(animateOnMount ? 0 : value);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(animateOnMount ? 0 : value);
  // Les données arrivent souvent après l'affichage (0 puis la vraie valeur).
  // Tant que la première vraie valeur n'est pas arrivée, on l'affiche sans animer.
  const settled = useRef(animateOnMount || value !== 0);

  useEffect(() => {
    if (!settled.current) {
      setDisplay(value);
      fromRef.current = value;
      if (value !== 0) settled.current = true;
      return;
    }
    fromRef.current = display;
    if (display === value) return;
    startRef.current = null;
    let raf = 0;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(fromRef.current + (value - fromRef.current) * eased);
      setDisplay(next);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <span className={className}>{display}{suffix}</span>;
}

/** Petit burst de confetti CSS (15 particules, couleurs design-system). */
export function ConfettiBurst({ count = 22 }: { count?: number }) {
  const colors = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--destructive))"];
  return (
    <div className="confetti-host" aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const duration = 1.6 + Math.random() * 1.2;
        const color = colors[i % colors.length];
        return (
          <i
            key={i}
            style={{
              left: `${left}%`,
              background: color,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}
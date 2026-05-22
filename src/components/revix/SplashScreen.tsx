import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

/**
 * Écran de chargement initial — affiché au boot de l'app.
 * Sobre, brutaliste, dans le thème (Archivo Black + accents primaires).
 * Disparaît après un court délai avec un fade.
 */
export const SplashScreen = () => {
  const [done, setDone] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => setFading(true), 900);
    const t2 = window.setTimeout(() => setDone(true), 1300);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  if (done) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-background transition-opacity duration-300 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary border-[3px] border-foreground shadow-brutal-lg animate-scale-in">
          <Sparkles className="h-10 w-10 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <h1 className="font-display text-4xl tracking-tight text-foreground">Revix</h1>
          <div className="h-1 w-24 overflow-hidden rounded-full border-2 border-foreground bg-card">
            <div className="h-full w-1/2 bg-accent animate-[loading-bar_1.1s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};
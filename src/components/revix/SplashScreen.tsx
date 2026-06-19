import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const SPLASH_FLAG = "revix:splash-shown";

/**
 * Écran de chargement initial — affiché UNIQUEMENT au tout premier lancement
 * de l'application dans l'onglet (comme un vrai jeu). On stocke un flag dans
 * sessionStorage pour ne plus le remontrer lors des navigations internes
 * ou des rechargements de chunks lazy.
 */
export const SplashScreen = () => {
  // Si on a déjà affiché le splash dans cet onglet, on saute directement.
  const alreadyShown =
    typeof window !== "undefined" && window.sessionStorage.getItem(SPLASH_FLAG) === "1";
  const [done, setDone] = useState(alreadyShown);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (alreadyShown) return;
    const t1 = window.setTimeout(() => setFading(true), 900);
    const t2 = window.setTimeout(() => {
      setDone(true);
      try {
        window.sessionStorage.setItem(SPLASH_FLAG, "1");
      } catch {
        // sessionStorage indisponible (mode privé strict) → on l'ignore.
      }
    }, 1300);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [alreadyShown]);

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
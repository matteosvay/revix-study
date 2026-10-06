import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { DiploFace, DiploDefs, type DiploExpr } from "./DiploFace";
import { DiploCapPicker } from "./DiploCapPicker";

// "" = immobile. Diplo ne se balance plus en continu dans un coin de l'écran :
// il saute quand tu gagnes de l'XP et fait la fête quand tu passes un niveau.
type Anim = "" | "diplo-hop" | "diplo-party";

/**
 * Diplo — la mascotte de Diplo, présente sur les écrans /app.
 * Cligne des yeux, se balance, réagit aux événements de jeu (XP -> saut,
 * niveau -> fête) avec un son doux, et ouvre le sélecteur de toque au clic.
 */
export const DiploMascot = () => {
  const { pathname } = useLocation();
  const [msg, setMsg] = useState<string | null>(null);
  const [expr, setExpr] = useState<DiploExpr>("normal");
  const [anim, setAnim] = useState<Anim>("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const msgTimer = useRef<number | undefined>(undefined);
  const animTimer = useRef<number | undefined>(undefined);

  const onApp = pathname.startsWith("/app");

  const say = (text: string, ms = 2000) => {
    setMsg(text);
    window.clearTimeout(msgTimer.current);
    msgTimer.current = window.setTimeout(() => setMsg(null), ms);
  };

  const react = (mode: "happy" | "party", duration = 900) => {
    setExpr("happy");
    setAnim(mode === "party" ? "diplo-party" : "diplo-hop");
    window.clearTimeout(animTimer.current);
    animTimer.current = window.setTimeout(() => {
      setExpr("normal");
      setAnim("");
    }, duration);
  };

  useEffect(() => {
    if (!onApp) return;
    const onXp = () => {
      // Le son est joué par XpOverlay. Ici, Diplo réagit seulement en image,
      // sinon chaque gain d'XP sonnait deux fois.
      react("happy");
    };
    const onLvl = (e: Event) => {
      const detail = (e as CustomEvent).detail as { level?: number };
      react("party", 1100);
      say(detail?.level ? `Niveau ${detail.level} !` : "Niveau supérieur !", 2600);
    };
    window.addEventListener("revix:xp", onXp);
    window.addEventListener("revix:levelup", onLvl);
    return () => {
      window.removeEventListener("revix:xp", onXp);
      window.removeEventListener("revix:levelup", onLvl);
    };
  }, [onApp]);

  if (!onApp) return null;

  return (
    <>
      <DiploDefs />
      {/* Sur téléphone, Diplo masquait le contenu (cartes, calendrier, libellés) et
          doublait celui du bouton coach. Il n'apparaît plus qu'au moment où il réagit
          (XP, niveau). Sur grand écran, il reste à sa place. */}
      <div
        className={`fixed left-3 lg:left-[88px] bottom-24 lg:bottom-28 z-30 ${anim || msg ? "" : "hidden lg:block"}`}
        style={{ pointerEvents: "none" }}
      >
        {msg && (
          <div
            className="mb-2 ml-1 inline-block max-w-[200px] rounded-xl border-[2.5px] border-foreground bg-card px-3 py-1.5 font-display text-sm text-foreground shadow-brutal-sm"
            style={{ pointerEvents: "none" }}
          >
            {msg}
          </div>
        )}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label="Personnaliser Diplo"
          style={{
            pointerEvents: "auto",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            filter: "drop-shadow(0 6px 8px rgba(30,44,71,0.28))",
          }}
        >
          <DiploFace expr={expr} animClass={anim} size={84} />
        </button>
      </div>
      <DiploCapPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  );
};

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { soundEnabled, setSoundEnabled, playPop } from "@/lib/sfx";

/** Bouton son on/off — préférence mémorisée (localStorage), activé par défaut. */
export const SoundToggle = () => {
  const [on, setOn] = useState(true);
  useEffect(() => setOn(soundEnabled()), []);

  const toggle = () => {
    const next = !on;
    setOn(next);
    setSoundEnabled(next);
    if (next) playPop();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={on ? "Couper le son" : "Activer le son"}
      title={on ? "Son activé" : "Son coupé"}
      className="inline-flex items-center justify-center h-10 w-10 rounded-lg border-2 border-foreground bg-card shadow-brutal-sm transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
    >
      {on ? <Volume2 className="h-5 w-5" strokeWidth={2.5} /> : <VolumeX className="h-5 w-5" strokeWidth={2.5} />}
    </button>
  );
};

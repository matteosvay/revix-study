import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Bouton "Retour" affiché en haut des pages de détail.
 * Revient à la page précédente via l'historique du navigateur,
 * avec un fallback vers le Dashboard si l'historique est vide.
 */
export function BackButton({ fallback = "/app", label = "Retour" }: { fallback?: string; label?: string }) {
  const nav = useNavigate();
  const onClick = () => {
    if (window.history.length > 1) {
      nav(-1);
    } else {
      nav(fallback);
    }
  };
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 ml-4 mt-4 rounded-full border-2 border-foreground bg-card text-xs font-bold uppercase tracking-wider shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition"
      aria-label={label}
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}
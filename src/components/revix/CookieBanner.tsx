import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const COOKIE_KEY = "revix_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_KEY);
      if (!consent) setVisible(true);
    } catch {
      // localStorage indisponible (mode privé strict) — on n'affiche pas la bannière
    }
  }, []);

  const accept = () => {
    try { localStorage.setItem(COOKIE_KEY, "accepted"); } catch {/* noop */}
    setVisible(false);
  };

  const decline = () => {
    try { localStorage.setItem(COOKIE_KEY, "declined"); } catch {/* noop */}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Gestion des cookies"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 z-[200] sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="bg-card border-[2.5px] border-foreground rounded-xl shadow-brutal p-4 relative">
        {/* Fermer sans choisir = équivalent à refuser */}
        <button
          onClick={decline}
          aria-label="Fermer"
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-sm font-bold mb-1">Cookies 🍪</p>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          Revix utilise des cookies <strong>strictement nécessaires</strong> pour l'authentification et
          le paiement sécurisé. Aucun cookie publicitaire ou de suivi tiers n'est utilisé.{" "}
          <Link
            to="/confidentialite"
            className="text-primary underline hover:no-underline"
            target="_blank"
          >
            En savoir plus
          </Link>
        </p>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={accept}
            className="flex-1 gradient-primary border-0 text-xs font-bold"
          >
            Accepter
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={decline}
            className="flex-1 text-xs font-bold border-[2px] border-foreground"
          >
            Refuser
          </Button>
        </div>
      </div>
    </div>
  );
}

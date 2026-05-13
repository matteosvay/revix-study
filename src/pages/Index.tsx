import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Landing from "./Landing";

const AUTH_TIMEOUT_MS = 5000;

const Index = () => {
  const { user, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const id = setTimeout(() => setTimedOut(true), AUTH_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [loading]);

  if (loading && !timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="rounded-md border-[3px] border-foreground bg-card px-5 py-4 shadow-brutal font-mono-tag text-xs uppercase tracking-wider">
          Chargement...
        </div>
      </div>
    );
  }

  if (timedOut && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="rounded-md border-[3px] border-foreground bg-card px-5 py-4 shadow-brutal text-center space-y-3">
          <p className="font-mono-tag text-xs uppercase tracking-wider text-destructive">Connexion lente</p>
          <p className="text-xs text-muted-foreground">Vérifie ta connexion réseau.</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs underline text-primary"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (user) return <Navigate to="/app" replace />;
  return <Landing />;
};

export default Index;

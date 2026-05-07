import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Wrapper qui combine RequireAuth + vérification du rôle admin.
 * - Pas connecté → redirige vers /login
 * - Connecté mais pas admin → redirige vers /app (la page admin n'apparaît même pas)
 * - Admin → affiche le contenu protégé
 *
 * Note : la sécurité réelle est côté serveur (RLS sur user_roles + RPC admin-stats).
 * Ce wrapper est un confort UX pour ne pas exposer la route aux non-admins.
 */
export const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

  if (authLoading || (user && adminLoading)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">Vérification des permissions…</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/app" replace />;

  return <>{children}</>;
};

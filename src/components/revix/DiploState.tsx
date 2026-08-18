import { ReactNode } from "react";
import { DiploFace, DiploExpr } from "./DiploFace";

/**
 * État vide / chargement illustré par Diplo.
 * Réutilisable partout : listes vides, écrans en attente, résultats introuvables.
 *
 *  <DiploState title="Aucune fiche" subtitle="Génère ta première fiche !" action={<Button/>} />
 *  <DiploState variant="loading" title="On prépare tout…" />
 */
export function DiploState({
  variant = "empty",
  title,
  subtitle,
  action,
  expr,
  size = 96,
  className = "",
}: {
  variant?: "empty" | "loading";
  title: string;
  subtitle?: string;
  action?: ReactNode;
  expr?: DiploExpr;
  size?: number;
  className?: string;
}) {
  const loading = variant === "loading";
  const face: DiploExpr = expr ?? (loading ? "normal" : "happy");

  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 py-10 ${className}`}>
      <div className="relative">
        {/* petite ombre papier sous Diplo */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-1 h-2.5 rounded-full bg-foreground/10 blur-[1px]" style={{ width: size * 0.55 }} />
        <DiploFace size={size} expr={face} animClass="diplo-bob" />
      </div>

      <p className="mt-3 font-display font-bold text-lg text-foreground">
        {title}
        {loading && <span className="diplo-dots" aria-hidden="true" />}
      </p>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground max-w-[280px]">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

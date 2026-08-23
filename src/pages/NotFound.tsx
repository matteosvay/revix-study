import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Logo } from "@/components/revix/Logo";
import { DiploFace } from "@/components/revix/DiploFace";
import { Button } from "@/components/ui/button";
import { PageHead } from "@/components/seo/PageHead";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 : route inconnue demandée :", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-6 text-center relative overflow-hidden">
      <PageHead
        title="Page introuvable, Diplo"
        description="Cette page n'existe pas ou plus."
        path={location.pathname}
        noindex
      />

      <div className="absolute top-6 left-6">
        <Logo />
      </div>

      <div className="pointer-events-none mb-6" aria-hidden="true">
        <DiploFace size={112} expr="sad" cap="#2456d6" />
      </div>

      <p className="font-mono-tag text-xs uppercase tracking-[0.3em] text-muted-foreground">
        Erreur 404
      </p>
      <h1 className="font-display text-5xl md:text-6xl tracking-tight mt-3">
        Cette page a <span className="inline-block bg-primary text-primary-foreground px-3 -rotate-1 border-[3px] border-foreground shadow-brutal-sm">séché</span> le cours
      </h1>
      <p className="mt-5 text-muted-foreground font-medium max-w-md">
        Le lien est cassé ou la page a été déplacée. Rien de grave, on te ramène en terrain connu.
      </p>

      <div className="mt-9 flex flex-col sm:flex-row gap-3">
        <Button
          asChild
          size="lg"
          className="rounded-md border-[3px] border-foreground bg-primary text-primary-foreground shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all font-bold uppercase tracking-wide h-14 px-7 text-sm"
        >
          <Link to="/">Retour à l'accueil</Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="rounded-md border-[3px] border-foreground bg-card shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all font-bold uppercase tracking-wide h-14 px-7 text-sm"
        >
          <Link to="/app">Ouvrir mon espace</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;

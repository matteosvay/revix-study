import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/revix/Logo";

interface LegalLayoutProps {
  title: string;
  subtitle?: string;
  updatedAt: string;
  children: ReactNode;
}

export function LegalLayout({ title, subtitle, updatedAt, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b-[3px] border-foreground bg-card">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <Link to="/" aria-label="Retour à l'accueil">
            <Logo />
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-5 py-10 pb-20">
        {/* Page title */}
        <div className="mb-10">
          <div className="inline-block border-[2.5px] border-foreground bg-secondary px-3 py-1 rounded-md shadow-brutal-sm mb-4">
            <p className="font-mono-tag text-[10px] uppercase tracking-widest">Revix — Document légal</p>
          </div>
          <h1 className="font-display text-4xl leading-[0.95] mb-3">{title}</h1>
          {subtitle && <p className="text-muted-foreground text-sm mt-2">{subtitle}</p>}
          <p className="font-mono-tag text-[11px] text-muted-foreground mt-3 uppercase tracking-wider">
            Dernière mise à jour : {updatedAt}
          </p>
        </div>

        {/* Legal content */}
        <div className="legal-content space-y-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-[3px] border-foreground bg-card py-6">
        <div className="max-w-3xl mx-auto px-5 flex flex-wrap gap-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <Link to="/mentions-legales" className="hover:text-foreground transition-colors">Mentions légales</Link>
          <Link to="/confidentialite" className="hover:text-foreground transition-colors">Confidentialité</Link>
          <Link to="/cgu" className="hover:text-foreground transition-colors">CGU</Link>
          <Link to="/cgv" className="hover:text-foreground transition-colors">CGV</Link>
        </div>
      </footer>
    </div>
  );
}

/** Section numérotée */
export function LegalSection({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <section>
      <div className="flex items-start gap-3 mb-3">
        <span className="font-display text-2xl leading-none shrink-0 text-primary">{number}.</span>
        <h2 className="font-display text-2xl leading-tight">{title}</h2>
      </div>
      <div className="pl-8 space-y-3 text-sm leading-relaxed text-foreground/90">
        {children}
      </div>
    </section>
  );
}

/** Bloc mise en évidence (info importante) */
export function LegalHighlight({ children }: { children: ReactNode }) {
  return (
    <div className="border-[2.5px] border-foreground bg-secondary rounded-md p-4 shadow-brutal-sm">
      {children}
    </div>
  );
}

/** Tableau simple */
export function LegalTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="border-[2.5px] border-foreground rounded-md overflow-hidden shadow-brutal-sm">
      {rows.map(([label, value], i) => (
        <div
          key={i}
          className={`flex gap-4 px-4 py-2.5 text-sm ${i < rows.length - 1 ? "border-b-[2px] border-foreground/20" : ""} ${i % 2 === 0 ? "bg-card" : "bg-muted/30"}`}
        >
          <span className="font-bold min-w-[160px] shrink-0">{label}</span>
          <span className="text-muted-foreground">{value}</span>
        </div>
      ))}
    </div>
  );
}

import { ReactNode } from "react";
import { NavLink } from "@/components/NavLink";
import { Home, BookOpen, Brain, Calendar, Flame, User } from "lucide-react";

const nav = [
  { to: "/app", end: true, label: "Accueil", icon: Home },
  { to: "/app/fiches", label: "Cours", icon: BookOpen },
  { to: "/app/quizz", label: "Quizz", icon: Brain },
  { to: "/app/planning", label: "Planning", icon: Calendar },
  { to: "/app/streak", label: "Streak", icon: Flame },
  { to: "/app/profil", label: "Profil", icon: User },
];

/**
 * Phone-frame layout — the entire app lives inside a centered iPhone-style frame,
 * even on desktop, with a bottom tab bar (Notion-meets-iOS).
 */
export const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-0 sm:p-6 lg:p-10 bg-gradient-to-br from-muted via-background to-secondary relative overflow-hidden">
      {/* Ambient background glows on desktop */}
      <div className="hidden sm:block absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="hidden sm:block absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-[120px] pointer-events-none" />
      <div className="w-full sm:w-[420px] sm:h-[860px] sm:rounded-[2.5rem] sm:shadow-phone bg-background relative overflow-hidden flex flex-col h-screen sm:border-8 sm:border-foreground/90 z-10">
        {/* Status bar (decorative on desktop) */}
        <div className="hidden sm:flex h-7 items-center justify-between px-7 text-[11px] font-semibold text-foreground shrink-0 pt-2">
          <span>9:41</span>
          <span className="absolute left-1/2 -translate-x-1/2 top-1.5 h-5 w-24 rounded-full bg-foreground/90" />
          <span className="flex gap-1 items-center">
            <span className="h-2 w-3 rounded-sm bg-foreground/80" />
            <span className="h-2 w-2 rounded-full bg-foreground/80" />
            <span className="h-2 w-5 rounded-sm border border-foreground/80" />
          </span>
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto overscroll-contain pb-24 animate-fade-in">
          {children}
        </main>

        {/* Bottom tab bar */}
        <nav className="absolute bottom-0 inset-x-0 border-t glass-tab">
          <div className="grid grid-cols-6 px-1 pt-1.5 pb-2">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[10px] font-medium text-muted-foreground transition-colors"
                activeClassName="!text-primary"
              >
                <n.icon className="h-[22px] w-[22px]" strokeWidth={2} />
                {n.label}
              </NavLink>
            ))}
          </div>
          {/* iOS home indicator */}
          <div className="hidden sm:flex justify-center pb-1.5">
            <div className="h-1 w-32 rounded-full bg-foreground/80" />
          </div>
        </nav>
      </div>
    </div>
  );
};

/** Page header with serif title (Notion vibe) */
export const PageHeader = ({ emoji, title, subtitle, action }: { emoji?: string; title: string; subtitle?: string; action?: ReactNode }) => (
  <div className="px-5 pt-5 pb-3">
    {emoji && <div className="text-4xl mb-2">{emoji}</div>}
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <h1 className="text-3xl font-serif tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  </div>
);
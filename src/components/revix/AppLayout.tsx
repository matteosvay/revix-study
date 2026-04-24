import { ReactNode } from "react";
import { NavLink } from "@/components/NavLink";
import { Home, BookOpen, Brain, Calendar, Flame, User, Map } from "lucide-react";
import { ScribbleUnderline } from "./Scribble";

const nav = [
  { to: "/app", end: true, label: "Accueil", icon: Home },
  { to: "/app/fiches", label: "Cours", icon: BookOpen },
  { to: "/app/quizz", label: "Quizz", icon: Brain },
  { to: "/app/aventure", label: "Quêtes", icon: Map },
  { to: "/app/planning", label: "Plan", icon: Calendar },
  { to: "/app/streak", label: "Streak", icon: Flame },
  { to: "/app/profil", label: "Profil", icon: User },
];

/**
 * Phone-frame brutaliste — bordure noire épaisse, ombre dure,
 * fond papier crème jaune + dots. Bottom tab bar style "post-it actif".
 */
export const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-0 sm:p-6 lg:p-10 bg-background relative overflow-hidden">
      {/* Background décoratif : trame pointillée + bandes diagonales */}
      <div className="hidden sm:block absolute inset-0 dots-bg pointer-events-none opacity-50" />
      <div className="hidden sm:block absolute -top-10 -left-10 w-72 h-72 stripes-violet rounded-full opacity-20 pointer-events-none" />
      <div className="hidden sm:block absolute -bottom-10 -right-10 w-80 h-80 bg-accent rounded-full opacity-25 pointer-events-none" />

      {/* Decorations flottantes desktop */}
      <span className="hidden lg:block absolute top-[12%] left-[14%] postit text-foreground p-3 text-sm w-28 drift-slow" aria-hidden>
        révise<br/>+ vite ✨
      </span>
      <span className="hidden lg:block absolute top-[20%] right-[14%] label-tape label-tape-violet drift-slow" style={{ animationDelay: "1.5s" }} aria-hidden>
        STUDY MODE
      </span>
      <span className="hidden lg:block absolute bottom-[18%] left-[12%] rubber-stamp" aria-hidden>+50 XP</span>

      <div className="w-full sm:w-[420px] sm:h-[860px] sm:rounded-[2rem] sm:shadow-[8px_8px_0_0_hsl(var(--foreground))] bg-background relative overflow-hidden flex flex-col h-screen sm:border-[4px] sm:border-foreground z-10">
        {/* Status bar décorative */}
        <div className="hidden sm:flex h-7 items-center justify-between px-7 text-[11px] font-bold text-foreground shrink-0 pt-2 font-mono">
          <span>9:41</span>
          <span className="absolute left-1/2 -translate-x-1/2 top-1.5 h-5 w-24 rounded-full bg-foreground" />
          <span className="flex gap-1 items-center">
            <span className="h-2 w-3 rounded-sm bg-foreground" />
            <span className="h-2 w-2 rounded-full bg-foreground" />
            <span className="h-2 w-5 rounded-sm border-2 border-foreground" />
          </span>
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto overscroll-contain pb-28 animate-fade-in">
          {children}
        </main>

        {/* Bottom tab bar brutaliste */}
        <nav className="absolute bottom-0 inset-x-0 bg-card border-t-[3px] border-foreground">
          <div className="grid grid-cols-7 px-1 pt-2 pb-2">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className="nav-postit-active flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-muted-foreground transition-colors"
                activeClassName="is-active"
              >
                <n.icon className="h-[20px] w-[20px]" strokeWidth={2.5} />
                <span className="nav-label">{n.label}</span>
              </NavLink>
            ))}
          </div>
          {/* iOS home indicator */}
          <div className="hidden sm:flex justify-center pb-1.5">
            <div className="h-1 w-32 rounded-full bg-foreground" />
          </div>
        </nav>
      </div>
    </div>
  );
};

/** Page header brutaliste — titre Archivo Black + soulignement manuscrit accent. */
export const PageHeader = ({
  emoji,
  title,
  subtitle,
  action,
}: {
  emoji?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) => (
  <div className="px-5 pt-5 pb-3 relative">
    {emoji && <div className="text-3xl mb-1.5 leading-none">{emoji}</div>}
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="relative inline-block">
          <h1 className="font-display text-[28px] leading-[0.95] tracking-tight">
            {title}
          </h1>
          <ScribbleUnderline color="accent" className="absolute -bottom-1 left-0 w-full" />
        </div>
        {subtitle && (
          <p className="text-xs font-medium text-muted-foreground mt-3 font-mono uppercase tracking-wider">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  </div>
);

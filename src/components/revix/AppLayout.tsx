import { ReactNode } from "react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { Home, BookOpen, Brain, Calendar, Flame, User, Map, School, Sparkles, BarChart3, Layers } from "lucide-react";
import { ScribbleUnderline } from "./Scribble";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Link } from "react-router-dom";
import { CoachFab } from "./CoachFab";

// Navigation complète — sidebar desktop
const navAll = [
  { to: "/app", end: true, label: "Accueil", icon: Home },
  { to: "/app/fiches", label: "Cours", icon: BookOpen },
  { to: "/app/quizz", label: "Quizz", icon: Brain },
  { to: "/app/flashcards", label: "Flashcards", icon: Layers },
  { to: "/app/aventure", label: "Quêtes", icon: Map },
  { to: "/app/campus", label: "Campus", icon: School },
  { to: "/app/planning", label: "Planning", icon: Calendar },
  { to: "/app/streak", label: "Streak", icon: Flame },
  { to: "/app/profil", label: "Profil", icon: User },
];

// Bottom nav mobile — 5 items pour des tap targets confortables
const nav = [
  { to: "/app", end: true, label: "Accueil", icon: Home },
  { to: "/app/fiches", label: "Cours", icon: BookOpen },
  { to: "/app/aventure", label: "Quêtes", icon: Map },
  { to: "/app/quizz", label: "Quizz", icon: Brain },
  { to: "/app/profil", label: "Profil", icon: User },
];

/**
 * Layout responsive :
 * - <lg (mobile/tablette) : frame téléphone brutaliste centrée avec bottom tabs (inchangé)
 * - ≥lg (desktop) : sidebar fixe à gauche + topbar + main pleine largeur
 */
export const AppLayout = ({ children, wide = false }: { children: ReactNode; wide?: boolean }) => {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const location = useLocation();
  const rawDisplayName = user?.user_metadata?.display_name;
  const displayName = typeof rawDisplayName === "string" && rawDisplayName.trim()
    ? rawDisplayName
    : user?.email ?? "Utilisateur";
  const initials = displayName
    .split(/\s|@/)
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-0 sm:p-6 bg-background relative overflow-hidden lg:items-stretch lg:justify-start lg:p-0">
      <div className="hidden sm:block absolute inset-0 dots-bg pointer-events-none opacity-50 lg:opacity-30" />
      <div className="hidden sm:block lg:hidden absolute -top-10 -left-10 w-72 h-72 stripes-violet rounded-full opacity-20 pointer-events-none" />
      <div className="hidden sm:block lg:hidden absolute -bottom-10 -right-10 w-80 h-80 bg-accent rounded-full opacity-25 pointer-events-none" />

      {/* Skip to main content — accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:border-2 focus:border-foreground focus:rounded-md focus:shadow-brutal-sm focus:font-bold focus:text-sm">
        Aller au contenu principal
      </a>

      <aside className="hidden lg:flex relative z-10 w-[260px] shrink-0 h-screen border-r-[3px] border-foreground bg-card flex-col" role="complementary" aria-label="Barre latérale">
        <div className="px-5 pt-6 pb-5 border-b-[2.5px] border-foreground">
          <Logo />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1" aria-label="Navigation principale">
          <p className="font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground px-3 mb-2">Navigation</p>
          {navAll.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide text-muted-foreground transition-all border-2 border-transparent hover:border-foreground hover:bg-secondary hover:translate-x-0.5"
              activeClassName="!text-foreground !bg-accent !border-foreground shadow-brutal"
            >
              <n.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2.5} />
              <span>{n.label}</span>
            </NavLink>
          ))}
          {isAdmin && (
            <>
              <p className="font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground px-3 mb-2 mt-5">Admin</p>
              <NavLink
                to="/admin/ai-usage"
                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide text-muted-foreground transition-all border-2 border-transparent hover:border-foreground hover:bg-secondary hover:translate-x-0.5"
                activeClassName="!text-foreground !bg-accent !border-foreground shadow-brutal"
              >
                <BarChart3 className="h-[18px] w-[18px] shrink-0" strokeWidth={2.5} />
                <span>Suivi IA</span>
              </NavLink>
            </>
          )}
        </nav>
        <Link to="/app/profil" className="m-3 p-3 rounded-xl border-[2.5px] border-foreground bg-background hover:bg-secondary transition-colors shadow-brutal flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-foreground shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground font-display text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{displayName}</p>
            <p className="font-mono-tag text-[10px] text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Profil
            </p>
          </div>
        </Link>
      </aside>

      <div className="w-full sm:w-[420px] sm:h-[860px] sm:rounded-[2rem] sm:shadow-[8px_8px_0_0_hsl(var(--foreground))] bg-background relative overflow-hidden flex flex-col h-screen sm:border-[4px] sm:border-foreground z-10 lg:w-auto lg:h-screen lg:flex-1 lg:rounded-none lg:shadow-none lg:border-0">
        <div className="hidden sm:flex lg:hidden h-7 items-center justify-between px-7 text-[11px] font-bold text-foreground shrink-0 pt-2 font-mono">
          <span>9:41</span>
          <span className="absolute left-1/2 -translate-x-1/2 top-1.5 h-5 w-24 rounded-full bg-foreground" />
          <span className="flex gap-1 items-center">
            <span className="h-2 w-3 rounded-sm bg-foreground" />
            <span className="h-2 w-2 rounded-full bg-foreground" />
            <span className="h-2 w-5 rounded-sm border-2 border-foreground" />
          </span>
        </div>

        <header className="hidden lg:flex h-16 shrink-0 border-b-[3px] border-foreground bg-card/95 backdrop-blur items-center justify-end px-6 gap-3">
          <NotificationBell />
          <Link to="/app/profil" className="hover:opacity-80 transition">
            <Avatar className="h-10 w-10 border-2 border-foreground">
              <AvatarFallback className="bg-primary text-primary-foreground font-display text-sm">{initials}</AvatarFallback>
            </Avatar>
          </Link>
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto overscroll-contain pb-24 lg:pb-0" role="main">
          <div
            key={location.pathname}
            className={`route-transition lg:mx-auto lg:px-6 lg:py-6 ${wide ? "lg:max-w-[1400px]" : "lg:max-w-[1200px]"}`}
          >
            {children}
          </div>
        </main>

        <CoachFab />
        <nav className="lg:hidden absolute bottom-0 inset-x-0 bg-card border-t-[3px] border-foreground z-50" aria-label="Navigation mobile">
          <div className="flex items-stretch justify-around px-2 pt-1.5 pb-1">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className="nav-tab tap-press flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 min-h-[52px] min-w-[56px] rounded-xl text-[11px] font-bold uppercase tracking-wide text-muted-foreground flex-1"
                activeClassName="nav-tab-active"
              >
                <n.icon className="nav-tab-icon h-[22px] w-[22px]" strokeWidth={2} />
                <span className="nav-tab-label">{n.label}</span>
              </NavLink>
            ))}
          </div>
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

import { ReactNode, useEffect, useState } from "react";
import { NavLink } from "@/components/NavLink";
import { Home, BookOpen, Brain, Calendar, Flame, User, Map, School, Sparkles } from "lucide-react";
import { ScribbleUnderline } from "./Scribble";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const nav = [
  { to: "/app", end: true, label: "Accueil", icon: Home },
  { to: "/app/fiches", label: "Cours", icon: BookOpen },
  { to: "/app/quizz", label: "Quizz", icon: Brain },
  { to: "/app/aventure", label: "Quêtes", icon: Map },
  { to: "/app/campus", label: "Campus", icon: School },
  { to: "/app/planning", label: "Plan", icon: Calendar },
  { to: "/app/streak", label: "Streak", icon: Flame },
  { to: "/app/profil", label: "Profil", icon: User },
];

/**
 * Layout responsive :
 * - <lg (mobile/tablette) : frame téléphone brutaliste centrée avec bottom tabs (inchangé)
 * - ≥lg (desktop) : sidebar fixe à gauche + topbar + main pleine largeur
 */
export const AppLayout = ({ children, wide = false }: { children: ReactNode; wide?: boolean }) => {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    isDesktop ? <DesktopLayout wide={wide}>{children}</DesktopLayout> : <MobileLayout>{children}</MobileLayout>
  );
};

/* ===================== MOBILE (inchangé visuellement) ===================== */

const MobileLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-0 sm:p-6 bg-background relative overflow-hidden">
      {/* Background décoratif : trame pointillée + bandes diagonales */}
      <div className="hidden sm:block absolute inset-0 dots-bg pointer-events-none opacity-50" />
      <div className="hidden sm:block absolute -top-10 -left-10 w-72 h-72 stripes-violet rounded-full opacity-20 pointer-events-none" />
      <div className="hidden sm:block absolute -bottom-10 -right-10 w-80 h-80 bg-accent rounded-full opacity-25 pointer-events-none" />

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

        {/* Bottom tab bar brutaliste — z-50 so it always sits above page content
            (cosmetic frames, stickers and other absolute overlays can use up to z-30). */}
        <nav className="absolute bottom-0 inset-x-0 bg-card border-t-[3px] border-foreground z-50">
          <div className="grid grid-cols-8 px-1 pt-2 pb-2">
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

/* ===================== DESKTOP (≥ lg) ===================== */

type ProfileMini = {
  display_name: string | null;
  avatar_url: string | null;
  level: number | null;
  xp_total: number | null;
  streak_days: number | null;
};

const DesktopLayout = ({ children, wide }: { children: ReactNode; wide: boolean }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileMini | null>(null);

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, level, xp_total, streak_days")
        .eq("id", user.id)
        .maybeSingle();
      if (active) setProfile((data as ProfileMini) ?? null);
    })();
    return () => { active = false; };
  }, [user]);

  const initials = (profile?.display_name ?? "U").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen w-full bg-background relative overflow-hidden">
      {/* Background dots subtil */}
      <div className="absolute inset-0 dots-bg pointer-events-none opacity-30" />

      {/* SIDEBAR */}
      <aside className="relative z-10 w-[260px] shrink-0 h-screen sticky top-0 border-r-[3px] border-foreground bg-card flex flex-col">
        <div className="px-5 pt-6 pb-5 border-b-[2.5px] border-foreground">
          <Logo />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
          <p className="font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground px-3 mb-2">Navigation</p>
          {nav.map((n) => (
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
        </nav>

        {/* Carte profil bas de sidebar */}
        {profile && (
          <Link
            to="/app/profil"
            className="m-3 p-3 rounded-xl border-[2.5px] border-foreground bg-background hover:bg-secondary transition-colors shadow-brutal flex items-center gap-3"
          >
            <Avatar className="h-10 w-10 border-2 border-foreground shrink-0">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} className="object-cover" />}
              <AvatarFallback className="bg-primary text-primary-foreground font-display text-sm">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{profile.display_name ?? "Sans nom"}</p>
              <p className="font-mono-tag text-[10px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Niv. {profile.level ?? 1} · {profile.xp_total ?? 0} XP
              </p>
            </div>
          </Link>
        )}
      </aside>

      {/* MAIN COLUMN (topbar + content) */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col h-screen">
        {/* TOPBAR */}
        <header className="sticky top-0 z-30 h-16 shrink-0 border-b-[3px] border-foreground bg-card/95 backdrop-blur flex items-center justify-between px-6 gap-4">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {profile && (
              <span className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-foreground bg-accent font-mono-tag text-[11px] font-bold uppercase">
                <Flame className="h-3.5 w-3.5" /> {profile.streak_days ?? 0}j
              </span>
            )}
            <NotificationBell />
            <Link to="/app/profil" className="hover:opacity-80 transition">
              <Avatar className="h-10 w-10 border-2 border-foreground">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} className="object-cover" />}
                <AvatarFallback className="bg-primary text-primary-foreground font-display text-sm">{initials}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto animate-fade-in">
          <div className={`mx-auto px-6 py-6 ${wide ? "max-w-[1400px]" : "max-w-[1200px]"}`}>
            {children}
          </div>
        </main>
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

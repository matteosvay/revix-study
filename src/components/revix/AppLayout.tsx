import { ReactNode } from "react";
import { NavLink } from "@/components/NavLink";
import { Home, BookOpen, Brain, Calendar, Users, User, Bell, Flame } from "lucide-react";
import { Logo } from "./Logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/app", end: true, label: "Accueil", icon: Home },
  { to: "/app/fiches", label: "Mes Cours", icon: BookOpen },
  { to: "/app/quizz", label: "Quizz", icon: Brain },
  { to: "/app/planning", label: "Planning", icon: Calendar },
  { to: "/app/communaute", label: "Communauté", icon: Users },
  { to: "/app/profil", label: "Profil", icon: User },
];

export const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r bg-card">
        <div className="px-6 py-5 border-b">
          <Logo />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              activeClassName="!bg-primary/10 !text-primary"
            >
              <n.icon className="h-5 w-5" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t">
          <div className="rounded-xl gradient-primary p-4 text-primary-foreground">
            <p className="text-sm font-semibold">Passe en Pro ✨</p>
            <p className="text-xs opacity-90 mt-1">Quizz illimités + planning IA</p>
            <Button size="sm" variant="secondary" className="w-full mt-3 rounded-full">Découvrir</Button>
          </div>
        </div>
      </aside>

      {/* Top bar */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur px-4 lg:px-8">
          <div className="lg:hidden"><Logo /></div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1.5 text-sm font-semibold text-orange-600">
              <Flame className="h-4 w-4" /> 7 jours
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
            </Button>
            <Avatar className="h-9 w-9 border-2 border-primary/20">
              <AvatarFallback className="gradient-primary text-primary-foreground font-semibold">LM</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="p-4 lg:p-8 pb-24 lg:pb-8 animate-fade-in">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-card grid grid-cols-6">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className="flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] text-muted-foreground"
            activeClassName="!text-primary"
          >
            <n.icon className="h-5 w-5" />
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
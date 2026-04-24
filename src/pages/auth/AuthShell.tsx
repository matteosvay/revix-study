import { ReactNode } from "react";
import { Logo } from "@/components/revix/Logo";

export const AuthShell = ({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) => (
  <div className="min-h-screen grid lg:grid-cols-2 paper-grain relative overflow-hidden">
    {/* Post-its décoratifs flottants */}
    <div className="absolute top-10 left-10 h-20 w-20 postit p-2 hidden lg:block drift-slow font-hand text-sm">
      Pense à<br/>réviser !
    </div>
    <div className="absolute bottom-16 left-[42%] h-16 w-16 postit postit-pink hidden lg:block drift-slow" style={{ animationDelay: "1.5s" }} />
    <div className="absolute top-20 right-12 h-14 w-14 hidden lg:block" style={{ background: "hsl(var(--tape-mint) / 0.85)", transform: "rotate(8deg)" }} />

    {/* Colonne gauche : citation académique */}
    <div className="hidden lg:flex flex-col justify-between p-10 relative">
      <Logo />
      <div className="relative max-w-md">
        <span className="rubber-stamp stamp-pop inline-block mb-4">Témoignage</span>
        <h2 className="font-hand text-5xl text-primary leading-tight">
          "Revix a transformé mes révisions. Je gagne <span className="marker-yellow">10h / semaine</span>."
        </h2>
        <p className="font-serif text-base mt-4 text-muted-foreground">— Léa, BTS NDRC</p>
      </div>
      <p className="font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground">© 2025 Revix · Made in France 🇫🇷</p>
    </div>

    {/* Colonne droite : formulaire en notebook-card */}
    <div className="flex flex-col justify-center p-6 lg:p-12 relative z-10">
      <div className="lg:hidden mb-6"><Logo /></div>
      <div className="notebook-card dog-ear max-w-md w-full mx-auto p-8 relative tilt-l">
        <h1 className="font-serif text-3xl tracking-tight">{title}</h1>
        <p className="font-hand text-lg text-primary mt-1">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  </div>
);
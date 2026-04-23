import { ReactNode } from "react";
import { Logo } from "@/components/revix/Logo";
import { Card } from "@/components/ui/card";

export const AuthShell = ({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) => (
  <div className="min-h-screen grid lg:grid-cols-2">
    <div className="hidden lg:flex flex-col justify-between p-10 gradient-hero text-primary-foreground relative overflow-hidden">
      <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <Logo className="text-white" />
      <div className="relative">
        <h2 className="text-4xl font-extrabold leading-tight">"Revix a transformé mes révisions. Je gagne 10h / semaine."</h2>
        <p className="mt-4 opacity-90">— Léa, BTS NDRC</p>
      </div>
      <p className="text-sm opacity-70 relative">© 2025 Revix · Made in France 🇫🇷</p>
    </div>
    <div className="flex flex-col justify-center p-6 lg:p-12">
      <div className="lg:hidden mb-8"><Logo /></div>
      <Card className="max-w-md w-full mx-auto p-8 rounded-2xl border-2 shadow-card">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </Card>
    </div>
  </div>
);
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/revix/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Upload, Brain, Trophy, Sparkles, Lock, Plus, ArrowRight, Calendar } from "lucide-react";
import { recentActivity, todayTasks } from "@/data/mock";

const iconMap = { trophy: Trophy, upload: Upload, flame: Flame, sparkles: Sparkles };

export default function Dashboard() {
  const score = 76;
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Salut Léa 👋</h1>
        <p className="text-muted-foreground mt-1">Continue sur ta lancée, tu cartonnes cette semaine.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Streak */}
        <Card className="p-5 rounded-2xl border-2 shadow-card relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-500/10" />
          <div className="flex items-center gap-2 text-orange-600">
            <Flame className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Streak</span>
          </div>
          <p className="mt-3 text-3xl font-extrabold">7 jours 🔥</p>
          <p className="text-xs text-muted-foreground mt-1">Record perso : 12 jours</p>
        </Card>

        {/* Uploads */}
        <Card className="p-5 rounded-2xl border-2 shadow-card relative">
          <div className="flex items-center gap-2 text-primary">
            <Upload className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Uploads</span>
          </div>
          <p className="mt-3 text-3xl font-extrabold">2<span className="text-base text-muted-foreground font-normal">/3</span></p>
          <Progress value={66} className="mt-3 h-2" />
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Lock className="h-3 w-3" /> Plan gratuit</p>
        </Card>

        {/* Score */}
        <Card className="p-5 rounded-2xl border-2 shadow-card">
          <div className="flex items-center gap-2 text-primary">
            <Trophy className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Score moyen</span>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div className="relative h-16 w-16">
              <svg className="h-full w-full -rotate-90">
                <circle cx="32" cy="32" r="28" className="stroke-muted fill-none" strokeWidth="6" />
                <circle cx="32" cy="32" r="28" className="stroke-primary fill-none" strokeWidth="6" strokeLinecap="round" strokeDasharray={2 * Math.PI * 28} strokeDashoffset={2 * Math.PI * 28 * (1 - score / 100)} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{score}%</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sur 12 quizz</p>
              <p className="text-xs text-success font-medium mt-1">+8% ce mois</p>
            </div>
          </div>
        </Card>

        {/* Quiz reco */}
        <Card className="p-5 rounded-2xl border-2 shadow-card gradient-primary text-primary-foreground">
          <div className="flex items-center gap-2 opacity-90">
            <Brain className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Recommandé</span>
          </div>
          <p className="mt-3 font-bold">Quizz Marketing Mix</p>
          <p className="text-xs opacity-80 mt-1">20 questions · 10 min</p>
          <Button asChild size="sm" variant="secondary" className="mt-4 rounded-full w-full">
            <Link to="/app/quizz">Démarrer <ArrowRight className="ml-1 h-3 w-3" /></Link>
          </Button>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today */}
        <Card className="lg:col-span-2 p-6 rounded-2xl border-2 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Planning du jour</h2>
              <p className="text-xs text-muted-foreground mt-0.5">3 tâches prévues</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link to="/app/planning">Voir tout</Link>
            </Button>
          </div>
          <div className="space-y-2">
            {todayTasks.map((t) => (
              <div key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border ${t.done ? "bg-muted/50 opacity-60" : "bg-card"}`}>
                <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center ${t.done ? "bg-success border-success" : "border-muted-foreground/40"}`}>
                  {t.done && <span className="text-success-foreground text-xs">✓</span>}
                </div>
                <span className={`text-sm flex-1 ${t.done ? "line-through" : ""}`}>{t.label}</span>
              </div>
            ))}
          </div>
          <Button asChild className="mt-4 w-full rounded-full gradient-primary border-0">
            <Link to="/app/upload"><Plus className="h-4 w-4 mr-1" /> Nouveau cours</Link>
          </Button>
        </Card>

        {/* Activity */}
        <Card className="p-6 rounded-2xl border-2 shadow-card">
          <h2 className="font-bold text-lg mb-4">Activité récente</h2>
          <div className="space-y-4">
            {recentActivity.map((a) => {
              const I = iconMap[a.icon as keyof typeof iconMap];
              return (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <I className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{a.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Flame, Plus, BookOpen, Brain, Calendar, Mic, Sparkles, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Profile = { display_name: string | null; streak_days: number; streak_record: number };

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ courses: 0, fiches: 0, quizzes: 0, avg: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { count: cc }, { count: fc }, { count: qc }, { data: attempts }] = await Promise.all([
        supabase.from("profiles").select("display_name, streak_days, streak_record").eq("id", user.id).single(),
        supabase.from("courses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("quizzes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("quiz_attempts").select("score, total").eq("user_id", user.id),
      ]);
      setProfile(p as any);
      const avg = attempts && attempts.length
        ? Math.round(attempts.reduce((s, a) => s + (a.score / a.total) * 100, 0) / attempts.length)
        : 0;
      setStats({ courses: cc ?? 0, fiches: fc ?? 0, quizzes: qc ?? 0, avg });
    })();
  }, [user]);

  const name = profile?.display_name?.split(" ")[0] ?? "toi";

  const tiles = [
    { to: "/app/upload", icon: Plus, label: "Nouveau cours", desc: "Upload un PDF ou photo", accent: true },
    { to: "/app/fiches", icon: BookOpen, label: "Mes fiches", desc: `${stats.fiches} fiches` },
    { to: "/app/quizz", icon: Brain, label: "Quizz", desc: `Score moyen ${stats.avg}%` },
    { to: "/app/planning", icon: Calendar, label: "Planning", desc: "Organise tes révisions" },
    { to: "/app/oral", icon: Mic, label: "Mode oral", desc: "Entraîne-toi à l'oral" },
  ];

  return (
    <AppLayout>
      <PageHeader emoji="✨" title={`Salut ${name}`} subtitle="Reprends là où tu t'es arrêté." />

      <div className="px-5">
        <div className="rounded-2xl border bg-gradient-to-br from-orange-50 to-amber-50 p-4 flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shrink-0 shadow-sm">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{profile?.streak_days ?? 0} jours d'affilée</p>
            <p className="text-xs text-muted-foreground">Record perso : {profile?.streak_record ?? 0}j</p>
          </div>
        </div>

        <div className="mt-5 mb-2 px-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vue d'ensemble</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: stats.courses, l: "Cours" },
            { v: stats.fiches, l: "Fiches" },
            { v: stats.quizzes, l: "Quizz" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border bg-card p-3 text-center">
              <p className="text-2xl font-serif">{s.v}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 mb-2 px-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Raccourcis</p>
        </div>
        <div className="space-y-1">
          {tiles.map((t) => (
            <Link key={t.to} to={t.to} className="flex items-center gap-3 px-2 py-2.5 rounded-lg notion-row">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${t.accent ? "gradient-primary text-primary-foreground" : "bg-muted"}`}>
                <t.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-xs text-muted-foreground truncate">{t.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>

        {stats.courses === 0 && (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-primary/30 p-6 text-center">
            <Sparkles className="h-8 w-8 mx-auto text-primary" />
            <p className="font-serif text-xl mt-2">Crée ta première fiche</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Upload un cours et l'IA fait le reste.</p>
            <Button asChild className="rounded-full gradient-primary border-0">
              <Link to="/app/upload"><Plus className="h-4 w-4 mr-1" /> Commencer</Link>
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
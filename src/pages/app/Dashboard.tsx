import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Flame, Plus, BookOpen, Brain, Calendar, Sparkles, ChevronRight, TrendingUp, Users, Target, Shirt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/hooks/useGamification";
import { Tape, Pin } from "@/components/revix/AcademicDecor";
import { NotificationBell } from "@/components/revix/NotificationBell";
import { LootBoxCard } from "@/components/revix/LootBoxCard";
import { QuizBonusLootBoxCard } from "@/components/revix/QuizBonusLootBoxCard";
import { FlashQuizCard } from "@/components/revix/FlashQuizCard";
import { ReviewCard } from "@/components/revix/ReviewCard";
import { useFomoChecks } from "@/hooks/useFomoChecks";
import { UsageMeter } from "@/components/revix/UsageMeter";

type Profile = { display_name: string | null; streak_days: number; streak_record: number; streak_tokens: number };

type GroupRow = {
  id: string;
  name: string;
  emoji: string | null;
  group_streak_days: number;
  member_count: number;
  contributed_today: number;
  all_contributed_today: boolean;
};

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ courses: 0, quizzes: 0, avg: 0 });
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const { profile: gam, levelTier, xp } = useGamification();
  useFomoChecks();

  useEffect(() => {
    if (authLoading || !user) return;
    let active = true;
    (async () => {
      try {
        const [{ data: p }, { count: cc }, { count: qc }, { data: attempts }, { data: gs }] = await Promise.all([
          supabase.from("profiles").select("display_name, streak_days, streak_record, streak_tokens").eq("id", user.id).maybeSingle(),
          supabase.from("courses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("quizzes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("quiz_attempts").select("score, total").eq("user_id", user.id),
          supabase.rpc("get_my_groups"),
        ]);
        if (!active) return;
        setProfile((p as any) ?? null);
        const avg = attempts && attempts.length
          ? Math.round(attempts.reduce((s, a) => s + (a.score / a.total) * 100, 0) / attempts.length)
          : 0;
        setStats({ courses: cc ?? 0, quizzes: qc ?? 0, avg });
        setGroups(((gs as any[]) ?? []).slice(0, 3));
      } catch {
        if (!active) return;
        setProfile(null);
        setStats({ courses: 0, quizzes: 0, avg: 0 });
        setGroups([]);
      }
    })();
    return () => { active = false; };
  }, [authLoading, user]);

  const name = profile?.display_name?.split(" ")[0] ?? "toi";

  const tiles = [
    { to: "/app/upload", icon: Plus, label: "Nouveau cours", desc: "Upload un PDF ou photo", accent: true },
    { to: "/app/fiches", icon: BookOpen, label: "Mes cours", desc: `${stats.courses} cours` },
    { to: "/app/quizz", icon: Brain, label: "Quizz", desc: `Score moyen ${stats.avg}%` },
    { to: "/app/revision", icon: Target, label: "Révisions ciblées", desc: "Heatmap & boss du jour" },
    { to: "/app/cosmetics", icon: Shirt, label: "Cosmétiques", desc: "Cadres, stickers, titres" },
    { to: "/app/aventure", icon: Sparkles, label: "Aventure", desc: levelTier ? `${levelTier.emoji} ${levelTier.name}` : "Quêtes & XP" },
    { to: "/app/planning", icon: Calendar, label: "Planning", desc: "Organise tes révisions" },
    { to: "/app/streak", icon: Flame, label: "Ma streak", desc: `${profile?.streak_days ?? 0}j d'affilée` },
  ];

  return (
    <AppLayout>
      <PageHeader
        emoji="✨"
        title={`Salut ${name}`}
        subtitle="Reprends là où tu t'es arrêté."
        action={<div className="lg:hidden"><NotificationBell /></div>}
      />

      <div className="px-5">
        {/* Boîte mystère + flash 5 min */}
        <LootBoxCard />
        <QuizBonusLootBoxCard />
        <ReviewCard />
        <FlashQuizCard />

        {/* XP / niveau bandeau */}
        {gam && levelTier && xp && (
          <Link to="/app/aventure" className="block card-paper p-4 relative mb-3 tilt-l hover:shadow-glow transition-shadow">
            <Tape variant="yellow" position="top-left" />
            <Pin color="purple" className="absolute top-2 right-3" />
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center text-2xl shadow-soft">
                {levelTier.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <p className="font-serif text-lg leading-none">Niveau {gam.level}</p>
                  <span className="text-xs text-muted-foreground">· {levelTier.name}</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full gradient-primary transition-all duration-700" style={{ width: `${xp.pct}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{xp.into} / {xp.span} XP vers niveau {gam.level + 1}</p>
              </div>
            </div>
          </Link>
        )}

        <Link to="/app/streak" className="block relative overflow-hidden rounded-md border-[2.5px] border-foreground gradient-hero p-5 text-primary-foreground shadow-brutal group hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-brutal-sm transition-all">
          <div className="relative flex items-center gap-3">
            <div className="h-14 w-14 rounded-md bg-card text-foreground border-[2.5px] border-foreground flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_hsl(var(--foreground))]">
              <Flame className="h-7 w-7 wiggle" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-1.5">
                <p className="font-serif text-3xl leading-none">{profile?.streak_days ?? 0}</p>
                <p className="text-sm opacity-90">jours d'affilée</p>
              </div>
              <p className="text-xs opacity-80 mt-1 flex items-center gap-1.5">
                <span>Record : {profile?.streak_record ?? 0}j</span>
                <span className="opacity-60">·</span>
                <span className="inline-flex items-center gap-0.5">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="inline-block w-3 h-2 rounded-[1px]"
                      style={{
                        background: i < (profile?.streak_tokens ?? 0) ? "hsl(var(--tape-pink) / 0.95)" : "transparent",
                        border: i < (profile?.streak_tokens ?? 0) ? "none" : "1px dashed rgba(255,255,255,0.45)",
                        transform: `rotate(${i % 2 === 0 ? -6 : 5}deg)`,
                      }}
                    />
                  ))}
                  <span className="ml-1 font-mono-tag uppercase tracking-wider text-[9px] opacity-90">scotch</span>
                </span>
              </p>
            </div>
            <ChevronRight className="h-5 w-5 opacity-80 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        <div className="mt-5 mb-2 px-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vue d'ensemble</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: stats.courses, l: "Cours" },
            { v: stats.quizzes, l: "Quizz" },
            { v: `${stats.avg}%`, l: "Moyenne" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl glass p-3 text-center hover:shadow-soft transition-shadow">
              <p className="text-2xl font-serif">{s.v}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Raccourci Study Groups */}
        <div className="mt-6 mb-2 px-1 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Groupes d'étude</p>
          <Link to="/app/groupes" className="text-[11px] font-mono uppercase tracking-wider text-primary hover:underline">
            Voir tout →
          </Link>
        </div>
        {groups.length === 0 ? (
          <Link
            to="/app/groupes"
            className="block rounded-md border-[2.5px] border-dashed border-foreground/40 p-4 text-center hover:border-foreground hover:bg-secondary/40 transition-colors"
          >
            <Users className="h-5 w-5 mx-auto text-muted-foreground" />
            <p className="text-sm font-bold mt-1.5">Rejoins un groupe</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Streaks collectives + motivation 🔥</p>
          </Link>
        ) : (
          <div className="space-y-1.5">
            {groups.map((g) => {
              const ratio = g.member_count > 0 ? g.contributed_today / g.member_count : 0;
              return (
                <Link
                  key={g.id}
                  to="/app/groupes"
                  className="flex items-center gap-3 rounded-md border-[2.5px] border-foreground bg-card p-2.5 shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                >
                  <div className="h-10 w-10 rounded-md border-[2px] border-foreground bg-secondary flex items-center justify-center text-xl shrink-0">
                    {g.emoji ?? "👥"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate leading-tight">{g.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-mono uppercase tracking-wider">
                        <Flame className="h-3 w-3" />
                        {g.group_streak_days}j
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {g.contributed_today}/{g.member_count} aujourd'hui
                      </span>
                      {g.all_contributed_today && (
                        <span className="text-[10px] font-bold text-primary">✓ complet</span>
                      )}
                    </div>
                    <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full gradient-primary transition-all"
                        style={{ width: `${Math.round(ratio * 100)}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-6 mb-2 px-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Raccourcis</p>
        </div>
        <div className="space-y-1">
          {tiles.map((t) => (
            <Link key={t.to} to={t.to} className="flex items-center gap-3 px-2 py-2.5 rounded-xl notion-row group">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${t.accent ? "gradient-primary text-primary-foreground shadow-glow" : "bg-muted"}`}>
                <t.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-xs text-muted-foreground truncate">{t.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>

        {stats.courses === 0 && (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-primary/30 p-6 text-center glass">
            <Sparkles className="h-8 w-8 mx-auto text-primary animate-pulse" />
            <p className="font-serif text-xl mt-2">Crée ta première fiche</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Upload un cours et l'IA fait le reste.</p>
            <Button asChild className="rounded-full gradient-primary border-0">
              <Link to="/app/upload"><Plus className="h-4 w-4 mr-1" /> Commencer</Link>
            </Button>
          </div>
        )}

        <div className="mt-6 mb-2 px-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tes quotas IA</p>
        </div>
        <UsageMeter />
      </div>
    </AppLayout>
  );
}
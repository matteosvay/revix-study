import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Flame, Plus, Brain, Calendar, Sparkles, ArrowRight, Target, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/hooks/useGamification";
import { NotificationBell } from "@/components/revix/NotificationBell";
import { LootBoxCard } from "@/components/revix/LootBoxCard";
import { FlashQuizCard } from "@/components/revix/FlashQuizCard";
import { useFomoChecks } from "@/hooks/useFomoChecks";
import { UsageMeter } from "@/components/revix/UsageMeter";

type Profile = { display_name: string | null; streak_days: number; streak_record: number; streak_tokens: number };

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ courses: 0 });
  const [dataLoading, setDataLoading] = useState(true);
  const { profile: gam, levelTier, xp } = useGamification();
  useFomoChecks();

  useEffect(() => {
    if (authLoading || !user) return;
    let active = true;
    (async () => {
      try {
        const [{ data: p }, { count: cc }] = await Promise.all([
          supabase.from("profiles").select("display_name, streak_days, streak_record, streak_tokens").eq("id", user.id).maybeSingle(),
          supabase.from("courses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        ]);
        if (!active) return;
        setProfile((p as any) ?? null);
        setStats({ courses: cc ?? 0 });
      } catch {
        if (!active) return;
        setProfile(null);
        setStats({ courses: 0 });
      } finally {
        if (active) setDataLoading(false);
      }
    })();
    return () => { active = false; };
  }, [authLoading, user]);

  const name = profile?.display_name?.split(" ")[0] ?? "toi";

  const quickTiles = [
    { to: "/app/upload", icon: Plus, label: "Nouveau cours", desc: "PDF ou photo", accent: true },
    { to: "/app/revision", icon: Target, label: "Révisions", desc: "Heatmap & boss" },
    { to: "/app/planning", icon: Calendar, label: "Planning", desc: "Semaine en vue" },
    { to: "/app/stats", icon: TrendingUp, label: "Mes stats", desc: "Score & progression" },
  ];

  return (
    <AppLayout>
      <PageHeader
        emoji="✨"
        title={`Salut ${name}`}
        subtitle="Reprends là où tu t'es arrêté."
        action={<div className="lg:hidden"><NotificationBell /></div>}
      />

      <div className="px-5 stagger-in space-y-3">
        {/* Focus du jour */}
        {!dataLoading && (
          <Link
            to={stats.courses > 0 ? "/app/quizz" : "/app/upload"}
            className="block rounded-2xl border-[2.5px] border-foreground bg-card shadow-brutal tap-press overflow-hidden"
          >
            <div className="gradient-primary px-4 py-2.5 flex items-center justify-between">
              <p className="text-[10px] font-mono uppercase tracking-widest text-primary-foreground/80">Voilà ce que tu fais aujourd'hui</p>
              <ArrowRight className="h-3.5 w-3.5 text-primary-foreground/80" />
            </div>
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl gradient-primary flex items-center justify-center shrink-0 border-2 border-foreground shadow-[2px_2px_0_0_hsl(var(--foreground))]">
                {stats.courses > 0 ? <Brain className="h-5 w-5 text-primary-foreground" /> : <Plus className="h-5 w-5 text-primary-foreground" />}
              </div>
              <div>
                <p className="font-bold text-base leading-tight">
                  {stats.courses > 0 ? "Lance un quizz" : "Ajoute ton premier cours"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {stats.courses > 0 ? "Teste-toi sur tes cours" : "Upload un PDF ou une photo"}
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* Cartes promo (max 2) */}
        <LootBoxCard />
        <FlashQuizCard />

        {/* Skeleton pendant chargement */}
        {dataLoading && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-[80px] rounded-xl" />
              <Skeleton className="h-[80px] rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-[72px] rounded-xl" />
              <Skeleton className="h-[72px] rounded-xl" />
            </div>
          </div>
        )}

        {/* XP + Streak — bandeau 2 colonnes */}
        {!dataLoading && (
          <div className="grid grid-cols-2 gap-2">
            {gam && levelTier && xp ? (
              <Link to="/app/aventure" className="rounded-xl border-[2.5px] border-foreground bg-card p-3 shadow-brutal-sm tap-press flex items-center gap-2.5">
                <div className="text-2xl leading-none shrink-0">{levelTier.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm leading-tight">Niv. {gam.level} <span className="font-normal text-muted-foreground text-xs">· {levelTier.name}</span></p>
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full gradient-primary transition-all duration-700" style={{ width: `${xp.pct}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{xp.into} / {xp.span} XP</p>
                </div>
              </Link>
            ) : (
              <div className="rounded-xl border-[2.5px] border-foreground/20 bg-card p-3" />
            )}
            <Link to="/app/streak" className="rounded-xl border-[2.5px] border-foreground gradient-hero p-3 shadow-brutal-sm tap-press flex items-center gap-2.5 text-primary-foreground">
              <Flame className="h-7 w-7 wiggle shrink-0" />
              <div>
                <p className="font-serif text-3xl leading-none">{profile?.streak_days ?? 0}</p>
                <p className="text-xs opacity-80 mt-0.5">jours</p>
                <p className="text-[10px] opacity-60">record {profile?.streak_record ?? 0}j</p>
              </div>
            </Link>
          </div>
        )}

        {/* Accès rapide — 4 tiles */}
        {!dataLoading && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 pt-1">Accès rapide</p>
            <div className="grid grid-cols-2 gap-2">
              {quickTiles.map((t) => (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`tap-press flex items-center gap-2.5 rounded-xl border-[2.5px] border-foreground p-3 min-h-[60px] shadow-brutal-sm ${t.accent ? "gradient-primary text-primary-foreground" : "bg-card"}`}
                >
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${t.accent ? "bg-white/15 border border-white/20" : "bg-muted"}`}>
                    <t.icon className={`h-4 w-4 ${t.accent ? "text-primary-foreground" : ""}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold leading-tight truncate ${t.accent ? "text-primary-foreground" : ""}`}>{t.label}</p>
                    <p className={`text-[11px] truncate mt-0.5 ${t.accent ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{t.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* État vide — premier cours */}
        {!dataLoading && stats.courses === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-primary/30 p-6 text-center glass">
            <Sparkles className="h-8 w-8 mx-auto text-primary animate-pulse" />
            <p className="font-serif text-xl mt-2">Crée ta première fiche</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Upload un cours et l'IA fait le reste.</p>
            <Button asChild className="rounded-full gradient-primary border-0">
              <Link to="/app/upload"><Plus className="h-4 w-4 mr-1" /> Commencer</Link>
            </Button>
          </div>
        )}

        {/* Quotas IA */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 pb-2">Tes quotas IA</p>
          <UsageMeter />
        </div>
      </div>
    </AppLayout>
  );
}

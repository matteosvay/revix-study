import { useEffect, useState } from "react";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Flame, Trophy, Sparkles, Zap, Calendar as CalendarIcon, Lock, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type Profile = {
  streak_days: number;
  streak_record: number;
  streak_tokens: number;
  quiz_completed_count: number;
  last_active_date: string | null;
  plan: string;
};

function ymd(d: Date) { return d.toISOString().slice(0, 10); }

export default function Streak() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeDates, setActiveDates] = useState<Set<string>>(new Set());
  const [restoring, setRestoring] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data: p } = await supabase
      .from("profiles")
      .select("streak_days, streak_record, streak_tokens, quiz_completed_count, last_active_date, plan")
      .eq("id", user.id).single();
    setProfile(p as any);

    // 30 derniers jours d'activité (quiz_attempts comme proxy d'activité)
    const since = new Date(); since.setDate(since.getDate() - 30);
    const { data: attempts } = await supabase
      .from("quiz_attempts").select("created_at")
      .eq("user_id", user.id).gte("created_at", since.toISOString());
    const set = new Set<string>();
    attempts?.forEach((a: any) => set.add(a.created_at.slice(0, 10)));
    if (p?.last_active_date) set.add(p.last_active_date);
    setActiveDates(set);
  };

  useEffect(() => { load(); }, [user]);

  const restore = async () => {
    if (!user) return;
    setRestoring(true);
    const { data, error } = await supabase.rpc("restore_streak", { p_user_id: user.id });
    setRestoring(false);
    if (error) { toast.error(error.message); return; }
    const res = data as any;
    if (!res?.success) {
      const map: Record<string, string> = {
        pro_required: "Réservé aux membres Pro ✨",
        no_tokens: "Tu n'as pas de jeton de restauration",
        no_broken_streak: "Aucune streak à restaurer",
      };
      toast.error(map[res?.error] ?? "Impossible de restaurer");
      return;
    }
    toast.success("Streak restaurée ! 🔥");
    load();
  };

  if (!profile) return <AppLayout><div className="p-5 text-sm text-muted-foreground">Chargement...</div></AppLayout>;

  // Construit la grille des 30 derniers jours
  const days: { date: Date; key: string; active: boolean; today: boolean }[] = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = ymd(d);
    days.push({ date: d, key, active: activeDates.has(key), today: i === 0 });
  }

  const todayActive = activeDates.has(ymd(today));
  const yest = new Date(today); yest.setDate(today.getDate() - 1);
  const lostYesterday = profile.last_active_date && profile.last_active_date < ymd(yest);

  const nextTokenIn = 10 - (profile.quiz_completed_count % 10);
  const tokenProgress = ((profile.quiz_completed_count % 10) / 10) * 100;

  return (
    <AppLayout>
      <PageHeader emoji="🔥" title="Streak" subtitle="Chaque jour compte." />

      <div className="px-5 space-y-5">
        {/* Hero streak */}
        <div className="relative overflow-hidden rounded-3xl gradient-hero p-6 text-primary-foreground shadow-glow">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Flame className="h-8 w-8 animate-pulse" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider opacity-80">Série actuelle</p>
                <p className="font-serif text-5xl leading-none">{profile.streak_days}</p>
                <p className="text-xs opacity-80 mt-0.5">{profile.streak_days <= 1 ? "jour" : "jours"} d'affilée</p>
              </div>
            </div>
            {!todayActive && (
              <div className="mt-4 flex items-center gap-2 text-xs bg-white/15 backdrop-blur-sm rounded-full px-3 py-2">
                <Zap className="h-3.5 w-3.5" />
                <span>Fais un quiz aujourd'hui pour conserver ta série</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl border bg-card/80 backdrop-blur p-4 text-center">
            <Trophy className="h-4 w-4 mx-auto text-primary" />
            <p className="font-serif text-2xl mt-1">{profile.streak_record}j</p>
            <p className="text-[11px] text-muted-foreground">Record</p>
          </div>
          <div className="rounded-2xl border bg-card/80 backdrop-blur p-4 text-center">
            <CalendarIcon className="h-4 w-4 mx-auto text-primary" />
            <p className="font-serif text-2xl mt-1">{activeDates.size}</p>
            <p className="text-[11px] text-muted-foreground">Jours actifs (30j)</p>
          </div>
        </div>

        {/* Calendrier 30 jours */}
        <div className="rounded-2xl border bg-card/80 backdrop-blur p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">30 derniers jours</p>
          </div>
          <div className="grid grid-cols-10 gap-1.5">
            {days.map(d => (
              <div
                key={d.key}
                title={d.date.toLocaleDateString("fr-FR")}
                className={`aspect-square rounded-md transition-all ${
                  d.active
                    ? "gradient-primary shadow-sm"
                    : "bg-muted/60"
                } ${d.today ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground">
            <span>Il y a 30j</span>
            <span>Aujourd'hui</span>
          </div>
        </div>

        {/* Jetons de restauration */}
        <div className="rounded-2xl border bg-card/80 backdrop-blur p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-serif text-lg">Jetons de restauration</p>
              <p className="text-xs text-muted-foreground">Sauve une streak perdue</p>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`h-9 w-9 rounded-xl flex items-center justify-center text-base ${
                    i < profile.streak_tokens
                      ? "gradient-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground/40"
                  }`}
                >
                  ❄️
                </div>
              ))}
            </div>
          </div>

          {/* Progression vers le prochain jeton */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
              <span>Prochain jeton</span>
              <span>{profile.streak_tokens >= 3 ? "Max atteint" : `${nextTokenIn} quiz restants`}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full gradient-primary transition-all"
                style={{ width: `${profile.streak_tokens >= 3 ? 100 : tokenProgress}%` }}
              />
            </div>
          </div>

          {/* CTA restauration */}
          {profile.plan === "pro" ? (
            <Button
              onClick={restore}
              disabled={restoring || profile.streak_tokens < 1 || !lostYesterday}
              className="w-full mt-4 rounded-full gradient-primary border-0"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {profile.streak_tokens < 1 ? "Aucun jeton" : !lostYesterday ? "Streak intacte" : "Restaurer ma streak"}
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-full mt-4 rounded-full border-primary/30">
              <Link to="/app/profil">
                <Lock className="h-4 w-4 mr-2" /> Pro requis pour restaurer
              </Link>
            </Button>
          )}
        </div>

        {/* Comment ça marche */}
        <div className="rounded-2xl border-2 border-dashed border-primary/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Comment ça marche
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            <li>• 1 activité par jour pour entretenir la flamme 🔥</li>
            <li>• Tous les <strong className="text-foreground">10 quiz</strong>, tu gagnes 1 jeton ❄️ (max 3)</li>
            <li>• Avec Pro, dépense un jeton pour restaurer une streak perdue la veille</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
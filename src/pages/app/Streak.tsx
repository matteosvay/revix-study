import { useEffect, useState } from "react";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Flame, Trophy, Sparkles, Zap, Calendar as CalendarIcon, Lock, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Tape, Pin, ScribbleUnderline } from "@/components/revix/AcademicDecor";
import { addDays, localDateKey, startOfLocalWeek } from "@/lib/date";

type Profile = {
  streak_days: number;
  streak_record: number;
  streak_tokens: number;
  quiz_completed_count: number;
  last_active_date: string | null;
  plan: string;
};

const WEEK_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];

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
      .eq("id", user.id).maybeSingle();
    setProfile(p as any);

    const since = new Date(); since.setDate(since.getDate() - 60);
    const { data: attempts } = await supabase
      .from("quiz_attempts").select("created_at")
       .eq("user_id", user.id).gte("created_at", since.toISOString());
    const set = new Set<string>();
    attempts?.forEach((a: any) => set.add(localDateKey(new Date(a.created_at))));
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
        no_tokens: "Tu n'as pas de pass de restauration",
        no_broken_streak: "Aucune streak à restaurer",
      };
      toast.error(map[res?.error] ?? "Impossible de restaurer");
      return;
    }
    toast.success("Streak restaurée ! 🔥");
    load();
  };

  if (!profile) return <AppLayout><div className="p-5 text-sm text-muted-foreground">Chargement...</div></AppLayout>;

  // Grille hebdo : 8 semaines de lundi à dimanche, today dans la dernière semaine
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weeksToShow = 8;
  const currentMonday = startOfLocalWeek(today);
  // Premier lundi affiché
  const firstMonday = addDays(currentMonday, -((weeksToShow - 1) * 7));

  type Cell = { date: Date; key: string; active: boolean; today: boolean; future: boolean };
  const weekColumns: Cell[][] = [];
  for (let w = 0; w < weeksToShow; w++) {
    const col: Cell[] = [];
    for (let d = 0; d < 7; d++) {
       const dt = addDays(firstMonday, w * 7 + d);
       const key = localDateKey(dt);
      col.push({
        date: dt,
        key,
        active: activeDates.has(key),
         today: key === localDateKey(today),
        future: dt > today,
      });
    }
    weekColumns.push(col);
  }
  // Mois pour l'en-tête : afficher le mois quand il change
  const monthHeaders = weekColumns.map((col, i) => {
    const m = col[0].date.getMonth();
    if (i === 0) return MONTHS_FR[m];
    const prev = weekColumns[i - 1][0].date.getMonth();
    return m !== prev ? MONTHS_FR[m] : "";
  });

  const todayActive = activeDates.has(localDateKey(today));
  const yest = addDays(today, -1);
  const yesterdayKey = localDateKey(yest);
  const lostYesterday = !!profile.last_active_date && profile.last_active_date < yesterdayKey;

  const nextTokenIn = 10 - (profile.quiz_completed_count % 10);
  const tokenProgress = ((profile.quiz_completed_count % 10) / 10) * 100;

  return (
    <AppLayout>
      <PageHeader emoji="🔥" title="Streak" subtitle="Chaque jour compte." />

      <div className="px-5 space-y-5 pb-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl gradient-hero p-6 text-primary-foreground shadow-glow">
          <Pin color="red" className="absolute top-3 right-3 z-10" />
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Flame className="h-8 w-8 wiggle" />
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
        <div className="grid grid-cols-2 gap-3">
          <div className="card-paper p-4 text-center relative tilt-l">
            <Tape variant="pink" position="top" />
            <Trophy className="h-4 w-4 mx-auto text-primary mt-1" />
            <p className="font-serif text-2xl mt-1">{profile.streak_record}j</p>
            <p className="text-[11px] text-muted-foreground">Record</p>
          </div>
          <div className="card-paper p-4 text-center relative tilt-r">
            <Tape variant="mint" position="top" />
            <CalendarIcon className="h-4 w-4 mx-auto text-primary mt-1" />
            <p className="font-serif text-2xl mt-1">{activeDates.size}</p>
            <p className="text-[11px] text-muted-foreground">Jours actifs</p>
          </div>
        </div>

        {/* Calendrier hebdomadaire */}
        <div className="card-paper p-4 relative paper-grain">
          <Tape variant="yellow" position="top-left" />
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activité — 8 dernières semaines</p>
            <ScribbleUnderline className="w-28" />
          </div>
          <div className="flex gap-1.5">
            <div className="flex flex-col gap-1 pt-[18px] pr-1 shrink-0">
              {WEEK_LABELS.map((l, i) => (
                <span key={i} className="font-mono-tag text-[9px] text-muted-foreground/70 h-[18px] leading-[18px] text-right w-3">{l}</span>
              ))}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex gap-1 mb-1">
                {monthHeaders.map((m, i) => (
                  <div key={i} className="flex-1 font-mono-tag text-[9px] text-muted-foreground/70 leading-[14px] text-left">{m}</div>
                ))}
              </div>
              <div className="flex gap-1">
                {weekColumns.map((col, ci) => (
                  <div key={ci} className="flex-1 flex flex-col gap-1">
                    {col.map((d) => (
                      <div
                        key={d.key}
                        title={`${d.date.toLocaleDateString("fr-FR")}${d.active ? " · actif" : d.future ? "" : " · inactif"}`}
                        className={`aspect-square w-full rounded-[3px] transition-all hover:scale-110 flex items-center justify-center font-mono-tag text-[9px] leading-none ${
                          d.future
                            ? "bg-muted/25 border border-dashed border-muted-foreground/15 text-muted-foreground/40"
                            : d.active
                            ? "gradient-primary shadow-sm text-primary-foreground"
                            : "bg-muted/55"
                            + " text-muted-foreground/60"
                        } ${d.today ? "ring-2 ring-primary ring-offset-1 ring-offset-card" : ""}`}
                      >
                        {d.date.getDate()}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-muted-foreground">
            <span className="font-mono-tag uppercase">Moins</span>
            <span className="h-2.5 w-2.5 rounded-sm bg-muted/60" />
            <span className="h-2.5 w-2.5 rounded-sm bg-primary/40" />
            <span className="h-2.5 w-2.5 rounded-sm bg-primary/70" />
            <span className="h-2.5 w-2.5 rounded-sm gradient-primary" />
            <span className="font-mono-tag uppercase">Plus</span>
          </div>
        </div>

        {/* Pass de restauration */}
        <div className="card-paper p-4 relative">
          <Tape variant="mint" position="top-right" />
          <div className="flex items-start justify-between mb-3 gap-3">
            <div>
              <p className="font-serif text-lg">Pass de restauration</p>
              <p className="text-xs text-muted-foreground">Colle un scotch sur ta streak perdue</p>
            </div>
            <div className="flex gap-2 shrink-0">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`relative h-10 w-12 rounded-sm flex items-center justify-center text-[10px] font-bold uppercase tracking-wider shadow-soft ${
                    i < profile.streak_tokens ? "text-foreground/70" : "text-muted-foreground/40 border border-dashed border-muted-foreground/30 bg-muted/30"
                  }`}
                  style={
                    i < profile.streak_tokens
                      ? { background: "hsl(var(--tape-pink) / 0.85)", transform: `rotate(${i % 2 === 0 ? -4 : 5}deg)` }
                      : undefined
                  }
                >
                  pass
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
              <span>Prochain pass</span>
              <span>{profile.streak_tokens >= 3 ? "Max atteint" : `${nextTokenIn} quiz restants`}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full gradient-primary transition-all duration-700" style={{ width: `${profile.streak_tokens >= 3 ? 100 : tokenProgress}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">{profile.quiz_completed_count} quiz complétés au total</p>
          </div>

          {profile.plan === "pro" ? (
            <Button
              onClick={restore}
              disabled={restoring || profile.streak_tokens < 1 || !lostYesterday}
              className="w-full mt-4 rounded-full gradient-primary border-0"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {profile.streak_tokens < 1 ? "Aucun pass" : !lostYesterday ? "Streak intacte" : "Restaurer ma streak"}
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
        <div className="rounded-2xl border-2 border-dashed border-primary/20 p-4 paper-grain">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Comment ça marche
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            <li>• 1 activité par jour pour entretenir la flamme 🔥</li>
            <li>• Tous les <strong className="text-foreground">10 quiz</strong>, tu gagnes 1 pass de scotch (max 3)</li>
            <li>• Avec Pro, colle un pass pour restaurer une streak perdue la veille</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
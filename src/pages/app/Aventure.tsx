import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { useGamification } from "@/hooks/useGamification";
import { Tape, Postit, Pin, ScribbleUnderline, Stamp } from "@/components/revix/AcademicDecor";
import { Flame, Sparkles, Trophy, Target, Zap, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { levelInfo, xpForLevel } from "@/lib/gamification";

export default function Aventure() {
  const { profile, dailyQuests, weeklyQuest, xp, levelTier, loading } = useGamification();

  if (loading || !profile || !xp || !levelTier) {
    return <AppLayout><div className="p-5 text-sm text-muted-foreground">Chargement de ton aventure…</div></AppLayout>;
  }

  const allDailyDone = dailyQuests.length > 0 && dailyQuests.every((q) => q.completed);

  return (
    <AppLayout>
      <PageHeader emoji="🗺️" title="Aventure" subtitle="Quêtes, niveaux & récompenses." />

      <div className="px-5 space-y-5 pb-6">
        {/* Niveau hero */}
        <div className="card-paper p-5 relative overflow-hidden">
          <Tape variant="yellow" position="top-left" />
          <Pin color="purple" className="absolute top-2 right-3" />
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center text-3xl shadow-glow">
              {levelTier.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Niveau {profile.level}</p>
              <p className="font-serif text-2xl leading-tight">{levelTier.name}</p>
              <p className="font-hand text-lg text-primary mt-0.5">{profile.xp_total} XP</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
              <span>Vers niveau {profile.level + 1}</span>
              <span>{xp.into} / {xp.span} XP</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full gradient-primary transition-all duration-700" style={{ width: `${xp.pct}%` }} />
            </div>
          </div>
        </div>

        {/* Mini stats : streak + ligue (placeholder) */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/app/streak" className="card-paper p-4 relative tilt-l hover:shadow-glow transition-shadow">
            <Tape variant="pink" position="top" />
            <div className="flex items-center gap-2.5 mt-1">
              <Flame className="h-6 w-6 text-orange-500 wiggle" />
              <div>
                <p className="font-serif text-2xl leading-none">{profile.streak_days}j</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Streak</p>
              </div>
            </div>
          </Link>
          <div className="card-paper p-4 relative tilt-r">
            <Tape variant="mint" position="top" />
            <div className="flex items-center gap-2.5 mt-1">
              <Trophy className="h-6 w-6 text-primary" />
              <div>
                <p className="font-serif text-2xl leading-none capitalize">{profile.league}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Ligue · {profile.xp_week} XP</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quête hebdo */}
        {weeklyQuest && (
          <div className="rounded-2xl p-[2px] bg-gradient-to-br from-amber-300 via-primary to-amber-300 shadow-glow">
            <div className="rounded-2xl bg-card p-4 relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <Sparkles className="h-3 w-3" /> Quête de la semaine
                </div>
                <Stamp>{weeklyQuest.xp_reward} XP</Stamp>
              </div>
              <p className="font-serif text-xl flex items-center gap-2">
                <span>{weeklyQuest.emoji}</span>
                {weeklyQuest.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{weeklyQuest.description}</p>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-muted-foreground">Progression</span>
                  <span className="font-semibold">{weeklyQuest.progress} / {weeklyQuest.target}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-primary transition-all duration-700" style={{ width: `${Math.min(100, (weeklyQuest.progress / weeklyQuest.target) * 100)}%` }} />
                </div>
              </div>
              {weeklyQuest.completed && (
                <p className="font-hand text-primary text-lg mt-3">Complétée ! 🎉</p>
              )}
            </div>
          </div>
        )}

        {/* Quêtes journalières */}
        <div>
          <div className="flex items-end justify-between mb-2 px-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quêtes du jour</p>
              <ScribbleUnderline className="w-20" />
            </div>
            {allDailyDone && <span className="font-hand text-primary text-base">tout fait ! 🎉</span>}
          </div>

          <div className="space-y-2.5">
            {dailyQuests.map((q, i) => {
              const pct = Math.min(100, (q.progress / q.target) * 100);
              return (
                <div key={q.id} className={`card-paper p-3.5 relative ${i % 2 === 0 ? "tilt-l" : "tilt-r"}`}>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg shrink-0">
                      {q.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold truncate">{q.title}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground shrink-0">
                          +{q.xp_reward} XP
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{q.description}</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="text-muted-foreground">{q.progress} / {q.target}</span>
                          {q.completed && <span className="font-hand text-primary">fait ✓</span>}
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full transition-all duration-700 ${q.completed ? "bg-success" : "gradient-primary"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ligues / boutique teaser */}
        <Postit variant="yellow" className="text-base">
          <div className="flex items-start gap-2">
            <Lock className="h-4 w-4 mt-1 shrink-0" />
            <div>
              <p className="font-bold">Bientôt</p>
              <p className="text-sm">Ligues hebdo, badges, boutique XP & cadres avatar arrivent dans la prochaine màj 📬</p>
            </div>
          </div>
        </Postit>
      </div>
    </AppLayout>
  );
}
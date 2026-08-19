import { useState } from "react";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { useGamification } from "@/hooks/useGamification";
import { Tape, Pin, ScribbleUnderline, Stamp } from "@/components/revix/AcademicDecor";
import { Flame, Sparkles, Trophy, Target, Zap, Lock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { levelInfo, xpForLevel, LEVEL_NAMES, LEAGUES, leagueInfo, questIcon } from "@/lib/gamification";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { illu } from "@/assets/illu";

export default function Aventure() {
  const { profile, dailyQuests, weeklyQuest, xp, levelTier, loading } = useGamification();
  const [openLevels, setOpenLevels] = useState(false);
  const [openLeagues, setOpenLeagues] = useState(false);

  if (loading || !profile || !xp || !levelTier) {
    return <AppLayout><div className="p-5 text-sm text-muted-foreground">Chargement de ton aventure…</div></AppLayout>;
  }

  const allDailyDone = dailyQuests.length > 0 && dailyQuests.every((q) => q.completed);
  const league = leagueInfo(profile.xp_week);

  return (
    <AppLayout>
      <PageHeader illustration={illu.adventure} title="Aventure" subtitle="Quêtes, niveaux & récompenses." />

      <div className="px-5 space-y-5 pb-6">
        {/* Niveau hero */}
        <button
          type="button"
          onClick={() => setOpenLevels(true)}
          className="card-paper p-5 relative overflow-hidden paper-grain w-full text-left hover:shadow-glow transition-shadow"
        >
          <Tape variant="yellow" position="top-left" />
          <Pin color="purple" className="absolute top-2 right-3 decor-extra" />
          <ChevronRight className="absolute bottom-3 right-3 h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
                <img src={levelTier.icon} alt="" width={48} height={48} className="h-12 w-12 object-contain" />
              </div>
              <span className="rubber-stamp-purple rubber-stamp absolute -bottom-2 -right-3 text-[8px] !px-1.5 !py-0.5 stamp-pop">
                Lv {profile.level}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono-tag text-[10px] uppercase tracking-widest text-muted-foreground">Niveau {profile.level}</p>
              <p className="font-serif text-2xl leading-tight">{levelTier.name}</p>
              <p className="font-hand text-lg text-primary mt-0.5">{profile.xp_total} XP total</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
              <span className="font-mono-tag uppercase tracking-wider">Vers niveau {profile.level + 1}</span>
              <span className="font-mono-tag">{xp.into} / {xp.span} XP</span>
            </div>
            <div className="ruler-bar">
              <div className="ruler-fill" style={{ width: `${xp.pct}%` }} />
            </div>
          </div>
        </button>

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
          <button
            type="button"
            onClick={() => setOpenLeagues(true)}
            className="card-paper p-4 relative tilt-r text-left hover:shadow-glow transition-shadow"
          >
            <Tape variant="mint" position="top" />
            <div className="flex items-center gap-2.5 mt-1">
              <img src={league.current.icon} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
              <div>
                <p className="font-serif text-2xl leading-none">{league.current.name}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Ligue · {profile.xp_week} XP</p>
              </div>
            </div>
          </button>
        </div>

        {/* Quête hebdo */}
        {weeklyQuest && (
          <div className="rounded-2xl p-[2px] bg-gradient-to-br from-amber-300 via-primary to-amber-300 shadow-glow">
            <div className="rounded-2xl bg-card p-4 relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <Sparkles className="h-3 w-3" /> Quête de la semaine
                </div>
                <div className="flex items-center gap-2">
                  {(() => { const day = new Date().getDay(); const left = day === 0 ? 0 : 7 - day; return left > 0 ? (
                    <span className="text-[10px] text-muted-foreground font-mono">Reste {left}j</span>
                  ) : (
                    <span className="text-[10px] text-destructive font-mono font-bold">Fin aujourd'hui</span>
                  ); })()}
                  <Stamp>{weeklyQuest.xp_reward} XP</Stamp>
                </div>
              </div>
              <p className="font-serif text-xl flex items-center gap-2">
                {questIcon(weeklyQuest.quest_key) ? (
                  <img src={questIcon(weeklyQuest.quest_key)} alt="" width={24} height={24} className="h-6 w-6 object-contain" />
                ) : (
                  <span>{weeklyQuest.emoji}</span>
                )}
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
 <p className="font-hand text-primary text-lg mt-3">Complétée! </p>
              )}
            </div>
          </div>
        )}

        {/* Quêtes journalières */}
        <div className="corkboard p-4 relative">
          <Pin color="red" className="absolute -top-1.5 left-6" />
          <Pin color="blue" className="absolute -top-1.5 right-6 decor-extra" />
          <div className="flex items-end justify-between mb-2 px-1">
            <div>
              <p className="font-mono-tag text-xs font-bold uppercase tracking-wider text-white/95 drop-shadow-sm">Quêtes du jour</p>
            </div>
 {allDailyDone && <span className="font-hand text-white text-lg drop-shadow">tout fait! </span>}
          </div>

          <div className="space-y-2.5">
            {dailyQuests.map((q, i) => {
              const pct = Math.min(100, (q.progress / q.target) * 100);
              return (
                <div key={q.id} className={`card-paper p-3.5 relative ${i % 2 === 0 ? "tilt-l" : "tilt-r"} hover:shadow-glow transition-shadow`}>
                  <Pin color={i % 3 === 0 ? "red" : i % 3 === 1 ? "blue" : "purple"} className="absolute -top-1 left-1/2 -translate-x-1/2 decor-extra" />
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      {questIcon(q.quest_key) ? (
                        <img src={questIcon(q.quest_key)} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
                      ) : (
                        <span className="text-lg">{q.emoji}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold truncate">{q.title}</p>
                        <span className="label-tape shrink-0">
                          +{q.xp_reward} XP
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{q.description}</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="font-mono-tag text-muted-foreground">{q.progress} / {q.target}</span>
 {q.completed && <span className="font-hand text-primary">fait </span>}
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

      </div>

      {/* Modale : chemin des titres */}
      <Dialog open={openLevels} onOpenChange={setOpenLevels}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
 <DialogTitle>Chemin des titres </DialogTitle>
            <DialogDescription>Tous les paliers de Bizuth à Légende Revix.</DialogDescription>
          </DialogHeader>
          <ol className="space-y-2">
            {LEVEL_NAMES.map((tier) => {
              const reached = profile.level >= tier.min;
              const current = profile.level >= tier.min && profile.level <= tier.max;
              const xpToReach = xpForLevel(tier.min);
              return (
                <li
                  key={tier.name}
                  className={`relative flex items-center gap-3 rounded-xl border-2 p-2.5 transition-all ${
                    current
                      ? "border-primary bg-primary/10 shadow-brutal"
                      : reached
                      ? "border-foreground/80 bg-card"
                      : "border-dashed border-muted-foreground/30 bg-muted/30 opacity-70"
                  }`}
                >
                  <div
                    className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center text-xl border-2 ${
                      current
                        ? "border-foreground bg-card"
                        : reached
                        ? "border-foreground/80 bg-secondary"
                        : "border-muted-foreground/30 bg-muted"
                    }`}
                  >
                    {reached ? <img src={tier.icon} alt="" width={28} height={28} className="h-7 w-7 object-contain" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-serif text-base leading-tight truncate ${!reached ? "text-muted-foreground" : ""}`}>
                        {tier.name}
                      </p>
                      {current && (
                        <span className="rubber-stamp-purple rubber-stamp text-[8px] !px-1.5 !py-0.5">ici</span>
                      )}
                    </div>
                    <p className="font-mono-tag text-[9px] uppercase tracking-wider text-muted-foreground">
                      Niv. {tier.min}–{tier.max} · {xpToReach} XP
                    </p>
                  </div>
                  {reached && !current && <span className="font-hand text-success text-lg shrink-0">fait !</span>}
                </li>
              );
            })}
          </ol>
        </DialogContent>
      </Dialog>

      {/* Modale : ligues */}
      <Dialog open={openLeagues} onOpenChange={setOpenLeagues}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
 <DialogTitle>Ligues hebdo </DialogTitle>
            <DialogDescription>
              Tu es <strong>{league.current.name}</strong> avec {profile.xp_week} XP cette semaine.
              {league.next && ` Encore ${league.next.minWeekXp - profile.xp_week} XP pour passer ${league.next.name}.`}
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-2">
            {LEAGUES.map((l) => {
              const reached = profile.xp_week >= l.minWeekXp;
              const current = l.key === league.current.key;
              return (
                <li
                  key={l.key}
                  className={`flex items-center gap-3 rounded-xl border-2 p-2.5 ${
                    current
                      ? "border-primary bg-primary/10 shadow-brutal"
                      : reached
                      ? "border-foreground/80 bg-card"
                      : "border-dashed border-muted-foreground/30 bg-muted/30 opacity-70"
                  }`}
                >
                  <div className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center border-2 border-foreground/80 bg-secondary">
                    {reached ? <img src={l.icon} alt="" width={28} height={28} className="h-7 w-7 object-contain" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-serif text-base leading-tight">{l.name}</p>
                      {current && (
                        <span className="rubber-stamp-purple rubber-stamp text-[8px] !px-1.5 !py-0.5">ici</span>
                      )}
                    </div>
                    <p className="font-mono-tag text-[9px] uppercase tracking-wider text-muted-foreground">
                      {l.minWeekXp} XP / semaine
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
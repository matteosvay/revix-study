// Affichage des quotas IA quotidiens/hebdo de l'utilisateur (style neo-brutaliste).
// Utilisé dans le Dashboard.
import { Link } from "react-router-dom";
import { Sparkles, BookOpen, Brain, Calendar, MessageSquare, CheckCircle2 } from "lucide-react";
import { useUsage, type UsageAction } from "@/hooks/useUsage";

const ACTION_META: Record<UsageAction, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  fiche:      { label: "Fiches IA",   icon: BookOpen },
  quiz_ia:    { label: "Quizz IA",    icon: Brain },
  coach:      { label: "Coach IA",    icon: MessageSquare },
  correction: { label: "Corrections", icon: CheckCircle2 },
  planning:   { label: "Planning IA", icon: Calendar },
};

const TIER_LABEL: Record<string, string> = {
  free: "Gratuit",
  pro: "Pro",
  ultra: "Ultra",
};

function barColor(pct: number) {
  if (pct >= 100) return "bg-destructive";
  if (pct >= 80) return "bg-amber-500";
  return "bg-primary";
}

export function UsageMeter() {
  const { tier, usage, loading } = useUsage();

  if (loading) {
    return (
      <div className="rounded-md border-[2.5px] border-foreground bg-card p-4 shadow-brutal-sm">
        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  const anyReached = usage.some((u) => u.reached);

  return (
    <div className="rounded-md border-[2.5px] border-foreground bg-card p-4 shadow-brutal-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm font-bold uppercase tracking-wider">Quotas IA</p>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border-[1.5px] border-foreground bg-secondary">
          {TIER_LABEL[tier] ?? tier}
        </span>
      </div>

      <div className="space-y-2.5">
        {usage.map((u) => {
          const Icon = ACTION_META[u.action].icon;
          // On affiche le quota le plus contraignant (celui dont % est le plus haut)
          const showWeekly = u.weekly_pct >= u.daily_pct;
          const used = showWeekly ? u.weekly_used : u.daily_used;
          const limit = showWeekly ? u.weekly_limit : u.daily_limit;
          const pct = showWeekly ? u.weekly_pct : u.daily_pct;
          const period = showWeekly ? "semaine" : "jour";
          return (
            <div key={u.action}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <Icon className="h-3.5 w-3.5" />
                  {ACTION_META[u.action].label}
                </span>
                <span className={`font-mono ${u.reached ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                  {used}/{limit} <span className="opacity-60">/{period}</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden border-[1px] border-foreground/20">
                <div
                  className={`h-full transition-all ${barColor(pct)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {anyReached && tier === "free" && (
        <Link
          to="/app/profil"
          className="mt-3 block text-center text-xs font-bold uppercase tracking-wider rounded-md border-[2.5px] border-foreground bg-primary text-primary-foreground py-2 shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
        >
          🚀 Passer à Pro
        </Link>
      )}
    </div>
  );
}

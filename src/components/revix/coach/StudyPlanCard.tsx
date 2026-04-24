import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { awardXp, bumpQuest } from "@/hooks/useGamification";

export type StudyPlan = {
  plan_title: string;
  subject: string;
  days: {
    day_label: string;
    date_iso: string;
    tasks: { description: string; duration_min: number; technique: string }[];
  }[];
  coach_note: string;
};

export function StudyPlanCard({ plan, onImported }: { plan: StudyPlan; onImported?: () => void }) {
  const { user } = useAuth();
  const [imported, setImported] = useState(false);
  const [loading, setLoading] = useState(false);

  const importAll = async () => {
    if (!user || imported) return;
    setLoading(true);
    try {
      const rows = plan.days.flatMap((d) =>
        d.tasks.map((t) => ({
          user_id: user.id,
          task_date: d.date_iso,
          subject: plan.subject,
          title: `${t.description} · ${t.technique}`,
        }))
      );
      if (!rows.length) throw new Error("Plan vide");
      const { error } = await supabase.from("planning_tasks").insert(rows);
      if (error) throw error;
      await bumpQuest(user.id, "task_added", rows.length);
      await bumpQuest(user.id, "w_5_planning_tasks", rows.length);
      await awardXp(user.id, 80, "coach:plan_imported");
      toast.success(`${rows.length} sessions ajoutées à ton planning ✨`);
      setImported(true);
      onImported?.();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notebook-card p-4 my-3 relative">
      <span className="rubber-stamp rubber-stamp-purple absolute -top-3 right-4 text-[10px]">+80 XP PLAN</span>
      <p className="font-hand text-2xl text-foreground leading-tight">📋 {plan.plan_title}</p>
      <p className="text-xs text-foreground/60 mt-1 mb-3">{plan.coach_note}</p>
      <div className="space-y-1.5">
        {plan.days.map((d, i) => (
          <div key={i} className="border-b border-border/40 pb-1.5 last:border-0">
            <p className="font-mono text-[10px] tracking-widest text-foreground/70">[{d.day_label}]</p>
            {d.tasks.map((t, j) => (
              <div key={j} className="flex items-baseline gap-2 text-xs ml-1 mt-0.5">
                <span className="text-foreground/85 flex-1">{t.description}</span>
                <span className="text-[10px] text-foreground/50 whitespace-nowrap">({t.duration_min} min)</span>
                <span className="font-mono text-[9px] tracking-wider bg-primary/10 text-primary px-1.5 rounded">
                  {t.technique}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          onClick={importAll}
          disabled={imported || loading}
          className="rounded-full gradient-primary border-0 flex-1 text-xs"
        >
          {imported ? "✓ Ajouté" : loading ? "Ajout..." : "✅ Ajouter tout au planning"}
        </Button>
      </div>
    </div>
  );
}
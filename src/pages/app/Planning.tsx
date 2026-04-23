import { useEffect, useState } from "react";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Task = { id: string; task_date: string; start_time: string | null; end_time: string | null; subject: string; title: string | null; done: boolean };

const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
function fmtDate(d: Date) { return d.toISOString().slice(0, 10); }

export default function Planning() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const week = startOfWeek();
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(week); d.setDate(week.getDate() + i); return d; });

  const load = async () => {
    if (!user) return;
    const start = fmtDate(week);
    const end = fmtDate(days[6]);
    const { data } = await supabase.from("planning_tasks").select("*").eq("user_id", user.id).gte("task_date", start).lte("task_date", end).order("task_date").order("start_time");
    setTasks((data as any) ?? []);
  };

  useEffect(() => { load(); }, [user]);

  const toggle = async (t: Task) => {
    setTasks(ts => ts.map(x => x.id === t.id ? { ...x, done: !x.done } : x));
    await supabase.from("planning_tasks").update({ done: !t.done }).eq("id", t.id);
  };

  const generate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-planning", {
        body: {
          hoursPerDay: Number(fd.get("hours")),
          examDate: fd.get("exam") || null,
          subjects: String(fd.get("subjects") ?? "").split(",").map(s => s.trim()).filter(Boolean),
          startDate: fmtDate(week),
        },
      });
      if (error) throw error;
      const tasksGen = data?.tasks ?? [];
      if (!tasksGen.length) throw new Error("Aucune tâche générée");
      const rows = tasksGen.map((t: any) => ({ ...t, user_id: user.id }));
      await supabase.from("planning_tasks").insert(rows);
      toast.success("Planning généré ✨");
      setOpen(false);
      load();
    } catch (e: any) { toast.error(e?.message ?? "Erreur"); }
    finally { setGenerating(false); }
  };

  return (
    <AppLayout>
      <PageHeader
        emoji="🗓️"
        title="Planning"
        subtitle="Cette semaine"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-full gradient-primary border-0">
                <Sparkles className="h-3.5 w-3.5 mr-1" /> IA
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle className="font-serif">Générer ton planning ✨</DialogTitle></DialogHeader>
              <form onSubmit={generate} className="space-y-3 mt-2">
                <div className="space-y-1.5"><Label>Heures dispo / jour</Label><Input name="hours" type="number" defaultValue={3} min={1} max={12} required /></div>
                <div className="space-y-1.5"><Label>Date du prochain examen</Label><Input name="exam" type="date" /></div>
                <div className="space-y-1.5"><Label>Matières prioritaires</Label><Input name="subjects" placeholder="Droit, Marketing..." /></div>
                <Button type="submit" disabled={generating} className="w-full rounded-full gradient-primary border-0">
                  {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Génération...</> : "Générer"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="px-5 space-y-4">
        {days.map((d, i) => {
          const dayTasks = tasks.filter(t => t.task_date === fmtDate(d));
          const isToday = fmtDate(d) === fmtDate(new Date());
          return (
            <div key={i}>
              <div className="flex items-baseline gap-2 mb-1.5">
                <p className={`text-xs font-semibold uppercase tracking-wider ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                  {dayLabels[i]} {d.getDate()}
                </p>
                {isToday && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">Aujourd'hui</span>}
              </div>
              {dayTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 italic px-2">Rien de prévu</p>
              ) : (
                <div className="space-y-1">
                  {dayTasks.map(t => (
                    <button key={t.id} onClick={() => toggle(t)} className={`w-full flex items-center gap-3 p-2.5 rounded-lg notion-row text-left ${t.done ? "opacity-50" : ""}`}>
                      <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${t.done ? "bg-primary border-primary" : "border-muted-foreground/40"}`}>
                        {t.done && <span className="text-primary-foreground text-[10px]">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${t.done ? "line-through" : ""}`}>{t.title ?? t.subject}</p>
                        <p className="text-[11px] text-muted-foreground">{t.start_time} – {t.end_time} · {t.subject}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
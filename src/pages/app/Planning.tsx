import { useEffect, useState } from "react";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Plus, Target, Trash2, BookOpen, Brain, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { bumpQuest } from "@/hooks/useGamification";
import { localDateKey } from "@/lib/date";
import { CoachPanel, useCoachContext } from "@/components/revix/coach/CoachPanel";
import { SmartAlertBanner } from "@/components/revix/coach/SmartAlertBanner";

type Task = { id: string; task_date: string; start_time: string | null; end_time: string | null; subject: string; title: string | null; done: boolean };

const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function fmtDate(d: Date) { return localDateKey(d); }

export default function Planning() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [weekStats, setWeekStats] = useState({ fiches: 0, quizzes: 0, attempts: 0 });
  const [weekOffset, setWeekOffset] = useState(0);
  const coachCtx = useCoachContext();

  const today0 = new Date(); today0.setHours(0, 0, 0, 0);
  const baseDay = new Date(today0); baseDay.setDate(today0.getDate() + weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(baseDay); d.setDate(baseDay.getDate() + i); return d; });
  const week = days[0];
  const isCurrentWeek = weekOffset === 0;

  const load = async () => {
    if (!user) return;
    const start = fmtDate(week);
    const end = fmtDate(days[6]);
    const startIso = `${start}T00:00:00.000Z`;
    const endIso = `${end}T23:59:59.999Z`;
    const [{ data: t }, { count: fc }, { count: qc }, { data: att }] = await Promise.all([
      supabase.from("planning_tasks").select("*").eq("user_id", user.id).gte("task_date", start).lte("task_date", end).order("task_date").order("start_time"),
      supabase.from("courses").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", startIso).lte("created_at", endIso),
      supabase.from("quizzes").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", startIso).lte("created_at", endIso),
      supabase.from("quiz_attempts").select("id").eq("user_id", user.id).gte("created_at", startIso).lte("created_at", endIso),
    ]);
    setTasks((t as any) ?? []);
    setWeekStats({ fiches: fc ?? 0, quizzes: qc ?? 0, attempts: att?.length ?? 0 });
  };

  useEffect(() => { load(); }, [user, weekOffset]);

  const toggle = async (t: Task) => {
    setTasks(ts => ts.map(x => x.id === t.id ? { ...x, done: !x.done } : x));
    await supabase.from("planning_tasks").update({ done: !t.done }).eq("id", t.id);
  };

  const remove = async (id: string) => {
    setTasks(ts => ts.filter(t => t.id !== id));
    await supabase.from("planning_tasks").delete().eq("id", id);
  };

  const addTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const row = {
      user_id: user.id,
      task_date: String(fd.get("date")),
      start_time: String(fd.get("start") ?? "") || null,
      end_time: String(fd.get("end") ?? "") || null,
      subject: String(fd.get("subject") ?? "Révisions"),
      title: String(fd.get("title") ?? "") || null,
    };
    const { error } = await supabase.from("planning_tasks").insert(row);
    if (error) { toast.error(error.message); return; }
    await bumpQuest(user.id, "task_added", 1);
    await bumpQuest(user.id, "w_5_planning_tasks", 1);
    toast.success("Tâche ajoutée");
    setAddOpen(false);
    load();
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
      await bumpQuest(user.id, "task_added", rows.length);
      await bumpQuest(user.id, "w_5_planning_tasks", rows.length);
      toast.success("Planning généré ✨");
      setOpen(false);
      load();
    } catch (e: any) { toast.error(e?.message ?? "Erreur"); }
    finally { setGenerating(false); }
  };

  // Objectifs hebdo
  const goalFiches = 5, goalQuizzes = 3, goalAttempts = 5;
  const todayKey = fmtDate(new Date());
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;

  return (
    <AppLayout>
      <PageHeader
        emoji="🗓️"
        title="Planning"
        subtitle="Les 7 prochains jours"
        action={
          <div className="flex gap-1.5">
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="rounded-full"><Plus className="h-3.5 w-3.5" /></Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader><DialogTitle className="font-serif">Nouvelle tâche</DialogTitle></DialogHeader>
                <form onSubmit={addTask} className="space-y-3 mt-2">
                  <div className="space-y-1.5"><Label>Titre</Label><Input name="title" placeholder="Réviser le chapitre 3..." required /></div>
                  <div className="space-y-1.5"><Label>Matière</Label><Input name="subject" placeholder="Droit civil" required /></div>
                  <div className="space-y-1.5"><Label>Date</Label><Input name="date" type="date" defaultValue={todayKey} required /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5"><Label>Début</Label><Input name="start" type="time" /></div>
                    <div className="space-y-1.5"><Label>Fin</Label><Input name="end" type="time" /></div>
                  </div>
                  <Button type="submit" className="w-full rounded-full gradient-primary border-0">Ajouter</Button>
                </form>
              </DialogContent>
            </Dialog>
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
          </div>
        }
      />

      <div className="px-5">
        <SmartAlertBanner
          ctx={coachCtx}
          weekTaskCount={tasks.length}
          onAction={(a) => { if (a === "generate_plan") setOpen(true); }}
        />

        <div className="lg:grid lg:grid-cols-[1fr_minmax(320px,30%)] lg:gap-6">
          <div>
        {/* Bandeau plage de dates avec navigation */}
        <div className="glass rounded-2xl px-3 py-2 mb-4 flex items-center justify-between gap-2">
          <button onClick={() => setWeekOffset(o => o - 1)} className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition shrink-0">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center flex-1">
            <p className="text-xs font-medium">
              {week.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – {days[6].toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </p>
            {!isCurrentWeek && (
              <button onClick={() => setWeekOffset(0)} className="text-[10px] text-primary font-semibold hover:underline">
                Aujourd'hui
              </button>
            )}
          </div>
          <button onClick={() => setWeekOffset(o => o + 1)} className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition shrink-0">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-full p-1 bg-muted/60">
            <TabsTrigger value="calendar" className="rounded-full text-xs">Calendrier</TabsTrigger>
            <TabsTrigger value="goals" className="rounded-full text-xs">Objectifs</TabsTrigger>
          </TabsList>

          {/* Onglet calendrier */}
          <TabsContent value="calendar" className="space-y-4 mt-4">
            {total > 0 && (
              <div className="glass rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium">Avancement semaine</span>
                  <span className="text-muted-foreground">{done} / {total}</span>
                </div>
                <Progress value={total ? (done / total) * 100 : 0} className="h-1.5" />
              </div>
            )}
            {days.map((d, i) => {
              const dayTasks = tasks.filter(t => t.task_date === fmtDate(d));
              const isToday = fmtDate(d) === fmtDate(today0);
              const dowIdx = (d.getDay() + 6) % 7; // Mon=0..Sun=6
              const dayDone = dayTasks.filter(t => t.done).length;
              return (
                <div key={i} className={`rounded-2xl border ${isToday ? "border-primary/40 bg-primary/5" : "border-border/40"} p-3`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-9 w-9 rounded-xl flex flex-col items-center justify-center shrink-0 ${isToday ? "gradient-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                        <span className="text-[8px] font-bold uppercase leading-none">{dayLabels[dowIdx]}</span>
                        <span className="text-sm font-bold leading-none mt-0.5">{d.getDate()}</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold capitalize">
                          {d.toLocaleDateString("fr-FR", { weekday: "long" })}
                        </p>
                        {isToday && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold uppercase tracking-wider">Aujourd'hui</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {dayTasks.length > 0 && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">{dayDone}/{dayTasks.length}</span>
                      )}
                      <button
                        onClick={() => { setAddOpen(true); setTimeout(() => { const inp = document.querySelector<HTMLInputElement>('input[name="date"]'); if (inp) inp.value = fmtDate(d); }, 50); }}
                        className="h-7 w-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition"
                        title="Ajouter une tâche ce jour-là"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {dayTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground/60 italic px-1 py-1">Rien de prévu</p>
                  ) : (
                    <div className="space-y-1.5">
                      {dayTasks.map(t => (
                        <div key={t.id} className={`group flex items-start gap-3 p-3 rounded-xl bg-card border border-border/60 hover:border-primary/40 transition ${t.done ? "opacity-60" : ""}`}>
                          <button onClick={() => toggle(t)} className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition mt-0.5 ${t.done ? "gradient-primary border-transparent" : "border-muted-foreground/40 hover:border-primary"}`}>
                            {t.done && <span className="text-primary-foreground text-[10px]">✓</span>}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium leading-snug break-words ${t.done ? "line-through" : ""}`}>{t.title ?? t.subject}</p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                              {t.start_time && t.end_time && (
                                <span className="text-[11px] text-foreground/70 font-mono bg-muted px-1.5 py-0.5 rounded">
                                  {t.start_time}–{t.end_time}
                                </span>
                              )}
                              <span className="text-[11px] text-primary font-medium">{t.subject}</span>
                            </div>
                          </div>
                          <button onClick={() => remove(t.id)} className="opacity-0 group-hover:opacity-100 sm:opacity-60 transition text-muted-foreground hover:text-destructive shrink-0 mt-0.5" aria-label="Supprimer">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {tasks.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-primary/20 p-6 text-center mt-4">
                <Sparkles className="h-8 w-8 mx-auto text-primary/60" />
                <p className="font-serif text-lg mt-2">Semaine vide</p>
                <p className="text-xs text-muted-foreground mt-1 mb-3">Génère un plan IA ou ajoute une tâche</p>
                <div className="flex gap-2 justify-center">
                  <Button size="sm" onClick={() => setOpen(true)} className="rounded-full gradient-primary border-0">
                    <Sparkles className="h-3.5 w-3.5 mr-1" /> Générer
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setAddOpen(true)} className="rounded-full">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Tâche
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Onglet objectifs */}
          <TabsContent value="goals" className="space-y-3 mt-4">
            <p className="text-xs text-muted-foreground">Tes objectifs de la semaine, mis à jour en temps réel.</p>

            {[
              { icon: BookOpen, label: "Cours créés", value: weekStats.fiches, goal: goalFiches, color: "from-violet-500 to-purple-500" },
              { icon: Brain, label: "Quizz générés", value: weekStats.quizzes, goal: goalQuizzes, color: "from-pink-500 to-rose-500" },
              { icon: Target, label: "Quizz complétés", value: weekStats.attempts, goal: goalAttempts, color: "from-amber-500 to-orange-500" },
              { icon: Sparkles, label: "Tâches accomplies", value: done, goal: total || 1, color: "from-emerald-500 to-teal-500" },
            ].map(g => {
              const pct = Math.min(100, Math.round((g.value / g.goal) * 100));
              const reached = g.value >= g.goal;
              return (
                <div key={g.label} className="glass rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${g.color} flex items-center justify-center text-white shrink-0`}>
                      <g.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{g.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {g.value} / {g.goal} {reached && "· objectif atteint 🎉"}
                      </p>
                    </div>
                    <p className="font-serif text-xl">{pct}%</p>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${g.color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}

            <div className="rounded-2xl border-2 border-dashed border-primary/20 p-4 mt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> Astuce
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">
                Atteindre tes 4 objectifs hebdo te garantit une streak solide et débloque +1 jeton bonus tous les 10 quiz complétés.
              </p>
            </div>
          </TabsContent>
        </Tabs>
          </div>

          {/* Coach panel — sidebar desktop / bottom sheet mobile */}
          <aside className="hidden lg:block">
            <div className="sticky top-4">
              <CoachPanel inline />
            </div>
          </aside>
        </div>

        {/* Floating coach trigger on mobile */}
        <div className="lg:hidden">
          <CoachPanel />
        </div>
      </div>
    </AppLayout>
  );
}
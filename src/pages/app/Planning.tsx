import { useState } from "react";
import { AppLayout } from "@/components/revix/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Flame } from "lucide-react";
import { planning, todayTasks } from "@/data/mock";
import { toast } from "sonner";

export default function Planning() {
  const [tasks, setTasks] = useState(todayTasks);
  const toggle = (id: number) => setTasks(t => t.map(x => x.id === id ? { ...x, done: !x.done } : x));

  return (
    <AppLayout>
      <Card className="p-5 rounded-2xl border-0 gradient-hero text-primary-foreground mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flame className="h-8 w-8" />
          <div>
            <p className="font-bold">Tu es sur une série de 7 jours 🔥</p>
            <p className="text-sm opacity-90">Encore 3 jours pour battre ton record !</p>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Planning</h1>
          <p className="text-muted-foreground mt-1">Semaine du 13 au 19 octobre</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="rounded-full gradient-primary border-0"><Sparkles className="h-4 w-4 mr-2" /> Générer un planning IA</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle>Génère ton planning IA ✨</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); toast.success("Planning généré !"); }} className="space-y-4 mt-2">
              <div className="space-y-2"><Label>Heures dispo / jour</Label><Input type="number" defaultValue={3} min={1} max={12} /></div>
              <div className="space-y-2"><Label>Date du prochain examen</Label><Input type="date" /></div>
              <div className="space-y-2"><Label>Matières prioritaires</Label><Input placeholder="Droit, Marketing..." /></div>
              <Button type="submit" className="w-full rounded-full gradient-primary border-0">Générer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-7 gap-3 mb-8">
        {planning.map(d => (
          <Card key={d.day} className="p-3 rounded-2xl border-2 min-h-[180px]">
            <p className="font-bold text-sm text-center pb-2 border-b">{d.day}</p>
            <div className="space-y-2 mt-2">
              {d.tasks.map((t, i) => (
                <div key={i} className="rounded-lg p-2 bg-muted/50 border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
                  <div className={`h-1.5 w-1.5 rounded-full ${t.color} mb-1`} />
                  <p className="text-[10px] font-medium">{t.time}</p>
                  <p className="text-xs font-semibold truncate">{t.subject}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 rounded-2xl border-2 shadow-card">
        <h2 className="font-bold text-lg mb-4">Tâches du jour</h2>
        <div className="space-y-2">
          {tasks.map(t => (
            <button key={t.id} onClick={() => toggle(t.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left ${t.done ? "bg-muted/50 opacity-60" : "hover:border-primary/40"}`}>
              <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center ${t.done ? "bg-success border-success" : "border-muted-foreground/40"}`}>
                {t.done && <span className="text-success-foreground text-xs">✓</span>}
              </div>
              <span className={`text-sm flex-1 ${t.done ? "line-through" : ""}`}>{t.label}</span>
            </button>
          ))}
        </div>
      </Card>
    </AppLayout>
  );
}
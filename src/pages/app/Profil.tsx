import { AppLayout } from "@/components/revix/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Sparkles, Trash2 } from "lucide-react";

export default function Profil() {
  const stats = [
    { label: "Cours", value: "12" },
    { label: "Quizz", value: "34" },
    { label: "Score moyen", value: "76%" },
    { label: "Record streak", value: "12j 🔥" },
  ];
  return (
    <AppLayout>
      <h1 className="text-3xl font-extrabold tracking-tight mb-6">Profil & paramètres</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 rounded-2xl border-2 lg:col-span-2 shadow-card">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-primary/20">
                <AvatarFallback className="gradient-primary text-primary-foreground text-2xl font-bold">LM</AvatarFallback>
              </Avatar>
              <Button size="icon" className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"><Camera className="h-3 w-3" /></Button>
            </div>
            <div>
              <p className="font-bold text-lg">Léa Martin</p>
              <p className="text-sm text-muted-foreground">lea.martin@etudiant.fr</p>
              <Badge variant="secondary" className="rounded-full mt-2">BTS NDRC · 2e année</Badge>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            <div className="space-y-2"><Label>Nom complet</Label><Input defaultValue="Léa Martin" /></div>
            <div className="space-y-2"><Label>Email</Label><Input defaultValue="lea.martin@etudiant.fr" /></div>
            <div className="space-y-2"><Label>École / Université</Label><Input defaultValue="Lycée Édouard Branly, Lyon" /></div>
            <div className="space-y-2"><Label>Cursus</Label><Input defaultValue="BTS NDRC" /></div>
          </div>
          <Button className="mt-6 rounded-full gradient-primary border-0">Enregistrer</Button>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 rounded-2xl border-2 gradient-primary text-primary-foreground shadow-glow">
            <Badge variant="secondary" className="rounded-full">Plan actuel</Badge>
            <p className="font-bold text-2xl mt-3">Gratuit</p>
            <p className="text-sm opacity-90 mt-1">3 uploads / semaine</p>
            <Button variant="secondary" className="w-full rounded-full mt-4"><Sparkles className="h-4 w-4 mr-2" /> Passer en Pro</Button>
          </Card>

          <Card className="p-6 rounded-2xl border-2 shadow-card">
            <p className="font-bold mb-4">Tes stats</p>
            <div className="grid grid-cols-2 gap-3">
              {stats.map(s => (
                <div key={s.label} className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-extrabold mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-6 rounded-2xl border-2 border-destructive/30 bg-destructive/5 mt-6">
        <p className="font-bold text-destructive">Zone dangereuse</p>
        <p className="text-sm text-muted-foreground mt-1">Supprimer ton compte est définitif. Toutes tes fiches seront perdues.</p>
        <Button variant="destructive" className="mt-4 rounded-full"><Trash2 className="h-4 w-4 mr-2" /> Supprimer mon compte</Button>
      </Card>
    </AppLayout>
  );
}
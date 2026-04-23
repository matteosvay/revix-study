import { AppLayout } from "@/components/revix/AppLayout";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Users } from "lucide-react";

const posts = [
  { name: "Hugo T.", role: "Licence Droit", avatar: "HT", time: "il y a 1h", text: "Quelqu'un a des fiches sur la responsabilité civile ? Partiel demain 😭", likes: 12, comments: 4 },
  { name: "Inès R.", role: "Prépa HEC", avatar: "IR", time: "il y a 3h", text: "Je viens de finir 50 fiches de macroéco en 2h grâce à Revix. Goated 🐐", likes: 47, comments: 8 },
  { name: "Mehdi B.", role: "BTS MCO", avatar: "MB", time: "hier", text: "Mode oral = game changer pour le grand oral. Vraiment.", likes: 28, comments: 6 },
];

export default function Communaute() {
  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-2">
        <Users className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-extrabold tracking-tight">Communauté</h1>
      </div>
      <p className="text-muted-foreground mb-6">12 384 étudiants actifs cette semaine</p>

      <div className="space-y-4 max-w-2xl">
        {posts.map((p, i) => (
          <Card key={i} className="p-5 rounded-2xl border-2 shadow-card">
            <div className="flex items-start gap-3">
              <Avatar><AvatarFallback className="gradient-primary text-primary-foreground text-xs font-bold">{p.avatar}</AvatarFallback></Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{p.name}</p>
                  <Badge variant="secondary" className="rounded-full text-[10px] py-0">{p.role}</Badge>
                  <span className="text-xs text-muted-foreground">· {p.time}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed">{p.text}</p>
                <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-primary"><Heart className="h-3.5 w-3.5" /> {p.likes}</button>
                  <button className="flex items-center gap-1 hover:text-primary"><MessageCircle className="h-3.5 w-3.5" /> {p.comments}</button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
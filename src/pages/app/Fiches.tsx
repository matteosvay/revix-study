import { useState } from "react";
import { AppLayout } from "@/components/revix/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Plus, Layers, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { courses, type Course } from "@/data/mock";

export default function Fiches() {
  const [filter, setFilter] = useState<"All" | "BTS" | "Licence" | "Prépa">("All");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Course | null>(null);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const filtered = courses.filter(c =>
    (filter === "All" || c.level === filter) &&
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const openCourse = (c: Course) => { setActive(c); setCardIdx(0); setFlipped(false); };
  const next = () => { setFlipped(false); setCardIdx(i => Math.min(i + 1, (active?.flashcards.length ?? 1) - 1)); };
  const prev = () => { setFlipped(false); setCardIdx(i => Math.max(i - 1, 0)); };

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Mes Fiches</h1>
          <p className="text-muted-foreground mt-1">{courses.length} cours · {courses.reduce((a, c) => a + c.flashcards.length, 0)} fiches</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full"><Download className="h-4 w-4 mr-2" /> Export PDF / Anki</Button>
          <Button asChild className="rounded-full gradient-primary border-0"><Link to="/app/upload"><Plus className="h-4 w-4 mr-1" /> Nouveau</Link></Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un cours..." className="pl-9 rounded-full" />
        </div>
        <div className="flex gap-2">
          {(["All", "BTS", "Licence", "Prépa"] as const).map(f => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className={`rounded-full ${filter === f ? "gradient-primary border-0" : ""}`}>{f}</Button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((c) => (
          <Card key={c.id} onClick={() => openCourse(c)} className="p-6 rounded-2xl border-2 cursor-pointer hover:-translate-y-1 hover:shadow-glow transition-all">
            <div className={`h-2 -mx-6 -mt-6 mb-4 rounded-t-2xl bg-gradient-to-r ${c.color}`} />
            <div className="flex items-start justify-between">
              <Badge variant="secondary" className="rounded-full">{c.level}</Badge>
              <span className="text-xs text-muted-foreground">{c.date}</span>
            </div>
            <h3 className="font-bold mt-3 text-lg">{c.title}</h3>
            <p className="text-sm text-muted-foreground">{c.subject}</p>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground"><Layers className="h-3.5 w-3.5" /> {c.flashcards.length} fiches</span>
              <span className="font-semibold text-primary">{c.progress}%</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full gradient-primary" style={{ width: `${c.progress}%` }} />
            </div>
          </Card>
        ))}
      </div>

      {/* Flashcard viewer */}
      {active && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setActive(null)}>
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 text-card-foreground">
              <div>
                <p className="font-bold text-lg">{active.title}</p>
                <p className="text-xs text-muted-foreground">Fiche {cardIdx + 1} / {active.flashcards.length}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setActive(null)} className="rounded-full"><X className="h-5 w-5" /></Button>
            </div>

            <div className={`flip-card ${flipped ? "flipped" : ""} h-80 cursor-pointer`} onClick={() => setFlipped(f => !f)}>
              <div className="flip-inner h-full w-full">
                <Card className="flip-face rounded-2xl border-2 p-8 flex items-center justify-center text-center shadow-glow">
                  <div>
                    <Badge variant="secondary" className="rounded-full mb-4">Question</Badge>
                    <p className="text-xl font-semibold">{active.flashcards[cardIdx].front}</p>
                    <p className="text-xs text-muted-foreground mt-6">Clique pour retourner</p>
                  </div>
                </Card>
                <Card className="flip-face flip-back rounded-2xl border-2 p-8 flex items-center justify-center text-center gradient-primary text-primary-foreground shadow-glow">
                  <div>
                    <Badge variant="secondary" className="rounded-full mb-4">Réponse</Badge>
                    <p className="text-lg leading-relaxed">{active.flashcards[cardIdx].back}</p>
                  </div>
                </Card>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <Button variant="outline" onClick={prev} disabled={cardIdx === 0} className="rounded-full"><ChevronLeft className="h-4 w-4 mr-1" /> Précédent</Button>
              <Button onClick={next} disabled={cardIdx === active.flashcards.length - 1} className="rounded-full gradient-primary border-0">Suivant <ChevronRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
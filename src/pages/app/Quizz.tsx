import { useState } from "react";
import { AppLayout } from "@/components/revix/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Trophy, Target, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { courses, quizQuestions } from "@/data/mock";

type Phase = "select" | "play" | "end";

export default function Quizz() {
  const [phase, setPhase] = useState<Phase>("select");
  const [courseId, setCourseId] = useState(courses[0].id);
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);

  const start = () => { setPhase("play"); setQIdx(0); setPicked(null); setScore(0); setWrong([]); };

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const correct = quizQuestions[qIdx].correct === i;
    if (correct) setScore(s => s + 1); else setWrong(w => [...w, qIdx]);
    setTimeout(() => {
      if (qIdx + 1 >= quizQuestions.length) setPhase("end");
      else { setQIdx(qIdx + 1); setPicked(null); }
    }, 1100);
  };

  if (phase === "select") {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold tracking-tight">Quizz</h1>
          <p className="text-muted-foreground mt-1">Choisis un cours pour tester tes connaissances.</p>
          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            {courses.map(c => (
              <Card key={c.id} onClick={() => setCourseId(c.id)} className={`p-6 rounded-2xl border-2 cursor-pointer transition ${courseId === c.id ? "border-primary shadow-glow" : "hover:border-primary/40"}`}>
                <Badge variant="secondary" className="rounded-full">{c.level}</Badge>
                <h3 className="font-bold mt-3">{c.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{c.flashcards.length} fiches · 5 questions</p>
              </Card>
            ))}
          </div>
          <Button onClick={start} size="lg" className="w-full mt-8 rounded-full gradient-primary border-0 h-14 text-base shadow-glow">
            <Brain className="h-5 w-5 mr-2" /> Démarrer le quizz
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (phase === "play") {
    const q = quizQuestions[qIdx];
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3 text-sm font-medium text-muted-foreground">
            <span>Question {qIdx + 1} / {quizQuestions.length}</span>
            <span>Score : {score}</span>
          </div>
          <Progress value={((qIdx) / quizQuestions.length) * 100} className="h-2" />

          <Card className="p-8 rounded-2xl border-2 mt-6 shadow-card animate-fade-in" key={qIdx}>
            <p className="text-xl font-semibold leading-relaxed">{q.q}</p>
            <div className="mt-6 grid gap-3">
              {q.answers.map((a, i) => {
                const isCorrect = i === q.correct;
                const isPicked = picked === i;
                let cls = "border-2 hover:border-primary hover:bg-primary/5";
                if (picked !== null) {
                  if (isCorrect) cls = "border-2 border-success bg-success/10 text-success";
                  else if (isPicked) cls = "border-2 border-destructive bg-destructive/10 text-destructive";
                  else cls = "border-2 opacity-60";
                }
                return (
                  <button key={i} onClick={() => pick(i)} disabled={picked !== null}
                    className={`flex items-center gap-3 p-4 rounded-xl text-left transition ${cls}`}>
                    <span className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center font-bold text-sm shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{a}</span>
                    {picked !== null && isCorrect && <CheckCircle2 className="h-5 w-5" />}
                    {picked !== null && isPicked && !isCorrect && <XCircle className="h-5 w-5" />}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // end
  const pct = Math.round((score / quizQuestions.length) * 100);
  const predicted = Math.round((pct / 100) * 20);
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto text-center animate-scale-in">
        <div className="inline-flex h-20 w-20 rounded-full gradient-primary items-center justify-center shadow-glow mx-auto">
          <Trophy className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-extrabold mt-6">Quizz terminé !</h1>
        <p className="text-muted-foreground mt-2">Tu as répondu correctement à {score} / {quizQuestions.length} questions</p>

        <Card className="p-8 rounded-2xl border-2 mt-8 text-left shadow-card">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Score</p>
              <p className="text-4xl font-extrabold mt-1 gradient-text">{pct}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Target className="h-3 w-3" /> Prédiction exam</p>
              <p className="text-4xl font-extrabold mt-1">~{predicted}/20 🎯</p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-sm font-semibold mb-3">Points faibles</p>
            {wrong.length === 0 ? (
              <p className="text-sm text-success">Aucun ! Tu maîtrises tout 💪</p>
            ) : (
              <ul className="space-y-2">
                {wrong.map(i => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    {quizQuestions[i].q}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={start} size="lg" className="rounded-full gradient-primary border-0">
            <RefreshCw className="h-4 w-4 mr-2" /> Refaire les questions ratées
          </Button>
          <Button onClick={() => setPhase("select")} size="lg" variant="outline" className="rounded-full">Choisir un autre cours</Button>
        </div>
      </div>
    </AppLayout>
  );
}
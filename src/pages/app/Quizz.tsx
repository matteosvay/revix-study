import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, Trophy, Target, RefreshCw, CheckCircle2, XCircle, Loader2, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Q = { id: string; question: string; answers: string[]; correct_index: number; explanation: string };
type Quiz = { id: string; title: string };

export default function Quizz() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const presetId = params.get("id");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [phase, setPhase] = useState<"select" | "play" | "end">("select");
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("quizzes").select("id,title").eq("user_id", user.id).order("created_at", { ascending: false });
      setQuizzes((data as any) ?? []);
      if (presetId && data?.find(q => q.id === presetId)) {
        const q = data.find(x => x.id === presetId)!;
        startQuiz(q as any);
      }
    })();
  }, [user, presetId]);

  const startQuiz = async (q: Quiz) => {
    const { data } = await supabase.from("quiz_questions").select("*").eq("quiz_id", q.id).order("position");
    if (!data || !data.length) { toast.error("Quizz vide"); return; }
    setActiveQuiz(q);
    setQuestions(data as any);
    setQIdx(0); setPicked(null); setScore(0); setWrong([]);
    setPhase("play");
  };

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const ok = questions[qIdx].correct_index === i;
    if (ok) setScore(s => s + 1); else setWrong(w => [...w, qIdx]);
    setTimeout(async () => {
      if (qIdx + 1 >= questions.length) {
        setPhase("end");
        if (user && activeQuiz) {
          await supabase.from("quiz_attempts").insert({
            user_id: user.id, quiz_id: activeQuiz.id,
            score: ok ? score + 1 : score, total: questions.length,
            wrong_indices: ok ? wrong : [...wrong, qIdx],
          });
          await supabase.rpc("bump_streak", { p_user_id: user.id });
        }
      } else {
        setQIdx(qIdx + 1); setPicked(null);
      }
    }, 1300);
  };

  if (phase === "select") {
    return (
      <AppLayout>
        <PageHeader emoji="🧠" title="Quizz" subtitle="Choisis un quizz pour t'entraîner." />
        {quizzes.length === 0 ? (
          <div className="px-5 mt-6 text-center">
            <Brain className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <p className="font-serif text-xl mt-3">Aucun quizz</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Génère un quizz depuis un cours.</p>
          </div>
        ) : (
          <div className="px-2">
            {quizzes.map(q => (
              <button key={q.id} onClick={() => startQuiz(q)} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg notion-row text-left">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Brain className="h-4 w-4" />
                </div>
                <p className="flex-1 text-sm font-medium truncate">{q.title}</p>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </AppLayout>
    );
  }

  if (phase === "play") {
    const q = questions[qIdx];
    return (
      <AppLayout>
        <div className="px-5 pt-5">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
            <span>Question {qIdx + 1} / {questions.length}</span>
            <span>Score : {score}</span>
          </div>
          <Progress value={(qIdx / questions.length) * 100} className="h-1.5" />

          <div className="mt-6 animate-fade-in" key={qIdx}>
            <p className="font-serif text-xl leading-snug">{q.question}</p>
            <div className="mt-5 space-y-2">
              {q.answers.map((a, i) => {
                const isCorrect = i === q.correct_index;
                const isPicked = picked === i;
                let cls = "border bg-card hover:border-primary";
                if (picked !== null) {
                  if (isCorrect) cls = "border-2 border-success bg-success/10 text-success";
                  else if (isPicked) cls = "border-2 border-destructive bg-destructive/10 text-destructive";
                  else cls = "border opacity-50";
                }
                return (
                  <button key={i} onClick={() => pick(i)} disabled={picked !== null}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition ${cls}`}>
                    <span className="h-7 w-7 rounded-md bg-muted flex items-center justify-center font-semibold text-xs shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1 text-sm">{a}</span>
                    {picked !== null && isCorrect && <CheckCircle2 className="h-4 w-4" />}
                    {picked !== null && isPicked && !isCorrect && <XCircle className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
            {picked !== null && q.explanation && (
              <div className="mt-4 p-3 rounded-xl bg-muted/60 text-xs text-muted-foreground animate-fade-in">
                💡 {q.explanation}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  // end
  const pct = Math.round((score / questions.length) * 100);
  const predicted = Math.round((pct / 100) * 20);
  return (
    <AppLayout>
      <div className="px-5 pt-10 text-center animate-scale-in">
        <div className="inline-flex h-16 w-16 rounded-full gradient-primary items-center justify-center shadow-glow mx-auto">
          <Trophy className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="font-serif text-3xl mt-4">Bien joué !</h1>
        <p className="text-sm text-muted-foreground mt-1">{score} / {questions.length} bonnes réponses</p>

        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-xl border p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</p>
            <p className="font-serif text-3xl mt-1 gradient-text">{pct}%</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Target className="h-3 w-3" /> Pré-exam</p>
            <p className="font-serif text-3xl mt-1">~{predicted}/20</p>
          </div>
        </div>

        {wrong.length > 0 && (
          <div className="mt-6 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">À retravailler</p>
            <div className="space-y-2">
              {wrong.map(i => (
                <div key={i} className="rounded-lg border p-3 text-xs">
                  <p className="font-medium">{questions[i].question}</p>
                  <p className="text-success mt-1">✓ {questions[i].answers[questions[i].correct_index]}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 space-y-2">
          <Button onClick={() => activeQuiz && startQuiz(activeQuiz)} className="w-full rounded-full gradient-primary border-0">
            <RefreshCw className="h-4 w-4 mr-2" /> Refaire
          </Button>
          <Button onClick={() => setPhase("select")} variant="outline" className="w-full rounded-full">Autre quizz</Button>
        </div>
      </div>
    </AppLayout>
  );
}
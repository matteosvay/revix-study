import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Trophy, Target, RefreshCw, CheckCircle2, XCircle, Loader2, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type QType = "qcm" | "vrai_faux" | "ouvert" | "trous";
type Q = {
  id: string;
  question: string;
  type: QType;
  answers: string[] | null;
  correct_index: number | null;
  accepted_answers: string[] | null;
  explanation: string;
};
type Quiz = { id: string; title: string; quiz_type?: string };

const TYPE_LABELS: Record<QType, string> = {
  qcm: "QCM",
  vrai_faux: "Vrai / Faux",
  ouvert: "Question ouverte",
  trous: "Texte à trous",
};

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}\s]/gu, "").trim();
}

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
  const [textAnswer, setTextAnswer] = useState("");
  const [openResult, setOpenResult] = useState<{ correct: boolean; feedback: string } | null>(null);
  const [grading, setGrading] = useState(false);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("quizzes").select("id,title,quiz_type").eq("user_id", user.id).order("created_at", { ascending: false });
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
    setQIdx(0); setPicked(null); setTextAnswer(""); setOpenResult(null); setScore(0); setWrong([]);
    setPhase("play");
  };

  const advance = async (ok: boolean) => {
    const nextScore = ok ? score + 1 : score;
    const nextWrong = ok ? wrong : [...wrong, qIdx];
    if (ok) setScore(nextScore); else setWrong(nextWrong);
    setTimeout(async () => {
      if (qIdx + 1 >= questions.length) {
        setPhase("end");
        if (user && activeQuiz) {
          await supabase.from("quiz_attempts").insert({
            user_id: user.id, quiz_id: activeQuiz.id,
            score: nextScore, total: questions.length,
            wrong_indices: nextWrong,
          });
          await supabase.rpc("bump_streak", { p_user_id: user.id });
          // Incrémente le compteur quiz et octroie un jeton tous les 10 quiz
          const { data: tokenRes } = await supabase.rpc("increment_quiz_count", { p_user_id: user.id });
          if ((tokenRes as any)?.earned) {
            toast.success("❄️ Jeton de restauration gagné !", { description: "Sauve ta streak en cas de pépin." });
          }
        }
      } else {
        setQIdx(qIdx + 1); setPicked(null); setTextAnswer(""); setOpenResult(null);
      }
    }, 1500);
  };

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    advance(questions[qIdx].correct_index === i);
  };

  const submitText = async () => {
    const q = questions[qIdx];
    if (!textAnswer.trim()) { toast.error("Écris ta réponse."); return; }
    if (q.type === "trous") {
      const accepted = (q.accepted_answers ?? []).map(normalize);
      const user = normalize(textAnswer);
      const ok = accepted.includes(user) || accepted.some(a => user.includes(a) || a.includes(user));
      setOpenResult({ correct: ok, feedback: ok ? "Bonne réponse !" : `Attendu : ${q.accepted_answers?.[0] ?? "—"}` });
      advance(ok);
      return;
    }
    // ouvert -> IA
    setGrading(true);
    try {
      const { data, error } = await supabase.functions.invoke("grade-open", {
        body: {
          question: q.question,
          userAnswer: textAnswer,
          expectedAnswer: q.explanation,
          acceptedAnswers: q.accepted_answers ?? [],
        },
      });
      if (error) throw error;
      const ok = !!data?.correct;
      setOpenResult({ correct: ok, feedback: data?.feedback ?? "" });
      advance(ok);
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur de correction");
    } finally { setGrading(false); }
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
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{q.title}</p>
                  <p className="text-[11px] text-muted-foreground">{TYPE_LABELS[(q.quiz_type as QType) ?? "qcm"] ?? "QCM"}</p>
                </div>
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
    const isChoice = q.type === "qcm" || q.type === "vrai_faux";
    const choices = q.type === "vrai_faux" ? (q.answers ?? ["Vrai", "Faux"]) : (q.answers ?? []);
    return (
      <AppLayout>
        <div className="px-5 pt-5">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
            <span>Question {qIdx + 1} / {questions.length}</span>
            <span>Score : {score}</span>
          </div>
          <Progress value={(qIdx / questions.length) * 100} className="h-1.5" />

          <div className="mt-6 animate-fade-in" key={qIdx}>
            <span className="inline-block text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-3">
              {TYPE_LABELS[q.type]}
            </span>
            <p className="font-serif text-xl leading-snug">{q.question}</p>

            {isChoice ? (
              <div className="mt-5 space-y-2">
                {choices.map((a, i) => {
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
                        {q.type === "vrai_faux" ? (i === 0 ? "V" : "F") : String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1 text-sm">{a}</span>
                      {picked !== null && isCorrect && <CheckCircle2 className="h-4 w-4" />}
                      {picked !== null && isPicked && !isCorrect && <XCircle className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <Textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  disabled={openResult !== null || grading}
                  rows={q.type === "trous" ? 2 : 4}
                  placeholder={q.type === "trous" ? "Mot ou expression..." : "Rédige ta réponse en quelques phrases..."}
                  className="resize-none"
                />
                {openResult === null && (
                  <Button onClick={submitText} disabled={grading || !textAnswer.trim()} className="w-full rounded-full gradient-primary border-0">
                    {grading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Correction...</> : "Valider"}
                  </Button>
                )}
                {openResult && (
                  <div className={`p-3.5 rounded-xl border-2 ${openResult.correct ? "border-success bg-success/10" : "border-destructive bg-destructive/10"}`}>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      {openResult.correct ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                      <span className={openResult.correct ? "text-success" : "text-destructive"}>
                        {openResult.correct ? "Bonne réponse" : "À revoir"}
                      </span>
                    </div>
                    <p className="text-xs mt-1.5">{openResult.feedback}</p>
                  </div>
                )}
              </div>
            )}

            {((isChoice && picked !== null) || (!isChoice && openResult !== null)) && q.explanation && (
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
                  <p className="text-success mt-1">
                    ✓ {questions[i].answers && typeof questions[i].correct_index === "number"
                        ? questions[i].answers![questions[i].correct_index!]
                        : questions[i].accepted_answers?.[0] ?? questions[i].explanation}
                  </p>
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
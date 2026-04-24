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
import { awardXp, bumpQuest } from "@/hooks/useGamification";
import { XP_REWARDS } from "@/lib/gamification";
import { Tape, Pin, ScribbleUnderline } from "@/components/revix/AcademicDecor";
import { localDateKey } from "@/lib/date";

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
          const { data: profileState } = await supabase.from("profiles").select("last_active_date").eq("id", user.id).maybeSingle();
          const todayKey = localDateKey(new Date());
          const isFirstActivityToday = profileState?.last_active_date !== todayKey;
          await supabase.rpc("bump_streak", { p_user_id: user.id });
          // Incrémente le compteur quiz et octroie un jeton tous les 10 quiz
          const { data: tokenRes } = await supabase.rpc("increment_quiz_count", { p_user_id: user.id });
          if ((tokenRes as any)?.earned) {
            toast.success("📎 Pass de restauration gagné !", { description: "Colle-le sur une streak perdue." });
          }
          // XP : finir un quiz + bonus score
          const pct = (nextScore / questions.length) * 100;
          let total = XP_REWARDS.quiz_finish;
          if (pct >= 80) total += XP_REWARDS.quiz_high_score;
          if (pct === 100) total += XP_REWARDS.quiz_perfect;
          await awardXp(user.id, total, "quiz_finish");
          // Bump quêtes
          await bumpQuest(user.id, "quiz_done", 1);
          await bumpQuest(user.id, "w_5_quizzes", 1);
          await bumpQuest(user.id, "questions_answered", questions.length);
          if (pct >= 80) {
            await bumpQuest(user.id, "high_score", 1);
            await bumpQuest(user.id, "w_3_high_scores", 1);
          }
          if (pct === 100) await bumpQuest(user.id, "perfect_quiz", 1);
          if (isFirstActivityToday) {
            await bumpQuest(user.id, "streak_kept", 1);
            await bumpQuest(user.id, "w_7_streak", 1);
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
            <div className="inline-block notebook-card dog-ear p-6 max-w-xs mx-auto">
              <Brain className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <p className="font-hand text-2xl mt-2">Pas encore de quizz</p>
              <p className="text-sm text-muted-foreground mt-1">Génère un quizz depuis un cours.</p>
            </div>
          </div>
        ) : (
          <div className="px-4 space-y-3">
            {quizzes.map((q, i) => (
              <button
                key={q.id}
                onClick={() => startQuiz(q)}
                className={`relative notebook-card w-full flex items-center gap-3 p-4 text-left hover:shadow-glow transition-all ${i % 2 === 0 ? "tilt-l" : "tilt-r"}`}
              >
                <Tape variant={i % 3 === 0 ? "yellow" : i % 3 === 1 ? "pink" : "mint"} position="top-right" />
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Brain className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-base truncate">{q.title}</p>
                  <span className="label-tape mt-1">{TYPE_LABELS[(q.quiz_type as QType) ?? "qcm"] ?? "QCM"}</span>
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
    const postitVariants = ["", "answer-postit-pink", "answer-postit-blue", "answer-postit-mint"];
    return (
      <AppLayout>
        <div className="px-5 pt-5">
          <div className="flex items-center justify-between font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            <span>Question {qIdx + 1} / {questions.length}</span>
            <span>Score · {score}</span>
          </div>
          <div className="ruler-bar !h-2.5">
            <div className="ruler-fill" style={{ width: `${(qIdx / questions.length) * 100}%` }} />
          </div>

          <div className="mt-6 animate-scale-in" key={qIdx}>
            <div className="notebook-card p-5 relative">
              <span className="label-tape absolute -top-2 left-4">{TYPE_LABELS[q.type]}</span>
              <p className="font-serif text-xl leading-snug mt-2">{q.question}</p>
            </div>

            {isChoice ? (
              <div className="mt-5 grid grid-cols-1 gap-3">
                {choices.map((a, i) => {
                  const isCorrect = i === q.correct_index;
                  const isPicked = picked === i;
                  const variant = postitVariants[i % postitVariants.length];
                  const tilt = i % 2 === 0 ? "tilt-l" : "tilt-r";
                  let stateCls = "";
                  if (picked !== null) {
                    if (isCorrect) stateCls = "is-correct";
                    else if (isPicked) stateCls = "is-wrong";
                    else stateCls = "is-faded";
                  }
                  return (
                    <button key={i} onClick={() => pick(i)} disabled={picked !== null}
                      className={`answer-postit ${variant} ${tilt} ${stateCls} flex items-center gap-3`}>
                      <span className="h-7 w-7 rounded-md bg-foreground/15 flex items-center justify-center font-mono-tag font-bold text-xs shrink-0">
                        {q.type === "vrai_faux" ? (i === 0 ? "V" : "F") : String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{a}</span>
                      {picked !== null && isCorrect && <CheckCircle2 className="h-5 w-5 text-success" />}
                      {picked !== null && isPicked && !isCorrect && <XCircle className="h-5 w-5 text-destructive" />}
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
                  className="resize-none notebook-card !pl-12 font-hand !text-lg"
                />
                {openResult === null && (
                  <Button onClick={submitText} disabled={grading || !textAnswer.trim()} className="w-full rounded-full gradient-primary border-0">
                    {grading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Correction...</> : "Valider"}
                  </Button>
                )}
                {openResult && (
                  <div className={`answer-postit ${openResult.correct ? "is-correct" : "is-wrong"} !cursor-default`}>
                    <div className="flex items-center gap-2 font-mono-tag text-xs uppercase">
                      {openResult.correct ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                      <span>{openResult.correct ? "Bonne réponse" : "À revoir"}</span>
                    </div>
                    <p className="font-hand text-base mt-1.5">{openResult.feedback}</p>
                  </div>
                )}
              </div>
            )}

            {((isChoice && picked !== null) || (!isChoice && openResult !== null)) && q.explanation && (
              <div className="mt-4 p-3 rounded-md border-l-4 border-primary/40 bg-primary/10 animate-fade-in font-hand text-base text-foreground/80 -rotate-[0.5deg]">
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
  const stars = Math.max(1, Math.round((pct / 100) * 5));
  return (
    <AppLayout>
      <div className="px-5 pt-8 pb-6 animate-scale-in">
        <div className="notebook-page relative">
          <span className="rubber-stamp stamp-pop absolute top-3 right-4">{pct >= 80 ? "Très bien" : pct >= 50 ? "Bien" : "À revoir"}</span>

          <p className="font-mono-tag text-[10px] uppercase tracking-widest text-muted-foreground">Résultats</p>
          <h1 className="font-hand text-5xl text-primary mt-1 leading-none">{score} / {questions.length}</h1>
          <p className="font-serif text-base text-muted-foreground mt-1">soit <strong className="marker-yellow">{pct}%</strong></p>

          {/* étoiles dessinées */}
          <div className="flex gap-1 mt-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} viewBox="0 0 24 24" className={`h-7 w-7 ${i < stars ? "" : "opacity-25"}`} aria-hidden>
                <path className="sketchy-star" d="M12 2 L14.4 8.6 L21.5 9 L16 13.6 L17.8 20.5 L12 16.7 L6.2 20.5 L8 13.6 L2.5 9 L9.6 8.6 Z" />
              </svg>
            ))}
          </div>

          <div className="clip-divider my-5">
            <span className="font-mono-tag text-[10px] uppercase">Bilan</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="postit p-3 -rotate-2">
              <p className="font-mono-tag text-[10px] uppercase opacity-70">Score</p>
              <p className="font-hand text-3xl mt-1">{pct}%</p>
            </div>
            <div className="postit postit-pink p-3 rotate-2">
              <p className="font-mono-tag text-[10px] uppercase opacity-70 flex items-center gap-1"><Target className="h-3 w-3" /> Pré-exam</p>
              <p className="font-hand text-3xl mt-1">~{predicted}/20</p>
            </div>
          </div>

          {wrong.length > 0 && (
            <div className="mt-5">
              <p className="font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground mb-2">À retravailler</p>
              <div className="space-y-2">
                {wrong.map(i => (
                  <div key={i} className="text-sm">
                    <p className="font-medium">{questions[i].question}</p>
                    <p className="font-hand text-base text-green-700 mt-0.5">
                      → {questions[i].answers && typeof questions[i].correct_index === "number"
                          ? questions[i].answers![questions[i].correct_index!]
                          : questions[i].accepted_answers?.[0] ?? questions[i].explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-3 justify-center">
          <button onClick={() => activeQuiz && startQuiz(activeQuiz)} className="pen-btn pen-btn-blue">
            <RefreshCw className="h-4 w-4 inline mr-1" /> Refaire
          </button>
          <button onClick={() => setPhase("select")} className="pen-btn pen-btn-green">Autre quizz</button>
        </div>
      </div>
    </AppLayout>
  );
}
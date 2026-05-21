import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Brain, Trash2, Loader2, ListChecks, CheckSquare, ToggleLeft, ArrowDownUp, Link2, Sparkles, Layers } from "lucide-react";
import { BackButton } from "@/components/revix/BackButton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CourseSummary, type CourseSummaryData } from "@/components/revix/CourseSummary";

type Course = { id: string; title: string; subject: string | null; emoji: string | null; source_content: string | null; summary: CourseSummaryData | null };

const QUIZ_TYPES = [
  { value: "qcm", label: "QCM", emoji: "🎯", desc: "Choisis la bonne réponse parmi 4", icon: ListChecks },
  { value: "qcm_multi", label: "Multi-réponses", emoji: "✅", desc: "Coche toutes les bonnes réponses", icon: CheckSquare },
  { value: "vrai_faux", label: "Vrai / Faux", emoji: "⚖️", desc: "Juge des affirmations rapidement", icon: ToggleLeft },
  { value: "association", label: "Association", emoji: "🔗", desc: "Relie chaque terme à sa définition", icon: Link2 },
  { value: "ordre", label: "Mise en ordre", emoji: "🔢", desc: "Remets les éléments dans l'ordre", icon: ArrowDownUp },
] as const;
const COUNT_PRESETS = [5, 10, 15, 20, 30];
const DIFFICULTIES = [
  { value: "facile", label: "Facile", emoji: "🌱", desc: "Mémorisation, définitions" },
  { value: "moyen", label: "Moyen", emoji: "📘", desc: "Compréhension, application" },
  { value: "difficile", label: "Difficile", emoji: "🔥", desc: "Analyse, mise en relation" },
  { value: "expert", label: "Expert", emoji: "🧠", desc: "Pièges subtils, niveau examen" },
  { value: "mixte", label: "Mixte", emoji: "🎲", desc: "Progressif facile → difficile" },
] as const;

export default function CourseDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [quizSheetOpen, setQuizSheetOpen] = useState(false);
  const [quizType, setQuizType] = useState<string>("qcm");
  const [quizCount, setQuizCount] = useState<number>(10);
  const [quizDifficulty, setQuizDifficulty] = useState<string>("mixte");
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [flashcardCount, setFlashcardCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data: c } = await supabase
        .from("courses")
        .select("id,title,subject,emoji,source_content,summary")
        .eq("id", id!)
        .eq("user_id", user.id)
        .single();
      if (active) setCourse(c as any);
    })();
    return () => { active = false; };
  }, [id, user]);

  useEffect(() => {
    if (!course || !user) return;
    (supabase as any)
      .from("flashcards")
      .select("id", { count: "exact", head: true })
      .eq("course_id", course.id)
      .eq("user_id", user.id)
      .then(({ count }) => setFlashcardCount(count ?? 0));
  }, [course, user]);

  const generateFlashcards = async () => {
    if (!course?.source_content) { toast.error("Contenu source indisponible."); return; }
    setGeneratingFlashcards(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-flashcards", {
        body: { content: course.source_content, subject: course.subject, title: course.title, courseId: course.id, count: 15 },
      });
      if (error) throw error;
      setFlashcardCount(data?.count ?? 0);
      toast.success(`${data?.count ?? 0} flashcards générées ✨`);
      nav(`/app/flashcards?deck=${course.id}`);
    } catch (e: any) { toast.error(e?.message ?? "Erreur"); }
    finally { setGeneratingFlashcards(false); }
  };

  const generateQuiz = async (chapterFilter?: string) => {
    if (!course?.source_content) { toast.error("Contenu source indisponible."); return; }
    setCreatingQuiz(true);
    try {
      const chapters = course.summary?.sections?.map((s) => s.title).filter(Boolean) ?? [];
      // Récupère les questions déjà posées sur ce cours pour éviter les doublons
      const { data: prevQuizzes } = await supabase
        .from("quizzes").select("id").eq("course_id", course.id).order("created_at", { ascending: false }).limit(10);
      const prevIds = (prevQuizzes ?? []).map(q => q.id);
      let avoidQuestions: string[] = [];
      if (prevIds.length) {
        const { data: prevQs } = await supabase
          .from("quiz_questions").select("question").in("quiz_id", prevIds).limit(60);
        avoidQuestions = (prevQs ?? []).map(q => q.question).filter(Boolean);
      }
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: {
          content: course.source_content,
          subject: course.subject,
          title: course.title,
          count: quizCount,
          quizType,
          difficulty: quizDifficulty,
          avoidQuestions,
          chapters,
          chapter: chapterFilter ?? null,
        },
      });
      if (error) throw error;
      const qs = data?.questions ?? [];
      if (!qs.length) throw new Error("Aucune question générée.");
      const { data: { user } } = await supabase.auth.getUser();
      const titleSuffix = chapterFilter ? ` · ${chapterFilter}` : "";
      const { data: quiz, error: qErr } = await supabase.from("quizzes").insert({
        user_id: user!.id, course_id: course.id, title: `Quizz · ${course.title}${titleSuffix}`, quiz_type: quizType,
      }).select().single();
      if (qErr) throw qErr;
      const rows = qs.map((q: any, i: number) => {
        // Pour qcm_multi : on stocke correct_indices dans accepted_answers (JSON-encodé en strings)
        // Pour ordre : on stocke correct_order dans accepted_answers
        // Pour association : on stocke les paires sérialisées JSON dans accepted_answers
        let acceptedAnswers = q.accepted_answers ?? null;
        let answers = q.answers ?? null;
        if (q.type === "qcm_multi" && Array.isArray(q.correct_indices)) {
          acceptedAnswers = q.correct_indices.map((n: number) => String(n));
        } else if (q.type === "ordre" && Array.isArray(q.correct_order)) {
          acceptedAnswers = q.correct_order.map((n: number) => String(n));
        } else if (q.type === "association" && Array.isArray(q.pairs)) {
          // answers = labels gauche (préservés dans l'ordre), accepted_answers = JSON paires complètes
          answers = q.pairs.map((p: any) => p.left);
          acceptedAnswers = [JSON.stringify(q.pairs)];
        }
        return {
          quiz_id: quiz.id, user_id: user!.id, question: q.question,
          type: q.type ?? quizType,
          answers,
          correct_index: typeof q.correct_index === "number" ? q.correct_index : null,
          accepted_answers: acceptedAnswers,
          explanation: q.explanation, position: i,
          chapter: q.chapter ?? chapterFilter ?? null,
        };
      });
      await supabase.from("quiz_questions").insert(rows);
      toast.success("Quizz créé ✨");
      setQuizSheetOpen(false);
      nav(`/app/quizz?id=${quiz.id}`);
    } catch (e: any) { toast.error(e?.message ?? "Erreur"); }
    finally { setCreatingQuiz(false); }
  };

  const remove = async () => {
    await supabase.from("courses").delete().eq("id", id!);
    nav("/app/fiches");
  };

  if (!course) return <AppLayout><div className="p-5 text-sm text-muted-foreground">Chargement...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="flex items-center gap-1 pr-3">
        <BackButton fallback="/app/fiches" />
        <div className="flex-1" />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full text-destructive mt-4">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce cours ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le cours et ses quizz associés seront supprimés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="px-5 pt-2 pb-4">
        <div className="text-4xl">{course.emoji ?? "📘"}</div>
        <h1 className="font-serif text-3xl mt-2">{course.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{course.subject ?? "—"}</p>
      </div>

      <div className="px-5 pb-32">
        {course.summary ? (
          <CourseSummary data={course.summary} />
        ) : (
          <p className="text-sm text-muted-foreground">Aucun résumé pour ce cours.</p>
        )}

        <Button
          onClick={generateFlashcards}
          disabled={generatingFlashcards}
          variant="outline"
          className="w-full mt-4 rounded-full h-12 border-2 border-foreground shadow-brutal-sm font-semibold"
        >
          {generatingFlashcards ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Génération...</>
          ) : flashcardCount > 0 ? (
            <><Layers className="h-4 w-4 mr-2" /> Flashcards ({flashcardCount} cartes)</>
          ) : (
            <><Layers className="h-4 w-4 mr-2" /> Générer des flashcards</>
          )}
        </Button>

        <Sheet open={quizSheetOpen} onOpenChange={setQuizSheetOpen}>
          <SheetTrigger asChild>
            <Button className="w-full mt-7 rounded-full gradient-primary border-0 h-12 shadow-glow">
              <Brain className="h-4 w-4 mr-2" /> Créer un quizz
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <SheetHeader className="text-left">
              <SheetTitle className="font-serif text-2xl">Configure ton quizz ✨</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">Choisis ton ambiance, on s'occupe du reste.</p>
            </SheetHeader>

            <div className="mt-5 space-y-6">
              {/* Type d'exercice — gros visuels */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Type d'exercice</Label>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {QUIZ_TYPES.map((t) => {
                    const Icon = t.icon;
                    const active = quizType === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setQuizType(t.value)}
                        className={`relative text-left p-3 rounded-2xl border-2 transition-all overflow-hidden ${
                          active
                            ? "border-primary bg-primary/8 shadow-glow scale-[1.02]"
                            : "border-border bg-card hover:border-primary/40 hover:bg-primary/[0.03]"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-xl transition ${
                              active ? "bg-primary/15" : "bg-muted/40"
                            }`}
                          >
                            {t.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[13px] leading-tight flex items-center gap-1">
                              {t.label}
                              {active && <Icon className="h-3 w-3 text-primary" />}
                            </p>
                            <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{t.desc}</p>
                          </div>
                        </div>
                        {active && (
                          <div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulté */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Difficulté</Label>
                  <span className="text-[11px] text-muted-foreground italic">
                    {DIFFICULTIES.find((d) => d.value === quizDifficulty)?.desc}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setQuizDifficulty(d.value)}
                      className={`flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl border-2 transition ${
                        quizDifficulty === d.value
                          ? "border-primary bg-primary/10 scale-105"
                          : "border-border bg-card hover:border-primary/30"
                      }`}
                    >
                      <span className="text-lg">{d.emoji}</span>
                      <span className="text-[10px] font-semibold leading-tight">{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombre */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Nombre de questions</Label>
                  <span className="font-bold text-primary text-sm">{quizCount}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 mb-3">
                  {COUNT_PRESETS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setQuizCount(n)}
                      className={`h-10 rounded-xl border-2 font-semibold transition text-sm ${
                        quizCount === n
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <Slider value={[quizCount]} onValueChange={(v) => setQuizCount(v[0])} min={3} max={50} step={1} />
              </div>

              <Button
                onClick={() => generateQuiz()}
                disabled={creatingQuiz}
                className="w-full rounded-full gradient-primary border-0 h-12 text-base font-semibold shadow-glow"
              >
                {creatingQuiz ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Génération...</>
                ) : (
                  <><Brain className="h-4 w-4 mr-2" /> Lancer le quizz</>
                )}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}
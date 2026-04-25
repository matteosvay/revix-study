import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, Trash2, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CourseSummary, type CourseSummaryData } from "@/components/revix/CourseSummary";
import { ChapterHeatmap } from "@/components/revix/ChapterHeatmap";
import { VoiceNotes } from "@/components/revix/VoiceNotes";

type Course = { id: string; title: string; subject: string | null; emoji: string | null; source_content: string | null; summary: CourseSummaryData | null };

const QUIZ_TYPES = [
  { value: "qcm", label: "QCM", desc: "Choix multiple, 4 réponses possibles" },
  { value: "vrai_faux", label: "Vrai / Faux", desc: "Affirmations à juger" },
  { value: "ouvert", label: "Questions ouvertes", desc: "Réponse rédigée, corrigée par l'IA" },
  { value: "trous", label: "Texte à trous", desc: "Compléter les mots manquants" },
] as const;
const COUNT_OPTIONS = [5, 10, 15, 20];

export default function CourseDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [quizSheetOpen, setQuizSheetOpen] = useState(false);
  const [quizType, setQuizType] = useState<string>("qcm");
  const [quizCount, setQuizCount] = useState<number>(10);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase
        .from("courses")
        .select("id,title,subject,emoji,source_content,summary")
        .eq("id", id!)
        .single();
      setCourse(c as any);
    })();
  }, [id]);

  const generateQuiz = async (chapterFilter?: string) => {
    if (!course?.source_content) { toast.error("Contenu source indisponible."); return; }
    setCreatingQuiz(true);
    try {
      const chapters = course.summary?.sections?.map((s) => s.title).filter(Boolean) ?? [];
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: {
          content: course.source_content,
          subject: course.subject,
          title: course.title,
          count: quizCount,
          quizType,
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
      const rows = qs.map((q: any, i: number) => ({
        quiz_id: quiz.id, user_id: user!.id, question: q.question,
        type: q.type ?? quizType,
        answers: q.answers ?? null,
        correct_index: typeof q.correct_index === "number" ? q.correct_index : null,
        accepted_answers: q.accepted_answers ?? null,
        explanation: q.explanation, position: i,
        chapter: q.chapter ?? chapterFilter ?? null,
      }));
      await supabase.from("quiz_questions").insert(rows);
      toast.success("Quizz créé ✨");
      setQuizSheetOpen(false);
      nav(`/app/quizz?id=${quiz.id}`);
    } catch (e: any) { toast.error(e?.message ?? "Erreur"); }
    finally { setCreatingQuiz(false); }
  };

  const remove = async () => {
    if (!confirm("Supprimer ce cours ?")) return;
    await supabase.from("courses").delete().eq("id", id!);
    nav("/app/fiches");
  };

  if (!course) return <AppLayout><div className="p-5 text-sm text-muted-foreground">Chargement...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="px-3 pt-3 flex items-center gap-1">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link to="/app/fiches"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1" />
        <Button onClick={remove} variant="ghost" size="icon" className="rounded-full text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
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

        <ChapterHeatmap
          courseId={course.id}
          courseTitle={course.title}
          sourceContent={course.source_content}
          subject={course.subject}
        />

        <VoiceNotes courseId={course.id} />

        <Sheet open={quizSheetOpen} onOpenChange={setQuizSheetOpen}>
          <SheetTrigger asChild>
            <Button className="w-full mt-7 rounded-full gradient-primary border-0 h-12 shadow-glow">
              <Brain className="h-4 w-4 mr-2" /> Créer un quizz
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <SheetHeader className="text-left">
              <SheetTitle className="font-serif text-2xl">Configurer ton quizz ✨</SheetTitle>
            </SheetHeader>

            <div className="mt-5 space-y-5">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Type de quizz</Label>
                <RadioGroup value={quizType} onValueChange={setQuizType} className="mt-2 space-y-2">
                  {QUIZ_TYPES.map(t => (
                    <label key={t.value} htmlFor={`qt-${t.value}`}
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${quizType === t.value ? "border-primary bg-primary/5" : "border-border"}`}>
                      <RadioGroupItem id={`qt-${t.value}`} value={t.value} className="mt-1" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{t.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nombre de questions</Label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {COUNT_OPTIONS.map(n => (
                    <button key={n} type="button" onClick={() => setQuizCount(n)}
                      className={`h-12 rounded-xl border-2 font-semibold transition ${quizCount === n ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={() => generateQuiz()} disabled={creatingQuiz} className="w-full rounded-full gradient-primary border-0 h-12">
                {creatingQuiz ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Génération...</> : <><Brain className="h-4 w-4 mr-2" /> Générer le quizz</>}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}
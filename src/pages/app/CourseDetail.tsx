import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, Brain, Trash2, Loader2, FileText, Layers } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CourseSummary, type CourseSummaryData } from "@/components/revix/CourseSummary";

type Course = { id: string; title: string; subject: string | null; emoji: string | null; source_content: string | null; summary: CourseSummaryData | null };
type Card = { id: string; front: string; back: string };

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
  const [cards, setCards] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [quizSheetOpen, setQuizSheetOpen] = useState(false);
  const [quizType, setQuizType] = useState<string>("qcm");
  const [quizCount, setQuizCount] = useState<number>(10);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: f }] = await Promise.all([
        supabase.from("courses").select("id,title,subject,emoji,source_content,summary").eq("id", id!).single(),
        supabase.from("flashcards").select("id,front,back").eq("course_id", id!).order("position"),
      ]);
      setCourse(c as any);
      setCards((f as any) ?? []);
    })();
  }, [id]);

  const generateQuiz = async () => {
    if (!course?.source_content) { toast.error("Contenu source indisponible."); return; }
    setCreatingQuiz(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: { content: course.source_content, subject: course.subject, title: course.title, count: quizCount, quizType },
      });
      if (error) throw error;
      const qs = data?.questions ?? [];
      if (!qs.length) throw new Error("Aucune question générée.");
      const { data: { user } } = await supabase.auth.getUser();
      const { data: quiz, error: qErr } = await supabase.from("quizzes").insert({
        user_id: user!.id, course_id: course.id, title: `Quizz · ${course.title}`, quiz_type: quizType,
      }).select().single();
      if (qErr) throw qErr;
      const rows = qs.map((q: any, i: number) => ({
        quiz_id: quiz.id, user_id: user!.id, question: q.question,
        type: q.type ?? quizType,
        answers: q.answers ?? null,
        correct_index: typeof q.correct_index === "number" ? q.correct_index : null,
        accepted_answers: q.accepted_answers ?? null,
        explanation: q.explanation, position: i,
      }));
      await supabase.from("quiz_questions").insert(rows);
      toast.success("Quizz créé ✨");
      setQuizSheetOpen(false);
      nav(`/app/quizz?id=${quiz.id}`);
    } catch (e: any) { toast.error(e?.message ?? "Erreur"); }
    finally { setCreatingQuiz(false); }
  };

  const remove = async () => {
    if (!confirm("Supprimer ce cours et ses fiches ?")) return;
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
        <p className="text-sm text-muted-foreground mt-1">{course.subject ?? "—"} · {cards.length} fiches</p>
      </div>

      <div className="px-5 pb-32">
        <Tabs defaultValue={course.summary ? "summary" : "cards"}>
          <TabsList className="grid w-full grid-cols-2 rounded-full bg-muted/60">
            <TabsTrigger value="summary" className="rounded-full data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-3.5 w-3.5 mr-1.5" /> Résumé
            </TabsTrigger>
            <TabsTrigger value="cards" className="rounded-full data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <Layers className="h-3.5 w-3.5 mr-1.5" /> Flashcards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-5">
            {course.summary ? (
              <CourseSummary data={course.summary} />
            ) : (
              <p className="text-sm text-muted-foreground">Aucun résumé pour ce cours (généré automatiquement pour les nouveaux cours).</p>
            )}
          </TabsContent>

          <TabsContent value="cards" className="mt-5">
            {cards.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune fiche.</p>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground mb-2 text-center">Fiche {idx + 1} / {cards.length}</p>
                <div className={`flip-card ${flipped ? "flipped" : ""} h-72 cursor-pointer`} onClick={() => setFlipped(f => !f)}>
                  <div className="flip-inner h-full w-full">
                    <div className="flip-face rounded-2xl border-2 p-6 flex items-center justify-center text-center bg-card shadow-card">
                      <p className="text-lg font-serif">{cards[idx].front}</p>
                    </div>
                    <div className="flip-face flip-back rounded-2xl border-0 p-6 flex items-center justify-center text-center gradient-primary text-primary-foreground shadow-glow">
                      <p className="text-base leading-relaxed">{cards[idx].back}</p>
                    </div>
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-2">Touche la carte pour la retourner</p>
                <div className="mt-4 flex items-center justify-between">
                  <Button variant="outline" size="icon" onClick={() => { setFlipped(false); setIdx(i => Math.max(0, i - 1)); }} disabled={idx === 0} className="rounded-full">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 mx-3 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full gradient-primary transition-all" style={{ width: `${((idx + 1) / cards.length) * 100}%` }} />
                  </div>
                  <Button variant="outline" size="icon" onClick={() => { setFlipped(false); setIdx(i => Math.min(cards.length - 1, i + 1)); }} disabled={idx === cards.length - 1} className="rounded-full">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

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

              <Button onClick={generateQuiz} disabled={creatingQuiz} className="w-full rounded-full gradient-primary border-0 h-12">
                {creatingQuiz ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Génération...</> : <><Brain className="h-4 w-4 mr-2" /> Générer le quizz</>}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}
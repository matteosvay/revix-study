import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, Brain, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Course = { id: string; title: string; subject: string | null; emoji: string | null; source_content: string | null };
type Card = { id: string; front: string; back: string };

export default function CourseDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [creatingQuiz, setCreatingQuiz] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: f }] = await Promise.all([
        supabase.from("courses").select("id,title,subject,emoji,source_content").eq("id", id!).single(),
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
        body: { content: course.source_content, subject: course.subject, title: course.title, count: 5 },
      });
      if (error) throw error;
      const qs = data?.questions ?? [];
      if (!qs.length) throw new Error("Aucune question générée.");
      const { data: { user } } = await supabase.auth.getUser();
      const { data: quiz, error: qErr } = await supabase.from("quizzes").insert({
        user_id: user!.id, course_id: course.id, title: `Quizz · ${course.title}`,
      }).select().single();
      if (qErr) throw qErr;
      const rows = qs.map((q: any, i: number) => ({
        quiz_id: quiz.id, user_id: user!.id, question: q.question, answers: q.answers,
        correct_index: q.correct_index, explanation: q.explanation, position: i,
      }));
      await supabase.from("quiz_questions").insert(rows);
      toast.success("Quizz créé ✨");
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

      {cards.length === 0 ? (
        <p className="px-5 text-sm text-muted-foreground">Aucune fiche.</p>
      ) : (
        <div className="px-5">
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

          <Button onClick={generateQuiz} disabled={creatingQuiz} className="w-full mt-6 rounded-full gradient-primary border-0">
            {creatingQuiz ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Création...</> : <><Brain className="h-4 w-4 mr-2" /> Générer un quizz</>}
          </Button>
        </div>
      )}
    </AppLayout>
  );
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Zap, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/** Crée un quiz flash (5 questions) basé sur les chapitres où l'user a des erreurs récentes. */
export function FlashQuizCard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const openPicker = async () => {
    if (!user || loading) return;
    setOpen(true);
    setLoadingSubjects(true);
    // Récupère les matières distinctes depuis les cours qui ont des QCM
    const { data: courses } = await supabase
      .from("courses")
      .select("subject")
      .eq("user_id", user.id)
      .not("subject", "is", null);
    const uniq = Array.from(new Set((courses ?? []).map((c: any) => c.subject).filter(Boolean))) as string[];
    setSubjects(uniq.sort());
    setLoadingSubjects(false);
  };

  const launch = async (subject: string | null) => {
    if (!user || loading) return;
    setLoading(true);
    try {
      // 1. Récupère les quizzes filtrés par matière (via course_id)
      let quizQuery = supabase.from("quizzes").select("id, course_id, courses!inner(subject)").eq("user_id", user.id);
      if (subject) quizQuery = quizQuery.eq("courses.subject", subject);
      const { data: filteredQuizzes } = await quizQuery;
      const quizIds = (filteredQuizzes ?? []).map((q: any) => q.id);

      let pool: any[] = [];
      if (quizIds.length > 0) {
        const { data: qs } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("user_id", user.id)
          .eq("type", "qcm")
          .in("quiz_id", quizIds)
          .limit(80);
        pool = qs ?? [];
      }
      // Fallback : QCM sans filtre matière
      if (pool.length < 5 && !subject) {
        const { data: qs } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("user_id", user.id)
          .eq("type", "qcm")
          .limit(80);
        pool = qs ?? [];
      }

      if (pool.length < 3) {
        toast.error(subject
          ? `Pas assez de QCM pour ${subject}. Crée un quizz dans cette matière.`
          : "Pas assez de questions. Crée d'abord un quizz.");
        return;
      }

      // Mélange et prend 5
      const picked = pool.sort(() => Math.random() - 0.5).slice(0, Math.min(5, pool.length));

      // 3. Crée un quiz éphémère
      const flashTitle = subject ? `⚡ Flash · ${subject}` : "⚡ Flash 5 min";
      const { data: quiz, error: qErr } = await supabase
        .from("quizzes")
        .insert({ user_id: user.id, title: flashTitle, quiz_type: "qcm" })
        .select()
        .single();
      if (qErr) throw qErr;

      const rows = picked.map((q: any, i: number) => ({
        quiz_id: quiz.id,
        user_id: user.id,
        question: q.question,
        type: q.type,
        answers: q.answers,
        correct_index: q.correct_index,
        accepted_answers: q.accepted_answers,
        explanation: q.explanation,
        chapter: q.chapter,
        position: i,
      }));
      await supabase.from("quiz_questions").insert(rows);

      setOpen(false);
      nav(`/app/quizz?id=${quiz.id}&mode=flash`);
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <button
      onClick={openPicker}
      disabled={loading}
      className="block w-full card-paper p-3 mb-3 text-left hover:shadow-glow transition-all tilt-l relative"
    >
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-accent text-accent-foreground border-[2.5px] border-foreground flex items-center justify-center shrink-0 shadow-brutal-sm">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-base leading-none">J'ai 5 minutes ⚡</p>
          <p className="text-xs text-muted-foreground mt-1">5 questions ciblées par matière</p>
        </div>
        <span className="font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground">Go</span>
      </div>
    </button>

    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="font-serif text-2xl">Quelle matière ? ⚡</SheetTitle>
        </SheetHeader>
        <div className="mt-5 space-y-2">
          <button
            onClick={() => launch(null)}
            disabled={loading}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-foreground bg-accent text-accent-foreground shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition disabled:opacity-50"
          >
            <Zap className="h-5 w-5 shrink-0" />
            <div className="flex-1 text-left">
              <p className="font-serif text-base leading-none">Toutes matières mélangées</p>
              <p className="text-xs opacity-70 mt-1">Surprise ! 5 questions au hasard</p>
            </div>
          </button>
          {loadingSubjects && (
            <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Chargement des matières...
            </div>
          )}
          {!loadingSubjects && subjects.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune matière trouvée. Ajoute des cours avec une matière.
            </p>
          )}
          {!loadingSubjects && subjects.map((s) => (
            <button
              key={s}
              onClick={() => launch(s)}
              disabled={loading}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition disabled:opacity-50"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="flex-1 text-left font-medium text-sm">{s}</span>
              {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}
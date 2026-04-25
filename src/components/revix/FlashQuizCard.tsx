import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";

/** Crée un quiz flash (5 questions) basé sur les chapitres où l'user a des erreurs récentes. */
export function FlashQuizCard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  const launch = async () => {
    if (!user || loading) return;
    setLoading(true);
    try {
      // 1. Trouver les chapitres faibles (erreurs récentes)
      const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select("quiz_id, wrong_indices")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      const weakQuestionIds = new Set<string>();
      const quizIds = new Set<string>();
      for (const a of (attempts ?? []) as any[]) {
        if (a.wrong_indices && Array.isArray(a.wrong_indices)) {
          quizIds.add(a.quiz_id);
        }
      }

      // 2. Récupérer 5 questions QCM au hasard parmi les quizzes joués
      let pool: any[] = [];
      if (quizIds.size > 0) {
        const { data: qs } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("user_id", user.id)
          .eq("type", "qcm")
          .in("quiz_id", Array.from(quizIds))
          .limit(50);
        pool = qs ?? [];
      }
      // Fallback : prendre n'importe quel QCM de l'user
      if (pool.length < 5) {
        const { data: qs } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("user_id", user.id)
          .eq("type", "qcm")
          .limit(50);
        pool = qs ?? [];
      }

      if (pool.length < 3) {
        toast.error("Pas assez de questions. Crée d'abord un quizz à partir d'un cours.");
        return;
      }

      // Mélange et prend 5
      const picked = pool.sort(() => Math.random() - 0.5).slice(0, Math.min(5, pool.length));

      // 3. Crée un quiz éphémère
      const { data: quiz, error: qErr } = await supabase
        .from("quizzes")
        .insert({ user_id: user.id, title: "⚡ Flash 5 min", quiz_type: "qcm" })
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

      nav(`/app/quizz?id=${quiz.id}&mode=flash`);
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={launch}
      disabled={loading}
      className="block w-full card-paper p-3 mb-3 text-left hover:shadow-glow transition-all tilt-l relative"
    >
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-accent text-accent-foreground border-[2.5px] border-foreground flex items-center justify-center shrink-0 shadow-brutal-sm">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-base leading-none">J'ai 5 minutes ⚡</p>
          <p className="text-xs text-muted-foreground mt-1">5 questions sur tes chapitres faibles</p>
        </div>
        <span className="font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground">Go</span>
      </div>
    </button>
  );
}
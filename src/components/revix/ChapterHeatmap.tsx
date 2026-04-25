import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Trophy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type Mastery = {
  chapter: string;
  total_questions: number;
  reviewed_questions: number;
  mastered_questions: number;
  due_today: number;
  avg_ease: number | null;
  mastery_pct: number;
};

function colorFor(pct: number) {
  if (pct >= 80) return "bg-success text-success-foreground";
  if (pct >= 50) return "bg-primary/70 text-primary-foreground";
  if (pct >= 20) return "bg-amber-400/80 text-foreground";
  return "bg-destructive/70 text-destructive-foreground";
}

export function ChapterHeatmap({ courseId, courseTitle, sourceContent, subject }: {
  courseId: string;
  courseTitle: string;
  sourceContent: string | null;
  subject: string | null;
}) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState<Mastery[]>([]);
  const [loading, setLoading] = useState(true);
  const [bossLoading, setBossLoading] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: rows } = await supabase.rpc("get_chapter_mastery", { p_course_id: courseId });
      setData((rows as any) ?? []);
      setLoading(false);
    })();
  }, [courseId]);

  const launchBoss = async (chapter: string) => {
    if (!user || !sourceContent) { toast.error("Contenu indisponible"); return; }
    setBossLoading(chapter);
    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: {
          content: sourceContent, subject, title: courseTitle,
          count: 15, quizType: "qcm", chapter,
          chapters: [chapter],
        },
      });
      if (error) throw error;
      const qs = data?.questions ?? [];
      if (!qs.length) throw new Error("Aucune question générée");
      const { data: quiz, error: qErr } = await supabase.from("quizzes").insert({
        user_id: user.id, course_id: courseId,
        title: `👹 Boss · ${chapter}`, quiz_type: "qcm",
      }).select().single();
      if (qErr) throw qErr;
      await supabase.from("quiz_questions").insert(qs.map((q: any, i: number) => ({
        quiz_id: quiz.id, user_id: user.id, question: q.question,
        type: q.type ?? "qcm", answers: q.answers ?? null,
        correct_index: typeof q.correct_index === "number" ? q.correct_index : null,
        accepted_answers: q.accepted_answers ?? null,
        explanation: q.explanation, position: i, chapter,
      })));
      toast.success("👹 Boss prêt — bonne chance !");
      nav(`/app/quizz?id=${quiz.id}`);
    } catch (e: any) { toast.error(e?.message ?? "Erreur"); }
    finally { setBossLoading(null); }
  };

  if (loading) return <div className="text-xs text-muted-foreground">Chargement de la maîtrise...</div>;
  if (!data.length) return null;

  const weakest = [...data].filter(d => d.reviewed_questions > 0).sort((a, b) => a.mastery_pct - b.mastery_pct)[0];

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Flame className="h-4 w-4 text-primary" />
        <p className="font-mono-tag text-[11px] uppercase tracking-wider text-muted-foreground">Maîtrise par chapitre</p>
      </div>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.chapter} className="notebook-card p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-serif text-sm flex-1 truncate">{d.chapter}</p>
              <span className={`font-mono-tag text-[10px] px-2 py-0.5 rounded-full font-bold ${colorFor(d.mastery_pct)}`}>
                {d.mastery_pct}%
              </span>
            </div>
            <div className="mt-1.5 h-2 bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${colorFor(d.mastery_pct).split(" ")[0]} transition-all`} style={{ width: `${d.mastery_pct}%` }} />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{d.mastered_questions}/{d.total_questions} maîtrisées</span>
              {d.due_today > 0 && <span className="text-primary font-medium">{d.due_today} à réviser</span>}
            </div>
          </div>
        ))}
      </div>

      {weakest && (
        <Button
          onClick={() => launchBoss(weakest.chapter)}
          disabled={!!bossLoading}
          className="w-full mt-4 rounded-full border-2 border-foreground bg-destructive text-destructive-foreground font-bold h-12 shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-brutal-sm transition-all"
        >
          {bossLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Préparation du boss...</> : <><Trophy className="h-4 w-4 mr-2" /> Combat le boss · {weakest.chapter}</>}
        </Button>
      )}
    </div>
  );
}
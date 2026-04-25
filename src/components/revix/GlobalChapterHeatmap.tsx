import { useEffect, useState } from "react";
import { Loader2, Trophy, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Row = {
  course_id: string;
  course_title: string;
  course_emoji: string | null;
  chapter: string;
  total_questions: number;
  reviewed_questions: number;
  mastered_questions: number;
  due_today: number;
  mastery_pct: number;
};

function colorFor(pct: number) {
  if (pct >= 80) return "bg-success text-success-foreground";
  if (pct >= 50) return "bg-primary/70 text-primary-foreground";
  if (pct >= 20) return "bg-amber-400/80 text-foreground";
  return "bg-destructive/70 text-destructive-foreground";
}

export function GlobalChapterHeatmap({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [bossLoading, setBossLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.rpc("get_global_chapter_mastery");
      setRows((data as any) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const launchBoss = async (row: Row) => {
    if (!user) return;
    setBossLoading(row.chapter + row.course_id);
    try {
      const { data: course } = await supabase.from("courses")
        .select("source_content,subject,title")
        .eq("id", row.course_id).single();
      if (!course?.source_content) throw new Error("Contenu source indisponible");
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: {
          content: course.source_content, subject: course.subject, title: course.title,
          count: 15, quizType: "qcm", chapter: row.chapter, chapters: [row.chapter],
        },
      });
      if (error) throw error;
      const qs = data?.questions ?? [];
      if (!qs.length) throw new Error("Aucune question générée");
      const { data: quiz, error: qErr } = await supabase.from("quizzes").insert({
        user_id: user.id, course_id: row.course_id,
        title: `👹 Boss · ${row.chapter}`, quiz_type: "qcm",
      }).select().single();
      if (qErr) throw qErr;
      await supabase.from("quiz_questions").insert(qs.map((q: any, i: number) => ({
        quiz_id: quiz.id, user_id: user.id, question: q.question,
        type: q.type ?? "qcm", answers: q.answers ?? null,
        correct_index: typeof q.correct_index === "number" ? q.correct_index : null,
        accepted_answers: q.accepted_answers ?? null,
        explanation: q.explanation, position: i, chapter: row.chapter,
      })));
      toast.success("👹 Boss prêt !");
      nav(`/app/quizz?id=${quiz.id}`);
    } catch (e: any) { toast.error(e?.message ?? "Erreur"); }
    finally { setBossLoading(null); }
  };

  if (loading) return <div className="text-xs text-muted-foreground px-1">Chargement de ta maîtrise…</div>;
  if (!rows.length) return null;

  const display = compact ? rows.slice(0, 5) : rows;
  const weakest = rows.find(r => r.reviewed_questions > 0);

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Flame className="h-4 w-4 text-primary" />
        <p className="font-mono-tag text-[11px] uppercase tracking-wider text-muted-foreground">
          Maîtrise par chapitre {compact && rows.length > 5 ? `(top 5 / ${rows.length})` : `(${rows.length})`}
        </p>
      </div>
      <div className="space-y-2">
        {display.map((d) => (
          <div key={d.course_id + d.chapter} className="notebook-card p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-serif text-sm truncate">{d.chapter}</p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {d.course_emoji ?? "📘"} {d.course_title}
                </p>
              </div>
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
          onClick={() => launchBoss(weakest)}
          disabled={!!bossLoading}
          className="w-full mt-4 rounded-full border-2 border-foreground bg-destructive text-destructive-foreground font-bold h-12 shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-brutal-sm transition-all"
        >
          {bossLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Préparation…</> : <><Trophy className="h-4 w-4 mr-2" /> Combat le boss · {weakest.chapter}</>}
        </Button>
      )}
    </div>
  );
}
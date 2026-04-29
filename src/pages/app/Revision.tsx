import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Brain, CheckCircle2, XCircle, Loader2, Repeat, Sparkles, ChevronRight, Folder, BookOpen, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { awardXp } from "@/hooks/useGamification";
import { RevisionExplorer } from "@/components/revix/RevisionExplorer";

type DueQ = {
  question_id: string;
  quiz_id: string;
  course_id: string | null;
  course_title: string | null;
  course_emoji: string | null;
  chapter: string | null;
  question: string;
  type: "qcm" | "vrai_faux" | "ouvert" | "trous" | "ordre" | "association";
  answers: string[] | null;
  correct_index: number | null;
  accepted_answers: string[] | null;
  explanation: string | null;
  due_at: string;
};

export default function Revision() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [queue, setQueue] = useState<DueQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [stats, setStats] = useState({ ok: 0, ko: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.rpc("get_due_review_questions", { p_limit: 15 });
      // Garde uniquement les types supportés ici (QCM / Vrai-Faux).
      const filtered = ((data as any[]) ?? []).filter((q) => q.type === "qcm" || q.type === "vrai_faux");
      setQueue(filtered as any);
      setLoading(false);
    })();
  }, [user]);

  const current = queue[idx];
  const done = !loading && (queue.length === 0 || idx >= queue.length);

  const recordReview = async (correct: boolean) => {
    if (!current || !user) return;
    await supabase.rpc("review_question", { p_question_id: current.question_id, p_correct: correct });
    setStats(s => ({ ok: s.ok + (correct ? 1 : 0), ko: s.ko + (correct ? 0 : 1) }));
  };

  const next = async () => {
    setPicked(null);
    if (idx + 1 >= queue.length) {
      // award xp at the end
      const total = stats.ok + stats.ko + 1;
      const xp = 10 * total + Math.max(0, stats.ok * 3);
      if (user && total > 0) await awardXp(user.id, xp, "srs_session");
    }
    setIdx(i => i + 1);
  };

  const pickChoice = async (i: number) => {
    if (picked !== null || !current) return;
    setPicked(i);
    const ok = current.correct_index === i;
    await recordReview(ok);
  };

  if (loading) {
    return <AppLayout><div className="p-5 text-sm text-muted-foreground">Chargement...</div></AppLayout>;
  }

  if (queue.length === 0) {
    return (
      <AppLayout>
        <PageHeader emoji="🧠" title="Révision" subtitle="Spaced repetition" />
        <div className="px-5 mt-4 text-center">
          <div className="inline-block notebook-card dog-ear p-5 max-w-xs mx-auto">
            <Sparkles className="h-8 w-8 mx-auto text-primary" />
            <p className="font-hand text-xl mt-2">Tout est à jour !</p>
            <p className="text-xs text-muted-foreground mt-1">Aucune question à réviser. Explore tes chapitres ci-dessous ou lance un nouveau quiz.</p>
            <Button asChild size="sm" className="mt-3 rounded-full">
              <Link to="/app/quizz"><Brain className="h-4 w-4 mr-1" /> Faire un quiz</Link>
            </Button>
          </div>
        </div>
        <div className="px-5 mt-6 pb-24">
          <RevisionExplorer />
        </div>
      </AppLayout>
    );
  }

  if (done) {
    const total = stats.ok + stats.ko;
    const pct = total > 0 ? Math.round((stats.ok / total) * 100) : 0;
    return (
      <AppLayout>
        <div className="px-5 pt-8">
          <div className="notebook-page relative">
            <span className="rubber-stamp stamp-pop absolute top-3 right-4">{pct >= 80 ? "Excellent" : pct >= 50 ? "Bien" : "Continue"}</span>
            <p className="font-mono-tag text-[10px] uppercase tracking-widest text-muted-foreground">Session SRS</p>
            <h1 className="font-hand text-5xl text-primary mt-1 leading-none">{stats.ok} / {total}</h1>
            <p className="font-serif text-base text-muted-foreground mt-1">Mémorisation à <strong className="marker-yellow">{pct}%</strong></p>
            <p className="text-sm text-muted-foreground mt-3">Les questions ratées reviendront demain. Les bonnes s'espaceront.</p>
          </div>
          <div className="mt-5 flex gap-3 justify-center">
            <Button onClick={() => nav("/app")} className="rounded-full">Retour</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const q = current;
  const isChoice = q.type === "qcm" || q.type === "vrai_faux";
  const choices = q.type === "vrai_faux" ? (q.answers ?? ["Vrai", "Faux"]) : (q.answers ?? []);

  return (
    <AppLayout>
      <div className="px-3 pt-3 flex items-center gap-1">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link to="/app"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <p className="text-xs text-muted-foreground">Révision · {idx + 1} / {queue.length}</p>
      </div>

      <div className="px-5 pt-2">
        <div className="ruler-bar !h-2.5">
          <div className="ruler-fill" style={{ width: `${(idx / queue.length) * 100}%` }} />
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Repeat className="h-3.5 w-3.5" />
          <span>{q.course_emoji ?? "📘"} {q.course_title ?? "Cours"}</span>
          {q.chapter && <><span>·</span><span className="truncate">{q.chapter}</span></>}
        </div>

        <div className="mt-3 notebook-card p-5 relative animate-scale-in" key={idx}>
          <span className="label-tape absolute -top-2 left-4">SRS</span>
          <p className="font-serif text-xl leading-snug mt-2">{q.question}</p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3">
            {choices.map((a, i) => {
              const isCorrect = i === q.correct_index;
              const isPicked = picked === i;
              let stateCls = "";
              if (picked !== null) {
                if (isCorrect) stateCls = "is-correct";
                else if (isPicked) stateCls = "is-wrong";
                else stateCls = "is-faded";
              }
              return (
                <button key={i} onClick={() => pickChoice(i)} disabled={picked !== null}
                  className={`answer-postit ${i % 2 === 0 ? "tilt-l" : "tilt-r"} ${stateCls} flex items-center gap-3`}>
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

        {picked !== null && q.explanation && (
          <div className="mt-4 p-3 rounded-md border-l-4 border-primary/40 bg-primary/10 animate-fade-in font-hand text-base text-foreground/80 -rotate-[0.5deg]">
            💡 {q.explanation}
          </div>
        )}

        {picked !== null && (
          <Button onClick={next} className="mt-5 w-full rounded-md gradient-primary border-2 border-foreground font-bold animate-fade-in">
            {idx + 1 >= queue.length ? "Voir le bilan" : "Suivante"}
          </Button>
        )}
      </div>
    </AppLayout>
  );
}
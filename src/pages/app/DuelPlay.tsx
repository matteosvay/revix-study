import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Swords } from "lucide-react";

type Q = { id: string; position: number; question: string; answers: string[]; correct_index: number; explanation: string | null };

export default function DuelPlay() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const nav = useNavigate();
  const [duel, setDuel] = useState<any>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: d }, { data: qs }, { data: mine }] = await Promise.all([
        supabase.from("duels").select("*").eq("id", id).maybeSingle(),
        supabase.rpc("get_duel_questions", { p_duel_id: id }),
        supabase.from("duel_attempts").select("*").eq("duel_id", id).eq("user_id", user!.id).maybeSingle(),
      ]);
      setDuel(d);
      // Map RPC field names (q_*) to expected shape; correct_index is no longer exposed mid-duel
      const mapped = (qs ?? []).map((r: any) => ({
        id: r.q_id, position: r.q_position, question: r.q_question,
        answers: r.q_answers, correct_index: -1, explanation: null,
      }));
      setQuestions(mapped as any);
      setTimeLeft(d?.seconds_per_question ?? 30);
      if (mine) setDone(true);
    })();
  }, [id, user]);

  useEffect(() => {
    if (done || !duel || selected !== null) return;
    if (timeLeft <= 0) { handleConfirm(-1); return; }
    const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, selected, done, duel]);

  const handleConfirm = async (chosen: number) => {
    setSelected(chosen);
    const next = [...answers, chosen];
    setAnswers(next);
    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        submit(next);
      } else {
        setIdx(idx + 1);
        setSelected(null);
        setTimeLeft(duel?.seconds_per_question ?? 30);
      }
    }, 1200);
  };

  const submit = async (finalAnswers: number[]) => {
    setSubmitting(true);
    // Score is recomputed server-side from stored correct answers; client value is ignored.
    const { data, error } = await supabase.rpc("submit_duel_attempt", {
      p_duel_id: id, p_answers: finalAnswers, p_score: 0,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setDone(true);
    const res = data as any;
    if (res?.completed) {
      if (res.winner_id === user?.id) toast.success("VICTOIRE 🏆 +100 XP !");
      else if (res.winner_id === null) toast.success("Égalité ! +60 XP");
      else toast.info("Perdu cette fois, +40 XP. Revanche ?");
    } else {
      toast.success("Score envoyé ! En attente de l'adversaire...");
    }
    setTimeout(() => nav("/app/campus"), 2500);
  };

  if (!duel || questions.length === 0) {
    return <AppLayout><div className="p-5 text-sm text-muted-foreground">Chargement du duel...</div></AppLayout>;
  }

  if (done) {
    return <AppLayout>
      <PageHeader emoji="⚔️" title="Duel terminé" />
      <div className="px-5 text-center pt-8">
        <p className="text-5xl mb-3">🎯</p>
        <p className="font-display text-xl">Tes réponses sont enregistrées</p>
        <p className="text-sm text-muted-foreground mt-2">Retour au Campus...</p>
      </div>
    </AppLayout>;
  }

  const q = questions[idx];
  const totalSecs = duel.seconds_per_question;

  return (
    <AppLayout>
      <div className="px-5 pt-5 pb-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="label-tape">Q{idx + 1}/{questions.length}</span>
          <span className="font-mono text-2xl font-bold">{timeLeft}s</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden border-2 border-foreground">
          <div className="h-full bg-accent transition-all" style={{ width: `${(timeLeft / totalSecs) * 100}%` }} />
        </div>

        <div className="bg-card border-2 border-foreground rounded-md p-4 shadow-brutal">
          <p className="font-display text-base leading-snug">{q.question}</p>
        </div>

        <div className="space-y-2">
          {q.answers.map((a, i) => {
            const isSelected = selected === i;
            const isCorrect = selected !== null && i === q.correct_index;
            const isWrong = isSelected && i !== q.correct_index;
            return (
              <button
                key={i}
                disabled={selected !== null}
                onClick={() => handleConfirm(i)}
                className={`w-full text-left p-3 rounded-md border-2 border-foreground font-medium text-sm transition-all
                  ${isCorrect ? "bg-success text-success-foreground" : isWrong ? "bg-destructive text-destructive-foreground" : "bg-card hover:shadow-brutal-sm"}`}
              >
                <span className="font-mono font-bold mr-2">{String.fromCharCode(65 + i)}.</span>{a}
              </button>
            );
          })}
        </div>

        <div className="text-center pt-2">
          <Swords className="h-5 w-5 inline text-primary" /> <span className="text-xs font-bold uppercase tracking-wider">Duel en cours</span>
        </div>
        {submitting && <p className="text-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 inline animate-spin" /> Envoi...</p>}
      </div>
    </AppLayout>
  );
}
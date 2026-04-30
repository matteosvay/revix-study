import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle, RefreshCw, Sparkles, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type BankQuestion = {
  id: string;
  question: string;
  answer: string;
  question_type: string;
  options: any;
  difficulty: number;
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  courseId: string;
  courseTitle?: string;
  limit?: number;
}

/**
 * Mode Révision SANS coût IA : tire des questions de quiz_bank
 * pour le cours sélectionné. Affiche question -> réponse, l'utilisateur
 * indique s'il a su ou non, on enregistre dans quiz_bank.
 */
export function ReviewBankDialog({ open, onOpenChange, courseId, courseTitle, limit = 10 }: Props) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIdx(0);
    setRevealed(false);
    setCorrect(0);
    setDone(false);
    setQuestions([]);
    setLoading(true);
    (async () => {
      const { data, error } = await supabase.rpc("start_review_session", {
        p_course_id: courseId,
        p_limit: limit,
      });
      setLoading(false);
      if (error) {
        toast.error("Impossible de charger la révision");
        onOpenChange(false);
        return;
      }
      const list = (data ?? []) as BankQuestion[];
      if (list.length === 0) {
        toast.info("Pas encore de questions dans la banque pour ce cours");
        onOpenChange(false);
        return;
      }
      setQuestions(list);
    })();
  }, [open, courseId, limit, onOpenChange]);

  const current = questions[idx];

  async function handleAnswer(wasCorrect: boolean) {
    if (!current) return;
    if (wasCorrect) setCorrect((c) => c + 1);
    // Best-effort, on n'attend pas
    supabase.rpc("record_review_answer", {
      p_question_id: current.id,
      p_correct: wasCorrect,
    }).then(({ error }) => {
      if (error) console.error("record_review_answer", error);
    });
    if (idx + 1 >= questions.length) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setRevealed(false);
    }
  }

  const progress = questions.length ? ((idx + (done ? 1 : 0)) / questions.length) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Réviser {courseTitle ? `· ${courseTitle}` : ""}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-xs">
            <Sparkles className="h-3 w-3 text-emerald-500" />
            Sans coût IA · Banque de questions
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="py-12 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Chargement…
          </div>
        )}

        {!loading && current && !done && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                <span>Question {idx + 1} / {questions.length}</span>
                <span>Bonnes · {correct}</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>

            <div className="notebook-card p-4">
              <p className="font-serif text-base leading-relaxed">{current.question}</p>
            </div>

            {revealed ? (
              <div className="rounded-lg border-2 border-emerald-500/30 bg-emerald-500/5 p-4">
                <p className="font-mono-tag text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                  Réponse
                </p>
                <p className="font-serif text-sm leading-relaxed">{current.answer}</p>
              </div>
            ) : (
              <Button
                onClick={() => setRevealed(true)}
                variant="outline"
                className="w-full"
              >
                Voir la réponse
              </Button>
            )}

            {revealed && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleAnswer(false)}
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="h-4 w-4 mr-1" /> Pas su
                </Button>
                <Button
                  onClick={() => handleAnswer(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Su
                </Button>
              </div>
            )}
          </div>
        )}

        {!loading && done && (
          <div className="space-y-4 text-center py-4">
            <div className="text-5xl">{correct === questions.length ? "🎉" : correct >= questions.length / 2 ? "💪" : "📚"}</div>
            <div>
              <p className="font-hand text-2xl">
                {correct} / {questions.length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Tu progresses ! Aucune crédit IA utilisé.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Terminer
              </Button>
              <Button
                onClick={() => {
                  setIdx(0);
                  setRevealed(false);
                  setCorrect(0);
                  setDone(false);
                  setLoading(true);
                  supabase
                    .rpc("start_review_session", { p_course_id: courseId, p_limit: limit })
                    .then(({ data, error }) => {
                      setLoading(false);
                      if (error || !data?.length) {
                        toast.error("Plus de questions à réviser");
                        onOpenChange(false);
                        return;
                      }
                      setQuestions(data as BankQuestion[]);
                    });
                }}
              >
                <RefreshCw className="h-4 w-4 mr-1" /> Encore
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
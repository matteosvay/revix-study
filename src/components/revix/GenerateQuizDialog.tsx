import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, BookOpen, Hash, CheckCircle2 } from "lucide-react";

type CourseRow = {
  id: string;
  title: string;
  emoji: string | null;
  subject: string | null;
  source_content: string | null;
  summary: any;
};

type QuizType = "qcm" | "qcm_multi" | "vrai_faux" | "ouvert" | "trous" | "ordre" | "association";

const TYPES: { key: QuizType; label: string; emoji: string }[] = [
  { key: "qcm", label: "QCM", emoji: "✅" },
  { key: "qcm_multi", label: "QCM multi", emoji: "☑️" },
  { key: "vrai_faux", label: "Vrai / Faux", emoji: "⚖️" },
  { key: "ouvert", label: "Question ouverte", emoji: "✍️" },
  { key: "trous", label: "Texte à trous", emoji: "🧩" },
  { key: "ordre", label: "Mise en ordre", emoji: "🔢" },
  { key: "association", label: "Association", emoji: "🔗" },
];

const COUNTS = [5, 10, 15, 20];
const DIFFS: { key: string; label: string }[] = [
  { key: "facile", label: "Facile" },
  { key: "moyen", label: "Moyen" },
  { key: "difficile", label: "Difficile" },
  { key: "expert", label: "Expert" },
  { key: "mixte", label: "Mixte" },
];

export function GenerateQuizDialog({
  open,
  onOpenChange,
  onGenerated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onGenerated?: (quizId: string) => void;
}) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [scope, setScope] = useState<"all" | "chapters">("all");
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [type, setType] = useState<QuizType>("qcm");
  const [count, setCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<string>("mixte");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("courses")
        .select("id, title, emoji, subject, source_content, summary")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setCourses((data ?? []) as CourseRow[]);
      setLoading(false);
    })();
  }, [open, user]);

  // reset when dialog reopens
  useEffect(() => {
    if (!open) {
      setCourseId(null);
      setScope("all");
      setSelectedChapters([]);
      setType("qcm");
      setCount(10);
      setDifficulty("mixte");
    }
  }, [open]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === courseId) ?? null,
    [courses, courseId]
  );

  const chapters = useMemo<string[]>(() => {
    if (!selectedCourse) return [];
    const sections = selectedCourse.summary?.sections ?? [];
    return sections.map((s: any) => s?.title).filter(Boolean);
  }, [selectedCourse]);

  const toggleChapter = (ch: string) => {
    setSelectedChapters((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const canGenerate =
    !!selectedCourse &&
    !!selectedCourse.source_content &&
    (scope === "all" || selectedChapters.length > 0) &&
    !generating;

  const handleGenerate = async () => {
    if (!user || !selectedCourse) return;
    if (!selectedCourse.source_content) {
      toast.error("Contenu source indisponible pour ce cours.");
      return;
    }
    setGenerating(true);
    try {
      const chaptersList = scope === "chapters" ? selectedChapters : chapters;
      const body: any = {
        content: selectedCourse.source_content,
        subject: selectedCourse.subject,
        title: selectedCourse.title,
        count,
        quizType: type,
        difficulty,
        chapters: chaptersList,
      };
      // Si un seul chapitre sélectionné => focus exclusif
      if (scope === "chapters" && selectedChapters.length === 1) {
        body.chapter = selectedChapters[0];
      }

      const { data, error } = await supabase.functions.invoke("generate-quiz", { body });
      if (error) throw error;
      const qs = data?.questions ?? [];
      if (!qs.length) throw new Error("Aucune question générée.");

      const titleSuffix =
        scope === "all"
          ? "tout le cours"
          : selectedChapters.length === 1
          ? selectedChapters[0]
          : `${selectedChapters.length} chapitres`;

      const { data: quiz, error: qErr } = await supabase
        .from("quizzes")
        .insert({
          user_id: user.id,
          course_id: selectedCourse.id,
          title: `Quizz · ${selectedCourse.title} · ${titleSuffix}`,
          quiz_type: type,
        })
        .select()
        .single();
      if (qErr) throw qErr;

      const rows = qs.map((q: any, i: number) => ({
        quiz_id: quiz.id,
        user_id: user.id,
        question: q.question,
        type: q.type ?? type,
        answers: q.answers ?? null,
        correct_index: typeof q.correct_index === "number" ? q.correct_index : null,
        accepted_answers: q.accepted_answers ?? null,
        explanation: q.explanation ?? "",
        position: i,
        chapter: q.chapter ?? (scope === "chapters" && selectedChapters.length === 1 ? selectedChapters[0] : null),
      }));
      const { error: rowsErr } = await supabase.from("quiz_questions").insert(rows);
      if (rowsErr) throw rowsErr;

      toast.success("Quizz prêt ✨");
      onOpenChange(false);
      if (onGenerated) onGenerated(quiz.id);
      else nav(`/app/quizz?id=${quiz.id}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Générer un quizz
          </DialogTitle>
          <DialogDescription>
            Choisis la fiche, la portée et le type de questions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Étape 1 : choix du cours */}
          <div>
            <Label className="text-xs uppercase font-mono-tag tracking-wider text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> 1. Choisis une fiche
            </Label>
            {loading ? (
              <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
              </div>
            ) : courses.length === 0 ? (
              <div className="mt-2 text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg p-4 text-center">
                Aucun cours disponible. Crée d'abord une fiche.
              </div>
            ) : (
              <div className="mt-2 max-h-44 overflow-y-auto space-y-1.5 pr-1">
                {courses.map((c) => {
                  const active = c.id === courseId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCourseId(c.id);
                        setSelectedChapters([]);
                        setScope("all");
                      }}
                      className={`w-full flex items-center gap-2 p-2.5 rounded-lg border-2 transition text-left ${
                        active
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <span className="text-xl shrink-0">{c.emoji ?? "📘"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.title}</p>
                        {c.subject && (
                          <p className="text-[11px] text-muted-foreground truncate">{c.subject}</p>
                        )}
                      </div>
                      {active && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Étape 2 : portée */}
          {selectedCourse && (
            <div>
              <Label className="text-xs uppercase font-mono-tag tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" /> 2. Portée
              </Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setScope("all");
                    setSelectedChapters([]);
                  }}
                  className={`p-2.5 rounded-lg border-2 text-sm font-medium transition ${
                    scope === "all"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  📖 Tout le cours
                </button>
                <button
                  onClick={() => setScope("chapters")}
                  disabled={chapters.length === 0}
                  className={`p-2.5 rounded-lg border-2 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
                    scope === "chapters"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  🎯 Chapitres choisis
                </button>
              </div>
              {scope === "chapters" && (
                <div className="mt-3">
                  {chapters.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Aucun chapitre détecté pour ce cours.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {chapters.map((ch) => {
                        const active = selectedChapters.includes(ch);
                        return (
                          <button
                            key={ch}
                            onClick={() => toggleChapter(ch)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border-2 text-[11px] font-medium transition ${
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card hover:border-primary/40"
                            }`}
                          >
                            <Hash className="h-2.5 w-2.5" />
                            <span className="max-w-[180px] truncate">{ch}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {selectedChapters.length} chapitre{selectedChapters.length > 1 ? "s" : ""} sélectionné{selectedChapters.length > 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Étape 3 : type */}
          {selectedCourse && (
            <div>
              <Label className="text-xs uppercase font-mono-tag tracking-wider text-muted-foreground">
                3. Type de questions
              </Label>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {TYPES.map((t) => {
                  const active = type === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setType(t.key)}
                      className={`p-2 rounded-lg border-2 text-xs font-medium transition flex items-center gap-1.5 ${
                        active
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <span>{t.emoji}</span>
                      <span className="truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Étape 4 : nombre + difficulté */}
          {selectedCourse && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase font-mono-tag tracking-wider text-muted-foreground">
                  4. Nombre
                </Label>
                <div className="mt-2 flex gap-1.5">
                  {COUNTS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      className={`flex-1 py-1.5 rounded-md border-2 text-xs font-bold transition ${
                        count === n
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase font-mono-tag tracking-wider text-muted-foreground">
                  Difficulté
                </Label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="mt-2 w-full h-8 rounded-md border-2 border-border bg-card px-2 text-xs font-medium"
                >
                  {DIFFS.map((d) => (
                    <option key={d.key} value={d.key}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
            Annuler
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="gradient-primary border-0"
          >
            {generating ? (
              <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Génération…</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-1.5" /> Générer</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AppLayout, PageHeader } from "@/components/revix/AppLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Target, RefreshCw, CheckCircle2, XCircle, Loader2, ChevronRight, Sparkles, AlertCircle, Scissors, SkipForward, Timer, Zap, Trash2, Link2, Shuffle, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { awardXp, bumpQuest } from "@/hooks/useGamification";
import { XP_REWARDS } from "@/lib/gamification";
import { Tape, Pin, ScribbleUnderline } from "@/components/revix/AcademicDecor";
import { localDateKey } from "@/lib/date";
import { GenerateQuizDialog } from "@/components/revix/GenerateQuizDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type QType = "qcm" | "qcm_multi" | "vrai_faux" | "ordre" | "association";
type Q = {
  id: string;
  question: string;
  type: QType;
  answers: string[] | null;
  correct_index: number | null;
  accepted_answers: string[] | null;
  explanation: string;
  chapter?: string | null;
};
type Quiz = { id: string; title: string; quiz_type?: string; course_id?: string | null };

type CourseGap = {
  course_id: string;
  course_title: string;
  course_emoji: string | null;
  source_content: string | null;
  subject: string | null;
  chapters: string[]; // tous les chapitres du cours
  covered: Set<string>; // chapitres déjà couverts par un quizz
  missing: string[];
};

const TYPE_LABELS: Record<QType, string> = {
  qcm: "QCM",
  qcm_multi: "QCM multi",
  vrai_faux: "Vrai / Faux",
  ordre: "Mise en ordre",
  association: "Association 🔗",
};

export default function Quizz() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const presetId = params.get("id");
  const isFlash = params.get("mode") === "flash";
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const [deletingQuiz, setDeletingQuiz] = useState(false);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [phase, setPhase] = useState<"select" | "play" | "end">("select");
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [multiPicked, setMultiPicked] = useState<number[]>([]);
  const [multiSubmitted, setMultiSubmitted] = useState(false);
  const [orderPicked, setOrderPicked] = useState<number[]>([]);
  const [orderSubmitted, setOrderSubmitted] = useState<boolean>(false);
  const [orderCorrect, setOrderCorrect] = useState<boolean>(false);
  // Association : pairs = [{left,right}], rightOrder = indices mélangés des "right",
  // matches = mapping leftIndex -> rightIndex (ou -1)
  const [assocPairs, setAssocPairs] = useState<{ left: string; right: string }[]>([]);
  const [assocRightOrder, setAssocRightOrder] = useState<number[]>([]);
  const [assocMatches, setAssocMatches] = useState<number[]>([]); // longueur = pairs.length
  const [assocSelectedLeft, setAssocSelectedLeft] = useState<number | null>(null);
  const [assocSubmitted, setAssocSubmitted] = useState<boolean>(false);
  const [assocCorrect, setAssocCorrect] = useState<boolean>(false);
  // Paires verrouillées (correctes validées) - index "left" qui ne peuvent plus être modifiés
  const [assocLocked, setAssocLocked] = useState<boolean[]>([]);
  // Nombre de tentatives de validation pour cette question
  const [assocAttempts, setAssocAttempts] = useState<number>(0);
  // Flash visuel après un check partiel : highlights des paires fausses
  const [assocFlashWrong, setAssocFlashWrong] = useState<boolean>(false);
  const [openResult, setOpenResult] = useState<{ correct: boolean; feedback: string } | null>(null);
  const [grading, setGrading] = useState(false);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const [gaps, setGaps] = useState<CourseGap[]>([]);
  const [generatingChapter, setGeneratingChapter] = useState<string | null>(null);
  // Combo & power-ups
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [hidden, setHidden] = useState<number[]>([]); // 50/50 hidden indices
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [genOpen, setGenOpen] = useState(false);

  const loadInventory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_inventory")
      .select("item_key, quantity")
      .eq("user_id", user.id)
      .in("item_key", ["power_5050", "power_skip", "power_time"]);
    const map: Record<string, number> = {};
    (data ?? []).forEach((r: any) => { map[r.item_key] = r.quantity; });
    setInventory(map);
  };

  useEffect(() => { loadInventory(); }, [user]);

  // Initialise l'ordre mélangé pour les questions de type "ordre"
  useEffect(() => {
    if (phase !== "play") return;
    const q = questions[qIdx];
    if (!q) return;
    if (q.type === "ordre" && q.answers) {
      // On part de l'ordre tel que présenté (déjà mélangé par l'IA)
      setOrderPicked(q.answers.map((_, i) => i));
    }
    if (q.type === "association") {
      // pairs sérialisées dans accepted_answers[0]
      try {
        const raw = (q.accepted_answers ?? [])[0];
        const pairs: { left: string; right: string }[] = raw ? JSON.parse(raw) : [];
        if (Array.isArray(pairs) && pairs.length) {
          setAssocPairs(pairs);
          // Mélange les indices des "right"
          const order = pairs.map((_, i) => i);
          for (let i = order.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [order[i], order[j]] = [order[j], order[i]];
          }
          setAssocRightOrder(order);
          setAssocMatches(new Array(pairs.length).fill(-1));
          setAssocSelectedLeft(null);
          setAssocSubmitted(false);
          setAssocCorrect(false);
          setAssocLocked(new Array(pairs.length).fill(false));
          setAssocAttempts(0);
          setAssocFlashWrong(false);
        }
      } catch {
        setAssocPairs([]);
      }
    }
  }, [qIdx, phase, questions]);

  const comboMultiplier = useMemo(() => {
    if (combo >= 10) return 3;
    if (combo >= 5) return 2;
    return 1;
  }, [combo]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: qzs } = await supabase
        .from("quizzes")
        .select("id,title,quiz_type,course_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setQuizzes((qzs as any) ?? []);

      // Calcule les chapitres non encore couverts par cours
      const { data: courses } = await supabase
        .from("courses")
        .select("id,title,emoji,subject,source_content,summary")
        .eq("user_id", user.id);

      const { data: allQuestions } = await supabase
        .from("quiz_questions")
        .select("quiz_id,chapter")
        .eq("user_id", user.id);

      const coveredByCourse = new Map<string, Set<string>>();
      for (const qz of (qzs ?? []) as any[]) {
        if (!qz.course_id) continue;
        const chapsForQuiz = (allQuestions ?? [])
          .filter((q: any) => q.quiz_id === qz.id && q.chapter)
          .map((q: any) => q.chapter as string);
        if (!coveredByCourse.has(qz.course_id)) coveredByCourse.set(qz.course_id, new Set());
        chapsForQuiz.forEach((c) => coveredByCourse.get(qz.course_id)!.add(c));
      }

      const computedGaps: CourseGap[] = [];
      for (const c of (courses ?? []) as any[]) {
        const sections: string[] = (c.summary?.sections ?? []).map((s: any) => s.title).filter(Boolean);
        if (!sections.length) continue;
        const covered = coveredByCourse.get(c.id) ?? new Set<string>();
        const missing = sections.filter((s) => !covered.has(s));
        if (missing.length) {
          computedGaps.push({
            course_id: c.id,
            course_title: c.title,
            course_emoji: c.emoji,
            source_content: c.source_content,
            subject: c.subject,
            chapters: sections,
            covered,
            missing,
          });
        }
      }
      setGaps(computedGaps);

      if (presetId && qzs?.find((q: any) => q.id === presetId)) {
        const q = qzs.find((x: any) => x.id === presetId)!;
        startQuiz(q as any);
      }
    })();
  }, [user, presetId]);

  const startQuiz = async (q: Quiz) => {
    const { data } = await supabase.from("quiz_questions").select("*").eq("quiz_id", q.id).order("position");
    if (!data || !data.length) { toast.error("Quizz vide"); return; }
    setActiveQuiz(q);
    setQuestions(data as any);
    setQIdx(0); setPicked(null); setTextAnswer(""); setOpenResult(null); setScore(0); setWrong([]);
    setCombo(0); setMaxCombo(0); setHidden([]);
    setMultiPicked([]); setMultiSubmitted(false); setOrderPicked([]); setOrderSubmitted(false); setOrderCorrect(false);
    setAssocPairs([]); setAssocRightOrder([]); setAssocMatches([]); setAssocSelectedLeft(null); setAssocSubmitted(false); setAssocCorrect(false);
    setPhase("play");
  };

  const generateForChapter = async (gap: CourseGap, chapter: string) => {
    if (!user || !gap.source_content) { toast.error("Contenu source indisponible."); return; }
    setGeneratingChapter(`${gap.course_id}::${chapter}`);
    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: {
          content: gap.source_content,
          subject: gap.subject,
          title: gap.course_title,
          count: 10,
          quizType: "qcm",
          chapters: gap.chapters,
          chapter,
        },
      });
      if (error) throw error;
      const qs = data?.questions ?? [];
      if (!qs.length) throw new Error("Aucune question générée.");
      const { data: quiz, error: qErr } = await supabase.from("quizzes").insert({
        user_id: user.id, course_id: gap.course_id,
        title: `Quizz · ${gap.course_title} · ${chapter}`, quiz_type: "qcm",
      }).select().single();
      if (qErr) throw qErr;
      const rows = qs.map((q: any, i: number) => ({
        quiz_id: quiz.id, user_id: user.id, question: q.question,
        type: q.type ?? "qcm",
        answers: q.answers ?? null,
        correct_index: typeof q.correct_index === "number" ? q.correct_index : null,
        accepted_answers: q.accepted_answers ?? null,
        explanation: q.explanation, position: i,
        chapter: q.chapter ?? chapter,
      }));
      await supabase.from("quiz_questions").insert(rows);
      toast.success("Quizz prêt ✨");
      nav(`/app/quizz?id=${quiz.id}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally {
      setGeneratingChapter(null);
    }
  };

  // Enregistre la réponse mais NE passe PAS à la question suivante (l'utilisateur clique sur "Suivant")
  const advance = (ok: boolean) => {
    if (ok) {
      setScore(s => s + 1);
      setCombo(c => {
        const nc = c + 1;
        setMaxCombo(m => Math.max(m, nc));
        return nc;
      });
    } else {
      setWrong(w => [...w, qIdx]);
      setCombo(0);
    }
  };

  const goNext = async () => {
    if (qIdx + 1 >= questions.length) {
      setPhase("end");
      if (user && activeQuiz) {
        // Recalcule depuis l'état actuel (score est à jour grâce aux setters fonctionnels)
        const finalScore = score;
        const finalWrong = wrong;
          await supabase.from("quiz_attempts").insert({
            user_id: user.id, quiz_id: activeQuiz.id,
            score: finalScore, total: questions.length,
            wrong_indices: finalWrong,
            max_combo: maxCombo,
          });
          const { data: profileState } = await supabase.from("profiles").select("last_active_date").eq("id", user.id).maybeSingle();
          const todayKey = localDateKey(new Date());
          const isFirstActivityToday = profileState?.last_active_date !== todayKey;
          await supabase.rpc("bump_streak", { p_user_id: user.id });
          // Incrémente le compteur quiz et octroie un jeton tous les 10 quiz
          const { data: tokenRes } = await supabase.rpc("increment_quiz_count", { p_user_id: user.id });
          if ((tokenRes as any)?.earned) {
            toast.success("📎 Pass de restauration gagné !", { description: "Colle-le sur une streak perdue." });
          }
          // XP : finir un quiz + bonus score
          const pct = (finalScore / questions.length) * 100;
          let total = XP_REWARDS.quiz_finish;
          if (pct >= 80) total += XP_REWARDS.quiz_high_score;
          if (pct === 100) total += XP_REWARDS.quiz_perfect;
          // Bonus combo : +5 XP par palier de 5 combos atteints (max combo)
          const comboBonus = Math.floor(maxCombo / 5) * 25;
          if (comboBonus > 0) total += comboBonus;
          await awardXp(user.id, total, "quiz_finish");
          // Log group activity (streak partagée des groupes d'étude)
          await supabase.rpc("log_group_activity", { p_xp: total });
          if (comboBonus > 0) {
            toast.success(`🔥 Combo x${Math.floor(maxCombo / 5) + 1} ! +${comboBonus} XP bonus`);
          }
          // Bump quêtes
          await bumpQuest(user.id, "quiz_done", 1);
          await bumpQuest(user.id, "w_5_quizzes", 1);
          await bumpQuest(user.id, "questions_answered", questions.length);
          if (pct >= 80) {
            await bumpQuest(user.id, "high_score", 1);
            await bumpQuest(user.id, "w_3_high_scores", 1);
          }
          if (pct === 100) await bumpQuest(user.id, "perfect_quiz", 1);
          if (isFirstActivityToday) {
            await bumpQuest(user.id, "streak_kept", 1);
            await bumpQuest(user.id, "w_7_streak", 1);
          }
      }
    } else {
      setQIdx(qIdx + 1); setPicked(null); setTextAnswer(""); setOpenResult(null); setHidden([]);
      setMultiPicked([]); setMultiSubmitted(false); setOrderPicked([]); setOrderSubmitted(false); setOrderCorrect(false);
      setAssocSelectedLeft(null); setAssocSubmitted(false); setAssocCorrect(false);
    }
  };

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const ok = questions[qIdx].correct_index === i;
    advance(ok);
    // SRS: enregistre la révision en arrière-plan
    supabase.rpc("review_question", { p_question_id: questions[qIdx].id, p_correct: ok });
  };

  const usePowerup = async (key: "power_5050" | "power_skip" | "power_time") => {
    if ((inventory[key] ?? 0) < 1) { toast.error("Plus de power-up de ce type."); return; }
    const { data, error } = await supabase.rpc("consume_powerup", { p_powerup_key: key });
    if (error) { toast.error(error.message); return; }
    const res = data as any;
    if (!res?.success) { toast.error(res?.error ?? "Erreur"); return; }
    setInventory(inv => ({ ...inv, [key]: res.remaining }));
    const q = questions[qIdx];
    if (key === "power_5050" && q.type === "qcm" && q.answers && q.correct_index != null) {
      const wrongIdx = q.answers.map((_, i) => i).filter(i => i !== q.correct_index);
      const toHide = wrongIdx.sort(() => Math.random() - 0.5).slice(0, Math.max(0, wrongIdx.length - 1));
      setHidden(toHide);
      toast.success("✂️ 50/50 activé");
    } else if (key === "power_skip") {
      toast.success("⏭️ Question passée");
      // Skip = avance sans compter (ni juste ni faux), reset combo neutre
      setCombo(0);
      if (qIdx + 1 >= questions.length) {
        // Ne triche pas : marque comme non répondue → comportement final identique à goNext
        setPicked(-99 as any);
      } else {
        setQIdx(qIdx + 1);
        setPicked(null); setTextAnswer(""); setOpenResult(null); setHidden([]);
      }
    } else if (key === "power_time") {
      toast.success("⏱️ +30 sec");
    }
  };

  const submitText = async () => {
    const q = questions[qIdx];
    if (!textAnswer.trim()) { toast.error("Écris ta réponse."); return; }
    if (q.type === "trous") {
      const accepted = (q.accepted_answers ?? []).map(normalize);
      const user = normalize(textAnswer);
      const ok = accepted.includes(user) || accepted.some(a => user.includes(a) || a.includes(user));
      setOpenResult({ correct: ok, feedback: ok ? "Bonne réponse !" : `Attendu : ${q.accepted_answers?.[0] ?? "—"}` });
      advance(ok);
      supabase.rpc("review_question", { p_question_id: q.id, p_correct: ok });
      return;
    }
    // ouvert -> correction hybride : Levenshtein d'abord, IA seulement si zone grise
    const { bestSimilarity } = await import("@/lib/levenshtein");
    const candidates = [
      ...(q.accepted_answers ?? []),
      ...(q.explanation ? [q.explanation] : []),
    ].filter(Boolean) as string[];
    if (candidates.length > 0) {
      const sim = bestSimilarity(textAnswer, candidates);
      if (sim >= 0.85) {
        setOpenResult({ correct: true, feedback: "Bonne réponse ! ✨" });
        advance(true);
        supabase.rpc("review_question", { p_question_id: q.id, p_correct: true });
        return;
      }
      if (sim < 0.30) {
        setOpenResult({
          correct: false,
          feedback: `Pas tout à fait. Réponse attendue : ${candidates[0]}`,
        });
        advance(false);
        supabase.rpc("review_question", { p_question_id: q.id, p_correct: false });
        return;
      }
      // Zone grise [0.30 ; 0.85[ → on demande à l'IA
    }
    setGrading(true);
    try {
      const { data, error } = await supabase.functions.invoke("grade-open", {
        body: {
          question: q.question,
          userAnswer: textAnswer,
          expectedAnswer: q.explanation,
          acceptedAnswers: q.accepted_answers ?? [],
        },
      });
      if (error) {
        const { handleAiLimit } = await import("@/lib/aiLimits");
        if (handleAiLimit(error, data)) { setGrading(false); return; }
        throw error;
      }
      const ok = !!data?.correct;
      setOpenResult({ correct: ok, feedback: data?.feedback ?? "" });
      advance(ok);
      supabase.rpc("review_question", { p_question_id: q.id, p_correct: ok });
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur de correction");
    } finally { setGrading(false); }
  };

  // Soumet une réponse QCM multi
  const submitMulti = () => {
    const q = questions[qIdx];
    const correct = (q.accepted_answers ?? []).map(s => parseInt(s, 10)).filter(n => !isNaN(n)).sort();
    const userPicked = [...multiPicked].sort();
    const ok = correct.length === userPicked.length && correct.every((n, i) => n === userPicked[i]);
    setMultiSubmitted(true);
    advance(ok);
    supabase.rpc("review_question", { p_question_id: q.id, p_correct: ok });
  };

  // Soumet la mise en ordre
  const submitOrder = () => {
    const q = questions[qIdx];
    const correct = (q.accepted_answers ?? []).map(s => parseInt(s, 10)).filter(n => !isNaN(n));
    const ok = correct.length === orderPicked.length && correct.every((n, i) => n === orderPicked[i]);
    setOrderSubmitted(true);
    setOrderCorrect(ok);
    advance(ok);
    supabase.rpc("review_question", { p_question_id: q.id, p_correct: ok });
  };

  const toggleMulti = (i: number) => {
    if (multiSubmitted) return;
    setMultiPicked(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const moveOrder = (from: number, dir: -1 | 1) => {
    if (orderSubmitted) return;
    setOrderPicked(prev => {
      const arr = [...prev];
      const to = from + dir;
      if (to < 0 || to >= arr.length) return arr;
      [arr[from], arr[to]] = [arr[to], arr[from]];
      return arr;
    });
  };

  // === Association ===
  const onAssocPickLeft = (leftIdx: number) => {
    if (assocSubmitted) return;
    if (assocLocked[leftIdx]) return; // déjà verrouillé = correct
    if (assocFlashWrong) setAssocFlashWrong(false);
    setAssocSelectedLeft(leftIdx);
  };
  const onAssocPickRight = (rightIdx: number) => {
    if (assocSubmitted) return;
    // Si ce right est déjà verrouillé, ignore
    const lockedLeft = assocMatches.findIndex((r, i) => r === rightIdx && assocLocked[i]);
    if (lockedLeft !== -1) return;
    if (assocFlashWrong) setAssocFlashWrong(false);
    if (assocSelectedLeft === null) {
      // Permettre de "défaire" : si ce right est déjà associé, libère
      const usingLeft = assocMatches.findIndex((r) => r === rightIdx);
      if (usingLeft !== -1 && !assocLocked[usingLeft]) {
        setAssocMatches((m) => m.map((v, i) => (i === usingLeft ? -1 : v)));
      }
      return;
    }
    setAssocMatches((m) => {
      const arr = [...m];
      // Si ce "right" était déjà associé à un autre "left", libère cet autre
      const dupLeft = arr.findIndex((r) => r === rightIdx);
      if (dupLeft !== -1 && dupLeft !== assocSelectedLeft && !assocLocked[dupLeft]) arr[dupLeft] = -1;
      arr[assocSelectedLeft!] = rightIdx;
      return arr;
    });
    setAssocSelectedLeft(null);
  };
  const submitAssoc = () => {
    const nextAttempts = assocAttempts + 1;
    setAssocAttempts(nextAttempts);
    const allCorrect = assocMatches.length > 0 && assocMatches.every((r, l) => r === l);
    if (allCorrect) {
      // Terminé définitivement
      setAssocSubmitted(true);
      setAssocCorrect(true);
      // Lock toutes les paires
      setAssocLocked(new Array(assocPairs.length).fill(true));
      // ok = true seulement si parfait du premier coup, sinon on credite quand même
      // mais on calcule le bonus XP à la fin via attempts
      advance(true);
      const q = questions[qIdx];
      if (q) supabase.rpc("review_question", { p_question_id: q.id, p_correct: nextAttempts === 1 });
      // Toast info sur la performance
      if (nextAttempts === 1) {
        toast.success("Parfait du premier coup ! 🎯");
      } else {
        toast.success(`Bravo ! ${nextAttempts} tentatives — score réduit`);
      }
      return;
    }
    // Validation partielle : verrouille les bonnes, libère les fausses
    const newLocked = assocPairs.map((_, i) => assocMatches[i] === i);
    const newMatches = assocMatches.map((r, i) => (newLocked[i] ? r : -1));
    const correctCount = newLocked.filter(Boolean).length;
    const wrongCount = assocPairs.length - correctCount;
    setAssocLocked(newLocked);
    setAssocMatches(newMatches);
    setAssocSelectedLeft(null);
    setAssocFlashWrong(true);
    setTimeout(() => setAssocFlashWrong(false), 800);
    if (correctCount === 0) {
      toast.error(`Aucune paire correcte. Réessaie !`);
    } else {
      toast.info(`${correctCount} OK ✅ — ${wrongCount} à corriger`);
    }
    // Si l'utilisateur a fait trop d'erreurs (5+ tentatives), on abandonne et marque faux
    if (nextAttempts >= 5) {
      setAssocSubmitted(true);
      setAssocCorrect(false);
      setAssocLocked(new Array(assocPairs.length).fill(true));
      advance(false);
      const q = questions[qIdx];
      if (q) supabase.rpc("review_question", { p_question_id: q.id, p_correct: false });
      toast.error("Trop de tentatives — on passe à la suivante");
    }
  };
  const resetAssoc = () => {
    if (assocSubmitted) return;
    // Conserve les paires verrouillées (correctes), reset uniquement les autres
    setAssocMatches((m) => m.map((r, i) => (assocLocked[i] ? r : -1)));
    setAssocSelectedLeft(null);
  };

  if (phase === "select") {
    return (
      <AppLayout>
        <PageHeader
          emoji="🧠"
          title="Quizz"
          subtitle="Choisis un quizz pour t'entraîner."
          action={
            <Button
              size="sm"
              onClick={() => setGenOpen(true)}
              className="rounded-full gradient-primary border-0"
            >
              <Sparkles className="h-4 w-4 mr-1" /> Générer
            </Button>
          }
        />
        <GenerateQuizDialog open={genOpen} onOpenChange={setGenOpen} />
        {gaps.length > 0 && (
          <div className="px-4 mt-2 mb-4">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="font-mono-tag text-[11px] uppercase tracking-wider text-muted-foreground">Chapitres à explorer</p>
            </div>
            <div className="space-y-3">
              {gaps.map((gap) => (
                <div key={gap.course_id} className="notebook-card p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{gap.course_emoji ?? "📘"}</span>
                    <p className="font-serif text-sm flex-1 truncate">{gap.course_title}</p>
                    <span className="font-mono-tag text-[10px] text-muted-foreground">{gap.missing.length} restant{gap.missing.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {gap.missing.slice(0, 6).map((ch) => {
                      const key = `${gap.course_id}::${ch}`;
                      const loading = generatingChapter === key;
                      return (
                        <button
                          key={ch}
                          onClick={() => generateForChapter(gap, ch)}
                          disabled={!!generatingChapter}
                          className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/15 hover:border-primary text-xs font-medium transition disabled:opacity-50"
                        >
                          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-primary" />}
                          <span className="max-w-[180px] truncate">{ch}</span>
                        </button>
                      );
                    })}
                    {gap.missing.length > 6 && (
                      <span className="text-xs text-muted-foreground self-center">+{gap.missing.length - 6}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {quizzes.length === 0 ? (
          <div className="px-5 mt-6 text-center">
            <div className="inline-block notebook-card dog-ear p-6 max-w-xs mx-auto">
              <Brain className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <p className="font-hand text-2xl mt-2">Pas encore de quizz</p>
              <p className="text-sm text-muted-foreground mt-1">Génère un quizz depuis un cours.</p>
            </div>
          </div>
        ) : (
          <div className="px-4 space-y-3">
            <p className="font-mono-tag text-[11px] uppercase tracking-wider text-muted-foreground px-1">Tes quizz</p>
            {quizzes.map((q, i) => (
              <div
                key={q.id}
                className={`relative notebook-card flex items-center gap-3 p-4 hover:shadow-glow transition-all ${i % 2 === 0 ? "tilt-l" : "tilt-r"}`}
              >
                <Tape variant={i % 3 === 0 ? "yellow" : i % 3 === 1 ? "pink" : "mint"} position="top-right" />
                <button onClick={() => startQuiz(q)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-base truncate">{q.title}</p>
                    <span className="label-tape mt-1">{TYPE_LABELS[(q.quiz_type as QType) ?? "qcm"] ?? "QCM"}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setQuizToDelete(q); }}
                  className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition shrink-0"
                  aria-label="Supprimer le quizz"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <AlertDialog open={!!quizToDelete} onOpenChange={(o) => !o && setQuizToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce quizz ?</AlertDialogTitle>
              <AlertDialogDescription>
                « {quizToDelete?.title} » et toutes ses questions seront supprimés. Tes révisions liées disparaîtront aussi.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingQuiz}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (!quizToDelete) return;
                  setDeletingQuiz(true);
                  const { error } = await supabase.from("quizzes").delete().eq("id", quizToDelete.id);
                  setDeletingQuiz(false);
                  if (error) { toast.error("Suppression impossible"); return; }
                  setQuizzes(prev => prev.filter(x => x.id !== quizToDelete.id));
                  toast.success("Quizz supprimé");
                  setQuizToDelete(null);
                }}
                disabled={deletingQuiz}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingQuiz ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Suppression…</> : <>Supprimer</>}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AppLayout>
    );
  }

  if (phase === "play") {
    const q = questions[qIdx];
    const isChoice = q.type === "qcm" || q.type === "vrai_faux";
    const isMulti = q.type === "qcm_multi";
    const isOrder = q.type === "ordre";
    const isText = q.type === "ouvert" || q.type === "trous";
    const isAssoc = q.type === "association";
    const choices = q.type === "vrai_faux" ? (q.answers ?? ["Vrai", "Faux"]) : (q.answers ?? []);
    const postitVariants = ["", "answer-postit-pink", "answer-postit-blue", "answer-postit-mint"];
    const correctMultiSet = isMulti
      ? new Set((q.accepted_answers ?? []).map(s => parseInt(s, 10)).filter(n => !isNaN(n)))
      : new Set<number>();
    return (
      <AppLayout>
        <div className="px-5 pt-5">
          <div className="flex items-center justify-between font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            <span>Question {qIdx + 1} / {questions.length}</span>
            <span className="flex items-center gap-2">
              <span>Score · {score}</span>
              {combo >= 2 && (
                <span key={combo} className="combo-pop inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px]">
                  <Zap className="h-2.5 w-2.5" /> x{comboMultiplier} · {combo}
                </span>
              )}
            </span>
          </div>
          <div className="ruler-bar !h-2.5">
            <div className="ruler-fill" style={{ width: `${(qIdx / questions.length) * 100}%` }} />
          </div>

          {/* Power-ups bar */}
          {(inventory.power_5050 || inventory.power_skip || inventory.power_time) ? (
            <div className="mt-3 flex items-center gap-2">
              <span className="font-mono-tag text-[9px] uppercase text-muted-foreground">Power-ups</span>
              {inventory.power_5050 > 0 && (
                <button
                  onClick={() => usePowerup("power_5050")}
                  disabled={picked !== null || q.type !== "qcm" || hidden.length > 0}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md border-2 border-foreground bg-card text-[10px] font-bold uppercase shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition disabled:opacity-40"
                >
                  <Scissors className="h-3 w-3" /> 50/50 · {inventory.power_5050}
                </button>
              )}
              {inventory.power_skip > 0 && (
                <button
                  onClick={() => usePowerup("power_skip")}
                  disabled={picked !== null}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md border-2 border-foreground bg-card text-[10px] font-bold uppercase shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition disabled:opacity-40"
                >
                  <SkipForward className="h-3 w-3" /> Skip · {inventory.power_skip}
                </button>
              )}
              {inventory.power_time > 0 && (
                <button
                  onClick={() => usePowerup("power_time")}
                  disabled={picked !== null}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md border-2 border-foreground bg-card text-[10px] font-bold uppercase shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition disabled:opacity-40"
                >
                  <Timer className="h-3 w-3" /> +30s · {inventory.power_time}
                </button>
              )}
            </div>
          ) : null}

          <div className="mt-6 animate-scale-in" key={qIdx}>
            <div className="notebook-card p-5 relative">
              <span className="label-tape absolute -top-2 left-4">{TYPE_LABELS[q.type]}</span>
              <p className="font-serif text-xl leading-snug mt-2">{q.question}</p>
            </div>

            {isChoice ? (
              <div className="mt-5 grid grid-cols-1 gap-3">
                {choices.map((a, i) => {
                  if (hidden.includes(i)) return null;
                  const isCorrect = i === q.correct_index;
                  const isPicked = picked === i;
                  const variant = postitVariants[i % postitVariants.length];
                  const tilt = i % 2 === 0 ? "tilt-l" : "tilt-r";
                  let stateCls = "";
                  if (picked !== null) {
                    if (isCorrect) stateCls = "is-correct";
                    else if (isPicked) stateCls = "is-wrong";
                    else stateCls = "is-faded";
                  }
                  return (
                    <button key={i} onClick={() => pick(i)} disabled={picked !== null}
                      className={`answer-postit ${variant} ${tilt} ${stateCls} flex items-center gap-3`}>
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
            ) : isMulti ? (
              <div className="mt-5 space-y-3">
                <p className="font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground px-1">
                  Coche TOUTES les bonnes réponses
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {(q.answers ?? []).map((a, i) => {
                    const checked = multiPicked.includes(i);
                    const isCorrect = correctMultiSet.has(i);
                    const variant = postitVariants[i % postitVariants.length];
                    const tilt = i % 2 === 0 ? "tilt-l" : "tilt-r";
                    let stateCls = "";
                    if (multiSubmitted) {
                      if (isCorrect) stateCls = "is-correct";
                      else if (checked) stateCls = "is-wrong";
                      else stateCls = "is-faded";
                    }
                    return (
                      <button key={i} onClick={() => toggleMulti(i)} disabled={multiSubmitted}
                        className={`answer-postit ${variant} ${tilt} ${stateCls} flex items-center gap-3`}>
                        <span className={`h-6 w-6 rounded-md border-2 border-foreground flex items-center justify-center shrink-0 ${checked ? "bg-foreground text-background" : "bg-background"}`}>
                          {checked && <CheckCircle2 className="h-4 w-4" />}
                        </span>
                        <span className="flex-1">{a}</span>
                        {multiSubmitted && isCorrect && <CheckCircle2 className="h-5 w-5 text-success" />}
                        {multiSubmitted && checked && !isCorrect && <XCircle className="h-5 w-5 text-destructive" />}
                      </button>
                    );
                  })}
                </div>
                {!multiSubmitted && (
                  <Button onClick={submitMulti} disabled={multiPicked.length === 0}
                    className="w-full rounded-full gradient-primary border-0">
                    Valider mes choix
                  </Button>
                )}
              </div>
            ) : isOrder ? (
              <div className="mt-5 space-y-3">
                <p className="font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground px-1">
                  Réorganise dans le bon ordre (haut → bas)
                </p>
                <div className="space-y-2">
                  {orderPicked.map((origIdx, pos) => {
                    const label = q.answers?.[origIdx] ?? "";
                    const variant = postitVariants[pos % postitVariants.length];
                    let stateCls = "";
                    if (orderSubmitted) {
                      const correct = (q.accepted_answers ?? []).map(s => parseInt(s, 10));
                      stateCls = correct[pos] === origIdx ? "is-correct" : "is-wrong";
                    }
                    return (
                      <div key={`${origIdx}-${pos}`} className={`answer-postit ${variant} ${stateCls} flex items-center gap-3`}>
                        <span className="h-7 w-7 rounded-md bg-foreground/15 flex items-center justify-center font-mono-tag font-bold text-xs shrink-0">
                          {pos + 1}
                        </span>
                        <span className="flex-1">{label}</span>
                        {!orderSubmitted && (
                          <div className="flex flex-col gap-0.5">
                            <button onClick={() => moveOrder(pos, -1)} disabled={pos === 0}
                              className="h-5 w-7 rounded border-2 border-foreground bg-background text-xs font-bold disabled:opacity-30 hover:bg-foreground hover:text-background transition">↑</button>
                            <button onClick={() => moveOrder(pos, 1)} disabled={pos === orderPicked.length - 1}
                              className="h-5 w-7 rounded border-2 border-foreground bg-background text-xs font-bold disabled:opacity-30 hover:bg-foreground hover:text-background transition">↓</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {!orderSubmitted && (
                  <Button onClick={submitOrder} className="w-full rounded-full gradient-primary border-0">
                    Valider l'ordre
                  </Button>
                )}
                {orderSubmitted && (
                  <div className={`answer-postit ${orderCorrect ? "is-correct" : "is-wrong"} !cursor-default`}>
                    <div className="flex items-center gap-2 font-mono-tag text-xs uppercase">
                      {orderCorrect ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                      <span>{orderCorrect ? "Ordre exact !" : "Ordre incorrect"}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : isAssoc ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-2 px-1">
                  <p className="font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Link2 className="h-3 w-3" /> Tape un terme à gauche, puis sa définition à droite
                  </p>
                  {assocAttempts > 0 && !assocSubmitted && (
                    <span className={`font-mono-tag text-[10px] px-2 py-0.5 rounded-full border ${assocAttempts >= 3 ? "border-destructive/50 text-destructive bg-destructive/10" : "border-warning/50 text-warning bg-warning/10"}`}>
                      Essai {assocAttempts + 1}/5
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Colonne gauche : termes */}
                  <div className="space-y-2">
                    {assocPairs.map((p, i) => {
                      const matched = assocMatches[i] !== -1;
                      const selected = assocSelectedLeft === i;
                      const locked = assocLocked[i];
                      let stateCls = "";
                      if (locked) {
                        // Verrouillé = correct (vert)
                        stateCls = "border-success bg-success/15 cursor-not-allowed";
                      } else if (assocSubmitted) {
                        const ok = assocMatches[i] === i;
                        stateCls = ok ? "border-success bg-success/10" : "border-destructive bg-destructive/10";
                      } else if (selected) {
                        stateCls = "border-primary bg-primary/15 ring-2 ring-primary/40 scale-[1.02]";
                      } else if (matched && assocFlashWrong) {
                        stateCls = "border-destructive bg-destructive/10 animate-pulse";
                      } else if (matched) {
                        stateCls = "border-primary/50 bg-primary/5";
                      } else {
                        stateCls = "border-border bg-card hover:border-primary/40";
                      }
                      return (
                        <button
                          key={`L-${i}`}
                          onClick={() => onAssocPickLeft(i)}
                          disabled={assocSubmitted || locked}
                          className={`w-full text-left p-2.5 rounded-xl border-2 transition-all text-sm font-medium ${stateCls}`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={`h-5 w-5 rounded-md font-mono-tag text-[10px] font-bold flex items-center justify-center shrink-0 ${locked ? "bg-success text-success-foreground" : "bg-foreground/10"}`}>
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="flex-1 leading-tight">{p.left}</span>
                            {locked ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                            ) : matched && !assocSubmitted && (
                              <span className="text-[10px] font-mono text-primary">→{assocRightOrder.indexOf(assocMatches[i]) + 1}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {/* Colonne droite : définitions, dans ordre mélangé */}
                  <div className="space-y-2">
                    {assocRightOrder.map((rightIdx, displayPos) => {
                      const usedByLeft = assocMatches.findIndex((r) => r === rightIdx);
                      const isUsed = usedByLeft !== -1;
                      const lockedHere = usedByLeft !== -1 && assocLocked[usedByLeft];
                      let stateCls = "";
                      if (lockedHere) {
                        stateCls = "border-success bg-success/15 cursor-not-allowed";
                      } else if (assocSubmitted) {
                        const ok = usedByLeft === rightIdx;
                        stateCls = ok ? "border-success bg-success/10" : isUsed ? "border-destructive bg-destructive/10" : "border-border bg-card opacity-60";
                      } else if (isUsed && assocFlashWrong) {
                        stateCls = "border-destructive bg-destructive/10 animate-pulse";
                      } else if (isUsed) {
                        stateCls = "border-primary/50 bg-primary/5";
                      } else {
                        stateCls = "border-border bg-card hover:border-primary/40";
                      }
                      return (
                        <button
                          key={`R-${rightIdx}`}
                          onClick={() => onAssocPickRight(rightIdx)}
                          disabled={assocSubmitted || lockedHere}
                          className={`w-full text-left p-2.5 rounded-xl border-2 transition-all text-sm ${stateCls}`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={`h-5 w-5 rounded-md font-mono-tag text-[10px] font-bold flex items-center justify-center shrink-0 ${lockedHere ? "bg-success text-success-foreground" : "bg-foreground/10"}`}>
                              {displayPos + 1}
                            </span>
                            <span className="flex-1 leading-tight">{assocPairs[rightIdx]?.right}</span>
                            {lockedHere ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                            ) : isUsed && !assocSubmitted && (
                              <span className="text-[10px] font-mono text-primary">{String.fromCharCode(65 + usedByLeft)}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* Indicateur de progression */}
                {!assocSubmitted && assocLocked.some(Boolean) && (
                  <div className="flex items-center gap-2 text-xs font-mono-tag text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    <span>{assocLocked.filter(Boolean).length}/{assocPairs.length} paires verrouillées</span>
                  </div>
                )}
                {!assocSubmitted && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={resetAssoc}
                      className="rounded-full"
                      disabled={assocMatches.every((m, i) => m === -1 || assocLocked[i])}
                    >
                      <Shuffle className="h-3.5 w-3.5 mr-1" /> Reset
                    </Button>
                    <Button
                      onClick={submitAssoc}
                      disabled={assocMatches.some((m) => m === -1)}
                      className="flex-1 rounded-full gradient-primary border-0"
                    >
                      {assocAttempts === 0 ? "Valider mes liens" : "Vérifier à nouveau"}
                    </Button>
                  </div>
                )}
                {assocSubmitted && (
                  <div className={`answer-postit ${assocCorrect ? "is-correct" : "is-wrong"} !cursor-default`}>
                    <div className="flex items-center gap-2 font-mono-tag text-xs uppercase">
                      {assocCorrect ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                      <span>
                        {assocCorrect
                          ? assocAttempts === 1 ? "Parfait du premier coup ! 🎯" : `Réussi en ${assocAttempts} tentatives`
                          : "Trop de tentatives"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <Textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  disabled={openResult !== null || grading}
                  rows={q.type === "trous" ? 2 : 4}
                  placeholder={q.type === "trous" ? "Mot ou expression..." : "Rédige ta réponse en quelques phrases..."}
                  className="resize-none notebook-card !pl-12 font-hand !text-lg"
                />
                {openResult === null && (
                  <Button onClick={submitText} disabled={grading || !textAnswer.trim()} className="w-full rounded-full gradient-primary border-0">
                    {grading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Correction...</> : "Valider"}
                  </Button>
                )}
                {openResult && (
                  <div className={`answer-postit ${openResult.correct ? "is-correct" : "is-wrong"} !cursor-default`}>
                    <div className="flex items-center gap-2 font-mono-tag text-xs uppercase">
                      {openResult.correct ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                      <span>{openResult.correct ? "Bonne réponse" : "À revoir"}</span>
                    </div>
                    <p className="font-hand text-base mt-1.5">{openResult.feedback}</p>
                  </div>
                )}
              </div>
            )}

            {((isChoice && picked !== null) || (isMulti && multiSubmitted) || (isOrder && orderSubmitted) || (isAssoc && assocSubmitted) || (isText && openResult !== null)) && q.explanation && (
              <div className="mt-4 p-3 rounded-md border-l-4 border-primary/40 bg-primary/10 animate-fade-in font-hand text-base text-foreground/80 -rotate-[0.5deg]">
                💡 {q.explanation}
              </div>
            )}

            {((isChoice && picked !== null) || (isMulti && multiSubmitted) || (isOrder && orderSubmitted) || (isAssoc && assocSubmitted) || (isText && openResult !== null)) && (
              <Button
                onClick={goNext}
                className="mt-5 w-full rounded-md gradient-primary border-2 border-foreground font-bold animate-fade-in"
              >
                {qIdx + 1 >= questions.length ? "Voir les résultats" : "Question suivante"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  // end
  const pct = Math.round((score / questions.length) * 100);
  const predicted = Math.round((pct / 100) * 20);
  const stars = Math.max(1, Math.round((pct / 100) * 5));
  return (
    <AppLayout>
      <div className="px-5 pt-8 pb-6 animate-scale-in">
        <div className="notebook-page relative">
          <span className="rubber-stamp stamp-pop absolute top-3 right-4">{pct >= 80 ? "Très bien" : pct >= 50 ? "Bien" : "À revoir"}</span>

          <p className="font-mono-tag text-[10px] uppercase tracking-widest text-muted-foreground">Résultats</p>
          <h1 className="font-hand text-5xl text-primary mt-1 leading-none">{score} / {questions.length}</h1>
          <p className="font-serif text-base text-muted-foreground mt-1">soit <strong className="marker-yellow">{pct}%</strong></p>

          {/* étoiles dessinées */}
          <div className="flex gap-1 mt-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} viewBox="0 0 24 24" className={`h-7 w-7 ${i < stars ? "" : "opacity-25"}`} aria-hidden>
                <path className="sketchy-star" d="M12 2 L14.4 8.6 L21.5 9 L16 13.6 L17.8 20.5 L12 16.7 L6.2 20.5 L8 13.6 L2.5 9 L9.6 8.6 Z" />
              </svg>
            ))}
          </div>

          <div className="clip-divider my-5">
            <span className="font-mono-tag text-[10px] uppercase">Bilan</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="postit p-3 -rotate-2">
              <p className="font-mono-tag text-[10px] uppercase opacity-70">Score</p>
              <p className="font-hand text-3xl mt-1">{pct}%</p>
            </div>
            <div className="postit postit-pink p-3 rotate-2">
              <p className="font-mono-tag text-[10px] uppercase opacity-70 flex items-center gap-1"><Target className="h-3 w-3" /> Pré-exam</p>
              <p className="font-hand text-3xl mt-1">~{predicted}/20</p>
            </div>
          </div>

          {wrong.length > 0 && (
            <div className="mt-5">
              {(() => {
                // Groupement par chapitre
                const byChapter = new Map<string, number>();
                let totalTagged = 0;
                wrong.forEach((i) => {
                  const ch = questions[i]?.chapter ?? null;
                  if (ch) {
                    byChapter.set(ch, (byChapter.get(ch) ?? 0) + 1);
                    totalTagged++;
                  }
                });
                if (byChapter.size === 0) return null;
                const sorted = [...byChapter.entries()].sort((a, b) => b[1] - a[1]);
                return (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <p className="font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground">Erreurs par chapitre</p>
                    </div>
                    <div className="space-y-1.5">
                      {sorted.map(([ch, n]) => {
                        const pct = Math.round((n / totalTagged) * 100);
                        return (
                          <div key={ch} className="postit postit-pink p-2.5 -rotate-[0.3deg]">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-hand text-base flex-1 truncate">{ch}</p>
                              <span className="font-mono-tag text-[10px] bg-destructive/15 text-destructive px-1.5 py-0.5 rounded-full shrink-0">{n} erreur{n > 1 ? "s" : ""}</span>
                            </div>
                            <div className="mt-1.5 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                              <div className="h-full bg-destructive/60" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              <p className="font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground mb-2">À retravailler</p>
              <div className="space-y-2">
                {wrong.map(i => (
                  <div key={i} className="text-sm">
                    <p className="font-medium">{questions[i].question}</p>
                    <p className="font-hand text-base text-success mt-0.5">
                      → {(() => {
                        const qq = questions[i];
                        if (qq.type === "qcm_multi" && qq.answers) {
                          const idxs = (qq.accepted_answers ?? []).map(s => parseInt(s, 10)).filter(n => !isNaN(n));
                          return idxs.map(n => qq.answers![n]).filter(Boolean).join(" + ");
                        }
                        if (qq.type === "ordre" && qq.answers) {
                          const idxs = (qq.accepted_answers ?? []).map(s => parseInt(s, 10)).filter(n => !isNaN(n));
                          return idxs.map((n, k) => `${k + 1}. ${qq.answers![n]}`).join(" → ");
                        }
                        if (qq.answers && typeof qq.correct_index === "number") {
                          return qq.answers[qq.correct_index];
                        }
                        return qq.accepted_answers?.[0] ?? qq.explanation;
                      })()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-3 justify-center">
          <button onClick={() => activeQuiz && startQuiz(activeQuiz)} className="pen-btn pen-btn-blue">
            <RefreshCw className="h-4 w-4 inline mr-1" /> Refaire
          </button>
          <button onClick={() => setPhase("select")} className="pen-btn pen-btn-green">Autre quizz</button>
        </div>
      </div>
    </AppLayout>
  );
}
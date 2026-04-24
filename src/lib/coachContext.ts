import { supabase } from "@/integrations/supabase/client";
import { localDateKey } from "@/lib/date";

export type CoachContext = {
  cursus: string | null;
  weakSubjects: string[];
  nextExam: { subject: string; date: string; daysLeft: number } | null;
  streak: number;
  currentTime: string;
  emptyPlanningThisWeek: boolean;
  lateStudyHabit: boolean;
  brokenStreak: boolean;
};

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((+target - +today) / 86400000);
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Build a snapshot of the student's situation for the coach. */
export async function buildCoachContext(userId: string): Promise<CoachContext> {
  const now = new Date();
  const today = localDateKey(now);
  const wkStart = startOfWeek(now);
  const wkEnd = new Date(wkStart);
  wkEnd.setDate(wkEnd.getDate() + 6);

  const [{ data: profile }, { data: courses }, { data: tasks }, { data: attempts }] = await Promise.all([
    supabase.from("profiles").select("cursus, streak_days, last_active_date").eq("id", userId).maybeSingle(),
    supabase.from("courses").select("subject, exam_date").eq("user_id", userId).not("exam_date", "is", null),
    supabase.from("planning_tasks").select("id").eq("user_id", userId).gte("task_date", localDateKey(wkStart)).lte("task_date", localDateKey(wkEnd)),
    supabase.from("quiz_attempts").select("score, total, quiz_id, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
  ]);

  // Next exam
  let nextExam: CoachContext["nextExam"] = null;
  if (courses?.length) {
    const upcoming = courses
      .filter((c) => c.exam_date && daysUntil(c.exam_date) >= 0)
      .sort((a, b) => +new Date(a.exam_date!) - +new Date(b.exam_date!))[0];
    if (upcoming?.exam_date) {
      nextExam = {
        subject: upcoming.subject ?? "Examen",
        date: upcoming.exam_date,
        daysLeft: daysUntil(upcoming.exam_date),
      };
    }
  }

  // Weak subjects: avg score < 60% per quiz aggregated by subject would need joins.
  // Simple heuristic: any attempt with score/total < 0.6 → mark its quiz subject (best-effort via course subject).
  let weakSubjects: string[] = [];
  if (attempts?.length) {
    const lowQuizIds = attempts.filter((a) => a.total > 0 && a.score / a.total < 0.6).map((a) => a.quiz_id);
    if (lowQuizIds.length) {
      const { data: quizzes } = await supabase
        .from("quizzes")
        .select("course_id")
        .in("id", lowQuizIds);
      const courseIds = (quizzes ?? []).map((q) => q.course_id).filter(Boolean) as string[];
      if (courseIds.length) {
        const { data: subjs } = await supabase.from("courses").select("subject").in("id", courseIds);
        weakSubjects = Array.from(new Set((subjs ?? []).map((s) => s.subject).filter(Boolean) as string[])).slice(0, 3);
      }
    }
  }

  // Late study habit: any attempt created after 23h
  const lateStudyHabit = (attempts ?? []).some((a) => {
    const h = new Date(a.created_at).getHours();
    return h >= 23 || h < 4;
  });

  // Broken streak: last_active_date < yesterday
  let brokenStreak = false;
  if (profile?.last_active_date) {
    const last = new Date(profile.last_active_date + "T00:00:00");
    const diff = Math.floor((+new Date(today + "T00:00:00") - +last) / 86400000);
    brokenStreak = diff >= 2;
  }

  return {
    cursus: profile?.cursus ?? null,
    weakSubjects,
    nextExam,
    streak: profile?.streak_days ?? 0,
    currentTime: now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    emptyPlanningThisWeek: !tasks || tasks.length === 0,
    lateStudyHabit,
    brokenStreak,
  };
}

/** Pick the best daily tip from rules + context. Deterministic per day. */
export function pickDailyTip(ctx: CoachContext): { label: string; text: string; tone: "warn" | "info" | "tip" | "fire" } {
  if (ctx.nextExam && ctx.nextExam.daysLeft >= 0 && ctx.nextExam.daysLeft < 7) {
    return {
      label: "[CONSEIL DU JOUR]",
      tone: "warn",
      text: `T'as un exam ${ctx.nextExam.subject} dans ${ctx.nextExam.daysLeft} jours. Arrête les nouveaux chapitres — révise ce que tu connais déjà à 70%. Le cerveau consolide mieux ce qui est presque maîtrisé.`,
    };
  }
  if (ctx.brokenStreak) {
    return {
      label: "[CONSEIL DU JOUR]",
      tone: "fire",
      text: `Ta série s'est cassée. Pas de panique — une étude de Cambridge montre que reprendre dans les 48h repart comme avant. Ce soir, juste 15 min.`,
    };
  }
  if (ctx.weakSubjects.length) {
    return {
      label: "[CONSEIL DU JOUR]",
      tone: "tip",
      text: `Ton score en ${ctx.weakSubjects[0]} est faible. Avant de refaire des exercices, relis tes fiches — la compréhension avant la mémorisation, toujours.`,
    };
  }
  if (ctx.lateStudyHabit) {
    return {
      label: "[CONSEIL DU JOUR]",
      tone: "info",
      text: `Tu révises souvent après 23h. Ton hippocampe consolide la mémoire pendant le sommeil — 30 min le matin valent 2h la nuit. Essaie demain matin.`,
    };
  }
  if (ctx.emptyPlanningThisWeek && ctx.nextExam && ctx.nextExam.daysLeft < 14) {
    return {
      label: "[CONSEIL DU JOUR]",
      tone: "warn",
      text: `Ton planning est vide cette semaine et t'as un exam dans ${ctx.nextExam.daysLeft} jours. Clique sur 'IA' dans le planning — ça prend 30 secondes.`,
    };
  }
  return {
    label: "[CONSEIL DU JOUR]",
    tone: "tip",
    text: `Alterner les matières (pas 3h d'affilée sur la même) améliore la rétention de 23%. Essaie 45 min Maths puis 45 min Histoire ce soir.`,
  };
}

export type SmartAlert = {
  tone: "urgent" | "warn" | "ok" | "info";
  text: string;
  cta: string;
  ctaAction: "generate_plan" | "open_techniques" | "open_subject" | "none";
};

export function pickSmartAlert(ctx: CoachContext, weekTaskCount: number): SmartAlert | null {
  if (ctx.nextExam && ctx.nextExam.daysLeft >= 0 && ctx.nextExam.daysLeft <= 2) {
    return {
      tone: "urgent",
      text: `⚠️ Exam ${ctx.nextExam.subject} dans ${ctx.nextExam.daysLeft} ${ctx.nextExam.daysLeft <= 1 ? "jour" : "jours"} ! Coach recommande : révision espacée ce soir + quizz demain matin.`,
      cta: "Voir le plan d'urgence",
      ctaAction: "generate_plan",
    };
  }
  if (ctx.nextExam && ctx.nextExam.daysLeft <= 7 && weekTaskCount < 3) {
    return {
      tone: "warn",
      text: `📅 T'as un exam ${ctx.nextExam.subject} dans ${ctx.nextExam.daysLeft} jours et seulement ${weekTaskCount} session${weekTaskCount > 1 ? "s" : ""} de prévue. Coach suggère d'ajouter 3 sessions.`,
      cta: "Générer le planning",
      ctaAction: "generate_plan",
    };
  }
  if (ctx.streak >= 5 && weekTaskCount >= 4) {
    return {
      tone: "ok",
      text: `✅ T'es à fond cette semaine (streak ${ctx.streak} jours). Coach suggère d'attaquer une matière plus dure pendant que t'as l'élan.`,
      cta: "OK",
      ctaAction: "none",
    };
  }
  return {
    tone: "info",
    text: `💡 Conseil pro : alterner les matières (pas 3h de la même d'affilée) améliore la rétention de 23%.`,
    cta: "En savoir plus",
    ctaAction: "open_techniques",
  };
}
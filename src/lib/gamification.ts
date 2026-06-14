/** Gamification helpers (levels, XP, quests). */
import { illu } from "@/assets/illu";

export const LEVEL_NAMES: { min: number; max: number; name: string; emoji: string; icon: string }[] = [
  { min: 1, max: 5, name: "Bizuth", emoji: "🎒", icon: illu.backpack },
  { min: 6, max: 10, name: "Galère", emoji: "📚", icon: illu.books },
  { min: 11, max: 15, name: "Studieux", emoji: "📖", icon: illu.notebook },
  { min: 16, max: 20, name: "Assidu", emoji: "⭐", icon: illu.star },
  { min: 21, max: 25, name: "Mention AB", emoji: "🏅", icon: illu.medalBronze },
  { min: 26, max: 30, name: "Mention B", emoji: "🥈", icon: illu.medalSilver },
  { min: 31, max: 35, name: "Mention TB", emoji: "🥇", icon: illu.medalGold },
  { min: 36, max: 40, name: "Major de Promo", emoji: "🎓", icon: illu.cap },
  { min: 41, max: 45, name: "Surdoué", emoji: "🧠", icon: illu.brain },
  { min: 46, max: 50, name: "Légende Revix", emoji: "👑", icon: illu.crown },
];

export function levelInfo(level: number) {
  const tier = LEVEL_NAMES.find((t) => level >= t.min && level <= t.max) ?? LEVEL_NAMES[0];
  return tier;
}

/** XP needed to *reach* level L (matches SQL xp_for_level). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 200 * (level - 1) + 75 * (level - 1) * (level - 2);
}

export function xpProgress(totalXp: number, level: number) {
  const cur = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const span = Math.max(1, next - cur);
  const into = Math.max(0, totalXp - cur);
  return {
    cur,
    next,
    into,
    span,
    pct: Math.min(100, Math.round((into / span) * 100)),
  };
}

/** Pool of daily quests — a random subset of 3 is chosen each day. */
export const DAILY_QUEST_POOL = [
  { key: "quiz_done", title: "Révise bien", description: "Termine 1 quiz", emoji: "🧠", icon: illu.brain, target: 1, xp: 60 },
  { key: "course_uploaded", title: "Fiche express", description: "Upload 1 cours", emoji: "📄", icon: illu.doc, target: 1, xp: 60 },
  { key: "streak_kept", title: "Chaud devant", description: "Garde ta streak aujourd'hui", emoji: "🔥", icon: illu.flame, target: 1, xp: 60 },
  { key: "questions_answered", title: "Sprint", description: "Réponds à 20 questions", emoji: "⚡", icon: illu.storm, target: 20, xp: 60 },
  { key: "high_score", title: "Précision", description: "Score 80%+ à un quiz", emoji: "🎯", icon: illu.target, target: 1, xp: 80 },
  { key: "task_added", title: "Planificateur", description: "Ajoute une session au planning", emoji: "🗓️", icon: illu.planning, target: 1, xp: 50 },
  { key: "perfect_quiz", title: "Sans faute", description: "Termine un quiz sans erreur", emoji: "💪", icon: illu.muscle, target: 1, xp: 100 },
  { key: "coach_question", title: "Consulte ton coach", description: "Pose 1 question au coach IA", emoji: "🧠", icon: illu.brain, target: 1, xp: 60 },
] as const;

export const WEEKLY_QUEST_POOL = [
  { key: "w_5_quizzes", title: "Semaine de feu", description: "Termine 5 quizzes cette semaine", emoji: "🏆", icon: illu.trophy, target: 5, xp: 200 },
  { key: "w_4_uploads", title: "Bibliothécaire", description: "Upload 4 cours cette semaine", emoji: "📖", icon: illu.books, target: 4, xp: 200 },
  { key: "w_3_high_scores", title: "Major", description: "3 scores au-dessus de 80%", emoji: "🎓", icon: illu.cap, target: 3, xp: 250 },
  { key: "w_7_streak", title: "Consistance", description: "Valide 7 jours de streak sur la semaine", emoji: "🌟", icon: illu.star, target: 7, xp: 300 },
  { key: "w_5_planning_tasks", title: "Agenda blindé", description: "Ajoute 5 sessions au planning cette semaine", emoji: "🗂️", icon: illu.folder, target: 5, xp: 220 },
] as const;

/** Map a quest key (from DB) to its icon URL. */
const QUEST_ICON_MAP: Record<string, string> = {
  ...Object.fromEntries(DAILY_QUEST_POOL.map((q) => [q.key, q.icon])),
  ...Object.fromEntries(WEEKLY_QUEST_POOL.map((q) => [q.key, q.icon])),
};
export function questIcon(key: string | null | undefined): string | undefined {
  if (!key) return undefined;
  return QUEST_ICON_MAP[key];
}

export function pickDailyQuests(seed: string, n = 3) {
  // Deterministic per-day pick
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const pool = [...DAILY_QUEST_POOL];
  const out: typeof DAILY_QUEST_POOL[number][] = [];
  for (let i = 0; i < n && pool.length; i++) {
    h = (h * 9301 + 49297) % 233280;
    const idx = h % pool.length;
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return out;
}

export function pickWeeklyQuest(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return WEEKLY_QUEST_POOL[h % WEEKLY_QUEST_POOL.length];
}

export function todayKey() {
  // Use LOCAL date so daily quests rotate at user's local midnight (not UTC).
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function weekKey() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function weekEnd(weekStart: string) {
  const [y, m, dd] = weekStart.split("-").map(Number);
  const d = new Date(y, m - 1, dd);
  d.setDate(d.getDate() + 6);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${day}`;
}

/** XP rewards table for actions. */
export const XP_REWARDS = {
  upload: 50,
  quiz_finish: 40,
  quiz_high_score: 20,
  quiz_perfect: 50,
  daily_login: 10,
  streak_7: 100,
  share_fiche: 25,
} as const;

/** Ligues hebdomadaires, classées par XP de la semaine. */
export const LEAGUES: { key: string; name: string; emoji: string; icon: string; minWeekXp: number }[] = [
  { key: "bronze", name: "Bronze", emoji: "🥉", icon: illu.medalBronze, minWeekXp: 0 },
  { key: "argent", name: "Argent", emoji: "🥈", icon: illu.medalSilver, minWeekXp: 300 },
  { key: "or", name: "Or", emoji: "🥇", icon: illu.medalGold, minWeekXp: 700 },
  { key: "saphir", name: "Saphir", emoji: "💎", icon: illu.gem, minWeekXp: 1200 },
  { key: "rubis", name: "Rubis", emoji: "❤️‍🔥", icon: illu.heartFire, minWeekXp: 1800 },
  { key: "diamant", name: "Diamant", emoji: "💠", icon: illu.diamond, minWeekXp: 2500 },
  { key: "maitre", name: "Maître", emoji: "🏆", icon: illu.trophy, minWeekXp: 3500 },
  { key: "legende", name: "Légende", emoji: "👑", icon: illu.crown, minWeekXp: 5000 },
];

export function leagueInfo(weekXp: number) {
  let current = LEAGUES[0];
  let nextIdx = 1;
  for (let i = 0; i < LEAGUES.length; i++) {
    if (weekXp >= LEAGUES[i].minWeekXp) {
      current = LEAGUES[i];
      nextIdx = i + 1;
    }
  }
  const next = LEAGUES[nextIdx] ?? null;
  return { current, next };
}

/** Prestiges streak — paliers symboliques avec titre et emoji. */
export const STREAK_PRESTIGES: { days: number; name: string; emoji: string; icon: string; tagline: string }[] = [
  { days: 3, name: "Étincelle", emoji: "✨", icon: illu.sparkle, tagline: "T'as allumé la flamme." },
  { days: 7, name: "Flammèche", emoji: "🔥", icon: illu.flame, tagline: "Une semaine pleine, respect." },
  { days: 14, name: "Brasier", emoji: "🔥🔥", icon: illu.flameDouble, tagline: "Deux semaines : c'est solide." },
  { days: 30, name: "Volcan", emoji: "🌋", icon: illu.volcano, tagline: "Un mois entier — tu es chaud." },
  { days: 60, name: "Tempête de feu", emoji: "⚡🔥", icon: illu.storm, tagline: "Deux mois, t'es hors-norme." },
  { days: 100, name: "Phénix", emoji: "🐦‍🔥", icon: illu.phoenix, tagline: "100 jours. Tu renais chaque jour." },
  { days: 180, name: "Soleil", emoji: "☀️", icon: illu.sun, tagline: "6 mois — tu brilles tout seul." },
  { days: 365, name: "Supernova", emoji: "💫", icon: illu.supernova, tagline: "Une année. Légendaire." },
  { days: 500, name: "Constellation", emoji: "🌌", icon: illu.constellation, tagline: "Tu fais partie du ciel Revix." },
  { days: 1000, name: "Éternel", emoji: "♾️", icon: illu.infinity, tagline: "1000 jours. Statut mythique." },
];

export function streakPrestige(days: number) {
  let current: typeof STREAK_PRESTIGES[number] | null = null;
  let nextIdx = 0;
  for (let i = 0; i < STREAK_PRESTIGES.length; i++) {
    if (days >= STREAK_PRESTIGES[i].days) {
      current = STREAK_PRESTIGES[i];
      nextIdx = i + 1;
    }
  }
  const next = STREAK_PRESTIGES[nextIdx] ?? null;
  return { current, next };
}
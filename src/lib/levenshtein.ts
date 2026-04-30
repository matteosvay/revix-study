// Similarité de Levenshtein normalisée (0..1). Utilisée pour la correction hybride
// des questions ouvertes : si très proche on valide direct, si très loin on rejette
// direct, et seulement entre les deux on appelle l'IA.

/** Normalise une chaîne : minuscule, sans accents, sans ponctuation, espaces compactés. */
export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[.,;:!?'"()\[\]{}]/g, "")
    .replace(/\s+/g, " ");
}

export function similarity(a: string, b: string): number {
  const normalize = normalizeAnswer;
  const s1 = normalize(a);
  const s2 = normalize(b);
  if (s1 === s2) return 1;
  if (!s1.length || !s2.length) return 0;

  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= len1; i++) matrix[i] = [i];
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return 1 - matrix[len1][len2] / Math.max(len1, len2);
}

/** Compare la réponse à une liste de réponses acceptées et retourne la meilleure similarité. */
export function bestSimilarity(userAnswer: string, candidates: string[]): number {
  let best = 0;
  for (const c of candidates) {
    if (!c) continue;
    const s = similarity(userAnswer, c);
    if (s > best) best = s;
  }
  return best;
}

export type HybridGrade =
  | { source: "client"; correct: true; score: number }
  | { source: "client"; correct: false; score: number }
  | { source: "ai-needed"; score: number };

/**
 * Correction hybride pour réponses ouvertes :
 * - similarity >= 0.85 → correct (client)
 * - similarity < 0.30 → faux (client)
 * - entre les deux → "ai-needed" : le caller doit appeler grade-open.
 */
export function gradeHybrid(userAnswer: string, expected: string | string[]): HybridGrade {
  const candidates = Array.isArray(expected) ? expected : [expected];
  const score = bestSimilarity(userAnswer, candidates);
  if (score >= 0.85) return { source: "client", correct: true, score };
  if (score < 0.30) return { source: "client", correct: false, score };
  return { source: "ai-needed", score };
}

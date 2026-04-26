export type Gender = "homme" | "femme" | "autre" | null | undefined;

/**
 * Renvoie un texte genré selon le sexe.
 * Ex: genderText(g, "il", "elle", "iel") → "il" / "elle" / "iel"
 */
export function genderText(
  gender: Gender,
  masculin: string,
  feminin: string,
  neutre?: string,
): string {
  if (gender === "femme") return feminin;
  if (gender === "homme") return masculin;
  return neutre ?? masculin;
}

/** Pronom sujet ("il" / "elle" / "iel") */
export function pronoun(gender: Gender): string {
  return genderText(gender, "il", "elle", "iel");
}

/** Accord court "ami" / "amie" / "ami·e" */
export function friendNoun(gender: Gender): string {
  return genderText(gender, "ami", "amie", "ami·e");
}

export const GENDER_OPTIONS: { value: "homme" | "femme" | "autre"; label: string; emoji: string }[] = [
  { value: "homme", label: "Homme", emoji: "👨" },
  { value: "femme", label: "Femme", emoji: "👩" },
  { value: "autre", label: "Autre / je préfère ne pas dire", emoji: "🌈" },
];
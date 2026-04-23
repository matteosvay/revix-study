export const CURSUS_OPTIONS = [
  "Lycée",
  "BTS",
  "BUT / IUT",
  "Licence",
  "Master",
  "Doctorat",
  "Prépa",
  "École d'ingénieur",
  "École de commerce",
  "Médecine / PASS / LAS",
  "Droit",
  "Sciences Po / IEP",
  "Beaux-Arts / Design",
  "Formation pro",
  "Autre",
] as const;

export type Cursus = (typeof CURSUS_OPTIONS)[number];
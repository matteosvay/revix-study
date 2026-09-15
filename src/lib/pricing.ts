/**
 * Source unique des prix et de la TVA.
 *
 * Règle de base : en vente aux particuliers, un prix affiché est TOUJOURS TTC.
 * On stocke donc le prix TTC, et la TVA se déduit de ce prix, jamais l'inverse.
 *
 * Aujourd'hui l'activité est en franchise en base de TVA (article 293 B du CGI),
 * donc aucune TVA n'est reversée et le prix TTC est encaissé en entier.
 * Le jour où le chiffre d'affaires dépasse 37 500 € sur l'année, il suffit de
 * passer VAT_APPLICABLE à true : le prix payé par l'étudiant ne bouge pas, seule
 * la ventilation HT / TVA change sur le reçu et dans la comptabilité.
 */

/** Passe à true le jour de l'assujettissement à la TVA. Rien d'autre à changer. */
export const VAT_APPLICABLE = false;

/** Taux normal français. */
export const VAT_RATE = 0.20;

/** Seuil de franchise en base pour les prestations de services (2026). */
export const VAT_FRANCHISE_THRESHOLD = 37500;

export type PlanId = "pro" | "max";

export interface Plan {
  id: PlanId;
  /** Clé de recherche du prix côté Stripe. Doit exister dans le tableau de bord Stripe. */
  lookupKey: string;
  label: string;
  /** Prix payé par l'étudiant, toutes taxes comprises. */
  priceTTC: number;
  tagline: string;
}

export const PLANS: Record<PlanId, Plan> = {
  pro: {
    id: "pro",
    lookupKey: "pro_monthly",
    label: "Pro",
    priceTTC: 7.99,
    tagline: "Le plus choisi",
  },
  max: {
    id: "max",
    lookupKey: "max_monthly",
    label: "Max",
    priceTTC: 12.99,
    tagline: "Puissance max",
  },
};

/** Part hors taxes d'un prix TTC. Égale au prix TTC tant que la franchise s'applique. */
export function priceHT(priceTTC: number): number {
  return VAT_APPLICABLE ? priceTTC / (1 + VAT_RATE) : priceTTC;
}

/** Montant de TVA contenu dans un prix TTC. Vaut 0 sous la franchise. */
export function vatAmount(priceTTC: number): number {
  return VAT_APPLICABLE ? priceTTC - priceHT(priceTTC) : 0;
}

/** "7,99 €" */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

/** Suffixe à coller après un prix, par exemple "/mois TTC". */
export const PRICE_SUFFIX = "/mois TTC";

/**
 * Mention légale obligatoire à côté des prix et sur les reçus.
 * Sous la franchise, l'absence de TVA doit être justifiée explicitement.
 */
export const VAT_NOTICE = VAT_APPLICABLE
  ? "Prix TTC, TVA 20 % incluse."
  : "Prix TTC. TVA non applicable, article 293 B du CGI.";

/**
 * Quotas réellement appliqués par le serveur (_shared/mod.ts).
 * À garder synchronisés : l'écart entre ce qui est promis ici et ce qui est
 * appliqué là-bas est un écart contractuel, pas une coquille d'affichage.
 */
export const PLAN_PERKS: Record<PlanId, string[]> = {
  pro: [
    "12 quizz IA par jour, 35 par semaine",
    "16 messages coach par jour",
    "2 fiches IA par jour, 3 par semaine",
    "Planning IA hebdomadaire",
    "Flashcards et export PDF",
  ],
  max: [
    "25 quizz IA par jour, 70 par semaine",
    "40 messages coach par jour",
    "4 fiches IA par jour, 7 par semaine",
    "3 plannings IA par jour",
    "Révisions ciblées et mode duel",
  ],
};

/** Crédits offerts une seule fois à l'inscription, jamais rechargés. */
export const FREE_CREDITS_GRANT = 20;

/** Coût en crédits de chaque action, côté serveur comme côté affichage. */
export const FREE_CREDIT_COST: Record<string, number> = {
  fiche: 4,
  quiz_ia: 2,
  coach: 1,
  planning: 1,
  correction: 1,
  ocr: 1,
};

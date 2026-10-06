/**
 * Informations légales de Diplo, en un seul endroit.
 *
 * Toutes les pages légales (mentions légales, CGU, CGV, confidentialité) lisent
 * ce fichier. Quand une information change, tu la modifies ici une seule fois.
 *
 * Tant que `registered` vaut false, les pages disent la vérité : Diplo est un
 * projet étudiant en phase de test, sans vente. Aucune fausse mention de statut
 * ni de numéro SIRET n'est affichée. Les champs vides ne sont pas affichés.
 *
 * Le jour de l'immatriculation :
 *   1. registered: true
 *   2. siret, address, courtCity
 *   3. mediator (nom, site, adresse), obligatoire avant toute vente
 *   4. côté serveur, secret PAYMENTS_ENABLED = true dans Lovable Cloud
 */
export const LEGAL = {
  editorName: "Matteo Svay",
  /** Passe à true une fois la micro-entreprise immatriculée. */
  registered: false,
  /** Numéro SIRET, ou "en cours d'attribution" juste après la déclaration. */
  siret: "",
  /** Adresse de l'entreprise. Une domiciliation évite d'afficher ton adresse personnelle. */
  address: "",
  contactEmail: "matteosvay4@gmail.com",
  /** Ville du tribunal compétent, en général celle du siège. */
  courtCity: "",
  /** Médiateur de la consommation (article L612-1 du Code de la consommation). */
  mediator: { name: "", website: "", address: "" },
  /** Délai de réponse annoncé aux réclamations. */
  replyDelay: "5 jours ouvrés",
} as const;

export const editorStatus = (): string =>
  LEGAL.registered
    ? "Entrepreneur individuel (micro-entreprise)"
    : "Particulier, projet étudiant en phase de test, sans activité commerciale à ce jour";

/** Sous-traitants réellement utilisés par l'app. À tenir à jour à chaque changement de fournisseur. */
export const SUBPROCESSORS: [string, string][] = [
  ["Lovable", "Hébergement de l'application et passerelle vers les modèles d'IA de Google"],
  ["Supabase, Inc.", "Base de données, authentification et stockage des fichiers, infrastructure AWS"],
  ["Anthropic, PBC", "Génération des fiches, quizz et réponses du coach (modèles Claude), États-Unis. Les contenus ne servent pas à entraîner les modèles et sont supprimés sous 30 jours"],
  ["Google (Gemini)", "Lecture des photos de cours, plannings et banques de questions, via la passerelle Lovable"],
  ["Stripe, Inc.", "Paiement en ligne, États-Unis, certifié PCI-DSS. Diplo ne stocke jamais tes données bancaires"],
];

export const AI_PROVIDERS_LABEL = "Anthropic (Claude) et Google (Gemini)";

/**
 * Base de données curée des formations françaises.
 * Recherche locale (sans API), couvre les principales filières post-bac et lycée.
 */

export type Formation = {
  name: string;
  category: string;
  abbr?: string;
};

export const FORMATIONS: Formation[] = [
  // Lycée
  { name: "Seconde générale", category: "Lycée" },
  { name: "Première générale", category: "Lycée" },
  { name: "Terminale générale", category: "Lycée" },
  { name: "Bac STMG", category: "Lycée" },
  { name: "Bac STI2D", category: "Lycée" },
  { name: "Bac ST2S", category: "Lycée" },
  { name: "Bac STL", category: "Lycée" },
  { name: "Bac STD2A", category: "Lycée" },
  { name: "Bac STAV", category: "Lycée" },
  { name: "Bac Pro Commerce", category: "Lycée" },
  { name: "Bac Pro Gestion-Administration", category: "Lycée" },

  // BUT / IUT
  { name: "BUT GEA - Gestion des Entreprises et des Administrations", abbr: "BUT GEA", category: "BUT / IUT" },
  { name: "BUT TC - Techniques de Commercialisation", abbr: "BUT TC", category: "BUT / IUT" },
  { name: "BUT GACO - Gestion Administrative et Commerciale", abbr: "BUT GACO", category: "BUT / IUT" },
  { name: "BUT MMI - Métiers du Multimédia et de l'Internet", abbr: "BUT MMI", category: "BUT / IUT" },
  { name: "BUT Informatique", category: "BUT / IUT" },
  { name: "BUT R&T - Réseaux et Télécoms", abbr: "BUT R&T", category: "BUT / IUT" },
  { name: "BUT GEII - Génie Électrique et Informatique Industrielle", abbr: "BUT GEII", category: "BUT / IUT" },
  { name: "BUT GMP - Génie Mécanique et Productique", abbr: "BUT GMP", category: "BUT / IUT" },
  { name: "BUT GCCD - Génie Civil Construction Durable", abbr: "BUT GCCD", category: "BUT / IUT" },
  { name: "BUT MP - Mesures Physiques", abbr: "BUT MP", category: "BUT / IUT" },
  { name: "BUT Chimie", category: "BUT / IUT" },
  { name: "BUT GB - Génie Biologique", abbr: "BUT GB", category: "BUT / IUT" },
  { name: "BUT GIM - Génie Industriel et Maintenance", abbr: "BUT GIM", category: "BUT / IUT" },
  { name: "BUT QLIO - Qualité Logistique Industrielle", abbr: "BUT QLIO", category: "BUT / IUT" },
  { name: "BUT Carrières Juridiques", category: "BUT / IUT" },
  { name: "BUT Carrières Sociales", category: "BUT / IUT" },
  { name: "BUT Information-Communication", category: "BUT / IUT" },
  { name: "BUT Statistique et Informatique Décisionnelle (STID)", category: "BUT / IUT" },
  { name: "BUT Hygiène Sécurité Environnement (HSE)", category: "BUT / IUT" },

  // BTS
  { name: "BTS MCO - Management Commercial Opérationnel", abbr: "BTS MCO", category: "BTS" },
  { name: "BTS NDRC - Négociation et Digitalisation Relation Client", abbr: "BTS NDRC", category: "BTS" },
  { name: "BTS GPME - Gestion PME", abbr: "BTS GPME", category: "BTS" },
  { name: "BTS SAM - Support à l'Action Managériale", abbr: "BTS SAM", category: "BTS" },
  { name: "BTS CG - Comptabilité et Gestion", abbr: "BTS CG", category: "BTS" },
  { name: "BTS Banque", category: "BTS" },
  { name: "BTS Assurance", category: "BTS" },
  { name: "BTS Communication", category: "BTS" },
  { name: "BTS Tourisme", category: "BTS" },
  { name: "BTS Hôtellerie-Restauration", category: "BTS" },
  { name: "BTS SIO - Services Informatiques aux Organisations", abbr: "BTS SIO", category: "BTS" },
  { name: "BTS CIEL - Cybersécurité, Informatique, Électronique", abbr: "BTS CIEL", category: "BTS" },
  { name: "BTS Design Graphique", category: "BTS" },
  { name: "BTS Design d'Espace", category: "BTS" },
  { name: "BTS MUC", category: "BTS" },

  // Licence
  { name: "Licence Droit", category: "Licence" },
  { name: "Licence Économie", category: "Licence" },
  { name: "Licence Économie-Gestion", category: "Licence" },
  { name: "Licence AES", category: "Licence" },
  { name: "Licence Gestion", category: "Licence" },
  { name: "Licence MIASHS", category: "Licence" },
  { name: "Licence Mathématiques", category: "Licence" },
  { name: "Licence Informatique", category: "Licence" },
  { name: "Licence Physique", category: "Licence" },
  { name: "Licence Chimie", category: "Licence" },
  { name: "Licence Biologie", category: "Licence" },
  { name: "Licence SVT", category: "Licence" },
  { name: "Licence STAPS", category: "Licence" },
  { name: "Licence Psychologie", category: "Licence" },
  { name: "Licence Sociologie", category: "Licence" },
  { name: "Licence Histoire", category: "Licence" },
  { name: "Licence Géographie", category: "Licence" },
  { name: "Licence Histoire de l'art", category: "Licence" },
  { name: "Licence Philosophie", category: "Licence" },
  { name: "Licence Lettres modernes", category: "Licence" },
  { name: "Licence Lettres classiques", category: "Licence" },
  { name: "Licence LEA", category: "Licence" },
  { name: "Licence LLCER", category: "Licence" },
  { name: "Licence Sciences politiques", category: "Licence" },
  { name: "Licence Information-Communication", category: "Licence" },
  { name: "Licence Arts du spectacle", category: "Licence" },
  { name: "Licence Musicologie", category: "Licence" },
  { name: "Licence Sciences de l'éducation", category: "Licence" },

  // Master
  { name: "Master Droit des affaires", category: "Master" },
  { name: "Master Droit public", category: "Master" },
  { name: "Master Droit pénal", category: "Master" },
  { name: "Master Finance", category: "Master" },
  { name: "Master Marketing", category: "Master" },
  { name: "Master Management", category: "Master" },
  { name: "Master MEEF", category: "Master" },
  { name: "Master Informatique", category: "Master" },
  { name: "Master Data Science", category: "Master" },
  { name: "Master Cybersécurité", category: "Master" },
  { name: "Master Communication", category: "Master" },
  { name: "Master Ressources Humaines", category: "Master" },
  { name: "Master Psychologie clinique", category: "Master" },
  { name: "Master Économie", category: "Master" },
  { name: "Master Sciences politiques", category: "Master" },
  { name: "Master Histoire", category: "Master" },
  { name: "Master Géographie", category: "Master" },

  // Prépa
  { name: "Prépa MPSI", category: "Prépa" },
  { name: "Prépa PCSI", category: "Prépa" },
  { name: "Prépa PTSI", category: "Prépa" },
  { name: "Prépa BCPST", category: "Prépa" },
  { name: "Prépa MP", category: "Prépa" },
  { name: "Prépa PC", category: "Prépa" },
  { name: "Prépa PSI", category: "Prépa" },
  { name: "Prépa PT", category: "Prépa" },
  { name: "Prépa ECG", category: "Prépa" },
  { name: "Prépa ECT", category: "Prépa" },
  { name: "Prépa A/L (Lettres)", category: "Prépa" },
  { name: "Prépa B/L (Lettres + Sciences sociales)", category: "Prépa" },
  { name: "Prépa Khâgne", category: "Prépa" },
  { name: "Prépa Hypokhâgne", category: "Prépa" },

  // Médecine
  { name: "PASS - Parcours Spécifique Santé", abbr: "PASS", category: "Médecine" },
  { name: "L.AS - Licence Accès Santé", abbr: "L.AS", category: "Médecine" },
  { name: "DFGSM2 (2e année médecine)", category: "Médecine" },
  { name: "DFGSM3 (3e année médecine)", category: "Médecine" },
  { name: "DFASM1", category: "Médecine" },
  { name: "DFASM2", category: "Médecine" },
  { name: "DFASM3", category: "Médecine" },
  { name: "Internat de médecine", category: "Médecine" },
  { name: "Études dentaires", category: "Médecine" },
  { name: "Études pharmacie", category: "Médecine" },
  { name: "Études maïeutique (sage-femme)", category: "Médecine" },
  { name: "IFSI - Soins infirmiers", abbr: "IFSI", category: "Médecine" },
  { name: "Kinésithérapie", category: "Médecine" },
  { name: "Orthophonie", category: "Médecine" },
  { name: "Ergothérapie", category: "Médecine" },

  // École d'ingénieur
  { name: "INSA", category: "École d'ingénieur" },
  { name: "École Centrale", category: "École d'ingénieur" },
  { name: "École des Mines", category: "École d'ingénieur" },
  { name: "Polytechnique", category: "École d'ingénieur" },
  { name: "Arts et Métiers (ENSAM)", category: "École d'ingénieur" },
  { name: "ESIEE", category: "École d'ingénieur" },
  { name: "EPITA", category: "École d'ingénieur" },
  { name: "Epitech", category: "École d'ingénieur" },
  { name: "ENSEEIHT", category: "École d'ingénieur" },
  { name: "ENSIMAG", category: "École d'ingénieur" },
  { name: "Télécom Paris", category: "École d'ingénieur" },
  { name: "École d'ingénieur (générique)", category: "École d'ingénieur" },

  // École de commerce
  { name: "HEC Paris", category: "École de commerce" },
  { name: "ESSEC", category: "École de commerce" },
  { name: "ESCP", category: "École de commerce" },
  { name: "EDHEC", category: "École de commerce" },
  { name: "EMLyon", category: "École de commerce" },
  { name: "Audencia", category: "École de commerce" },
  { name: "Skema", category: "École de commerce" },
  { name: "NEOMA", category: "École de commerce" },
  { name: "KEDGE", category: "École de commerce" },
  { name: "TBS Education", category: "École de commerce" },
  { name: "Programme Grande École (générique)", category: "École de commerce" },
  { name: "BBA", category: "École de commerce" },

  // Sciences Po / IEP
  { name: "Sciences Po Paris", category: "Sciences Po / IEP" },
  { name: "Sciences Po Lyon", category: "Sciences Po / IEP" },
  { name: "Sciences Po Bordeaux", category: "Sciences Po / IEP" },
  { name: "Sciences Po Aix", category: "Sciences Po / IEP" },
  { name: "Sciences Po Grenoble", category: "Sciences Po / IEP" },
  { name: "Sciences Po Lille", category: "Sciences Po / IEP" },
  { name: "Sciences Po Rennes", category: "Sciences Po / IEP" },
  { name: "Sciences Po Strasbourg", category: "Sciences Po / IEP" },
  { name: "Sciences Po Toulouse", category: "Sciences Po / IEP" },
  { name: "Sciences Po St-Germain", category: "Sciences Po / IEP" },

  // Beaux-Arts / Design
  { name: "Beaux-Arts (ENSBA)", category: "Beaux-Arts / Design" },
  { name: "ENSCI - Les Ateliers", category: "Beaux-Arts / Design" },
  { name: "École Boulle", category: "Beaux-Arts / Design" },
  { name: "École Estienne", category: "Beaux-Arts / Design" },
  { name: "Penninghen", category: "Beaux-Arts / Design" },
  { name: "Gobelins", category: "Beaux-Arts / Design" },
  { name: "DN MADE", category: "Beaux-Arts / Design" },
  { name: "DNA - Diplôme National d'Art", category: "Beaux-Arts / Design" },
  { name: "DNSEP", category: "Beaux-Arts / Design" },

  // Doctorat
  { name: "Doctorat Sciences", category: "Doctorat" },
  { name: "Doctorat Lettres", category: "Doctorat" },
  { name: "Doctorat Droit", category: "Doctorat" },
  { name: "Doctorat Économie", category: "Doctorat" },

  // Formation pro
  { name: "Formation continue", category: "Formation pro" },
  { name: "CAP", category: "Formation pro" },
  { name: "BP", category: "Formation pro" },
  { name: "Titre RNCP", category: "Formation pro" },
  { name: "Bootcamp Dev Web", category: "Formation pro" },
  { name: "Bootcamp Data", category: "Formation pro" },

  // Autre
  { name: "Autre / non listé", category: "Autre" },
];

export function searchFormations(q: string, limit = 30): Formation[] {
  const query = q.trim().toLowerCase();
  if (!query) return FORMATIONS.slice(0, limit);
  return FORMATIONS.filter(f =>
    f.name.toLowerCase().includes(query) ||
    f.category.toLowerCase().includes(query) ||
    (f.abbr?.toLowerCase().includes(query) ?? false)
  ).slice(0, limit);
}
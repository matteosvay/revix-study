/**
 * Base de données curée de matières (français + universitaire).
 */

export type Subject = { name: string; category: string; emoji?: string };

export const SUBJECTS: Subject[] = [
  // Tronc commun
  { name: "Mathématiques", category: "Sciences", emoji: "📐" },
  { name: "Physique", category: "Sciences", emoji: "⚛️" },
  { name: "Chimie", category: "Sciences", emoji: "🧪" },
  { name: "Biologie", category: "Sciences", emoji: "🧬" },
  { name: "SVT", category: "Sciences", emoji: "🌱" },
  { name: "Géologie", category: "Sciences", emoji: "🪨" },
  { name: "Statistiques", category: "Sciences", emoji: "📊" },
  { name: "Probabilités", category: "Sciences", emoji: "🎲" },
  { name: "Algèbre linéaire", category: "Sciences", emoji: "🧮" },
  { name: "Analyse", category: "Sciences", emoji: "∫" },
  { name: "Mécanique", category: "Sciences", emoji: "⚙️" },
  { name: "Thermodynamique", category: "Sciences", emoji: "🔥" },
  { name: "Électromagnétisme", category: "Sciences", emoji: "⚡" },
  { name: "Optique", category: "Sciences", emoji: "🔭" },

  // Informatique
  { name: "Algorithmique", category: "Informatique", emoji: "💻" },
  { name: "Programmation", category: "Informatique", emoji: "👨‍💻" },
  { name: "Python", category: "Informatique", emoji: "🐍" },
  { name: "Java", category: "Informatique", emoji: "☕" },
  { name: "JavaScript", category: "Informatique", emoji: "🟨" },
  { name: "Bases de données / SQL", category: "Informatique", emoji: "🗄️" },
  { name: "Réseaux", category: "Informatique", emoji: "🌐" },
  { name: "Systèmes d'exploitation", category: "Informatique", emoji: "🖥️" },
  { name: "Cybersécurité", category: "Informatique", emoji: "🔒" },
  { name: "Développement web", category: "Informatique", emoji: "🕸️" },
  { name: "Intelligence artificielle", category: "Informatique", emoji: "🤖" },
  { name: "Data Science", category: "Informatique", emoji: "📈" },
  { name: "Génie logiciel", category: "Informatique", emoji: "🛠️" },
  { name: "UML", category: "Informatique", emoji: "📐" },

  // Économie / Gestion
  { name: "Économie générale", category: "Économie & Gestion", emoji: "💹" },
  { name: "Microéconomie", category: "Économie & Gestion", emoji: "📉" },
  { name: "Macroéconomie", category: "Économie & Gestion", emoji: "📊" },
  { name: "Comptabilité générale", category: "Économie & Gestion", emoji: "🧾" },
  { name: "Comptabilité analytique", category: "Économie & Gestion", emoji: "📒" },
  { name: "Contrôle de gestion", category: "Économie & Gestion", emoji: "🎯" },
  { name: "Finance d'entreprise", category: "Économie & Gestion", emoji: "💰" },
  { name: "Marchés financiers", category: "Économie & Gestion", emoji: "📈" },
  { name: "Marketing", category: "Économie & Gestion", emoji: "📣" },
  { name: "Marketing digital", category: "Économie & Gestion", emoji: "📱" },
  { name: "Management", category: "Économie & Gestion", emoji: "👔" },
  { name: "GRH - Gestion Ressources Humaines", category: "Économie & Gestion", emoji: "🧑‍🤝‍🧑" },
  { name: "Stratégie d'entreprise", category: "Économie & Gestion", emoji: "♟️" },
  { name: "Logistique", category: "Économie & Gestion", emoji: "📦" },
  { name: "Supply chain", category: "Économie & Gestion", emoji: "🔗" },
  { name: "Économétrie", category: "Économie & Gestion", emoji: "🧮" },
  { name: "Fiscalité", category: "Économie & Gestion", emoji: "📑" },

  // Droit
  { name: "Droit civil", category: "Droit", emoji: "⚖️" },
  { name: "Droit pénal", category: "Droit", emoji: "🚔" },
  { name: "Droit constitutionnel", category: "Droit", emoji: "🏛️" },
  { name: "Droit administratif", category: "Droit", emoji: "🏢" },
  { name: "Droit des affaires", category: "Droit", emoji: "💼" },
  { name: "Droit du travail", category: "Droit", emoji: "👷" },
  { name: "Droit fiscal", category: "Droit", emoji: "📋" },
  { name: "Droit des sociétés", category: "Droit", emoji: "🏭" },
  { name: "Droit international", category: "Droit", emoji: "🌍" },
  { name: "Droit européen", category: "Droit", emoji: "🇪🇺" },
  { name: "Procédure civile", category: "Droit", emoji: "📜" },

  // Sciences humaines
  { name: "Histoire", category: "Sciences humaines", emoji: "📜" },
  { name: "Géographie", category: "Sciences humaines", emoji: "🗺️" },
  { name: "Philosophie", category: "Sciences humaines", emoji: "🤔" },
  { name: "Sociologie", category: "Sciences humaines", emoji: "👥" },
  { name: "Psychologie", category: "Sciences humaines", emoji: "🧠" },
  { name: "Anthropologie", category: "Sciences humaines", emoji: "🗿" },
  { name: "Sciences politiques", category: "Sciences humaines", emoji: "🏛️" },
  { name: "Histoire de l'art", category: "Sciences humaines", emoji: "🎨" },

  // Lettres / Langues
  { name: "Français", category: "Lettres & Langues", emoji: "📖" },
  { name: "Littérature", category: "Lettres & Langues", emoji: "📚" },
  { name: "Anglais", category: "Lettres & Langues", emoji: "🇬🇧" },
  { name: "Espagnol", category: "Lettres & Langues", emoji: "🇪🇸" },
  { name: "Allemand", category: "Lettres & Langues", emoji: "🇩🇪" },
  { name: "Italien", category: "Lettres & Langues", emoji: "🇮🇹" },
  { name: "Chinois", category: "Lettres & Langues", emoji: "🇨🇳" },
  { name: "Japonais", category: "Lettres & Langues", emoji: "🇯🇵" },
  { name: "Latin", category: "Lettres & Langues", emoji: "🏛️" },
  { name: "Grec ancien", category: "Lettres & Langues", emoji: "🏺" },

  // Médecine
  { name: "Anatomie", category: "Santé", emoji: "🦴" },
  { name: "Physiologie", category: "Santé", emoji: "❤️" },
  { name: "Histologie", category: "Santé", emoji: "🔬" },
  { name: "Embryologie", category: "Santé", emoji: "🧫" },
  { name: "Pharmacologie", category: "Santé", emoji: "💊" },
  { name: "Biochimie", category: "Santé", emoji: "🧪" },
  { name: "Biophysique", category: "Santé", emoji: "🌀" },
  { name: "Sémiologie", category: "Santé", emoji: "🩺" },
  { name: "Santé publique", category: "Santé", emoji: "🏥" },

  // Communication / Arts
  { name: "Communication", category: "Arts & Communication", emoji: "💬" },
  { name: "Design graphique", category: "Arts & Communication", emoji: "🎨" },
  { name: "Design produit", category: "Arts & Communication", emoji: "🪑" },
  { name: "UX / UI Design", category: "Arts & Communication", emoji: "📱" },
  { name: "Photographie", category: "Arts & Communication", emoji: "📷" },
  { name: "Cinéma", category: "Arts & Communication", emoji: "🎬" },
  { name: "Musique", category: "Arts & Communication", emoji: "🎵" },
  { name: "Histoire des médias", category: "Arts & Communication", emoji: "📺" },

  // Ingénierie
  { name: "Mécanique des fluides", category: "Ingénierie", emoji: "💧" },
  { name: "Résistance des matériaux", category: "Ingénierie", emoji: "🔩" },
  { name: "Génie civil", category: "Ingénierie", emoji: "🏗️" },
  { name: "Génie électrique", category: "Ingénierie", emoji: "🔌" },
  { name: "Automatique", category: "Ingénierie", emoji: "🤖" },
  { name: "Électronique", category: "Ingénierie", emoji: "🔋" },
  { name: "Productique", category: "Ingénierie", emoji: "🏭" },

  // Autre
  { name: "EPS / Sport", category: "Autre", emoji: "🏃" },
  { name: "Méthodologie", category: "Autre", emoji: "📋" },
  { name: "PPP - Projet Personnel et Professionnel", category: "Autre", emoji: "🎯" },
  { name: "Stage", category: "Autre", emoji: "💼" },
];

export function searchSubjects(q: string, limit = 40): Subject[] {
  const query = q.trim().toLowerCase();
  if (!query) return SUBJECTS.slice(0, limit);
  return SUBJECTS.filter(s =>
    s.name.toLowerCase().includes(query) ||
    s.category.toLowerCase().includes(query)
  ).slice(0, limit);
}
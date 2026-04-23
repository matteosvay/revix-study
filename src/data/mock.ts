export type Course = {
  id: string;
  title: string;
  subject: string;
  level: "BTS" | "Licence" | "Prépa";
  date: string;
  flashcards: { id: string; front: string; back: string }[];
  progress: number;
  color: string;
};

export const courses: Course[] = [
  {
    id: "c1",
    title: "Droit des contrats",
    subject: "Droit",
    level: "Licence",
    date: "12 oct. 2025",
    progress: 72,
    color: "from-purple-500 to-indigo-500",
    flashcards: [
      { id: "f1", front: "Définition du contrat (art. 1101 C. civ.)", back: "Accord de volontés entre deux ou plusieurs personnes destiné à créer, modifier, transmettre ou éteindre des obligations." },
      { id: "f2", front: "Conditions de validité d'un contrat", back: "Consentement, capacité des parties, contenu licite et certain (art. 1128)." },
      { id: "f3", front: "Vice du consentement", back: "Erreur, dol, violence — entraînent la nullité relative du contrat." },
      { id: "f4", front: "Force obligatoire du contrat", back: "Article 1103 : les contrats légalement formés tiennent lieu de loi à ceux qui les ont faits." },
      { id: "f5", front: "Imprévision (art. 1195)", back: "Si un changement imprévisible rend l'exécution excessivement onéreuse, une partie peut demander la renégociation." },
      { id: "f6", front: "Résolution pour inexécution", back: "Sanction permettant à une partie d'anéantir le contrat en cas d'inexécution suffisamment grave." },
    ],
  },
  {
    id: "c2",
    title: "Marketing Mix",
    subject: "Marketing",
    level: "BTS",
    date: "8 oct. 2025",
    progress: 45,
    color: "from-pink-500 to-rose-500",
    flashcards: [
      { id: "f1", front: "Les 4P du Marketing Mix", back: "Product, Price, Place, Promotion — modèle de McCarthy (1960)." },
      { id: "f2", front: "Stratégie de prix d'écrémage", back: "Fixer un prix élevé pour cibler une clientèle premium, puis baisser progressivement." },
      { id: "f3", front: "Stratégie de pénétration", back: "Prix bas pour conquérir rapidement une grande part de marché." },
      { id: "f4", front: "Cycle de vie produit", back: "Lancement → Croissance → Maturité → Déclin." },
      { id: "f5", front: "SWOT", back: "Strengths, Weaknesses, Opportunities, Threats — analyse stratégique interne/externe." },
      { id: "f6", front: "Positionnement", back: "Image distinctive du produit dans l'esprit du consommateur cible." },
    ],
  },
  {
    id: "c3",
    title: "Analyse littéraire — Baudelaire",
    subject: "Lettres",
    level: "Prépa",
    date: "5 oct. 2025",
    progress: 88,
    color: "from-amber-500 to-orange-500",
    flashcards: [
      { id: "f1", front: "Spleen et Idéal — thème central", back: "Tension permanente entre l'aspiration vers le beau (Idéal) et l'enlisement dans l'ennui (Spleen)." },
      { id: "f2", front: "Synesthésie chez Baudelaire", back: "Correspondance entre les sens — voir 'Correspondances' : 'Les parfums, les couleurs et les sons se répondent.'" },
      { id: "f3", front: "Modernité poétique", back: "Baudelaire fait entrer la ville, la laideur et le quotidien dans la poésie ('Tableaux parisiens')." },
      { id: "f4", front: "Allégorie", back: "Représentation concrète d'une idée abstraite — ex. l'Ennui personnifié dans 'Au lecteur'." },
      { id: "f5", front: "L'Albatros", back: "Allégorie du poète : majestueux dans son élément, ridicule et exilé chez les hommes." },
    ],
  },
];

export const recentActivity = [
  { id: 1, text: "Quizz terminé : Droit des contrats — 82%", time: "il y a 2h", icon: "trophy" },
  { id: 2, text: "Nouveau cours uploadé : Marketing Mix", time: "hier", icon: "upload" },
  { id: 3, text: "Streak de 7 jours atteint 🔥", time: "hier", icon: "flame" },
  { id: 4, text: "Fiches générées : Baudelaire (5 cartes)", time: "il y a 2j", icon: "sparkles" },
];

export const planning = [
  { day: "Lun", tasks: [{ time: "9h-11h", subject: "Droit", color: "bg-purple-500" }, { time: "14h-15h30", subject: "Marketing", color: "bg-pink-500" }] },
  { day: "Mar", tasks: [{ time: "10h-12h", subject: "Lettres", color: "bg-amber-500" }] },
  { day: "Mer", tasks: [{ time: "9h-10h30", subject: "Droit", color: "bg-purple-500" }, { time: "16h-17h", subject: "Marketing", color: "bg-pink-500" }] },
  { day: "Jeu", tasks: [{ time: "14h-16h", subject: "Lettres", color: "bg-amber-500" }] },
  { day: "Ven", tasks: [{ time: "9h-11h", subject: "Droit", color: "bg-purple-500" }] },
  { day: "Sam", tasks: [{ time: "10h-12h", subject: "Révisions", color: "bg-indigo-500" }] },
  { day: "Dim", tasks: [] },
];

export const todayTasks = [
  { id: 1, label: "Réviser Droit des contrats — chap. 3", done: true },
  { id: 2, label: "Quizz Marketing Mix (20 questions)", done: false },
  { id: 3, label: "Lire 'L'Albatros' + commentaire", done: false },
];

export const quizQuestions = [
  {
    q: "Selon l'article 1101 du Code civil, le contrat est :",
    answers: [
      "Un acte unilatéral créant des obligations",
      "Un accord de volontés destiné à créer des obligations",
      "Une décision judiciaire",
      "Un acte de commerce",
    ],
    correct: 1,
  },
  {
    q: "Quel vice du consentement nécessite des manœuvres frauduleuses ?",
    answers: ["L'erreur", "La violence", "Le dol", "La lésion"],
    correct: 2,
  },
  {
    q: "L'article 1103 consacre :",
    answers: [
      "La liberté contractuelle",
      "La force obligatoire du contrat",
      "L'effet relatif",
      "La bonne foi",
    ],
    correct: 1,
  },
  {
    q: "L'imprévision permet :",
    answers: [
      "L'annulation immédiate du contrat",
      "La renégociation en cas de changement imprévisible",
      "L'exécution forcée",
      "Aucune action",
    ],
    correct: 1,
  },
  {
    q: "La nullité relative protège :",
    answers: ["L'intérêt général", "L'ordre public", "Un intérêt particulier", "L'État"],
    correct: 2,
  },
];

export const testimonials = [
  { name: "Léa M.", role: "BTS NDRC, Lyon", quote: "J'ai pris 4 points en marketing en 3 semaines. Les fiches sont parfaites pour mes révisions du soir.", avatar: "LM" },
  { name: "Hugo T.", role: "Licence Droit, Paris", quote: "Le mode quizz a sauvé mes partiels. Je connais enfin les arrêts par cœur sans souffrir.", avatar: "HT" },
  { name: "Inès R.", role: "Prépa HEC, Bordeaux", quote: "Le planning IA m'a structurée. Plus de stress du dimanche soir, je sais quoi réviser.", avatar: "IR" },
];

export const faqs = [
  { q: "Est-ce vraiment gratuit ?", a: "Oui, le plan Gratuit te donne 3 uploads par semaine et l'accès aux fiches basiques, sans carte bancaire." },
  { q: "Mes cours sont-ils en sécurité ?", a: "100%. Tes données restent en France, hébergées chez OVH, et ne sont jamais utilisées pour entraîner d'IA." },
  { q: "Quels formats sont acceptés ?", a: "PDF, photos (JPG/PNG), screenshots et texte collé directement. L'IA s'occupe du reste." },
  { q: "Puis-je annuler à tout moment ?", a: "Oui, sans engagement. Tu peux passer du Pro au Gratuit en un clic depuis ton profil." },
  { q: "Revix fonctionne pour toutes les matières ?", a: "Oui — droit, marketing, maths, histoire, philo, langues, médecine... tout ce qui est texte ou notes." },
];
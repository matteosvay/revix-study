import { SubjectLandingLayout } from "@/components/seo/SubjectLandingLayout";

export default function FicheAnalyseLitteraire() {
  return (
    <SubjectLandingLayout
      title="Fiche Analyse littéraire — méthode, figures, quiz | Revix"
      metaDescription="Méthode complète d'analyse littéraire : axes de lecture, figures de style, registres. Flashcards et quiz interactifs pour réussir le bac de français."
      path="/fiches-de-revision/analyse-litteraire"
      subject="Analyse littéraire"
      tagline="Fiche matière · Français"
      h1="Fiche d'analyse littéraire"
      intro={
        <>
          <p>
            La méthode pour analyser un texte au bac de français : repérer les
            procédés, construire des axes de lecture, structurer un commentaire.
          </p>
          <p>
            Avec flashcards de figures de style et mini-quiz sur les registres.
          </p>
        </>
      }
      highlights={[
        "Méthode du commentaire composé",
        "Tableau des principales figures de style",
        "Registres littéraires et effets",
        "Quiz pour réviser avant l'oral du bac",
      ]}
      sheetTitle="Méthode du commentaire littéraire"
      sheetSections={[
        {
          heading: "Lire et identifier le texte",
          points: [
            "Repérer le genre (poésie, théâtre, roman, essai) et le mouvement littéraire.",
            "Situer l'auteur, l'époque, l'œuvre dont le texte est extrait.",
            "Identifier la situation d'énonciation : qui parle, à qui, où, quand ?",
          ],
        },
        {
          heading: "Repérer les procédés",
          points: [
            "Lexique : champs lexicaux dominants, connotations.",
            "Syntaxe : longueur des phrases, rythme, ponctuation.",
            "Figures de style : métaphore, personnification, anaphore, antithèse, hyperbole.",
            "Sonorités (poésie) : allitérations, assonances, rimes.",
          ],
        },
        {
          heading: "Construire les axes de lecture",
          points: [
            "Un axe = une grande idée sur le sens du texte.",
            "Chaque axe se décompose en sous-parties appuyées sur des procédés cités.",
            "Conseil : 2 ou 3 axes, équilibrés, qui répondent à une problématique.",
          ],
        },
        {
          heading: "Structurer le commentaire",
          points: [
            "Introduction : amorce, présentation, problématique, annonce du plan.",
            "Développement : axes + sous-parties (citation → procédé → interprétation).",
            "Conclusion : bilan + ouverture vers une autre œuvre ou un autre auteur.",
          ],
        },
      ]}
      flashcards={[
        { front: "Qu'est-ce qu'une métaphore ?", back: "Une comparaison sans outil de comparaison : 'cet homme est un lion'." },
        { front: "Définis 'anaphore'.", back: "Répétition d'un même mot ou groupe en début de vers/phrase pour insister." },
        { front: "Le registre pathétique cherche à provoquer…", back: "…la pitié, l'émotion forte du lecteur face à la souffrance d'un personnage." },
        { front: "Différence entre comparaison et métaphore ?", back: "La comparaison utilise un outil (comme, tel, pareil à). La métaphore l'omet." },
        { front: "Qu'est-ce qu'une oxymore ?", back: "L'alliance de deux termes contradictoires dans une même expression : 'une obscure clarté' (Corneille)." },
        { front: "Registre épique = ?", back: "Récit héroïque qui amplifie les actions ; hyperboles, énumérations, pluriels de masse, lexique du combat." },
      ]}
      quiz={[
        {
          question: "« Le vent hurlait dans la nuit » : quelle figure de style ?",
          choices: ["Métaphore", "Personnification", "Hyperbole", "Litote"],
          correctIndex: 1,
          explanation: "On attribue au vent un comportement humain (hurler) : c'est une personnification.",
        },
        {
          question: "Quel registre vise à faire rire en se moquant ?",
          choices: ["Tragique", "Lyrique", "Satirique", "Élégiaque"],
          correctIndex: 2,
          explanation: "Le registre satirique critique en se moquant — La Fontaine, Voltaire en sont maîtres.",
        },
        {
          question: "Un alexandrin est un vers de :",
          choices: ["8 syllabes", "10 syllabes", "12 syllabes", "14 syllabes"],
          correctIndex: 2,
          explanation: "L'alexandrin classique compte 12 syllabes, souvent avec une césure à l'hémistiche (après la 6e).",
        },
      ]}
      faqs={[
        { q: "Pour quel examen cette fiche est-elle utile ?", a: "Bac de français (écrit et oral), brevet, concours d'entrée en classe prépa littéraire." },
        { q: "Comment générer ma fiche sur un texte précis ?", a: "Sur Revix, upload le texte ou ton cours d'analyse — l'IA produit une fiche personnalisée avec procédés repérés." },
        { q: "Y a-t-il des flashcards sur d'autres figures de style ?", a: "Oui, la fonctionnalité Flashcards IA crée un deck complet à partir de n'importe quel cours." },
      ]}
    />
  );
}
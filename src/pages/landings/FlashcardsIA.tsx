import { FeatureLandingLayout } from "@/components/seo/FeatureLandingLayout";

export default function FlashcardsIA() {
  return (
    <FeatureLandingLayout
      title="Flashcards IA — réviser avec la répétition espacée | Revix"
      metaDescription="Crée des flashcards depuis tes cours et révise avec la méthode SM-2 (répétition espacée). L'IA Revix génère, suit et adapte tes cartes automatiquement."
      path="/flashcards-ia"
      tagline="Flashcards · Gratuit"
      h1="Flashcards IA avec répétition espacée"
      intro={
        <>
          <p>
            La méthode des flashcards combinée à l'IA : Revix génère
            automatiquement tes cartes recto-verso depuis n'importe quel cours.
          </p>
          <p>
            L'algorithme SM-2 (répétition espacée) te fait revoir chaque carte au
            bon moment — ce que la science appelle l'apprentissage le plus
            efficace.
          </p>
        </>
      }
      bullets={[
        "Génération auto des cartes depuis ton cours",
        "Algorithme SM-2 de répétition espacée (méthode Anki)",
        "Sessions courtes adaptées à ton niveau du jour",
        "Stats de mémorisation par chapitre",
        "Export vers Anki si tu veux migrer ton deck",
        "Synchronisation web et mobile",
      ]}
      steps={[
        { title: "Upload ton cours", desc: "PDF, photo ou texte — Revix accepte tous les formats." },
        { title: "L'IA crée les cartes", desc: "Recto question, verso réponse, généré automatiquement." },
        { title: "Révise au bon moment", desc: "L'algorithme te ressort les cartes juste avant que tu les oublies." },
      ]}
      faqs={[
        { q: "C'est quoi la répétition espacée ?", a: "Une méthode qui te fait revoir une carte juste avant que tu l'oublies — preuves scientifiques d'efficacité supérieure au bachotage." },
        { q: "Puis-je exporter vers Anki ?", a: "Oui, l'export Anki est disponible." },
        { q: "Combien de flashcards en gratuit ?", a: "Limite raisonnable en Gratuit, illimitées en Max." },
        { q: "Les cartes sont-elles modifiables ?", a: "Oui, tu peux éditer ou supprimer chaque carte." },
        { q: "Ça marche pour les langues ?", a: "Oui — vocabulaire, conjugaison, expressions. Format flashcards idéal pour ça." },
      ]}
    />
  );
}
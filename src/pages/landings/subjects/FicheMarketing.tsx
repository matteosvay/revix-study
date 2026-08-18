import { SubjectLandingLayout } from "@/components/seo/SubjectLandingLayout";

export default function FicheMarketing() {
  return (
    <SubjectLandingLayout
      title="Fiche de révision Marketing — 4P, SWOT, segmentation | Revix"
      metaDescription="Fiche Marketing complète : mix marketing (4P), SWOT, segmentation, ciblage, positionnement. Flashcards et quiz interactifs pour BTS, BUT et école de commerce."
      path="/fiches-de-revision/marketing"
      subject="Marketing"
      tagline="Fiche matière · Marketing"
      h1="Fiche de révision Marketing"
      intro={
        <>
          <p>
            Les fondamentaux du marketing : mix marketing, SWOT, segmentation-ciblage-
            positionnement (STP). Idéal BTS MCO/NDRC, BUT TC, école de commerce.
          </p>
          <p>
            Tu peux générer ta propre fiche à partir de ton cours sur Revix.
          </p>
        </>
      }
      highlights={[
        "Mix marketing détaillé (4P → 7P services)",
        "Matrice SWOT avec exemple concret",
        "STP : segmentation, ciblage, positionnement",
        "Flashcards et quiz pour s'auto-évaluer",
      ]}
      sheetTitle="Stratégie marketing — les essentiels"
      sheetSections={[
        {
          heading: "Le mix marketing (4P)",
          points: [
            "Product (Produit) : caractéristiques, gamme, packaging, marque.",
            "Price (Prix) : stratégie d'écrémage, pénétration, alignement.",
            "Place (Distribution) : circuits courts/longs, multicanal, e-commerce.",
            "Promotion (Communication) : publicité, promo des ventes, RP, marketing direct, digital.",
            "Pour les services, on ajoute : People, Process, Physical evidence (7P).",
          ],
        },
        {
          heading: "L'analyse SWOT",
          points: [
            "Strengths (Forces internes) : atouts de l'entreprise.",
            "Weaknesses (Faiblesses internes) : points à améliorer.",
            "Opportunities (Opportunités externes) : tendances marché favorables.",
            "Threats (Menaces externes) : concurrence, réglementation, crise.",
          ],
        },
        {
          heading: "Segmentation, ciblage, positionnement (STP)",
          points: [
            "Segmentation : découper le marché en groupes homogènes (critères socio-démo, géo, comportementaux, psychographiques).",
            "Ciblage : choisir les segments à adresser (concentré, différencié, indifférencié).",
            "Positionnement : place voulue dans l'esprit du consommateur — exprimée via une promesse + une preuve.",
          ],
        },
        {
          heading: "Études marketing",
          points: [
            "Quantitatives : sondages, panels — chiffrer un comportement.",
            "Qualitatives : entretiens, focus groups — comprendre les motivations.",
            "Veille concurrentielle et benchmarking.",
          ],
        },
      ]}
      flashcards={[
        { front: "Quels sont les 4P du mix marketing ?", back: "Product (produit), Price (prix), Place (distribution), Promotion (communication)." },
        { front: "Que mesure une analyse SWOT ?", back: "Forces/Faiblesses internes et Opportunités/Menaces externes de l'organisation." },
        { front: "Définis 'positionnement'.", back: "La place qu'occupe une marque ou un produit dans l'esprit du consommateur, par rapport à la concurrence." },
        { front: "Stratégie d'écrémage = ?", back: "Lancer un produit à prix élevé pour viser un segment premium et maximiser la marge unitaire." },
        { front: "B2B vs B2C ?", back: "B2B : ventes entre entreprises (cycle long, rationnel). B2C : ventes aux particuliers (cycle court, émotionnel)." },
        { front: "Qu'est-ce qu'un persona ?", back: "Un portrait-type représentant un segment de clients, avec démographie, motivations et freins." },
      ]}
      quiz={[
        {
          question: "Apple utilise principalement quelle stratégie de prix au lancement d'un nouvel iPhone ?",
          choices: ["Pénétration", "Écrémage", "Alignement", "Prix prédateur"],
          correctIndex: 1,
          explanation: "Apple pratique l'écrémage : prix élevé au lancement pour capter les early adopters et maximiser la marge, puis baisse progressive.",
        },
        {
          question: "Dans une SWOT, 'arrivée d'un nouveau concurrent' est :",
          choices: ["Une force", "Une faiblesse", "Une opportunité", "Une menace"],
          correctIndex: 3,
          explanation: "C'est un facteur externe défavorable → menace (Threat).",
        },
        {
          question: "La segmentation comportementale s'appuie sur :",
          choices: ["L'âge et le genre", "Le lieu de résidence", "Les habitudes d'achat et l'usage", "Les valeurs et le mode de vie"],
          correctIndex: 2,
          explanation: "La segmentation comportementale regarde fréquence d'achat, fidélité, occasion d'usage, bénéfices recherchés.",
        },
      ]}
      faqs={[
        { q: "Cette fiche correspond à quel niveau ?", a: "BTS MCO/NDRC, BUT TC/GEA, L1/L2 éco-gestion, première année d'école de commerce." },
        { q: "Y a-t-il une fiche sur le marketing digital ?", a: "Pas encore en page dédiée. Génère-la dans l'app à partir de ton cours — l'IA produit une fiche similaire en moins d'une minute." },
        { q: "Puis-je m'entraîner avec plus de quiz ?", a: "Oui, la fonctionnalité Quiz IA de Revix génère un nombre illimité de questions à partir de ton cours." },
      ]}
    />
  );
}
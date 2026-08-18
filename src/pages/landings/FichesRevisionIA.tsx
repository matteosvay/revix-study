import { FeatureLandingLayout } from "@/components/seo/FeatureLandingLayout";

export default function FichesRevisionIA() {
  return (
    <FeatureLandingLayout
      title="Fiches de révision IA — créer une fiche depuis un PDF | Revix"
      metaDescription="Génère une fiche de révision claire et synthétique à partir d'un PDF, d'une photo de cours ou de notes. L'IA Revix structure, résume et met en forme automatiquement."
      path="/fiches-de-revision-ia"
      tagline="Fiches IA · Gratuit"
      h1="Fiches de révision générées par IA"
      intro={
        <>
          <p>
            Uploade ton PDF, ta photo de cours ou colle ton texte : Revix te génère
            une fiche de révision structurée, hiérarchisée et prête à imprimer en
            quelques secondes.
          </p>
          <p>
            Idéal pour le bac, le BTS, la licence, la prépa ou la fac — fini les
            heures passées à reformuler tes notes.
          </p>
        </>
      }
      bullets={[
        "Import PDF, photo, screenshot ou texte collé",
        "Plan automatique avec titres, sous-titres, définitions clés",
        "Mise en forme lisible : gras, listes, encadrés",
        "Export PDF prêt à imprimer ou consulter sur mobile",
        "Fiche éditable : tu reprends la main quand tu veux",
        "Données hébergées en Europe, jamais utilisées pour entraîner d'IA tierces",
      ]}
      steps={[
        { title: "Upload ton cours", desc: "Glisse un PDF, prends ton cours en photo ou colle ton texte." },
        { title: "L'IA structure", desc: "Revix extrait les concepts clés et construit la fiche." },
        { title: "Révise efficacement", desc: "Consulte, édite ou exporte ta fiche en PDF." },
      ]}
      faqs={[
        { q: "Quels formats sont acceptés ?", a: "PDF, photos (JPG/PNG), screenshots et texte collé directement. L'IA gère le reste." },
        { q: "Est-ce vraiment gratuit ?", a: "Le plan Gratuit te donne 1 fiche IA par semaine. Les plans Pro et Max augmentent ce quota." },
        { q: "Puis-je éditer la fiche générée ?", a: "Oui, la fiche est entièrement modifiable après génération." },
        { q: "Mes cours sont-ils en sécurité ?", a: "100%. Tes données restent en Europe et ne sont jamais partagées." },
        { q: "Ça marche pour toutes les matières ?", a: "Droit, marketing, maths, histoire, philo, langues, médecine — tout ce qui est texte ou notes." },
      ]}
    />
  );
}
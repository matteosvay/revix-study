import { FeatureLandingLayout } from "@/components/seo/FeatureLandingLayout";

export default function PlanningRevision() {
  return (
    <FeatureLandingLayout
      title="Planning de révision IA — organise tes examens | Revix"
      metaDescription="Génère un planning de révisions personnalisé selon ta date d'examen et tes matières. L'IA Revix répartit tes sessions et adapte ton planning chaque jour."
      path="/planning-de-revision"
      tagline="Planning IA · Gratuit"
      h1="Planning de révision personnalisé par IA"
      intro={
        <>
          <p>
            Dis à Revix tes matières, ta date d'examen et ton temps disponible :
            l'IA te construit un planning de révisions équilibré, jour par jour.
          </p>
          <p>
            Le planning s'adapte automatiquement quand tu prends du retard ou que
            tu cibles un chapitre faible.
          </p>
        </>
      }
      bullets={[
        "Rétroplanning automatique jusqu'au jour J",
        "Répartition équilibrée des matières et chapitres",
        "Adaptation auto en cas de retard ou de session manquée",
        "Priorité aux chapitres faibles détectés par l'IA",
        "Vue jour / semaine / mois sur mobile et desktop",
        "Rappels et streaks pour garder le rythme",
      ]}
      steps={[
        { title: "Renseigne ton examen", desc: "Date, matières, temps que tu peux consacrer par jour." },
        { title: "L'IA construit le plan", desc: "Sessions réparties intelligemment sur les jours restants." },
        { title: "Suis & ajuste", desc: "Coche tes sessions, le planning se recale automatiquement." },
      ]}
      faqs={[
        { q: "Quels types d'examens sont supportés ?", a: "Bac, BTS, partiels de fac, concours, prépa — tout examen avec une deadline." },
        { q: "Que se passe-t-il si je rate une session ?", a: "L'IA recale automatiquement les sessions restantes pour tenir la deadline." },
        { q: "Le planning est-il limité au plan gratuit ?", a: "Un planning hebdo est disponible en Pro, des plannings illimités en Max." },
        { q: "Puis-je éditer manuellement ?", a: "Oui, tu peux déplacer ou ajouter une session à tout moment." },
        { q: "Y a-t-il des rappels ?", a: "Oui — notifications navigateur et streaks pour garder la régularité." },
      ]}
    />
  );
}
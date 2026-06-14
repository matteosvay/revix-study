import { FeatureLandingLayout } from "@/components/seo/FeatureLandingLayout";

export default function QuizIA() {
  return (
    <FeatureLandingLayout
      title="Quiz IA — générer un QCM depuis ton cours | Revix"
      metaDescription="Crée un quiz personnalisé (QCM, vrai/faux, questions ouvertes) à partir de tes cours. L'IA Revix génère et corrige automatiquement pour t'entraîner aux examens."
      path="/quiz-ia"
      tagline="Quiz IA · Gratuit"
      h1="Quiz IA pour réviser tes cours"
      intro={
        <>
          <p>
            Transforme n'importe quel cours en quiz d'entraînement : QCM,
            vrai/faux, questions ouvertes corrigées automatiquement par l'IA.
          </p>
          <p>
            Le format le plus rapide pour mémoriser et identifier tes lacunes
            avant un examen.
          </p>
        </>
      }
      bullets={[
        "QCM, vrai/faux et questions ouvertes en un clic",
        "Correction et explications générées par l'IA",
        "Quizz adaptatifs basés sur tes erreurs précédentes",
        "Statistiques par chapitre pour cibler tes lacunes",
        "Mode duel avec tes amis pour réviser en s'amusant",
        "Fonctionne avec n'importe quel cours uploadé sur Revix",
      ]}
      steps={[
        { title: "Choisis ton cours", desc: "Sélectionne un cours déjà uploadé ou ajoutes-en un nouveau." },
        { title: "L'IA génère le quiz", desc: "Questions adaptées au niveau et au contenu de ton cours." },
        { title: "Réponds & progresse", desc: "Correction immédiate, explications et stats détaillées." },
      ]}
      faqs={[
        { q: "Combien de quizz puis-je faire par jour ?", a: "2 par jour en Gratuit, 10 en Pro, 30 en Max." },
        { q: "Les questions sont-elles fiables ?", a: "Oui : elles sont générées à partir du contenu exact de ton cours, pas inventées." },
        { q: "Puis-je refaire le même quiz ?", a: "Oui, et l'IA varie les questions pour éviter la mémorisation par cœur." },
        { q: "Y a-t-il un mode multijoueur ?", a: "Oui — défie un ami en duel ou rejoins un groupe d'étude." },
        { q: "Ça marche au bac, en BTS, en fac ?", a: "Oui, pour tout niveau du lycée au master." },
      ]}
    />
  );
}
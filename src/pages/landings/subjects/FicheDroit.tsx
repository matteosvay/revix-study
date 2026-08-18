import { SubjectLandingLayout } from "@/components/seo/SubjectLandingLayout";

export default function FicheDroit() {
  return (
    <SubjectLandingLayout
      title="Fiche de révision Droit — exemples, flashcards et quiz | Revix"
      metaDescription="Fiche de révision Droit prête à l'emploi : introduction au droit, sources, hiérarchie des normes. Flashcards et mini-quiz interactifs pour réviser efficacement."
      path="/fiches-de-revision/droit"
      subject="Droit"
      tagline="Fiche matière · Droit"
      h1="Fiche de révision Droit"
      intro={
        <>
          <p>
            Une fiche claire pour réviser les bases du droit : sources, hiérarchie des
            normes, organisation juridictionnelle. Avec flashcards et mini-quiz pour
            tester tes connaissances.
          </p>
          <p>
            Tu peux générer la tienne en uploadant ton cours sur Revix — l'IA structure
            tout en moins d'une minute.
          </p>
        </>
      }
      highlights={[
        "Adaptée aux L1 Droit, BTS, prépa et terminale SES",
        "Définitions clés et notions à connaître",
        "Flashcards interactives pour mémoriser",
        "Mini-quiz avec corrections expliquées",
      ]}
      sheetTitle="Introduction au droit"
      sheetSections={[
        {
          heading: "Définition du droit",
          points: [
            "Le droit est l'ensemble des règles qui régissent la vie en société et dont le respect est assuré par la puissance publique.",
            "Distinction droit objectif (les règles) / droits subjectifs (prérogatives individuelles).",
            "Branches principales : droit public / droit privé.",
          ],
        },
        {
          heading: "Les sources du droit",
          points: [
            "Sources internationales : traités, droit de l'Union européenne.",
            "Sources nationales : Constitution, lois, règlements.",
            "Sources informelles : jurisprudence, doctrine, coutume.",
          ],
        },
        {
          heading: "Hiérarchie des normes (pyramide de Kelsen)",
          points: [
            "1. Bloc de constitutionnalité",
            "2. Traités et droit international",
            "3. Lois (organiques puis ordinaires)",
            "4. Règlements (décrets, arrêtés)",
            "5. Actes individuels et contrats",
          ],
        },
        {
          heading: "Organisation juridictionnelle",
          points: [
            "Ordre judiciaire : Cour de cassation, cours d'appel, tribunaux judiciaires.",
            "Ordre administratif : Conseil d'État, cours administratives d'appel, tribunaux administratifs.",
            "Conseil constitutionnel : contrôle de constitutionnalité.",
          ],
        },
      ]}
      flashcards={[
        { front: "Qu'est-ce que le droit objectif ?", back: "L'ensemble des règles juridiques qui régissent la vie en société, indépendamment des personnes." },
        { front: "Qui se trouve au sommet de la pyramide de Kelsen ?", back: "Le bloc de constitutionnalité (Constitution + DDHC + préambule 1946 + Charte de l'environnement)." },
        { front: "Quelle est la différence entre une loi et un règlement ?", back: "La loi est votée par le Parlement (art. 34). Le règlement émane du pouvoir exécutif (art. 37)." },
        { front: "Cour suprême de l'ordre judiciaire ?", back: "La Cour de cassation." },
        { front: "Cour suprême de l'ordre administratif ?", back: "Le Conseil d'État." },
        { front: "Qu'est-ce que la jurisprudence ?", back: "L'ensemble des décisions rendues par les juridictions, qui interprète et précise la règle de droit." },
      ]}
      quiz={[
        {
          question: "Quelle norme est au-dessus d'une loi ordinaire ?",
          choices: ["Un décret", "Un arrêté municipal", "Un traité international ratifié", "Une circulaire"],
          correctIndex: 2,
          explanation: "Selon l'article 55 de la Constitution, les traités régulièrement ratifiés ont une autorité supérieure à celle des lois.",
        },
        {
          question: "Quelle juridiction juge un conflit entre un particulier et l'administration ?",
          choices: ["Tribunal judiciaire", "Tribunal administratif", "Cour de cassation", "Conseil constitutionnel"],
          correctIndex: 1,
          explanation: "Les litiges opposant un particulier à l'administration relèvent de l'ordre administratif, dont le premier degré est le tribunal administratif.",
        },
        {
          question: "Le droit pénal appartient au :",
          choices: ["Droit public", "Droit privé", "Droit mixte", "Droit international"],
          correctIndex: 2,
          explanation: "Le droit pénal est traditionnellement classé en droit mixte : il sanctionne au nom de l'État (public) des comportements souvent interpersonnels (privé).",
        },
      ]}
      faqs={[
        { q: "À qui s'adresse cette fiche ?", a: "Étudiants en L1 Droit, BTS, classes prépa, terminale spécialité HGGSP/SES et toute personne curieuse du fonctionnement du droit français." },
        { q: "Puis-je générer une fiche similaire pour mon propre cours ?", a: "Oui. Inscris-toi sur Revix, upload ton PDF ou ta photo de cours, et l'IA produit une fiche structurée comme celle-ci." },
        { q: "Les flashcards sont-elles exportables ?", a: "Oui, les fiches générées dans l'app sont exportables en PDF et révisables en mode flashcards." },
      ]}
    />
  );
}
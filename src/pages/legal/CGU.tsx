import { LegalLayout, LegalSection, LegalHighlight } from "./LegalLayout";

export default function CGU() {
  return (
    <LegalLayout
      title="Conditions Générales d'Utilisation"
      subtitle="En créant un compte sur Revix, vous acceptez les présentes Conditions Générales d'Utilisation (CGU). Veuillez les lire attentivement."
      updatedAt="19 mai 2026"
    >
      <LegalHighlight>
        <p className="text-sm">
          <strong>Version :</strong> 1.0 — Ces CGU s'appliquent à toute utilisation de l'application Revix,
          accessible sur le web et en version installée (PWA). Elles forment un contrat entre vous
          (l'utilisateur) et Matteo Svay (auto-entrepreneur, éditeur de Revix).
        </p>
      </LegalHighlight>

      <LegalSection number="1" title="Présentation du service">
        <p>
          Revix est une application d'aide à la révision scolaire et universitaire. Elle permet aux
          utilisateurs de :
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Uploader des cours (PDF, photos, texte) et générer des fiches et quizz par intelligence artificielle ;</li>
          <li>Planifier et suivre leurs révisions grâce à des outils de spaced repetition (SM-2) ;</li>
          <li>Participer à des groupes d'étude et interagir avec d'autres utilisateurs ;</li>
          <li>Obtenir un suivi de progression gamifié (XP, niveaux, streaks, quêtes) ;</li>
          <li>Accéder à un coach IA personnalisé.</li>
        </ul>
        <p>
          Une version gratuite avec des quotas limités est disponible. Des abonnements payants (Pro et Max)
          offrent des quotas étendus. Les tarifs sont décrits dans les{" "}
          <a href="/cgv" className="text-primary font-medium underline">Conditions Générales de Vente (CGV)</a>.
        </p>
      </LegalSection>

      <LegalSection number="2" title="Accès au service et création de compte">
        <p>
          L'accès au service nécessite la création d'un compte utilisateur. Pour créer un compte, vous devez :
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Fournir une adresse e-mail valide et un mot de passe ;</li>
          <li>Avoir au moins 15 ans, ou disposer du consentement d'un représentant légal si vous avez moins de 15 ans ;</li>
          <li>Accepter les présentes CGU et la Politique de confidentialité.</li>
        </ul>
        <p>
          Vous êtes responsable de la confidentialité de vos identifiants et de toute activité réalisée
          sous votre compte. En cas de suspicion d'utilisation non autorisée, informez-nous immédiatement.
        </p>
      </LegalSection>

      <LegalSection number="3" title="Utilisation acceptable du service">
        <p>En utilisant Revix, vous vous engagez à :</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>N'uploader que des contenus dont vous êtes l'auteur ou pour lesquels vous disposez des droits nécessaires ;</li>
          <li>Ne pas partager de contenus illicites, injurieux, diffamatoires, pornographiques ou portant atteinte aux droits de tiers ;</li>
          <li>Ne pas tenter de contourner les quotas d'utilisation ou de détourner les fonctionnalités IA ;</li>
          <li>Ne pas utiliser le service à des fins commerciales sans autorisation préalable écrite ;</li>
          <li>Ne pas porter atteinte au bon fonctionnement du service (attaque, scraping, injection).</li>
        </ul>
        <p>
          Le non-respect de ces règles peut entraîner la suspension ou la suppression de votre compte,
          sans préavis ni remboursement.
        </p>
      </LegalSection>

      <LegalSection number="4" title="Contenus générés par intelligence artificielle">
        <p>
          Revix utilise des services d'intelligence artificielle (IA) pour générer des fiches, quizz,
          corrections, conseils de révision et réponses du coach. À ce titre :
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            <strong>Les contenus générés par IA sont fournis à titre indicatif.</strong> Ils ne
            constituent pas un avis professionnel (médical, juridique, financier, etc.) et peuvent
            contenir des inexactitudes. Vérifiez toujours les informations importantes auprès de
            sources officielles.
          </li>
          <li>
            Revix décline toute responsabilité quant aux conséquences résultant de l'utilisation
            de contenus générés par IA dans un contexte d'examen ou d'évaluation officielle.
          </li>
          <li>
            Vos contenus uploadés sont transmis aux APIs d'IA partenaires (Anthropic, OpenAI)
            pour traitement, dans le strict respect de leur politique de confidentialité.
            Vos documents <strong>ne servent pas à entraîner ces modèles.</strong>
          </li>
        </ul>
      </LegalSection>

      <LegalSection number="5" title="Propriété intellectuelle des contenus utilisateurs">
        <p>
          Vous conservez l'intégralité des droits de propriété intellectuelle sur les contenus que vous
          uploadez (cours, photos, textes, fiches créées). En les déposant sur Revix, vous accordez à
          Matteo Svay une licence non exclusive, mondiale, gratuite et limitée dans le temps, uniquement
          pour les finalités suivantes :
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Stocker et afficher vos contenus dans votre compte personnel ;</li>
          <li>Les transmettre aux services d'IA partenaires pour traitement à votre demande ;</li>
          <li>Générer des fiches, quizz et éléments pédagogiques dérivés à votre usage.</li>
        </ul>
        <p>
          Cette licence prend fin dès la suppression du contenu ou de votre compte.
        </p>
      </LegalSection>

      <LegalSection number="6" title="Disponibilité du service">
        <p>
          Revix s'efforce d'assurer la disponibilité du service 24h/24, 7j/7. Toutefois, des
          interruptions peuvent survenir pour maintenance, mises à jour ou incidents techniques.
          L'éditeur ne s'engage pas sur un taux de disponibilité garanti.
        </p>
        <p>
          Des modifications du service, des fonctionnalités ou des quotas peuvent intervenir à tout moment.
          Vous serez informé des changements significatifs par email ou notification dans l'application.
        </p>
      </LegalSection>

      <LegalSection number="7" title="Suspension et résiliation de compte">
        <p>
          <strong>Par l'utilisateur :</strong> Vous pouvez supprimer votre compte à tout moment depuis
          Profil → Supprimer mon compte. L'abonnement payant en cours doit être résilié séparément
          (voir CGV).
        </p>
        <p>
          <strong>Par Revix :</strong> Nous nous réservons le droit de suspendre ou supprimer tout
          compte qui violerait les présentes CGU, sans préavis et sans indemnité. Les abonnements
          prépayés ne sont pas remboursés en cas de suspension pour violation des CGU.
        </p>
      </LegalSection>

      <LegalSection number="8" title="Limitation de responsabilité">
        <p>
          Dans les limites autorisées par la loi française, Revix ne saurait être tenu responsable :
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Des pertes de données résultant d'une mauvaise utilisation du service ;</li>
          <li>Des résultats scolaires ou académiques de l'utilisateur ;</li>
          <li>Des erreurs ou inexactitudes dans les contenus générés par IA ;</li>
          <li>Des dommages indirects, perte de chance, ou préjudice moral.</li>
        </ul>
        <p>
          La responsabilité de Revix est en tout état de cause limitée au montant des sommes
          effectivement versées par l'utilisateur au cours des 12 derniers mois.
        </p>
      </LegalSection>

      <LegalSection number="9" title="Modifications des CGU">
        <p>
          Les présentes CGU peuvent être modifiées à tout moment. En cas de modification substantielle,
          vous serez informé par email au moins 15 jours avant l'entrée en vigueur. Si vous refusez les
          nouvelles CGU, vous pouvez supprimer votre compte avant leur application. La poursuite de
          l'utilisation après cette date vaut acceptation.
        </p>
      </LegalSection>

      <LegalSection number="10" title="Droit applicable et litiges">
        <p>
          Les présentes CGU sont régies par le droit français. En cas de litige, une solution amiable
          sera recherchée en priorité. À défaut, les tribunaux compétents du ressort de [À COMPLÉTER]
          seront saisis.
        </p>
        <p>
          Conformément à l'article L. 612-1 du Code de la consommation, vous avez le droit de
          recourir à un médiateur de la consommation. Vous pouvez également utiliser la plateforme
          de règlement en ligne des litiges (RLL) de la Commission européenne :{" "}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary font-medium underline">
            ec.europa.eu/consumers/odr
          </a>
        </p>
      </LegalSection>

      <LegalSection number="11" title="Contact">
        <p>
          Pour toute question relative aux présentes CGU :
          <a href="mailto:matteosvay4@gmail.com" className="text-primary font-medium underline ml-1">
            matteosvay4@gmail.com
          </a>
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

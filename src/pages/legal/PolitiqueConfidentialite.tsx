import { LegalLayout, LegalSection, LegalHighlight, LegalTable } from "./LegalLayout";

export default function PolitiqueConfidentialite() {
  return (
    <LegalLayout
      title="Politique de confidentialité"
      subtitle="Comment Revix collecte, utilise et protège vos données personnelles, conformément au Règlement Général sur la Protection des Données (RGPD — UE 2016/679) et à la loi Informatique et Libertés."
      updatedAt="19 mai 2026"
    >
      <LegalHighlight>
        <p className="text-sm font-bold mb-1">En résumé</p>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>Nous collectons uniquement ce dont nous avons besoin pour faire fonctionner Revix.</li>
          <li>Nous ne vendons jamais vos données à des tiers.</li>
          <li>Vos fichiers ne servent pas à entraîner des modèles d'IA tiers.</li>
          <li>Vous pouvez demander la suppression de votre compte et de toutes vos données à tout moment.</li>
        </ul>
      </LegalHighlight>

      <LegalSection number="1" title="Responsable du traitement">
        <LegalTable rows={[
          ["Responsable", "Matteo Svay"],
          ["Statut", "Auto-entrepreneur"],
          ["SIRET", "[À COMPLÉTER]"],
          ["Email", "matteosvay4@gmail.com"],
          ["Adresse", "[À COMPLÉTER]"],
        ]} />
        <p>
          Pour toute demande relative à vos données personnelles, contactez-nous à :
          <a href="mailto:matteosvay4@gmail.com" className="text-primary font-medium underline ml-1">
            matteosvay4@gmail.com
          </a>
        </p>
      </LegalSection>

      <LegalSection number="2" title="Données collectées et finalités">
        <p>Nous collectons les données suivantes :</p>

        <div className="space-y-4">
          <div>
            <p className="font-bold mb-2">2.1 Données de compte</p>
            <LegalTable rows={[
              ["Donnée", "Adresse e-mail, prénom / nom d'affichage, genre (optionnel), cursus"],
              ["Finalité", "Création et gestion de votre compte utilisateur"],
              ["Base légale", "Exécution du contrat (CGU)"],
              ["Durée", "Durée de vie du compte + 1 an après suppression"],
            ]} />
          </div>

          <div>
            <p className="font-bold mb-2">2.2 Contenus pédagogiques uploadés</p>
            <LegalTable rows={[
              ["Donnée", "Fichiers PDF, images de cours, textes saisis"],
              ["Finalité", "Génération de fiches, quizz et révisions par IA"],
              ["Base légale", "Exécution du contrat (CGU)"],
              ["Durée", "Conservés jusqu'à suppression par l'utilisateur ou du compte"],
            ]} />
          </div>

          <div>
            <p className="font-bold mb-2">2.3 Données de progression et de gamification</p>
            <LegalTable rows={[
              ["Donnée", "Scores, streaks, XP, niveaux, réponses aux quizz, heatmap des chapitres"],
              ["Finalité", "Personnalisation du parcours d'apprentissage, affichage du profil"],
              ["Base légale", "Exécution du contrat (CGU)"],
              ["Durée", "Durée de vie du compte"],
            ]} />
          </div>

          <div>
            <p className="font-bold mb-2">2.4 Données de paiement</p>
            <LegalTable rows={[
              ["Donnée", "Informations de carte bancaire et de facturation"],
              ["Traitement", "Stripe, Inc. — nous ne stockons jamais vos données de paiement"],
              ["Finalité", "Traitement des abonnements Pro et Max"],
              ["Base légale", "Exécution du contrat (CGV)"],
              ["Durée", "Selon la politique de conservation de Stripe (5 ans)"],
            ]} />
          </div>

          <div>
            <p className="font-bold mb-2">2.5 Données de consentement</p>
            <LegalTable rows={[
              ["Donnée", "Date et heure d'acceptation des CGU et de la présente politique"],
              ["Finalité", "Preuve de consentement RGPD"],
              ["Base légale", "Obligation légale"],
              ["Durée", "5 ans à compter de l'acceptation"],
            ]} />
          </div>

          <div>
            <p className="font-bold mb-2">2.6 Données techniques</p>
            <LegalTable rows={[
              ["Donnée", "Logs de connexion, adresse IP, type d'appareil, navigateur"],
              ["Finalité", "Sécurité, débogage, prévention de la fraude"],
              ["Base légale", "Intérêt légitime"],
              ["Durée", "90 jours"],
            ]} />
          </div>
        </div>
      </LegalSection>

      <LegalSection number="3" title="Utilisateurs mineurs">
        <p>
          Revix est accessible à tout public, y compris aux mineurs. Conformément à l'article 8 du RGPD,
          le traitement des données d'un mineur de moins de 15 ans (âge retenu en droit français) nécessite
          le consentement d'un titulaire de l'autorité parentale.
        </p>
        <p>
          En créant un compte sur Revix, l'utilisateur déclare :
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Avoir au moins 15 ans, ou</li>
          <li>Avoir obtenu le consentement de son représentant légal pour utiliser le service.</li>
        </ul>
        <p>
          Si vous êtes parent ou tuteur et pensez que votre enfant a créé un compte sans votre accord,
          contactez-nous à <a href="mailto:matteosvay4@gmail.com" className="text-primary font-medium underline">matteosvay4@gmail.com</a> pour procéder à la suppression du compte.
        </p>
      </LegalSection>

      <LegalSection number="4" title="Sous-traitants et transferts hors UE">
        <p>
          Pour fournir le service, nous faisons appel aux sous-traitants suivants. Conformément à
          l'article 28 du RGPD, chacun présente des garanties suffisantes en matière de protection des données :
        </p>
        <LegalTable rows={[
          ["Supabase, Inc.", "Base de données, authentification — AWS (UE/US) — Clauses contractuelles types UE"],
          ["Stripe, Inc.", "Paiement en ligne — USA — Certifié PCI-DSS, Clauses contractuelles types UE"],
          ["Anthropic / OpenAI", "Traitement IA de vos contenus — USA — Clauses contractuelles types UE"],
          ["[Hébergeur front-end]", "[À COMPLÉTER]"],
        ]} />
        <p>
          Ces transferts sont encadrés par les Clauses Contractuelles Types (CCT) de la Commission européenne,
          conformément à l'article 46 du RGPD.
        </p>
      </LegalSection>

      <LegalSection number="5" title="Vos droits">
        <p>
          Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants :
        </p>
        <LegalTable rows={[
          ["Droit d'accès (art. 15)", "Obtenir une copie de toutes vos données personnelles"],
          ["Droit de rectification (art. 16)", "Corriger des données inexactes ou incomplètes"],
          ["Droit à l'effacement (art. 17)", "Demander la suppression de votre compte et de vos données"],
          ["Droit à la portabilité (art. 20)", "Recevoir vos données dans un format structuré et lisible"],
          ["Droit d'opposition (art. 21)", "Vous opposer au traitement fondé sur l'intérêt légitime"],
          ["Droit à la limitation (art. 18)", "Suspendre temporairement le traitement de vos données"],
        ]} />
        <p>
          Pour exercer ces droits, envoyez votre demande à{" "}
          <a href="mailto:matteosvay4@gmail.com" className="text-primary font-medium underline">
            matteosvay4@gmail.com
          </a>.
          Nous répondrons dans un délai maximum de 30 jours.
        </p>
        <p>
          Vous avez également le droit d'introduire une réclamation auprès de la{" "}
          <strong>CNIL</strong> (Commission Nationale de l'Informatique et des Libertés) :
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary font-medium underline ml-1">
            www.cnil.fr
          </a>
        </p>
      </LegalSection>

      <LegalSection number="6" title="Suppression de compte">
        <p>
          Vous pouvez supprimer votre compte à tout moment depuis la page{" "}
          <strong>Profil → Supprimer mon compte</strong>.
          La suppression entraîne l'effacement définitif de :
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Vos données de profil (email, prénom, photo)</li>
          <li>Vos cours et fiches uploadés</li>
          <li>Vos quizz, scores et historique de progression</li>
          <li>Vos groupes d'étude et contributions</li>
        </ul>
        <p>
          Certaines données peuvent être conservées plus longtemps si la loi l'exige (ex : données de
          facturation pour les obligations comptables, jusqu'à 10 ans).
        </p>
      </LegalSection>

      <LegalSection number="7" title="Sécurité des données">
        <p>
          Nous mettons en oeuvre des mesures techniques et organisationnelles adaptées pour protéger vos données :
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Chiffrement des données en transit (HTTPS/TLS) et au repos</li>
          <li>Authentification sécurisée via Supabase Auth (hachage des mots de passe)</li>
          <li>Règles de sécurité au niveau base de données (Row Level Security — RLS)</li>
          <li>Accès aux données restreint aux personnes autorisées</li>
        </ul>
      </LegalSection>

      <LegalSection number="8" title="Cookies">
        <p>
          Revix utilise des cookies strictement nécessaires au fonctionnement du service. Consultez
          notre <a href="/cookies" className="text-primary font-medium underline">politique de cookies</a> pour
          plus de détails.
        </p>
      </LegalSection>

      <LegalSection number="9" title="Modifications de la politique">
        <p>
          Nous pouvons modifier la présente politique à tout moment. En cas de modification substantielle,
          nous vous en informerons par email ou via une notification dans l'application au moins 15 jours
          avant l'entrée en vigueur des changements. La poursuite de l'utilisation du service après
          modification vaut acceptation de la nouvelle politique.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

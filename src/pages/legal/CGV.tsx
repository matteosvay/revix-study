import { LegalLayout, LegalSection, LegalHighlight, LegalTable } from "./LegalLayout";
import { LEGAL, editorStatus } from "@/lib/legal";
import { PLANS, FREE_CREDITS_GRANT, formatPrice, VAT_NOTICE } from "@/lib/pricing";

export default function CGV() {
  return (
    <LegalLayout
      title="Conditions Générales de Vente"
      subtitle="Les présentes Conditions Générales de Vente (CGV) s'appliquent à tout achat d'abonnement payant sur Diplo. Elles complètent les Conditions Générales d'Utilisation (CGU)."
      updatedAt="6 octobre 2026"
      seo={{
        title: "Conditions Générales de Vente | Diplo",
        description: "CGV de Diplo : tarifs, abonnements Pro et Max, paiement, droit de rétractation et remboursement.",
        path: "/cgv",
      }}
    >
      {!LEGAL.registered && (
        <LegalHighlight>
          <p className="text-sm">
            <strong>Aucun abonnement payant n'est proposé pour l'instant.</strong> Diplo est en phase
            de test et entièrement gratuit. Ces conditions s'appliqueront à l'ouverture des offres
            payantes, et seront mises à jour avec les informations du vendeur à ce moment-là.
          </p>
        </LegalHighlight>
      )}
      <LegalHighlight>
        <p className="text-sm">
          <strong>Vendeur :</strong> {LEGAL.editorName}, {editorStatus().toLowerCase()}
          {LEGAL.siret ? <>, SIRET {LEGAL.siret}</> : null}<br />
          <strong>Email :</strong> {LEGAL.contactEmail}<br />
          <strong>Paiement sécurisé :</strong> Stripe, Inc., certifié PCI-DSS niveau 1
        </p>
      </LegalHighlight>

      <LegalSection number="1" title="Offres et tarifs">
        <p>
          Diplo propose trois formules d'accès au service :
        </p>
        <LegalTable rows={[
          ["Gratuit", `0 € : ${FREE_CREDITS_GRANT} crédits offerts une seule fois à l'inscription, puis révisions illimitées sur tes fiches et quizz existants`],
          ["Pro", `${formatPrice(PLANS.pro.priceTTC)} TTC par mois : 12 quizz IA par jour, 16 messages coach par jour, 2 fiches IA par jour, planning IA`],
          ["Max", `${formatPrice(PLANS.max.priceTTC)} TTC par mois : 25 quizz IA par jour, 40 messages coach par jour, 4 fiches IA par jour, 3 plannings IA par jour`],
        ]} />
        <p>
          Les tarifs sont affichés TTC (Toutes Taxes Comprises) en euros. L'éditeur se réserve le
          droit de modifier ses tarifs à tout moment. Les modifications de prix seront communiquées
          par email au moins 30 jours avant leur entrée en vigueur. L'abonnement en cours n'est
          pas affecté avant son renouvellement.
        </p>
        <p>
          Des offres promotionnelles ponctuelles peuvent être proposées. Elles ne sont pas cumulables
          et soumises à leurs propres conditions.
        </p>
      </LegalSection>

      <LegalSection number="2" title="Processus de commande">
        <p>
          Pour souscrire à un abonnement payant :
        </p>
        <ol className="list-decimal pl-4 space-y-1">
          <li>Connectez-vous à votre compte Diplo ;</li>
          <li>Accédez à la section Abonnement depuis votre Profil ;</li>
          <li>Sélectionnez l'offre souhaitée (Pro ou Max) ;</li>
          <li>Renseignez vos informations de paiement dans le formulaire sécurisé Stripe ;</li>
          <li>Cochez les deux confirmations (18 ans ou plus, accès immédiat), puis validez le paiement dans le formulaire Stripe.</li>
        </ol>
        <p>
          La commande est définitivement validée à réception du paiement. Un email de confirmation
          vous est envoyé à l'adresse associée à votre compte.
        </p>
      </LegalSection>

      <LegalSection number="3" title="Paiement">
        <p>
          Le paiement s'effectue exclusivement via <strong>Stripe, Inc.</strong>, prestataire de
          paiement sécurisé certifié PCI-DSS. Diplo n'a pas accès à vos coordonnées bancaires.
        </p>
        <p>Les moyens de paiement acceptés sont :</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Carte bancaire (Visa, Mastercard, American Express)</li>
          <li>Apple Pay et Google Pay (selon disponibilité)</li>
        </ul>
        <p>
          Le paiement est prélevé immédiatement à la souscription, puis automatiquement à chaque
          date anniversaire de l'abonnement.
        </p>
      </LegalSection>

      <LegalSection number="4" title="Durée et renouvellement">
        <p>
          Les abonnements sont souscrits au mois, sans engagement minimum. Ils se renouvellent
          automatiquement chaque mois à la date anniversaire de la souscription, jusqu'à résiliation.
        </p>
      </LegalSection>

      <LegalSection number="5" title="Résiliation">
        <p>
          Vous pouvez résilier votre abonnement à tout moment, sans frais, depuis :
          <strong> Profil → Abonnement → Résilier</strong>.
        </p>
        <p>
          La résiliation prend effet à la fin de la période d'abonnement en cours. Vous continuez
          à bénéficier des fonctionnalités Premium jusqu'à cette date. Aucun remboursement du
          mois en cours n'est effectué, sauf dans les cas prévus à l'article 6 (droit de rétractation).
        </p>
        <p>
          En cas de non-paiement à l'échéance, l'accès aux fonctionnalités payantes est suspendu
          automatiquement. Votre compte et vos données restent accessibles avec le plan Gratuit.
        </p>
      </LegalSection>

      <LegalSection number="6" title="Droit de rétractation">
        <LegalHighlight>
          <p className="text-sm font-bold mb-2">Important : accès immédiat au service</p>
          <p className="text-sm">
            Conformément à l'article L. 221-28 du Code de la consommation, en souscrivant à un
            abonnement Diplo, vous demandez expressément que l'exécution du service commence
            immédiatement, avant l'expiration du délai de rétractation de 14 jours.
          </p>
          <p className="text-sm mt-2">
            Vous reconnaissez donc que vous perdez votre droit de rétractation dès lors que le
            service a commencé à être exécuté et est pleinement fourni avant l'expiration de ce délai.
          </p>
        </LegalHighlight>
        <p>
          Si vous n'avez pas encore accédé aux fonctionnalités payantes, vous disposez d'un délai
          de <strong>14 jours calendaires</strong> à compter de la souscription pour vous rétracter
          sans justification, conformément à l'article L. 221-18 du Code de la consommation.
        </p>
        <p>
          Pour exercer ce droit, envoyez votre demande à{" "}
          <a href={`mailto:${LEGAL.contactEmail}`} className="text-primary font-medium underline">
            {LEGAL.contactEmail}
          </a>{" "}
          en indiquant votre adresse email de compte et la date de souscription.
          Le remboursement sera effectué dans les 14 jours suivant la réception de votre demande,
          via le même moyen de paiement.
        </p>
      </LegalSection>

      <LegalSection number="7" title="Facturation">
        <p>
          Une facture est générée automatiquement par Stripe à chaque prélèvement et vous est
          envoyée par email. Vous pouvez également retrouver l'historique de vos factures dans
          Stripe Customer Portal, accessible depuis votre Profil.
        </p>
        <p>
          {VAT_NOTICE} Le vendeur relève du régime de la franchise en base de TVA prévu à
          l'article 293 B du Code général des impôts. La mention « TVA non applicable, art. 293 B
          du CGI » figure sur les factures.
        </p>
        <p className="text-sm text-muted-foreground italic">
          Note : si le chiffre d'affaires dépasse le seuil de franchise, la TVA sera applicable
          et les CGV seront mises à jour en conséquence.
        </p>
      </LegalSection>

      <LegalSection number="8" title="Garantie légale de conformité">
        <p>
          Conformément aux articles L. 224-25-12 et suivants du Code de la consommation, vous
          bénéficiez d'une garantie légale de conformité pour les contenus et services numériques.
          En cas de défaut de conformité, vous pouvez demander la mise en conformité du service
          ou, si cela est impossible, une réduction du prix ou la résolution du contrat.
        </p>
      </LegalSection>

      <LegalSection number="9" title="Médiation et litiges">
        <p>
          En cas de litige relatif à votre abonnement, contactez-nous d'abord à{" "}
          <a href={`mailto:${LEGAL.contactEmail}`} className="text-primary font-medium underline">
            {LEGAL.contactEmail}
          </a>.
          Nous nous engageons à répondre sous {LEGAL.replyDelay}.
        </p>
        <p>
          Si aucune solution amiable n'est trouvée, vous pouvez saisir gratuitement le médiateur de
          la consommation, conformément à l'article L. 612-1 du Code de la consommation
          {LEGAL.mediator.name ? (
            <>
              {" "}: {LEGAL.mediator.name}
              {LEGAL.mediator.address ? <>, {LEGAL.mediator.address}</> : null}
              {LEGAL.mediator.website ? (
                <>, <a href={LEGAL.mediator.website} target="_blank" rel="noopener noreferrer" className="text-primary font-medium underline">{LEGAL.mediator.website}</a></>
              ) : null}
            </>
          ) : null}.
        </p>
        <p>
          Les présentes CGV sont régies par le droit français. Les tribunaux français sont compétents
          en cas de litige non résolu par voie amiable.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

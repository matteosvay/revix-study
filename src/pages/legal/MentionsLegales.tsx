import { LegalLayout, LegalSection, LegalTable } from "./LegalLayout";

export default function MentionsLegales() {
  return (
    <LegalLayout
      title="Mentions légales"
      subtitle="Informations obligatoires conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN)."
      updatedAt="19 mai 2026"
    >
      <LegalSection number="1" title="Éditeur de l'application">
        <LegalTable rows={[
          ["Nom", "Matteo Svay"],
          ["Statut", "Auto-entrepreneur"],
          ["SIRET", "[À COMPLÉTER]"],
          ["Adresse", "[À COMPLÉTER]"],
          ["Email", "matteosvay4@gmail.com"],
          ["Directeur de la publication", "Matteo Svay"],
        ]} />
      </LegalSection>

      <LegalSection number="2" title="Hébergement">
        <p>
          L'application Revix est hébergée par les prestataires suivants :
        </p>
        <div className="space-y-3">
          <LegalTable rows={[
            ["Hébergeur front-end", "[À COMPLÉTER — ex : Vercel, Inc.]"],
            ["Adresse", "[À COMPLÉTER — ex : 340 S Lemon Ave #4133, Walnut, CA 91789, USA]"],
            ["Site web", "[À COMPLÉTER — ex : vercel.com]"],
          ]} />
          <LegalTable rows={[
            ["Hébergeur base de données", "Supabase, Inc."],
            ["Adresse", "970 Toa Payoh North, Singapore 318992"],
            ["Site web", "supabase.com"],
            ["Infrastructure", "Amazon Web Services (AWS)"],
          ]} />
        </div>
      </LegalSection>

      <LegalSection number="3" title="Propriété intellectuelle">
        <p>
          L'ensemble des éléments constituant l'application Revix (marque, logo, design, textes,
          fonctionnalités, code source) est la propriété exclusive de Matteo Svay, sauf mention contraire.
        </p>
        <p>
          Toute reproduction, représentation, modification, publication ou adaptation, totale ou partielle,
          de ces éléments est interdite sans l'autorisation écrite préalable de l'éditeur.
        </p>
        <p>
          Les contenus pédagogiques (cours, fiches, quizz) créés et uploadés par les utilisateurs
          restent la propriété intellectuelle de leurs auteurs respectifs. En les déposant sur Revix,
          l'utilisateur accorde à Revix une licence non-exclusive d'utilisation limitée à la fourniture
          du service (traitement par IA, stockage, affichage).
        </p>
      </LegalSection>

      <LegalSection number="4" title="Limitation de responsabilité">
        <p>
          Revix met tout en oeuvre pour assurer la disponibilité et la sécurité du service. Toutefois,
          l'éditeur ne saurait être tenu responsable :
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Des interruptions de service liées à des opérations de maintenance ou à des incidents techniques ;</li>
          <li>De l'exactitude des contenus générés par intelligence artificielle ;</li>
          <li>Des contenus uploadés par les utilisateurs ;</li>
          <li>Des dommages indirects résultant de l'utilisation ou de l'impossibilité d'utiliser le service.</li>
        </ul>
      </LegalSection>

      <LegalSection number="5" title="Droit applicable et juridiction">
        <p>
          Les présentes mentions légales sont régies par le droit français.
          En cas de litige, les tribunaux français seront seuls compétents.
        </p>
      </LegalSection>

      <LegalSection number="6" title="Contact">
        <p>
          Pour toute question relative aux présentes mentions légales, vous pouvez contacter l'éditeur
          à l'adresse suivante : <a href="mailto:matteosvay4@gmail.com" className="text-primary font-medium underline">matteosvay4@gmail.com</a>
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

/**
 * Domaines d'emails jetables les plus courants.
 *
 * Sans ce filtre, quelqu'un peut créer dix comptes avec dix adresses jetables et
 * récupérer dix fois les crédits gratuits. C'est un premier barrage côté
 * navigateur, il ne remplace pas la confirmation obligatoire de l'email
 * (à activer dans Lovable Cloud, section Auth).
 */
const DISPOSABLE = new Set([
  "yopmail.com", "yopmail.fr", "yopmail.net", "cool.fr.nf", "jetable.fr.nf", "courriel.fr.nf",
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "guerrillamail.org", "sharklasers.com",
  "10minutemail.com", "10minutemail.net", "tempmail.com", "temp-mail.org", "temp-mail.io",
  "throwawaymail.com", "trashmail.com", "trashmail.fr", "getnada.com", "nada.email",
  "maildrop.cc", "dispostable.com", "fakeinbox.com", "mailnesia.com", "mintemail.com",
  "mohmal.com", "emailondeck.com", "tempail.com", "spamgourmet.com", "mailcatch.com",
  "moakt.com", "tmpmail.org", "tmpmail.net", "burnermail.io", "inboxkitten.com",
  "jetable.org", "mail-temp.com", "minuteinbox.com", "discard.email", "mailpoof.com",
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  return DISPOSABLE.has(domain);
}

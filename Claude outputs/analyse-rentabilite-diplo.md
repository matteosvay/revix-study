# Diplo est-il rentable ? Analyse chiffrée

Méthode : marge sur coût variable et seuil de rentabilité, appliqués à ton modèle réel. Les quotas viennent du code de tes fonctions serveur, les tarifs des sources publiques de septembre 2026. Tout est recalculable dans le classeur joint.

---

## Le verdict, sans détour

En l'état, non. Et pas de peu.

| Décomposition d'un abonné moyen | Par mois |
|---|---|
| Chiffre d'affaires encaissé | 6,19 € |
| Commission Stripe | -0,34 € |
| Cotisations sociales et impôt | -1,42 € |
| Coût IA de l'abonné lui-même | -3,84 € |
| Coût IA des gratuits qu'il finance | -11,04 € |
| **Marge sur coût variable** | **-10,46 €** |

Ta marge sur coût variable est négative. En gestion, c'est le seul cas où il n'existe aucun seuil de rentabilité : chaque abonné supplémentaire aggrave la perte au lieu de la réduire. Sur douze mois, avec 300 inscrits au départ et 20 % de croissance mensuelle, le modèle sort 181 abonnés, 5 335 € de chiffre d'affaires et **12 416 € de perte**.

Le réflexe serait d'accuser les charges fixes. Elles font 47,50 € par mois, Supabase et Lovable compris. Ce n'est pas le sujet.

---

## La vraie cause : le gratuit

Le problème n'est ni le prix, ni l'hébergement. C'est un ratio.

La conversion médiane d'un modèle freemium en 2026 est de **2,1 %**. Autrement dit, pour un abonné payant, tu héberges 47 utilisateurs gratuits. Chacun consomme en moyenne 0,24 € d'IA par mois. Le calcul est implacable : 47 × 0,24 = **11,04 € de coût IA par abonné**, pour un abonné qui t'en rapporte 6,19.

Tes utilisateurs gratuits absorbent **178 % du chiffre d'affaires** de chaque payant.

Le classeur calcule le coût maximal admissible pour un utilisateur gratuit à l'équilibre : **0,012 € par mois**. Tu es à 0,237 €. Il faut diviser par vingt.

Deuxième problème, moins visible mais réel : même sans aucun utilisateur gratuit, l'abonné lui-même coûte 3,84 € d'IA pour 6,19 € encaissés, soit 62 % de son abonnement. Il ne resterait que 0,58 € de marge. Le modèle serait à peine viable même dans un monde sans gratuits.

---

## Les trois leviers, par ordre d'impact

### 1. La conversion, de loin le plus puissant

Passer d'un gratuit permanent à un essai qui pousse à l'abonnement fait passer la conversion médiane de 2,1 % à **10,7 %**, écart mesuré sur plus de 115 000 applications par abonnement. Chaque abonné ne porte alors plus 47 gratuits, mais 8.

À lui seul, ce levier fait passer le coût des gratuits de 11,04 € à 1,98 €.

### 2. Le coût par génération

Le prix de sortie du modèle est cinq fois celui de l'entrée. Ta fiche IA coûte 0,039 €, dont 93 % en tokens de sortie, parce que ton prompt exige une fiche exhaustive plus longue que le cours d'origine.

Attention à un effet de bord de mon correctif précédent : j'ai relevé les budgets de tokens pour régler la troncature qui cassait tes générations. C'était nécessaire pour que ça marche, mais ça augmente le coût unitaire. La bonne correction sur la durée n'est pas un budget plus grand, c'est un prompt qui demande une fiche **dense plutôt que longue**. Diviser la sortie par deux divise ton coût IA par presque deux.

### 3. Le prix

Secondaire, mais réel. Passer Pro à 6,99 € et Max à 11,99 € reste crédible pour un produit qui fait gagner des heures, et ajoute 2,30 € d'ARPU.

---

## Ce que ça donne

| | Actuel | Optimisé | Agressif |
|---|---|---|---|
| Conversion | 2,1 % | 10,7 % | 10,7 % |
| Coût IA d'un gratuit | 0,24 € | 0,06 € | 0,03 € |
| Coût IA d'un abonné | 3,84 € | 2,50 € | 2,50 € |
| Prix Pro / Max | 4,99 / 8,99 € | 4,99 / 8,99 € | 6,99 / 11,99 € |
| **Marge par abonné** | **-10,46 €** | **+1,42 €** | **+3,41 €** |
| **Seuil de rentabilité** | **jamais** | **34 abonnés** | **14 abonnés** |
| Inscrits nécessaires | sans objet | 312 | 130 |
| Résultat à 300 abonnés | -3 186 € | +379 € | +975 € |
| Résultat à 1 000 abonnés | -10 508 € | +1 375 € | +3 362 € |

Le scénario optimisé devient rentable à 34 abonnés, soit environ 312 inscrits. C'est atteignable avec le plan marketing qu'on a écrit. Le scénario agressif y arrive à 14 abonnés.

Note honnête sur ces chiffres : ils restent modestes. Même à 1 000 abonnés, le scénario agressif dégage 3 362 € par mois avant de rémunérer ton temps. C'est un vrai complément de revenu, pas encore un salaire.

---

## Ton statut fiscal, et les deux falaises à surveiller

Un point qui joue en ta faveur : la vente d'abonnements à un logiciel en ligne est une activité commerciale standardisée, donc **BIC prestations de services**, pas BNC. Cotisations à 21,2 % au lieu de 25,6 %, et abattement fiscal de 50 % au lieu de 34 %. L'arbitrage vaut 4,4 points de cotisations, ne te laisse pas classer en BNC par erreur au moment de l'immatriculation.

Le versement libératoire à 1,7 % est intéressant si ton revenu fiscal de référence 2024 est sous 29 315 € par part. En tant qu'étudiant, c'est probable, mais vérifie le foyer auquel tu es rattaché.

Deux seuils à anticiper, parce qu'ils arrivent plus vite qu'on ne croit :

La **franchise en base de TVA** s'arrête à 37 500 € de chiffre d'affaires annuel. En scénario agressif, tu y es à environ 370 abonnés. Le jour où tu la dépasses, tes prix affichés TTC ne bougent pas mais tu reverses la TVA : ta marge fond d'environ 17 % du jour au lendemain. Tes clients sont des étudiants, ils ne récupèrent rien, tu ne peux donc pas simplement répercuter. Prépare ce passage à l'avance.

Le **plafond du régime micro** est à 83 600 €, soit environ 820 abonnés. Au-delà, il faut passer en société, et là le calcul change complètement.

Bonne nouvelle au passage : la réforme qui devait abaisser le seuil de TVA à 25 000 € a été définitivement abandonnée par la loi du 3 novembre 2025.

---

## Comment être sûr de gagner de l'argent

Sûr, personne ne peut te le garantir. Mais on peut rendre la perte structurellement impossible, ce qui n'est pas la même chose et c'est atteignable.

Le principe : **borner le coût variable du gratuit côté serveur**, pas côté interface. Aujourd'hui ton quota gratuit se recharge chaque semaine, donc le coût d'un utilisateur gratuit est illimité dans le temps. Remplace-le par une enveloppe fixe, par exemple quinze générations offertes à l'inscription, non renouvelées. Le coût maximal d'un inscrit qui ne paiera jamais devient alors connu et fini, de l'ordre de 0,40 € une fois pour toutes au lieu de 2,85 € par an.

À partir de là, ta perte maximale est bornée, ton seuil de rentabilité existe, et chaque abonné te rapproche de l'équilibre au lieu de t'en éloigner.

Trois conditions à réunir, dans cet ordre :

Rendre le quota gratuit fini et non renouvelable. C'est le seul changement qui rend le modèle mathématiquement viable, tout le reste en découle.

Raccourcir les sorties de l'IA. Demande des fiches denses, pas longues. Tu gagnes sur le coût et sur la qualité perçue.

Mesurer ta vraie conversion avant de conclure. Les 2,1 % et les 10,7 % sont des médianes de marché, pas ta réalité. Dès que tu as 200 inscrits, remplace ces hypothèses par tes chiffres dans le classeur.

---

## Le risque à surveiller

La rétention. Les applications d'IA retiennent leurs abonnés **36 % moins bien** que les autres catégories, et environ 72 % des abonnés annulent au cours de la première année. Avec 10 % de churn mensuel, un abonné reste dix mois et ne vaut que 14 € de marge en scénario optimisé.

Ça veut dire une chose : ton acquisition doit rester quasi gratuite. Avec une valeur vie de 14 €, tu ne peux pas te permettre de payer de la publicité pour acquérir un abonné. L'organique n'est pas seulement un choix de démarrage par prudence, c'est une nécessité économique tant que la rétention n'est pas améliorée.

C'est d'ailleurs le meilleur argument pour la gamification que tu as déjà construite : les séries, les quêtes et les cosmétiques ne sont pas du décor, ce sont tes leviers de rétention, donc directement ta marge.

---

## Sources

Cotisations micro-entreprise 2026 et taux BIC / BNC : compta-online. Seuils de TVA 2026 et abandon de la réforme des 25 000 € : Calcunet, loi n° 2025-1044 du 3 novembre 2025. Taux du versement libératoire : Wisestart. Distinction BIC / BNC pour le SaaS : LegalPlace. Tarifs Anthropic Claude Haiku 4.5 : 1 $ et 5 $ par million de tokens. Tarifs Stripe France : 1,5 % + 0,25 € par carte européenne. Benchmarks de conversion et de rétention : RevenueCat, State of Subscription Apps 2026. Tarifs Supabase et Lovable : grilles publiques 2026.

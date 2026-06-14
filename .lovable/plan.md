
# Refonte identité Revix — "Studieux moderne & chaleureux"

L'app a aujourd'hui une identité brouillonne : post-its, scotch, punaises, surligneurs fluo, polices manuscrites, ombres dures brutalistes. On part sur une vraie personnalité : chaleureuse, premium, lisible, avec l'énergie gamifiée de Duolingo mais une finition Linear/Things 3.

## Direction visuelle

**Personnalité** : studieux, chaleureux, motivant. Pas froid SaaS, pas Duolingo-cartoon, pas brouillon-cahier. L'app doit donner envie de l'ouvrir comme un bel objet.

**Palette signature**
- Fond papier : `#faf7f2` (sable très clair)
- Encre : `#2a2622` (brun-noir chaud, remplace le noir pur et l'encre bleue)
- Signature : `#c2624a` (terracotta, remplace partout l'ex-mauve puis bleu encre)
- Surface chaude : `#d9c5a7` (sable, pour cards secondaires, hovers, progress)
- Mode sombre cohérent : fond `#1a1612`, encre `#f1e9dc`, terracotta plus saturée.

**Couleurs d'état conservées** mais désaturées et harmonisées avec la chaleur de la palette : succès vert sapin, erreur rouge brique, info ocre. Plus aucun rose flashy ni jaune fluo.

**Typographie**
- Display : Sora (titres, niveaux, nombres XP)
- Body : Manrope (toute UI)
- Suppression complète de Caveat, Architects Daughter, Kalam, Archivo Black.

**Forme & profondeur**
- Coins doux (`radius` 12–16px), pas de coins cassés ni rotations.
- Ombres soft layered (`0 1px 2px`, `0 8px 24px`) au lieu des ombres dures brutalistes 4px offset.
- Bordures fines `1px` couleur encre à 8–12% d'opacité, plus jamais 2.5–3px noir pur.
- Une seule petite signature graphique discrète : un soulignement terracotta légèrement décalé sous certains titres clés (rappel cahier sans le mimer).

## Ce qui est retiré

- Toutes les classes décoratives : `.tape`, `.tape-*`, `.postit`, `.postit-*`, `.pin`, `.pin-*`, `.marker-yellow`, `.marker-pink`, `.marker-orange`, `.label-tape*`, `.stamp`, `.rubber-stamp*`, `.tally-mark`, `.corkboard`, `.clip-divider`, `.notebook-card`, `.notebook-page`, `.dog-ear`, `.paper`, `.paper-grain`, `.scribble`, `.underline-pencil`.
- Tous les usages dans les composants : décor de fond Aventure (rond mauve rayé, blob orange, points), bandeaux scotch en haut des cartes, stickers, badges "stamp", titres "Caveat".
- Les imports de fonts Caveat / Kalam / JetBrains Mono / Architects Daughter / Archivo Black.
- Les emojis décoratifs gratuits sur cartes système (on garde uniquement ceux portant du sens : matières, badges, états).

## Ce qui est gardé et redessiné

- **Gamification complète** : XP, niveaux, streaks, quêtes, ligues, loot box, duels, FOMO. La mécanique Duolingo reste, c'est l'âme de l'app. Seul le rendu change.
- **Cards niveau / quête / streak** : fond crème ou blanc, bordure 1px, accent terracotta sur la barre de progression et le bouton d'action, typo Sora pour le titre, Manrope pour le reste.
- **Bottom nav** : pas de pill mauve, juste icône + label, item actif souligné en terracotta + icône remplie.
- **Loot box / rarities** : on conserve les couleurs gaming standard (commun gris, rare bleu, épique violet, légendaire or) car c'est un langage attendu — mais désaturées pour rester dans la palette.

## Pages à passer en revue

- App shell (`AppLayout`, `Logo`, `SplashScreen`, `NotificationBell`, `CookieBanner`, `InstallAppPrompt`).
- Pages principales : `Dashboard`, `Aventure`, `Fiches`, `CourseDetail`, `Upload`, `Quizz`, `Revision`, `Stats`, `Streak`, `Planning`, `Cosmetics`, `Profil`.
- Décors : `AcademicDecor`, `BackgroundDecor`, `Scribble`, `ChapterHeatmap`, `GlobalChapterHeatmap`, `ReviewCard`, `FlashQuizCard`, `CourseSummary`, `LootBoxCard`, `LootBoxReveal`, `CoachFab`, `XpOverlay`, `TitleBadge`.
- Pages auth + légales + landing pour cohérence.

## Détails techniques

- Réécriture quasi totale de `src/index.css` : nouveaux tokens, suppression des utilities papier/scotch/post-it, nouvelles ombres soft, nouvelles animations sobres.
- `tailwind.config.ts` : nouvelles `boxShadow` (`soft`, `soft-lg`, `inset`), suppression des `brutal-*`, fontFamily Sora/Manrope.
- Remplacement systématique dans le code TSX :
  - `shadow-brutal*` → `shadow-soft*`
  - classes `tape/postit/pin/stamp/marker/notebook-card/paper` → variantes neutres
  - `font-hand`, `font-marker` → `font-sans` ou `italic`
  - hex hardcodés violets/oranges/jaunes dans décors et mock data → palette terracotta
- Alias de compatibilité supprimés progressivement pour éviter casse silencieuse.
- Mode sombre testé sur Aventure, Dashboard, CourseDetail.

## Hors-scope

- Pas de changement de structure d'écran ni de nouvelles fonctionnalités.
- Pas de retrait de la gamification.
- Pas de refonte des emails, PDFs, ou écrans admin.

## Quality bar

À la fin, capture des écrans clés (Dashboard, Aventure, CourseDetail, Upload, Quizz) en clair + sombre pour vérifier qu'il ne reste : aucun violet, aucun bleu encre, aucun scotch/post-it/punaise/surligneur fluo, aucune police manuscrite, aucune ombre dure noire 4px offset.

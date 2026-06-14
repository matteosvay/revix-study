## Plan SEO Revix — du fix technique à la croissance organique

### Phase 1 — Corriger les 5 findings SEO actuels (quick wins)

**1. Sitemap manquant** (`/sitemap.xml` → 404)
- Créer `scripts/generate-sitemap.ts` + hooks `predev`/`prebuild`.
- Inclure uniquement les routes publiques indexables : `/`, `/login`, `/signup`, `/reset-password`, `/mentions-legales`, `/confidentialite`, `/cgu`, `/cgv` + futures landings (phase 3).
- Exclure `/app/*`, `/admin/*`, `*`.

**2. `/llms.txt` manquant** (lisibilité IA — ChatGPT, Perplexity, Claude)
- Créer `public/llms.txt` avec pitch Revix + liens vers pages publiques.

**3. Title trop long + métadonnées dupliquées sur toutes les routes**
- Raccourcir le `<title>` global à <60 caractères : `Revix — Fiches, quizz & planning IA pour étudiants` (52 car.).
- Installer `react-helmet-async`, ajouter `HelmetProvider` dans `main.tsx`.
- Ajouter `<Helmet>` par page (Landing, Login, SignUp, légal, futures landings) avec **title, description, canonical et og:url propres à chaque route**.
- Retirer `<link rel="canonical">` statique de `index.html` (chaque route gérera le sien).

**4. Previews sociaux non spécifiques**
- Les mêmes `<Helmet>` couvriront `og:title`, `og:description`, `og:url`, `twitter:*` par page.

**5. FAQ structured data manquante**
- Ajouter un JSON-LD `FAQPage` dans la Landing reprenant les questions/réponses du composant FAQ existant.

### Phase 2 — Boost technique SEO

- Ajouter un JSON-LD `WebSite` avec `SearchAction` (sitelinks search box).
- Préciser `og:image:width/height` et garantir image OG 1200x630 servie via le domaine du site (pas storage.googleapis).
- Renforcer `index.html` avec `<meta name="keywords">` ciblé + hreflang `fr-FR`.

### Phase 3 — Landings produit SEO (le vrai levier trafic)

D'après l'analyse Semrush, c'est ce qui fait décoller StudySmarter & Knowunity. Créer 4 landings publiques, chacune avec head, contenu unique, FAQ, JSON-LD et CTA vers signup :

| Route | Cible mots-clés |
|---|---|
| `/fiches-de-revision-ia` | « fiche de révision », « fiche de révision IA », « créer fiche de révision PDF » |
| `/quiz-ia` | « quiz révision IA », « générateur quiz cours », « QCM bac » |
| `/planning-de-revision` | « planning de révision », « organiser ses révisions », « rétroplanning bac » |
| `/flashcards-ia` | « flashcards », « flashcards IA », « apprendre avec flashcards » |

Chaque landing : H1 unique, 600-1000 mots, section "comment ça marche", captures, FAQ, JSON-LD `SoftwareApplication` + `FAQPage`, lien vers `/signup`.

### Phase 4 — Préparer le SEO long terme

- **Recommandation domaine custom** : `revix-study.lovable.app` est un sous-domaine partagé `lovable.app` → Google ne traite jamais sérieusement le contenu d'un sous-domaine partagé. Acheter `revix.app` / `revix.fr` (faisable depuis Project Settings → Domains) est *le* prérequis pour ranker. Je le mentionne dans le résultat sans bloquer la phase 1-3.
- Préparer la structure pour une future section `/blog` (fiches de cours, méthodos) — c'est ce qui fait 90% du trafic Knowunity. Pas créé maintenant, juste évoqué.

### Détails techniques

- **Dépendance ajoutée** : `react-helmet-async`.
- **Fichiers créés** : `scripts/generate-sitemap.ts`, `public/llms.txt`, `src/components/seo/PageHead.tsx` (wrapper Helmet réutilisable), 4 fichiers de landings dans `src/pages/landings/`, route entries dans `src/App.tsx`.
- **Fichiers modifiés** : `index.html` (title raccourci, suppression canonical), `src/main.tsx` (HelmetProvider), `package.json` (hooks predev/prebuild), `src/pages/Landing.tsx` (ajout JSON-LD FAQ + Helmet), pages `/login`, `/signup`, légales (Helmet).
- **Pas touché** : routes `/app/*` et `/admin/*` (gated, déjà exclues robots).

### Ce que tu obtiens à la fin

- 5 findings SEO actuels → fixés.
- Score lisibilité IA OK (llms.txt).
- Chaque page publique a son propre titre/description/preview social → fin des duplicats.
- 4 nouvelles landings ciblant des mots-clés à fort volume.
- Sitemap auto-généré qui suivra l'ajout de futures pages.

### Hors scope (à décider après)
- Création d'un blog/section contenu (gros chantier).
- Achat domaine custom (action utilisateur).
- Configuration Google Search Console (peut être enchaînée après).

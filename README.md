# Revix — Application d'apprentissage gamifiée

> **Note pour Claude** : ce repo est synchronisé en bidirectionnel avec Lovable. Toute modification poussée sur `main` est appliquée en live à l'app. Inversement, toute modification faite via Lovable apparaît ici en quelques secondes. Travaille sur des branches feature + PR si tu veux éviter d'impacter directement le preview.

---

## 1. Vue d'ensemble

**Revix** est une PWA d'apprentissage pour étudiants du supérieur qui transforme n'importe quel cours (PDF, DOCX, photo) en fiches de révision structurées et quiz adaptatifs — le tout gamifié avec un système complet d'XP, niveaux, streaks, lootboxes et cosmétiques.

### Ce que fait Revix
- 📚 **Upload intelligent** — Glisse-dépose un PDF ou une photo de cours, l'IA en extrait le texte et génère des fiches claires
- 🧠 **Quiz adaptatifs** — QCM et questions ouvertes notées automatiquement par IA
- 🔁 **Révision espacée** — Algorithme SM-2 pour retenir à long terme
- 🎮 **Gamification complète** — XP, niveaux, streaks quotidiens, lootboxes, cosmétiques, titres, badges
- 👥 **Social learning** — Duels 1v1 temps réel, salles d'étude collaboratives, groupes d'étude, classements campus
- 🤖 **Coach IA personnel** — Chat pédagogique, tips quotidiens, alertes intelligentes, techniques de mémorisation
- 📅 **Planning IA** — Génère un planning de révision personnalisé selon ton emploi du temps
- 🎙️ **Entraînement oral** — Notes vocales transcrites + feedback oral par IA

**Public cible** : étudiants français du supérieur (médecine, droit, ingénierie, etc.) — cursus configurable à l'inscription.

**Design** : style "néo-brutaliste papier" (bordures épaisses, ombres décalées, grain papier, scribbles dessinés). Tout est en HSL via tokens sémantiques — **ne jamais utiliser de couleurs en dur**.

---

## 2. Stack technique

| Couche | Techno |
|---|---|
| Frontend | React 18 + Vite 5 + TypeScript 5 |
| UI | Tailwind CSS v3 + shadcn/ui (Radix) |
| State serveur | TanStack Query v5 |
| Routing | React Router v6 |
| Backend | **Lovable Cloud** (= Supabase managé) |
| DB | Postgres 15 + RLS |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Edge Functions | Deno (9 fonctions, voir §5) |
| IA | **Lovable AI Gateway** (sans API key utilisateur) — modèles Gemini 2.5 / GPT-5 |
| PDF | `pdfjs-dist` + `mammoth` (DOCX) |
| Tests | Vitest + Testing Library |
| PWA | manifest + install prompt custom |

---

## 3. Structure du projet

```
revix/
├── src/
│   ├── pages/
│   │   ├── Index.tsx              → Redirige vers /app ou /login
│   │   ├── Landing.tsx            → Landing publique
│   │   ├── auth/                  → Login, SignUp, Reset (+ AuthShell)
│   │   └── app/                   → Pages authentifiées (voir §4)
│   │
│   ├── components/
│   │   ├── revix/                 → Composants métier
│   │   │   ├── coach/             → CoachPanel, CoachChat, DailyTipCard,
│   │   │   │                        SmartAlertBanner, StudyPlanCard,
│   │   │   │                        TechniquesLibrary, SavedTipsTab
│   │   │   ├── cosmetics/         → BackgroundDecor, FrameDecor, StickerDecor
│   │   │   ├── leaderboard/       → LeaderboardTabs
│   │   │   ├── AppLayout.tsx      → Layout authentifié (nav, bell, install)
│   │   │   ├── RequireAuth.tsx    → Garde de route
│   │   │   ├── XpOverlay.tsx      → Animation XP gagnée (global)
│   │   │   ├── LootBoxReveal.tsx  → Cinématique d'ouverture de lootbox
│   │   │   ├── FlashQuizCard.tsx  → Carte quiz interactive
│   │   │   ├── ReviewCard.tsx     → Carte de révision espacée
│   │   │   ├── ChapterHeatmap.tsx → Heatmap progression par chapitre
│   │   │   └── …
│   │   └── ui/                    → shadcn/ui (ne pas modifier sauf nécessité)
│   │
│   ├── hooks/
│   │   ├── useAuth.tsx            → Provider auth + session Supabase
│   │   ├── useGamification.tsx    → addXp, lootboxes, quêtes, streaks
│   │   ├── useFomoChecks.tsx      → Notifications "ton ami a gagné X"
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   │
│   ├── lib/
│   │   ├── coachContext.ts        → Construit le contexte envoyé au coach IA
│   │   ├── gamification.ts        → Constantes XP, paliers, calculs niveau
│   │   ├── cosmetics.ts           → Catalogue + équipement cosmétiques
│   │   ├── pdf.ts                 → Extraction texte PDF côté client
│   │   ├── gender.ts              → Helpers d'accord (féminin/masculin)
│   │   ├── date.ts
│   │   └── utils.ts               → cn() (clsx + tailwind-merge)
│   │
│   ├── data/
│   │   ├── cursus.ts              → Liste des cursus disponibles
│   │   ├── formations.ts          → Formations par cursus
│   │   ├── subjects.ts            → Matières par formation
│   │   └── mock.ts
│   │
│   ├── integrations/supabase/
│   │   ├── client.ts              → ⚠️ AUTO-GÉNÉRÉ, NE PAS ÉDITER
│   │   └── types.ts               → ⚠️ AUTO-GÉNÉRÉ depuis le schéma DB
│   │
│   ├── index.css                  → 🎨 Design system (tokens HSL, animations)
│   ├── App.tsx                    → Routes + providers
│   └── main.tsx
│
├── supabase/
│   ├── functions/                 → Edge functions Deno (voir §5)
│   ├── migrations/                → Historique SQL (43 migrations)
│   └── config.toml                → ⚠️ project_id uniquement
│
├── public/
│   ├── manifest.webmanifest       → Config PWA
│   ├── robots.txt
│   └── placeholder.svg
│
├── tailwind.config.ts             → Tokens couleurs, fontes, animations
├── vite.config.ts
├── tsconfig*.json
├── eslint.config.js
├── vitest.config.ts
└── package.json
```

---

## 4. Routes (toutes définies dans `src/App.tsx`)

### Publiques
| Route | Composant | Rôle |
|---|---|---|
| `/` | `Index` | Redirection selon auth |
| `/login` | `auth/Login` | Connexion email + Google |
| `/signup` | `auth/SignUp` | Inscription + onboarding cursus |
| `/reset-password` | `auth/Reset` | Mot de passe oublié |

### Authentifiées (`RequireAuth`)
| Route | Composant | Rôle |
|---|---|---|
| `/app` | `Dashboard` | Hub : streak, quêtes, coach, raccourcis, fomo |
| `/app/upload` | `Upload` | Upload PDF/DOCX → génération fiches |
| `/app/fiches` | `Fiches` | Liste des cours + fiches générées |
| `/app/fiches/:id` | `CourseDetail` | Détail d'un cours (fiches, quiz, partage) |
| `/app/quizz` | `Quizz` | Hub quiz : libres, par cours, défis |
| `/app/revision` | `Revision` | Révision espacée (cartes du jour) |
| `/app/planning` | `Planning` | Planning IA + tâches |
| `/app/streak` | `Streak` | Détail streak + récompenses |
| `/app/aventure` | `Aventure` | Mode aventure (parcours gamifié) |
| `/app/campus` | `Campus` | Classements (campus, formation, amis) |
| `/app/groupes` | `StudyGroups` | Groupes d'étude |
| `/app/cosmetics` | `Cosmetics` | Boutique + inventaire cosmétiques |
| `/app/u/:id` | `PublicProfile` | Profil public d'un autre utilisateur |
| `/app/duel/:id` | `DuelPlay` | Duel quiz temps réel (1v1) |
| `/app/room/:id` | `StudyRoom` | Salle d'étude collaborative |
| `/app/profil` | `Profil` | Profil utilisateur, settings, cursus |

---

## 5. Edge Functions (`supabase/functions/`)

Toutes en Deno. Déployées automatiquement à chaque push. Toutes utilisent **Lovable AI Gateway** (`LOVABLE_API_KEY` injecté automatiquement) — **aucune clé OpenAI/Google à gérer**.

| Fonction | Rôle | Modèle par défaut |
|---|---|---|
| `extract-pdf` | Extrait le texte d'un PDF uploadé | — (parsing) |
| `generate-fiches` | Génère fiches structurées depuis un texte de cours | `google/gemini-2.5-flash` |
| `generate-quiz` | Génère QCM + questions ouvertes depuis un cours | `google/gemini-2.5-flash` |
| `generate-planning` | Génère un planning de révision personnalisé | `google/gemini-2.5-pro` |
| `grade-open` | Note une réponse ouverte (0-10 + feedback) | `google/gemini-2.5-flash` |
| `coach-chat` | Chat avec le coach IA (contexte utilisateur complet) | `google/gemini-2.5-pro` |
| `transcribe-voice` | Transcrit une note vocale (audio → texte) | Whisper / Gemini |
| `oral-feedback` | Feedback sur une réponse orale enregistrée | `google/gemini-2.5-pro` |
| `room-explain` | Explique un concept dans une study room | `google/gemini-2.5-flash` |

**Conventions Edge Functions** :
- CORS headers exposés (`Access-Control-Allow-Origin: *`)
- Lecture du JWT via `Authorization: Bearer …` quand `verify_jwt = true`
- Réponses JSON `{ data?, error? }`
- Streaming SSE pour `coach-chat` et `room-explain`

---

## 6. Schéma de base de données (35 tables)

### Authentification & profil
- `profiles` — pseudo, avatar, cursus, formation, gender, level, xp, streak, current_title…
- `user_badges` — badges débloqués
- `user_cosmetics` — cosmétiques possédés (équipés ou non)
- `user_inventory` — items consommables (lootboxes en attente, etc.)
- `cosmetic_items` — catalogue (avatars, cadres, fonds, stickers, titres)

### Contenu pédagogique
- `courses` — cours uploadés (titre, matière, contenu brut, fiches générées)
- `course_shares` — partages de cours entre amis
- `quizzes` — quiz générés ou créés
- `quiz_questions` — questions (qcm / open)
- `quiz_attempts` — tentatives (score, durée, xp gagné)
- `question_reviews` — révision espacée (next_review, ease, interval)
- `voice_notes` — notes vocales liées à un cours
- `oral_sessions` — sessions d'entraînement oral

### Gamification
- `xp_events` — historique XP (source, montant, ts)
- `daily_loot_box` — lootbox quotidienne (claimed_at)
- `user_quests` — quêtes en cours / terminées
- `notifications` — notifications in-app
- `push_subscriptions` — abonnements Web Push

### Social
- `friendships` — relations d'amitié (status: pending / accepted)
- `duels` + `duel_questions` + `duel_attempts` + `duel_presence` — duels temps réel
- `study_rooms` + `room_members` + `room_messages` + `room_goals` + `room_shared_courses` + `room_whiteboard` — salles d'étude
- `study_groups` + `study_group_members` + `study_group_activity` — groupes

### Coach IA
- `coach_messages` — historique chat coach
- `coach_saved_tips` — tips épinglés par l'utilisateur

### Planning
- `planning_tasks` — tâches de planning (date, durée, statut)

### Sécurité
- **RLS activée sur toutes les tables**
- Pattern : `auth.uid() = user_id` pour les données privées
- Fonction `has_role(uuid, app_role)` SECURITY DEFINER pour les rôles (jamais stockés sur `profiles`)
- Realtime activé sur : `duels`, `duel_attempts`, `duel_presence`, `room_*`, `notifications`, `friendships`

---

## 7. Design system

**Tout est défini dans `src/index.css` et `tailwind.config.ts`.**

### Tokens principaux (HSL obligatoire)
- `--background`, `--foreground`
- `--primary`, `--primary-foreground`, `--primary-glow`
- `--secondary`, `--accent`, `--muted`, `--destructive`
- `--card`, `--popover`, `--border`, `--input`, `--ring`
- Couleurs métier : `--xp`, `--streak`, `--rare`, `--epic`, `--legendary`

### Effets signature
- `.shadow-brutal` / `.shadow-brutal-sm` — ombres décalées (style néo-brutalisme)
- `.paper-grain` — texture papier subtile
- `.gradient-primary` — dégradé primary → primary-glow
- Bordures `border-[2.5px] border-foreground` sur les CTA
- Animations `hover:translate-x-[1px] hover:translate-y-[1px]` sur les boutons

### Règles strictes
1. **Jamais** de classes `text-white`, `bg-black`, `text-[#abc123]` etc. dans les composants → toujours via tokens.
2. Toutes les couleurs en **HSL** dans `index.css` et `tailwind.config.ts`.
3. Nouveau composant ? → définir une **variante** dans `cva` plutôt que dupliquer du style.
4. Mode sombre supporté partout via les tokens `:root` / `.dark`.

---

## 8. Conventions de code

- **Imports** : alias `@/` = `src/` (configuré dans `vite.config.ts` + `tsconfig.json`)
- **Supabase client** : `import { supabase } from "@/integrations/supabase/client"` — **jamais** créer un autre client
- **Types DB** : `import type { Database } from "@/integrations/supabase/types"` — **auto-généré, ne pas éditer**
- **Toasts** : `import { toast } from "sonner"` (préféré) ou `useToast` pour les cas avec actions
- **Forms** : `react-hook-form` + `zod` + `@hookform/resolvers`
- **Composants** : petits, focalisés. Si > 250 lignes → refactor.
- **State serveur** : TanStack Query, jamais `useEffect` + `fetch`
- **Edge functions** : appel via `supabase.functions.invoke('nom', { body })`

---

## 9. Variables d'environnement

### Frontend (`.env`, **auto-généré par Lovable**)
```
VITE_SUPABASE_URL=…
VITE_SUPABASE_PUBLISHABLE_KEY=…   (anon key, OK en clair)
VITE_SUPABASE_PROJECT_ID=…
```

### Edge functions (secrets gérés via Lovable Cloud)
- `LOVABLE_API_KEY` — injecté automatiquement, donne accès à tous les modèles
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` — auto-injectés

**Aucune autre clé n'est requise**. Pas d'OpenAI key, pas de Google AI key.

---

## 10. Workflow recommandé pour Claude

1. **Lire d'abord** : ce fichier `.claude.md` pour le contexte global, puis `src/App.tsx` (routes), `src/index.css` (design system), `src/integrations/supabase/types.ts` (schéma).
2. **Avant toute modif DB** : créer un nouveau fichier de migration dans `supabase/migrations/` au format `YYYYMMDDHHMMSS_description.sql`. Ne **jamais** éditer une migration existante.
3. **Avant toute modif UI** : vérifier les tokens existants dans `index.css` plutôt que d'en créer de nouveaux.
4. **Tests** : `bun run test` (Vitest). Setup dans `src/test/setup.ts`.
5. **Build local** : `bun install && bun run dev` (port 8080).
6. **PR plutôt que push direct** sur `main` si le changement est risqué — Lovable applique tout immédiatement au preview.

### Points d'attention
- ⚠️ Ne **jamais** modifier : `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, `.env`, `supabase/config.toml` (au-delà du `project_id`)
- ⚠️ Ne **jamais** stocker de rôles sur `profiles` → utiliser `user_roles` + `has_role()`
- ⚠️ Toujours activer RLS sur les nouvelles tables
- ⚠️ Réponses Lovable AI Gateway peuvent renvoyer `429` (rate limit) ou `402` (crédits) → gérer ces cas

---

## 11. Liens utiles

- **Preview** : https://id-preview--0d4529f0-ab78-407f-a666-44384d4fa848.lovable.app
- **Production** : https://revix-study.lovable.app
- **Docs Lovable** : https://docs.lovable.dev
- **Docs Supabase** : https://supabase.com/docs

---

*Dernière mise à jour du README : 13 mai 2026 — avec fichier `.claude.md` pour Claude Code.*

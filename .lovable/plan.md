## Objectif

Remplacer les ~156 cosmétiques visuels (55 frames + 54 fonds + 47 stickers) actuellement en CSS/SVG par des illustrations générées via le modèle image de GPT (`openai/gpt-image-2`). Les 32 titres restent en texte stylé.

## Direction artistique

Hiérarchie par rareté pour rendre la collection désirable :

- **Commun** → ligne claire ambre/crème, style cahier d'étudiant cohérent avec les icônes actuelles (`#c2691a`, contour 8px, fond transparent). Lecture rapide, minimaliste.
- **Rare** → 2 tons d'ambre + 1 accent couleur, léger volume, ombre douce.
- **Épique** → 3D doux coloré, brillance subtile, palette riche (par thème : ocean/forest/sunset…).
- **Légendaire** → 3D premium avec aura/glow, matériaux (or, cristal, plasma), satisfaisant à débloquer.
- **Créateur / Reine** → garder les visuels existants déjà premium (frame_origine, frame_reine, bg_reine, sticker_origine).

Format technique :
- Stickers : 512×512 PNG transparent, contour blanc 6-8px optionnel selon rareté ("puffy sticker" pour rare+).
- Frames (rings) : 1024×1024 PNG transparent, anneau centré laissant un trou propre pour l'avatar.
- Fonds : 1536×864 JPG (ratio 16/9), illustration pleine, sans texte.

## Phase 1 — Échantillons de validation (6 visuels)

Générer un set représentatif pour valider la direction avant la série complète :

1. `sticker_book` (commun, ligne claire)
2. `sticker_rocket` (rare, puffy avec accent couleur)
3. `sticker_crown` (épique, 3D doré brillant)
4. `frame_gold` (épique, anneau or 3D)
5. `bg_ocean` (rare, illustration paysage)
6. `bg_phoenix_fire` (légendaire, scène épique)

Présenter ces 6 visuels en preview au user → attendre validation avant Phase 2.

## Phase 2 — Génération de la série (~150 visuels)

Une fois la DA validée, script Python (`/tmp/gen_cosmetics.py`) qui :

1. Lit la liste des item_keys depuis la DB (`SELECT item_key, name, category, rarity FROM cosmetic_items`).
2. Pour chaque item, construit un prompt depuis 3 tables de templates :
   - template par catégorie (sticker / frame / background)
   - modulateur par rareté (palette + style 3D level)
   - sujet dérivé du nom + item_key (mappage manuel pour la cohérence sémantique)
3. Appelle l'AI Gateway en parallèle (concurrence 4) avec `quality: "low"` (sauf légendaires en `medium`) pour limiter le coût.
4. Sauvegarde dans `src/assets/cosmetics/gen/{category}/{item_key}.png` (ou .jpg pour fonds).
5. Externalise les assets via `lovable-assets` (CDN) pour éviter d'alourdir le repo.

Estimation : ~150 images × ~15s avec 4 workers → ~10 min de génération.

## Phase 3 — Refactor du code

Remplacer les implémentations CSS/SVG par des `<img>` :

- `src/lib/cosmetics.ts` → `frameStyle()` simplifié : retourne juste `{ src, glow }` pour chaque frame (depuis un map généré). Les anneaux CSS conditionnels sont retirés.
- `src/components/revix/cosmetics/StickerDecor.tsx` (882 l.) → remplacé par un composant simple qui rend `<img src={STICKERS[itemKey]} />` depuis un map généré. Suppression de tout le SVG hand-drawn.
- `src/components/revix/cosmetics/FrameDecor.tsx` (1077 l.) → simplifié de la même façon. Garde uniquement la logique d'overlay (positionnement, taille, glow).
- `src/components/revix/cosmetics/BackgroundDecor.tsx` (1285 l.) → remplacé par un `<img>` plein cadre + un léger overlay CSS gradient en fallback pendant le chargement.
- `src/lib/cosmetics.ts` → `backgroundStyle()` : retourne juste `backgroundImage: url(...)` pour chaque fond.

Bonus : les composants gagnent en performance (suppression de SVG animés complexes), le code passe de ~3500 lignes à ~300 lignes.

## Phase 4 — QA

- Visiter `/app/cosmetics` et vérifier l'affichage par onglet (Cadres / Fonds / Stickers).
- Vérifier la preview en haut de page (avatar avec frame + sticker + background équipés).
- Vérifier `PublicProfile`, `LeaderboardTabs`, `LootBoxReveal` qui consomment les mêmes composants.
- Confirmer que les visuels créateur/reine existants ne sont pas écrasés.

## Détails techniques

- **Modèle** : `openai/gpt-image-2` via l'endpoint `/v1/images/generations` (route serveur non nécessaire — on génère côté agent dans le sandbox avec le script `lovable_ai.py` du skill ai-gateway).
- **Coût estimé** : ~150 images low-quality + ~15 medium-quality (légendaires) ≈ usage modéré de crédits workspace.
- **Pas de changement DB** : on garde les mêmes `item_key`, `category`, `rarity`. Seul le mapping côté front change.
- **Rollback safe** : on garde les fichiers CSS/SVG actuels dans Git history. Si le user n'aime pas, on peut revenir.
- **Pas de régression** : les RPC `equip_cosmetic`, `get_my_cosmetics_inventory`, `unlockable_in_loot` restent intactes.

## Hors scope

- Titres (restent en texte stylé, comme demandé).
- Cosmétiques créateur/reine existants (`*_origine`, `*_reine`) — déjà premium, préservés.
- Mécaniques de jeu (loot box, prix XP, drop rate) — aucun changement.

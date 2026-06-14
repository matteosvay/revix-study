## Contexte

Tu as validé la DA sur les 6 échantillons :
- ✅ Sticker fusée (puffy, contour blanc, accent couleur)
- ✅ Fond océan (illustration calme, painterly)
- ✅ Cadre or 3D (anneau premium)
- ❌ Fond phénix « trop abusé » → à refaire en version plus calme/cohérente avec l'app

Les assets générés à la session précédente n'ont pas été persistés dans le repo (seuls les 6 samples sont là). Je relance donc la génération complète + l'intégration.

## Ajustements DA suite à ton retour

- **Tous les fonds légendaires** : on reste sur des illustrations *painterly calmes* (style océan), pas de scènes dramatiques pleines de flammes/éclairs. La rareté se traduit par la richesse de la lumière et de la composition, pas par l'intensité du sujet. Ex: `bg_phoenix_fire` → ciel d'aube avec silhouette d'oiseau lumineux et plumes douces, pas un brasier.
- **Stickers** : tous au style fusée (puffy 3D, contour blanc 6-8px, ombre douce). Hiérarchie par rareté = matériaux (ambre simple → coloré → glossy → or/cristal/glow).
- **Cadres** : tous en anneau 3D premium (style or validé), variation par matière selon rareté.

## Étapes

### 1. Génération (~145 visuels)
- Script `/tmp/run_gen.py` (déjà écrit) appelle `openai/gpt-image-2` via AI Gateway, 6 workers parallèles.
- `quality: "low"` pour commun/rare/épique, `medium` pour légendaire.
- Prompts construits depuis `/tmp/build_prompts.py` (mapping `item_key` → sujet + modulateur rareté).
- Sortie brute → `/tmp/cosmetics_raw/{category}/{item_key}.png`.

### 2. Post-traitement (`/tmp/process.py`)
- Stickers + frames : flood-fill depuis les bords pour rendre le fond blanc transparent.
- Resize stickers/frames → 512px, fonds → 1280×720.
- Compression WebP (qualité 88).
- Sortie finale → `src/assets/cosmetics/gen/{category}/{item_key}.webp`.

### 3. Refactor des composants
- `src/lib/cosmetics.ts` : maps `STICKER_SRC`, `FRAME_SRC`, `BG_SRC` (item_key → URL importée). Les helpers `frameStyle/backgroundStyle` retournent l'URL au lieu du CSS.
- `StickerDecor.tsx` (882 l.) → ~50 l. : juste un `<img>` + glow conditionnel par rareté.
- `FrameDecor.tsx` (1077 l.) → ~80 l. : `<img>` anneau + halo CSS selon rareté.
- `BackgroundDecor.tsx` (1285 l.) → ~30 l. : `<img>` plein cadre + overlay sombre léger pour lisibilité.
- Préservés tels quels : `*_origine`, `*_reine` (créateur/queen — déjà premium).

### 4. QA
- `/app/cosmetics` : onglets Cadres / Fonds / Stickers, preview de l'avatar équipé.
- `PublicProfile`, `LeaderboardTabs`, `LootBoxReveal`, `StudyRoom` : vérifier rendu.
- Console + network : pas d'erreurs 404 sur les imports d'images.

## Hors scope
- Titres (texte stylé, inchangés).
- DB / RPC / loot box (aucun changement de schéma ni de logique métier).
- Cosmétiques `*_origine` / `*_reine` (conservés).

## Coût / durée estimés
- ~10 min de génération (145 images × ~4s avec 6 workers).
- Crédits modérés (low quality majoritaire).

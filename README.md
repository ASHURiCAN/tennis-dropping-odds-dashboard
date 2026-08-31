# Tennis Backtest — Dropping-odds Dashboard

Visualisation (React + Tailwind + Recharts) d'un backtest tennis **walk-forward strict**
sur le signal *underdog en drop consensuel → on parie la favorite* (cote réelle du favori).

> UI = visualisation seule. Aucune optimisation n'est faite ici ; le signal est figé
> (été 2026) et appliqué tel-quel en out-of-sample.

## Données

- 1 cohorte **découverte** (in-sample estivale) + **12 fenêtres OOS** (OOS1 juin→août, OOS2 avril→juin).
- 6 083 paris OOS (tous signaux), ROI poolé reconstitué ≈ **−10,5 %**.
- Equity curve et IC95 (Wilson pour le win%, bootstrap pour le ROI%) sont **reconstitués**
  depuis les `roi_unit` / `outcome` par signal (les JSON source ne les contiennent pas).

## Structure du dépôt

| Chemin | Rôle |
|--------|------|
| `build_tennis_reports.py` | Pont Python → `tennis_reports.json` (equity + IC95 reconstitués) |
| `tennis_reports.json` | Données agrégées consommées par l'app (13 cohortes) |
| `tennis_dashboard/` | App React (Vite + Tailwind + Radix + Recharts + react-router + zustand) |
| `tennis_dashboard/dist/` | Build de production (ignoré par git ; régénéré via `pnpm build`) |
| `tennis_dashboard/public/tennis_reports.json` | Copie pour le dev server |

## Lancer l'app (dev)

```bash
cd tennis_dashboard
pnpm install
pnpm dev          # http://127.0.0.1:5173 (ou le port affiché)
```

## Build autonome (ouvrir sans serveur)

Le build de production est inliné dans un fichier HTML unique (données embarquées) :

```bash
cd tennis_dashboard
pnpm build
# puis générer le bundle autonome (script hors repo) ou copier dist/ + tennis_reports.json
```

Ouvrir `tennis_dashboard_bundle.html` directement dans un navigateur Android fonctionne
(HashRouter + données injectées dans `window.__TENNIS_REPORT__`).

## Routes

- **Découverte** — cohorte in-sample, equity, contexte du signal.
- **OOS par cohorte** — 12 fenêtres cliquables → equity + tableau des signaux détaillés.
- **Favori-ROI** — agrégé par cohorte avec IC95 + heatmap.
- **Paramètres figés** — signal validé (lecture seule).

## Régénérer les données

Le dataset brut (`tennisexplorer_oos_*.json`, `tennisexplorer_oos2_*.json`) est exclu du dépôt
(trop volumineux). Pour le régénérer :

```bash
python3 build_tennis_reports.py   # lit les JSON source présents, écrit tennis_reports.json
```

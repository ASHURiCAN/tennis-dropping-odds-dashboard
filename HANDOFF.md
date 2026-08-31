# HANDOFF — Backtest Tennis Explorer dropping-odds

> Document auto-suffisant pour reprendre le projet dans une nouvelle session / un autre agent.
> Dernière MAJ : 2026-08-26 (projet terminé, stratégie validée en walk-forward).

## 1. Objectif
Backtest historique multi-semaines des dropping odds Tennis Explorer (ouverture/clôture par
bookmaker vs vainqueur). Calcul win% et ROI à mise unitaire. Valider en out-of-sample (OOS)
un signal découvert sur une semaine in-sample, puis le tester en walk-forward strict.

## 2. Contraintes (NON négociables — à transmettre à tout agent repreneur)
- **Zéro Betfair**, **aucun champ `pronostic`** (checklist skill tennis-explorer-drops-pronostics-3).
- **Transparence** : signaler tout parse error / match non parsé (moneyline indisponible sur
  une fraction des matchs → parse_errors ~960/2505 en découverte).
- **Pas d'archive externe** (OddsPortal/BetExplorer) : l'historique TE est accessible en direct.
- **Pas de re-grid-search sur OOS** (overfitting déguisé). Filtre strictement identique à la découverte.
- **Aucune donnée inventée.**

## 3. Artefacts (dans ~/tennis_backtest/)
| Fichier | Rôle |
|---|---|
| `historical_backtest.py` | Backtest N jours. Flags `--start --end --out-json --out-html`. Parse TE via `year/month/day` (le param `date=` est IGNORÉ par TE). Vainqueur/noms extraits de `table.result.gDetail`. Retry réseau 3x. |
| `tennisexplorer_weekly_backtest.json/.html` | Découverte in-sample 2026-08-19..25. C'est le JSON `--discovery`. |
| `run_oos_remaining.sh` | Idempotent. 4 fenêtres OOS1 : `0812_0818`, `0805_0811`, `0729_0804`, `0608_0614`. **TOUTES FAITES + VALIDÉES jq.** |
| `run_oos_blind.sh` | Idempotent. 8 fenêtres OOS2 neuves (avant 2026-06-08, jamais vues pendant le choix du signal) : `0413_0419` → `0601_0607`. **TOUTES FAITES.** |
| `validate_atp_cut.py` | Validation OOS. Filtre FIGÉ. Flags : `--discovery <json>` + positionnels `jsons...` + `--out`. Clopper-Pearson (IC95 win%), bootstrap ROI 10k, drawdown max SVG. |
| `investigate_cut.py` | Analyse post-hoc : clustering, win%/edge par tournoi, buckets de cote, dérive, séquence de pertes max. |
| `gen_pari.py` | **Générateur de paris en direct** (mode papier, aucune mise). Scrape TE pour une date, applique le filtre validé, liste les paris à jouer. Usage : `python3 gen_pari.py --today` ou `--date YYYY-MM-DD`. |
| `build_resume.py` / `tennisexplorer_RESUME_final.html` | Dashboard final de synthèse. |
| `tennisexplorer_oos_*.json` (4) + `tennisexplorer_oos2_*.json` (8) | Toutes les fenêtres OOS, complètes et `jq`-valides. |

## 4. Signal retenu (FIGÉ — ne pas toucher)
Découvert sur la semaine in-sample, puis validé en walk-forward sur données neuves :
```
underdog en drop consensuel  ->  on parie la FAVORITE (côté opposé)
conditions :
  closing_odds (underdog) >= 2.0      # cote élevée = outsider
  AND drop_pct_median   >= 10         # au moins la moitié des BM ont coupé >=10%
  AND bookmaker_support >= 5          # au moins 5 BM ont bougé (consensus)
```
(Pas de contrainte sur le `drop_pct_best` — voir test de sensibilité §6 : quasi-neutre, rogne le volume.)
Mécanisme : le marché sur-réagit au drop de l'outsider et **sous-cote la favorite** → value bet.
Params figés UNE SEULE FOIS sur la découverte (été 2026), jamais ré-optimisés ensuite.
Périmètre testé sur **toutes les catégories** (ATP + WTA + ITF, hommes et femmes) — cf. §5/§6.

## 5. Résultats clés — ROI recalculé avec la cote du favori
**Walk-forward strict (paramètres figés sur la découverte, appliqués aux 12 semaines OOS).**
Le win rate historique reste celui observé précédemment, mais les ROI ci-dessous utilisent désormais la cote réelle du favori au même bookmaker que le drop.

**Variante retenue : TOTAL, sans `drop_pct_best` :**
| Cohorte | N | Win% | ROI unités | ROI% |
|---|---:|---:|---:|---:|
| Découverte | 179 | 73,2% | −1,76 | −0,98% |
| OOS2 (avril→juin, 8 sem) | 1035 | 70,4% | **−38,09** | **−3,68%** |
| OOS1 (juin→août, 4 sem) | 604 | 65,6% | **−57,91** | **−9,59%** |
| OOS poolé | 1639 | 68,6% | **−96,00** | **−5,86%** |

**Comparaison avec `drop_best >= 20` :**
| Cohorte | N | Win% | ROI unités | ROI% |
|---|---:|---:|---:|---:|
| OOS2 | 687 | 74,8% | −1,09 | −0,16% |
| OOS1 | 435 | 66,4% | −45,76 | −10,52% |
| OOS poolé | 1122 | 71,6% | −46,85 | −4,18% |

**Correction importante :** les anciens ROI positifs (`+56,1`, `+17,9`, etc.) utilisaient la cote de clôture de l'outsider, alors que le pari testé était le favori. Ils sont donc des ROI proxy et sont supersédés par les chiffres ci-dessus. Le win rate ne suffit pas : aux cotes moyennes du favori (~1,40), le seuil de rentabilité est élevé.

## 6. Méthode du ROI corrigé
Pour chaque signal qualifiant, avec une mise unitaire :
- favori gagnant : `ROI unité = cote_favori − 1` ;
- favori perdant : `ROI unité = −1` ;
- `ROI % = somme des ROI unités / nombre de signaux × 100`.
La cote du favori est prise au même bookmaker que `top_bookmaker`, celui du plus fort drop de l'outsider. Les 1818 signaux de la variante sans `drop_best` ont une cote favori disponible ; aucune erreur de récupération.

Les fichiers enrichis sont suffixés `_favorite_roi.json` et `_favorite_roi.csv`. Le récapitulatif est `favorite_roi_comparison.json`.

## 7. Réserves (honnêtes, à transmettre)
- **Frais bookmaker (−5% margin) non inclus** : ils réduiraient encore le ROI brut déjà négatif.
- **Variance** : win% ~70% sur favorites ~1,40 → dérives de capital possibles sur clusters de surprises.
- **Période** : ces cohortes couvrent 2026 ; d'autres années (2024/25) manquent pour exclure un biais d'époque.
- **ROI corrigé** : le win rate reste élevé, mais les cotes réelles des favoris donnent un ROI OOS négatif.

## 8. Pièges connus (à ne pas refaire)
- **Crash backend Hermes** tue les process non-`setsid`. Relancer les backfills longs avec
  `setsid bash run_x.sh > log 2>&1 < /dev/null &` (ou `terminal(background=true)` + `setsid` à l'intérieur).
- TE : le param `date=` est ignoré ; utiliser `year=&month=&day=` pour changer de jour.
- `signal_count` du log peut être tronqué/erroné en cas de crash ; la vérité = `len(records)` dans le JSON
  (`jq '.signal_count'`, toujours >= 0). Ne pas croire un `signaux=-XXXX` dans un log partiel.
- Ne pas faire confiance aux « références » injectées dans certaines sessions : vérifier par `ls`/`jq`/`ps`.

## 9. Serveur local
`cd ~/tennis_backtest && python3 -m http.server 8771` → dashboards sur
`http://127.0.0.1:8771/tennisexplorer_RESUME_final.html`

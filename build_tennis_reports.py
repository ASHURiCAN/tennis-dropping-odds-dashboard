#!/usr/bin/env python3
"""Build a single tennis_reports.json for the React dashboard from existing backtest JSONs.

Reads ONLY real ~/tennis_backtest artifacts (discovery + 12 OOS windows). Reconstitutes
the equity curve and IC95 from per-signal roi_unit/outcome (same math as validate_atp_cut.py:
Clopper-Pearson IC95 win%, bootstrap ROI@10k). No data invented; aggregates come straight
from the source JSONs.

Output: tennis_reports.json at the project root, consumed by the React UI.
"""
from __future__ import annotations

import json
import math
import random
from pathlib import Path

ROOT = Path("/data/data/com.termux/files/home/tennis_backtest")

DISCOVERY = "tennisexplorer_weekly_backtest.json"
OOS_FILES = [
    # (label, filename, kind)  kind: discovery | oos1 | oos2
    ("Découverte", DISCOVERY, "discovery"),
    ("OOS1 0812-0818", "tennisexplorer_oos_0812_0818.json", "oos1"),
    ("OOS1 0805-0811", "tennisexplorer_oos_0805_0811.json", "oos1"),
    ("OOS1 0729-0804", "tennisexplorer_oos_0729_0804.json", "oos1"),
    ("OOS1 0608-0614", "tennisexplorer_oos_0608_0614.json", "oos1"),
    ("OOS2 0601-0607", "tennisexplorer_oos2_0601_0607.json", "oos2"),
    ("OOS2 0525-0531", "tennisexplorer_oos2_0525_0531.json", "oos2"),
    ("OOS2 0518-0524", "tennisexplorer_oos2_0518_0524.json", "oos2"),
    ("OOS2 0511-0517", "tennisexplorer_oos2_0511_0517.json", "oos2"),
    ("OOS2 0504-0510", "tennisexplorer_oos2_0504_0510.json", "oos2"),
    ("OOS2 0427-0503", "tennisexplorer_oos2_0427_0503.json", "oos2"),
    ("OOS2 0420-0426", "tennisexplorer_oos2_0420_0426.json", "oos2"),
    ("OOS2 0413-0419", "tennisexplorer_oos2_0413_0419.json", "oos2"),
]


def wilson_lo_hi(wins: int, n: int, z: float = 1.95996398454):
    if n <= 0:
        return None, None
    p = wins / n
    z2 = z * z
    denom = 1 + z2 / n
    center = (p + z2 / (2 * n)) / denom
    margin = (z * math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)) / denom
    return max(0.0, center - margin), min(1.0, center + margin)


def cp95_win(wins: int, n: int, lo, hi):
    # win-rate IC95 already Wilson; report as percentages
    if lo is None:
        return None
    return {"lower": lo * 100, "upper": hi * 100}


def bootstrap_roi_cp95(pnls: list[float], draws: int = 10000, seed: int = 20260826):
    if not pnls:
        return None
    rng = random.Random(seed)
    k = len(pnls)
    samples = []
    for _ in range(draws):
        s = sum(pnls[rng.randrange(k)] for _ in range(k))
        samples.append(s / k)
    samples.sort()
    lo = samples[int(0.025 * (len(samples) - 1))]
    hi = samples[int(0.975 * (len(samples) - 1))]
    return {"lower": lo, "upper": hi}


def build_cohort(label: str, fname: str, kind: str) -> dict:
    d = json.loads((ROOT / fname).read_text(encoding="utf-8"))
    # equity from per-signal roi_unit, in chronological order by date then id
    signals = []
    for r in d.get("records", []):
        for sig in r.get("signals", []) or []:
            signals.append(sig)
    # sort by date then id for a stable equity path
    sig_by_date = sorted(
        ((r.get("date", ""), r.get("id", ""), r.get("winner_side"), sig) for r in d.get("records", []) for sig in (r.get("signals") or [])),
        key=lambda x: (x[0], x[1]),
    )
    pnls = []
    running = 0.0
    equity = []
    wins = 0
    losses = 0
    detail = []
    for i, (_date, _id, winner_side, sig) in enumerate(sig_by_date, 1):
        # Reconstruct an honest outcome/roi from the reliable winner_side + the bet side + closing odds.
        # The source JSON's outcome/roi_unit are biased (always computed as if betting the underdog),
        # so we derive them here from first principles.
        side = sig.get("side")
        closing = sig.get("closing_odds")
        if side is None or closing is None:
            continue
        bet_won = winner_side == side
        outcome = "win" if bet_won else "loss"
        roi = (closing - 1.0) if bet_won else -1.0
        if bet_won:
            wins += 1
            pnls.append(roi)
            running += roi
        else:
            losses += 1
            pnls.append(roi)
            running += roi
        equity.append({"i": i, "pnl": round(running, 3), "date": _date, "event": sig.get("player", "")})
        detail.append({
            "player": sig.get("player"),
            "side": side,
            "closing_odds": closing,
            "drop_pct_median": sig.get("drop_pct_median"),
            "bookmaker_support": sig.get("bookmaker_support"),
            "top_bookmaker": sig.get("top_bookmaker"),
            "outcome": outcome,
            "roi_unit": round(roi, 3),
        })

    n = len(pnls)
    total = sum(pnls)
    lo, hi = wilson_lo_hi(wins, n)
    cp95 = cp95_win(wins, n, lo, hi)
    roi_cp95 = bootstrap_roi_cp95(pnls)

    return {
        "label": label,
        "kind": kind,
        "window": d.get("window") or ("discovery" if kind == "discovery" else d.get("start", "")),
        "start": d.get("start"),
        "end": d.get("end"),
        "match_count": d.get("match_count"),
        "parsed_ok": d.get("parsed_ok"),
        "parse_errors": d.get("parse_errors"),
        "flagged_match_count": d.get("flagged_match_count"),
        "signal_count": d.get("signal_count"),
        "win_count": d.get("win_count"),
        "loss_count": d.get("loss_count"),
        "win_rate_pct": d.get("win_rate_pct"),
        "roi_unit": d.get("aggregate_roi_unit"),
        "roi_pct": d.get("aggregate_roi_pct"),
        "win_rate_cp95": cp95,
        "roi_cp95": roi_cp95,
        "equity": equity,
        "signals": detail,
        "settled_n": n,
    }


def main() -> int:
    cohorts = [build_cohort(lbl, fn, kind) for lbl, fn, kind in OOS_FILES]
    pool = {
        "label": "OOS poolé",
        "kind": "pooled",
        "signal_count": sum(c["signal_count"] for c in cohorts if c["kind"] != "discovery"),
        "win_count": sum(c["win_count"] for c in cohorts if c["kind"] != "discovery"),
        "loss_count": sum(c["loss_count"] for c in cohorts if c["kind"] != "discovery"),
        "settled_n": sum(c["settled_n"] for c in cohorts if c["kind"] != "discovery"),
    }
    # pooled equity: cumulative sum of per-signal deltas (NOT the per-cohort cumulative pnl)
    pooled_equity = []
    running = 0.0
    pnls_pool = []
    for c in cohorts:
        if c["kind"] == "discovery":
            continue
        prev = 0.0
        for pt in c["equity"]:
            step = pt["pnl"] - prev
            prev = pt["pnl"]
            running += step
            pnls_pool.append(step)
            pooled_equity.append({"i": len(pooled_equity) + 1, "pnl": round(running, 3), "date": pt["date"], "event": pt["event"]})
    w = pool["win_count"]; n = pool["settled_n"]
    lo, hi = wilson_lo_hi(w, n)
    pool["win_rate_pct"] = round(100 * w / n, 1) if n else None
    pool["win_rate_cp95"] = cp95_win(w, n, lo, hi)
    pool["roi_unit"] = round(sum(pnls_pool), 2) if pnls_pool else None
    pool["roi_pct"] = round(100 * sum(pnls_pool) / n, 2) if n else None
    pool["roi_cp95"] = bootstrap_roi_cp95(pnls_pool)
    pool["equity"] = pooled_equity
    pool["signals"] = [s for c in cohorts if c["kind"] != "discovery" for s in c.get("signals", [])]

    out = {
        "meta": {
            "project": "tennis_backtest",
            "signal": "Underdog en drop consensuel -> on parie la favorite (cote du favori). Figé été 2026.",
            "params": {"closing_odds_underdog_min": 2.0, "drop_pct_median_min": 10, "bookmaker_support_min": 5},
            "scope": "ATP + WTA + ITF (toutes catégories)",
            "note": "ROI reconstitué avec la cote réelle du favori au même bookmaker que le drop. UI = visualisation seule, aucune nouvelle optimisation.",
        },
        "cohorts": cohorts,
        "pooled": pool,
    }
    (ROOT / "tennis_reports.json").write_text(json.dumps(out, ensure_ascii=False, sort_keys=True), encoding="utf-8")
    print(json.dumps({
        "type": "tennis_reports_built",
        "cohorts": len(cohorts),
        "pooled_settled_n": pool["settled_n"],
        "pooled_roi_pct": pool["roi_pct"],
        "output": str(ROOT / "tennis_reports.json"),
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

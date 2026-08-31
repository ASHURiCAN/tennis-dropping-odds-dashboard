import { useMemo, useState } from "react";
import { useReport } from "@/lib/useReport";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { fmtPct } from "@/lib/types";
import type { Signal } from "@/lib/types";

function compute(sigs: Signal[]) {
  const n = sigs.length;
  const w = sigs.filter((s) => s.outcome === "win").length;
  const roi = n ? (sigs.reduce((a, s) => a + (s.roi_unit ?? 0), 0) / n) * 100 : null;
  return { n, w, wr: n ? (100 * w) / n : null, roi };
}

export function LabPage() {
  const { report } = useReport();
  const [dropMin, setDropMin] = useState<number>(10);
  const [bmMin, setBmMin] = useState<number>(5);
  const [excludeBig, setExcludeBig] = useState<boolean>(false);

  if (!report) return <div className="p-8 text-sm text-muted-foreground">Chargement…</div>;

  const base = report.pooled.signals;

  const filtered = useMemo(() => {
    let r = base;
    r = r.filter((s) => (s.drop_pct_median ?? 0) >= dropMin);
    r = r.filter((s) => (s.bookmaker_support ?? 0) >= bmMin);
    if (excludeBig) r = r.filter((s) => (s.closing_odds ?? 0) < 10);
    return r;
  }, [base, dropMin, bmMin, excludeBig]);

  const stats = useMemo(() => compute(filtered), [filtered]);
  const full = useMemo(() => compute(base), [base]);

  const Slider = ({ label, v, set, max, note }: { label: string; v: number; set: (n: number) => void; max: number; note?: string }) => (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs uppercase text-muted-foreground">{label}</div>
        <div className="mt-1 font-mono text-lg">{v}</div>
        <input type="range" min={0} max={max} value={v} onChange={(e) => set(Number(e.target.value))} className="mt-2 w-full accent-primary" />
        {note ? <div className="mt-1 text-[11px] text-muted-foreground">{note}</div> : null}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Slider label="Drop% médian min" v={dropMin} set={setDropMin} max={60} note="signal figé = 10" />
        <Slider label="Support bookmaker min" v={bmMin} set={setBmMin} max={20} note="signal figé = 5" />
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-muted-foreground">Exclure cote ≥ 10</div>
            <button
              onClick={() => setExcludeBig((x) => !x)}
              className={cn(
                "mt-2 w-full rounded-md border px-3 py-2 text-sm transition-colors",
                excludeBig ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
              )}
            >
              {excludeBig ? "Activé" : "Désactivé"}
            </button>
            <div className="mt-1 text-[11px] text-muted-foreground">retire les longshots extrêmes</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg">Sensibilité (OOS poolé)</CardTitle>
          <CardDescription>
            Re-filtrage des {full.n} paris OOS — pas de ré-optimisation. Montre comment durcir les critères déplace le ROI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <div className="text-xs uppercase text-muted-foreground">N paris</div>
              <div className="font-mono text-2xl tabular-nums">{stats.n}</div>
              <div className="text-[11px] text-muted-foreground">base: {full.n}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Win%</div>
              <div className="font-mono text-2xl tabular-nums">{stats.wr?.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">ROI%</div>
              <div className={cn("font-mono text-2xl tabular-nums", (stats.roi ?? 0) >= 0 ? "text-emerald-500" : "text-rose-500")}>
                {fmtPct(stats.roi)}
              </div>
              <div className="text-[11px] text-muted-foreground">base: {fmtPct(full.roi)}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Δ vs base</div>
              <div className="font-mono text-2xl tabular-nums">
                {stats.roi != null && full.roi != null ? `${stats.roi >= full.roi ? "+" : ""}${(stats.roi - full.roi).toFixed(1)}` : "—"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Le signal validé (été 2026) est figé à drop≥10 / BM≥5. Ce Lab ne fait que durcir ces seuils sur les
        données déjà collectées — il ne génère aucune nouvelle règle. Pour une vraie recherche de paramètres,
        relancer l'audit walk-forward sur le dataset brut (exclu du dépôt).
      </div>
    </div>
  );
}

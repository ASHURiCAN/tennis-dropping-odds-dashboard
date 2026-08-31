import { useMemo } from "react";
import { useReport } from "@/lib/useReport";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { fmtPct } from "@/lib/types";
import type { Signal } from "@/lib/types";

function roiOf(sigs: Signal[]) {
  const n = sigs.length;
  if (!n) return null;
  return (sigs.reduce((a, s) => a + (s.roi_unit ?? 0), 0) / n) * 100;
}

function cellColor(v: number | null) {
  if (v == null) return "bg-muted text-muted-foreground";
  if (v >= 0) return "bg-emerald-500/25 text-emerald-400";
  if (v > -8) return "bg-amber-500/20 text-amber-400";
  return "bg-rose-500/25 text-rose-400";
}

export function HeatmapPage() {
  const { report } = useReport();
  if (!report) return <div className="p-8 text-sm text-muted-foreground">Chargement…</div>;

  const cohorts = report.cohorts; // 12 OOS windows
  const bookmakers = useMemo(() => {
    const s = new Set<string>();
    cohorts.forEach((c) => c.signals.forEach((sig) => sig.top_bookmaker && s.add(sig.top_bookmaker)));
    return Array.from(s).sort();
  }, [cohorts]);

  // per (bookmaker, cohort) ROI
  const matrix = useMemo(() => {
    return bookmakers.map((b) => {
      const row: Record<string, number | null> = {};
      cohorts.forEach((c) => {
        const sigs = c.signals.filter((sig) => sig.top_bookmaker === b);
        row[c.label] = roiOf(sigs);
      });
      return { bookmaker: b, row };
    });
  }, [bookmakers, cohorts]);

  const byBook = useMemo(() => {
    return bookmakers
      .map((b) => {
        const sigs = cohorts.flatMap((c) => c.signals).filter((sig) => sig.top_bookmaker === b);
        return { bookmaker: b, n: sigs.length, roi: roiOf(sigs) };
      })
      .sort((a, b) => (a.roi ?? -1e9) - (b.roi ?? -1e9));
  }, [bookmakers, cohorts]);

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg">Heatmap · bookmaker × fenêtre OOS</CardTitle>
          <CardDescription>ROI% par bookmaker et par cohorte (mise unitaire). Rouge = sous-performant.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Bookmaker</th>
                {cohorts.map((c) => (
                  <th key={c.label} className="px-2 py-2 text-right font-medium">
                    {c.label.replace("OOS1 ", "").replace("OOS2 ", "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((m) => (
                <tr key={m.bookmaker} className="border-t border-border">
                  <td className="px-3 py-1.5 text-xs">{m.bookmaker}</td>
                  {cohorts.map((c) => {
                    const v = m.row[c.label];
                    return (
                      <td key={c.label} className={cn("px-1 py-1 text-center font-mono tabular-nums", cellColor(v))}>
                        {v == null ? "—" : v.toFixed(1)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg">Synthèse par bookmaker (OOS poolé)</CardTitle>
          <CardDescription>Trié par ROI%. Montre si certains books sont systématiquement meilleurs/menaces.</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Bookmaker</th>
                <th className="px-2 py-2 text-right font-medium">N</th>
                <th className="px-2 py-2 text-right font-medium">ROI%</th>
                <th className="px-2 py-2">Barre</th>
              </tr>
            </thead>
            <tbody>
              {byBook.map((b) => {
                const max = Math.max(...byBook.map((x) => Math.abs(x.roi ?? 0)), 1);
                return (
                  <tr key={b.bookmaker} className="border-t border-border">
                    <td className="px-3 py-1.5 text-xs">{b.bookmaker}</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums">{b.n}</td>
                    <td className={cn("px-2 py-1.5 text-right font-mono tabular-nums", (b.roi ?? 0) >= 0 ? "text-emerald-500" : "text-rose-500")}>
                      {fmtPct(b.roi)}
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="h-2.5 w-full rounded bg-muted">
                        <div className={cn("h-2.5 rounded", cellColor(b.roi))} style={{ width: `${Math.min(100, (Math.abs(b.roi ?? 0) / max) * 100)}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

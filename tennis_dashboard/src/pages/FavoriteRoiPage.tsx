import { useReport } from "@/lib/useReport";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { fmtCp, fmtPct } from "@/lib/types";

function roiColor(v: number | null | undefined): string {
  if (v == null) return "bg-muted";
  if (v >= 0) return "bg-emerald-500/20 text-emerald-400";
  if (v > -8) return "bg-amber-500/15 text-amber-400";
  return "bg-rose-500/20 text-rose-400";
}

export function FavoriteRoiPage() {
  const { report } = useReport();
  if (!report) return <div className="p-8 text-sm text-muted-foreground">Chargement…</div>;

  const rows = [report.pooled, ...report.cohorts];
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.roi_pct ?? 0)), 1);

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg">Favori-ROI par cohorte</CardTitle>
          <CardDescription>Win% et ROI% avec IC95 (Wilson win%, bootstrap ROI). Heatmap = intensité du ROI.</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Cohorte</th>
                <th className="px-2 py-2 text-right font-medium">N</th>
                <th className="px-2 py-2 text-right font-medium">Win%</th>
                <th className="px-2 py-2 font-medium text-right">IC95 win%</th>
                <th className="px-2 py-2 text-right font-medium">ROI%</th>
                <th className="px-2 py-2 font-medium">Heatmap</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-border">
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      {r.kind === "pooled" ? (
                        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] uppercase text-primary">pool</span>
                      ) : null}
                      {r.label}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums">{r.signal_count}</td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums">{r.win_rate_pct?.toFixed(1)}</td>
                  <td className="px-2 py-2 text-right font-mono text-[11px] text-muted-foreground">{fmtCp(r.win_rate_cp95)}</td>
                  <td className={cn("px-2 py-2 text-right font-mono tabular-nums", (r.roi_pct ?? 0) >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {fmtPct(r.roi_pct)}
                  </td>
                  <td className="px-2 py-2">
                    <div className="h-3 w-full rounded bg-muted">
                      <div
                        className={cn("h-3 rounded", roiColor(r.roi_pct))}
                        style={{ width: `${Math.min(100, (Math.abs(r.roi_pct ?? 0) / maxAbs) * 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-3">
        {[
          { k: "OOS1 (juin→août)", f: "oos1" },
          { k: "OOS2 (avril→juin)", f: "oos2" },
          { k: "Découverte", f: "discovery" },
        ].map((g) => {
          const cs = report.cohorts.filter((c) => c.kind === g.f);
          const avg = cs.reduce((a, c) => a + (c.roi_pct ?? 0), 0) / (cs.length || 1);
          return (
            <Card key={g.f}>
              <CardContent className="p-5">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{g.k}</div>
                <div className={cn("font-mono text-2xl tabular-nums", avg >= 0 ? "text-emerald-500" : "text-rose-500")}>
                  {fmtPct(avg)}
                </div>
                <div className="text-[11px] text-muted-foreground">{cs.length} fenêtres · ROI moyen</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

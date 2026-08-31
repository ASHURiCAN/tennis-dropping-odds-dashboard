import { useMemo } from "react";
import { useReport } from "@/lib/useReport";
import { useTennis } from "@/lib/store";
import { CohortStatCard, Equity } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { fmtPct, fmtSigned, type Cohort } from "@/lib/types";

function SignalsTable({ c }: { c: Cohort }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg">Signaux détaillés · {c.label}</CardTitle>
        <CardDescription>{c.signals.length} paris · cliquez les en-têtes pour trier (cote, drop, ROI)</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[420px] w-full">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-card text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Joueur</th>
                <th className="px-2 py-2 font-medium">Côté</th>
                <th className="px-2 py-2 text-right font-medium">Cote</th>
                <th className="px-2 py-2 text-right font-medium">Drop%</th>
                <th className="px-2 py-2 text-right font-medium">BM</th>
                <th className="px-2 py-2 font-medium">Book</th>
                <th className="px-2 py-2 font-medium">Issu</th>
                <th className="px-2 py-2 text-right font-medium">P&L</th>
              </tr>
            </thead>
            <tbody>
              {c.signals.map((s, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-3 py-1.5">{s.player ?? "—"}</td>
                  <td className="px-2 py-1.5 font-mono">{s.side ?? "—"}</td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums">{s.closing_odds?.toFixed(2)}</td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums">{s.drop_pct_median?.toFixed(1)}</td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums">{s.bookmaker_support}</td>
                  <td className="px-2 py-1.5 text-xs text-muted-foreground">{s.top_bookmaker}</td>
                  <td className={cn("px-2 py-1.5", s.outcome === "win" ? "text-emerald-500" : "text-rose-500")}>
                    {s.outcome === "win" ? "W" : "L"}
                  </td>
                  <td className={cn("px-2 py-1.5 text-right font-mono tabular-nums", (s.roi_unit ?? 0) >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {fmtSigned(s.roi_unit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export function OosPage() {
  const { report } = useReport();
  const { activeCohort, setActiveCohort } = useTennis();
  if (!report) return <div className="p-8 text-sm text-muted-foreground">Chargement…</div>;

  const oos = report.cohorts.filter((c) => c.kind !== "discovery");
  const selected =
    oos.find((c) => c.label === activeCohort) ?? oos.find((c) => c.kind === "oos1") ?? oos[0];

  const sorted = useMemo(() => [...oos].sort((a, b) => (a.start ?? "").localeCompare(b.start ?? "")), [oos]);

  return (
    <div className="space-y-6 p-6">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Fenêtres OOS</CardTitle>
            <CardDescription>{oos.length} cohortes · walk-forward chronologique</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[520px] w-full">
              <div className="space-y-1">
                {sorted.map((c) => {
                  const tone = (c.roi_pct ?? 0) > 0 ? "text-emerald-500" : "text-rose-500";
                  return (
                    <button
                      key={c.label}
                      onClick={() => setActiveCohort(c.label)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        selected.label === c.label ? "bg-primary/10 text-primary" : "hover:bg-muted",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-[10px] uppercase text-muted-foreground">{c.kind}</span>
                        {c.label}
                      </span>
                      <span className={cn("font-mono tabular-nums", tone)}>{fmtPct(c.roi_pct)}</span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <CohortStatCard c={selected} />
          <Equity data={selected.equity} title={`Equity · ${selected.label}`} />
          <SignalsTable c={selected} />
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useReport } from "@/lib/useReport";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { fmtPct, fmtSigned } from "@/lib/types";
import type { Cohort, Signal } from "@/lib/types";

type SortKey = "player" | "closing_odds" | "drop_pct_median" | "bookmaker_support" | "roi_unit";

function winRate(sigs: Signal[]) {
  const n = sigs.length;
  const w = sigs.filter((s) => s.outcome === "win").length;
  return { n, w, wr: n ? (100 * w) / n : null, roi: n ? (sigs.reduce((a, s) => a + (s.roi_unit ?? 0), 0) / n) * 100 : null };
}

export function SignalsExplorerPage() {
  const { report } = useReport();
  const [cohort, setCohort] = useState<string>("pooled");
  const [bookmaker, setBookmaker] = useState<string>("all");
  const [dropMin, setDropMin] = useState<number>(0);
  const [outcome, setOutcome] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("drop_pct_median");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const cohorts: Cohort[] = report ? [report.pooled, ...report.cohorts] : [];
  const selected = cohorts.find((c) => c.label === cohort) ?? report?.pooled;

  const bookmakers = useMemo(() => {
    if (!selected) return [];
    const s = new Set(selected.signals.map((s) => s.top_bookmaker).filter(Boolean) as string[]);
    return Array.from(s).sort();
  }, [selected]);

  const filtered = useMemo(() => {
    if (!selected) return [];
    let r = selected.signals;
    if (bookmaker !== "all") r = r.filter((s) => s.top_bookmaker === bookmaker);
    if (dropMin > 0) r = r.filter((s) => (s.drop_pct_median ?? 0) >= dropMin);
    if (outcome !== "all") r = r.filter((s) => s.outcome === outcome);
    r = [...r].sort((a, b) => {
      const va = sortKey === "player" ? (a.player ?? "") : (a[sortKey as keyof Signal] as number) ?? 0;
      const vb = sortKey === "player" ? (b.player ?? "") : (b[sortKey as keyof Signal] as number) ?? 0;
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return r;
  }, [selected, bookmaker, dropMin, outcome, sortKey, sortDir]);

  const stats = useMemo(() => winRate(filtered), [filtered]);

  if (!report) return <div className="p-8 text-sm text-muted-foreground">Chargement…</div>;

  const SortHead = ({ k, label }: { k: SortKey; label: string }) => (
    <th
      className="px-2 py-2 cursor-pointer select-none font-medium hover:text-foreground"
      onClick={() => {
        if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else {
          setSortKey(k);
          setSortDir("desc");
        }
      }}
    >
      {label}
      {sortKey === k ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
    </th>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-muted-foreground">Cohorte</div>
            <select
              value={cohort}
              onChange={(e) => setCohort(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            >
              {cohorts.map((c) => (
                <option key={c.label} value={c.label}>
                  {c.label}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-muted-foreground">Bookmaker</div>
            <select
              value={bookmaker}
              onChange={(e) => setBookmaker(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            >
              <option value="all">Tous</option>
              {bookmakers.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-muted-foreground">Drop% min : {dropMin}</div>
            <input
              type="range"
              min={0}
              max={80}
              value={dropMin}
              onChange={(e) => setDropMin(Number(e.target.value))}
              className="mt-2 w-full accent-primary"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-muted-foreground">Issue</div>
            <div className="mt-1 flex gap-1">
              {["all", "win", "loss"].map((o) => (
                <button
                  key={o}
                  onClick={() => setOutcome(o)}
                  className={cn(
                    "flex-1 rounded-md border px-2 py-1.5 text-xs capitalize transition-colors",
                    outcome === o ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
                  )}
                >
                  {o === "all" ? "Toutes" : o === "win" ? "Gagnées" : "Perdues"}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg">Filtre live</CardTitle>
          <CardDescription>
            {stats.n} paris · win {stats.wr?.toFixed(1)}% · ROI {fmtPct(stats.roi)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[460px] w-full">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-card text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <SortHead k="player" label="Joueur" />
                  <th className="px-2 py-2">Côté</th>
                  <SortHead k="closing_odds" label="Cote" />
                  <SortHead k="drop_pct_median" label="Drop%" />
                  <SortHead k="bookmaker_support" label="BM" />
                  <th className="px-2 py-2">Book</th>
                  <th className="px-2 py-2">Issu</th>
                  <SortHead k="roi_unit" label="P&L" />
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 600).map((s, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-2 py-1.5">{s.player ?? "—"}</td>
                    <td className="px-2 py-1.5 font-mono">{s.side}</td>
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
            {filtered.length > 600 && (
              <div className="py-2 text-center text-xs text-muted-foreground">
                + {filtered.length - 600} paris (affichage limité à 600)
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

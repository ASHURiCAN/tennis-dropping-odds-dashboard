import { useReport } from "@/lib/useReport";
import { CohortStatCard, Equity } from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DiscoveryPage() {
  const { report } = useReport();
  if (!report) return <div className="p-8 text-sm text-muted-foreground">Chargement…</div>;
  const disc = report.cohorts.find((c) => c.kind === "discovery")!;
  const others = report.cohorts.filter((c) => c.kind !== "discovery");

  return (
    <div className="space-y-6 p-6">
      <CohortStatCard c={disc} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Equity data={disc.equity} title="Equity · Découverte (in-sample)" />
        <Card>
          <CardContent className="p-6">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Contexte</div>
            <p className="mt-2 text-sm text-muted-foreground">{report.meta.signal}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline">scope: {report.meta.scope}</Badge>
              <Badge variant="outline">
                closing≥{report.meta.params.closing_odds_underdog_min} · drop≥
                {report.meta.params.drop_pct_median_min}% · BM≥{report.meta.params.bookmaker_support_min}
              </Badge>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Fenêtres OOS suivantes : <span className="font-mono">{others.length}</span>. Le signal est figé
              sur la découverte et appliqué tel-quel (walk-forward strict).
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

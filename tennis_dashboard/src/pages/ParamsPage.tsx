import { useReport } from "@/lib/useReport";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ParamsPage() {
  const { report } = useReport();
  if (!report) return <div className="p-8 text-sm text-muted-foreground">Chargement…</div>;
  const m = report.meta;

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg">Signal figé (été 2026)</CardTitle>
          <CardDescription>Ne pas ré-optimiser. Appliqué tel-quel en OOS.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Règle</div>
            <p className="mt-1 text-sm">{m.signal}</p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Paramètres</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(m.params).map(([k, v]) => (
                <Badge key={k} variant="secondary" className="font-mono">
                  {k} = {v}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Périmètre</div>
            <p className="mt-1 text-sm text-muted-foreground">{m.scope}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            {m.note}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

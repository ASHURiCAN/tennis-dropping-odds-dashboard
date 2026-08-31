import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { fmtCp, fmtPct, fmtSigned, type Cohort, type EquityPoint } from "@/lib/types";

export function Stat({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: string;
  tone?: "win" | "loss" | "neutral";
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-mono text-lg tabular-nums",
          tone === "win" && "text-emerald-500",
          tone === "loss" && "text-rose-500",
          tone === "neutral" && "text-foreground",
        )}
      >
        {value}
      </span>
      {sub ? <span className="font-mono text-[11px] text-muted-foreground">{sub}</span> : null}
    </div>
  );
}

export function Equity({ data, title, height = 256 }: { data: EquityPoint[]; title: string; height?: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg">{title}</CardTitle>
        <CardDescription>Courbe d'equity cumulée (mise unitaire, cote réelle du favori)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--foreground) / 0.08)" vertical={false} />
              <XAxis dataKey="i" hide />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(v: number) => v.toFixed(0)}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v) => [fmtSigned(Number(v)), "P&L"]}
                labelFormatter={(l) => `signal #${l}`}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Line type="monotone" dataKey="pnl" stroke="hsl(var(--primary))" dot={false} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function CohortStatCard({ c }: { c: Cohort }) {
  const tone = (c.roi_pct ?? 0) > 0 ? "win" : "loss";
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Cohorte" value={c.label} tone="neutral" />
        <Stat label="Signaux" value={String(c.signal_count)} tone="neutral" sub={`${c.settled_n} settlés`} />
        <Stat label="Win%" value={c.win_rate_pct?.toFixed(1) ?? "—"} tone="neutral" sub={fmtCp(c.win_rate_cp95)} />
        <Stat
          label="ROI%"
          value={fmtPct(c.roi_pct)}
          tone={tone}
          sub={c.roi_cp95 ? `IC95 ${c.roi_cp95.lower.toFixed(1)} / ${c.roi_cp95.upper.toFixed(1)}` : "—"}
        />
        <Stat label="P&L unités" value={fmtSigned(c.roi_unit)} tone={tone} />
        <Stat label="Parse err" value={String(c.parse_errors ?? 0)} tone="neutral" sub={`${c.match_count} matchs`} />
      </CardContent>
    </Card>
  );
}

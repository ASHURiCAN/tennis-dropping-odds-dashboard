export type Cp95 = { lower: number; upper: number } | null;

export interface Signal {
  player: string | null;
  side: string | null;
  closing_odds: number | null;
  drop_pct_median: number | null;
  bookmaker_support: number | null;
  top_bookmaker: string | null;
  outcome: string | null;
  roi_unit: number | null;
}

export interface EquityPoint {
  i: number;
  pnl: number;
  date: string;
  event: string;
}

export interface Cohort {
  label: string;
  kind: string;
  window?: string;
  start?: string;
  end?: string;
  match_count?: number;
  parse_errors?: number;
  flagged_match_count?: number;
  signal_count?: number;
  win_count?: number;
  loss_count?: number;
  win_rate_pct?: number;
  roi_unit?: number;
  roi_pct?: number;
  win_rate_cp95: Cp95;
  roi_cp95: Cp95;
  equity: EquityPoint[];
  signals: Signal[];
  settled_n: number;
}

export interface Meta {
  project: string;
  signal: string;
  params: Record<string, number>;
  scope: string;
  note: string;
}

export interface Report {
  meta: Meta;
  cohorts: Cohort[];
  pooled: Cohort;
}

export const fmtPct = (v: number | null | undefined) =>
  v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
export const fmtSigned = (v: number | null | undefined) =>
  v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(2)}`;
export const fmtCp = (c: Cp95) => (c ? `±[${c.lower.toFixed(1)}, ${c.upper.toFixed(1)}]` : "—");

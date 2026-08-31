import { useEffect, useState } from "react";
import type { Report } from "./types";

export function useReport() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const embedded = (window as unknown as { __TENNIS_REPORT__?: Report }).__TENNIS_REPORT__;
    if (embedded) {
      setReport(embedded);
      return;
    }
    fetch("/tennis_reports.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: Report) => setReport(d))
      .catch((e) => setError(e instanceof Error ? e.message : "load failed"));
  }, []);

  return { report, error };
}

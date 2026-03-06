import type { PerformanceMetrics } from "@/lib/sentinelle-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge } from "lucide-react";

function metricColor(ms: number | undefined): string {
  if (ms == null) return "text-muted-foreground";
  if (ms < 1000) return "text-status-pass";
  if (ms < 3000) return "text-status-pending";
  return "text-status-fail";
}

function formatMs(ms: number | undefined): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

interface Props {
  metrics: Record<string, PerformanceMetrics>;
}

export function PerformanceMetricsCard({ metrics }: Props) {
  const entries = Object.entries(metrics);
  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-mono text-sm uppercase tracking-wider flex items-center gap-1.5">
          <Gauge className="h-3.5 w-3.5" /> Performance ({entries.length} page{entries.length > 1 ? "s" : ""})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-xs">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">Page</th>
                <th className="pb-2 pr-4">Load</th>
                <th className="pb-2 pr-4">FCP</th>
                <th className="pb-2 pr-4">DOM Ready</th>
                <th className="pb-2 pr-4">Ressources</th>
                <th className="pb-2">Taille</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([url, m]) => {
                // Show only the pathname for readability
                let label: string;
                try {
                  label = new URL(url).pathname;
                } catch {
                  label = url;
                }
                return (
                  <tr key={url} className="border-b border-border/50">
                    <td className="py-2 pr-4 max-w-[200px] truncate" title={url}>
                      {label}
                    </td>
                    <td className={`py-2 pr-4 ${metricColor(m.loaded)}`}>
                      {formatMs(m.loaded)}
                    </td>
                    <td className={`py-2 pr-4 ${metricColor(m.firstContentfulPaint)}`}>
                      {formatMs(m.firstContentfulPaint)}
                    </td>
                    <td className={`py-2 pr-4 ${metricColor(m.domContentLoaded)}`}>
                      {formatMs(m.domContentLoaded)}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {m.resourceCount ?? "—"}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {m.totalTransferSizeKB != null ? `${Math.round(m.totalTransferSizeKB)} KB` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

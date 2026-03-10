import type { PerformanceMetrics as PerfMetrics } from "@/lib/sentinelle-types";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";

function perfColor(ms: number): string {
  if (ms < 2000) return "text-status-safe";
  if (ms < 4000) return "text-status-alerte";
  return "text-status-erreur";
}

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

interface MetricRowProps {
  label: string;
  value: number | undefined;
}

function MetricRow({ label, value }: MetricRowProps) {
  if (value == null) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-xs font-mono font-medium", perfColor(value))}>
        {formatMs(value)}
      </span>
    </div>
  );
}

interface PerformanceMetricsProps {
  metrics: Record<string, PerfMetrics>;
}

export function PerformanceMetrics({ metrics }: PerformanceMetricsProps) {
  const entries = Object.entries(metrics);
  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Performance
        </span>
      </div>
      <div className="grid gap-2">
        {entries.map(([url, m]) => {
          const shortUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
          return (
            <div key={url} className="rounded-lg border border-border bg-background/50 p-3 space-y-2">
              <p className="text-xs font-mono text-muted-foreground truncate" title={url}>
                {shortUrl}
              </p>
              <div className="space-y-1">
                <MetricRow label="First Contentful Paint" value={m.firstContentfulPaint} />
                <MetricRow label="DOM Content Loaded" value={m.domContentLoaded} />
                <MetricRow label="Page chargée" value={m.loaded} />
                <MetricRow label="DOM Interactive" value={m.domInteractive} />
              </div>
              {(m.resourceCount != null || m.totalTransferSizeKB != null) && (
                <div className="flex items-center gap-3 pt-1 border-t border-border">
                  {m.resourceCount != null && (
                    <span className="text-[11px] text-muted-foreground">
                      {m.resourceCount} ressources
                    </span>
                  )}
                  {m.totalTransferSizeKB != null && (
                    <span className="text-[11px] text-muted-foreground">
                      {m.totalTransferSizeKB.toFixed(0)} KB
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

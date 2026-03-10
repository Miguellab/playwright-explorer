import { XCircle, AlertTriangle, Clock } from "lucide-react";
import type { VerdictIssue } from "@/lib/sentinelle-types";
import { cn } from "@/lib/utils";

const SEVERITY_CONFIG = {
  critical: {
    icon: XCircle,
    textClass: "text-status-erreur",
    bgClass: "bg-status-erreur/5 border-status-erreur/20",
  },
  warning: {
    icon: AlertTriangle,
    textClass: "text-status-alerte",
    bgClass: "bg-status-alerte/5 border-status-alerte/20",
  },
  pending: {
    icon: Clock,
    textClass: "text-blue-400",
    bgClass: "bg-blue-500/5 border-blue-500/20",
  },
};

interface VerdictIssuesProps {
  issues: VerdictIssue[];
}

export function VerdictIssues({ issues }: VerdictIssuesProps) {
  if (!issues || issues.length === 0) return null;

  return (
    <div className="space-y-2">
      {issues.map((issue, i) => {
        const config = SEVERITY_CONFIG[issue.severity] ?? SEVERITY_CONFIG.pending;
        const Icon = config.icon;
        return (
          <div
            key={i}
            className={cn("rounded-lg border p-3 space-y-1", config.bgClass)}
          >
            <div className="flex items-start gap-2">
              <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", config.textClass)} />
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{issue.message}</p>
                {issue.action && (
                  <p className="text-xs text-muted-foreground italic">{issue.action}</p>
                )}
                {issue.details && issue.details.length > 0 && (
                  <ul className="text-xs text-muted-foreground list-disc ml-4 space-y-0.5">
                    {issue.details.map((d, j) => (
                      <li key={j}>{d}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

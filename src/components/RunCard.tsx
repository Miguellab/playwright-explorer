import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VerdictBadge } from "@/components/VerdictBadge";
import { MainFlowSteps } from "@/components/MainFlowSteps";
import { EvidenceViewer } from "@/components/EvidenceViewer";
import { RunFindings } from "@/components/RunFindings";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import type { Run } from "@/lib/sentinelle-types";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  RotateCcw,
  AlertCircle,
  ImageOff,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RunCardProps {
  run: Run;
  isMainFlow: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onRetest: (flowId: string) => void;
  retesting: boolean;
  /** Compact mode: single-line card for passed runs, no expand */
  compact?: boolean;
  /** Category badge to display */
  typeBadge?: { label: string; className: string };
  /** Category-specific status message */
  statusMessage?: string;
}

function statusToVerdict(status: string) {
  if (status === "passed") return "OK" as const;
  if (status === "failed" || status === "error") return "ERREUR" as const;
  return "PENDING" as const;
}

function isErrorStatus(status: string) {
  return status === "failed" || status === "error";
}

export function RunCard({
  run,
  isMainFlow,
  isExpanded,
  onToggle,
  onRetest,
  retesting,
  compact,
  typeBadge,
  statusMessage,
}: RunCardProps) {
  const hasError = isErrorStatus(run.status);
  const hasScreenshots = run.assets?.screenshots && run.assets.screenshots.length > 0;

  // Compact mode for passed runs
  if (compact && run.status === "passed") {
    return (
      <div
        id={run.id}
        className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-muted/20 transition-colors"
      >
        <CheckCircle className="h-4 w-4 text-status-safe shrink-0" />
        <span className="text-sm font-medium truncate">{run.flowLabel || "Parcours"}</span>
        {typeBadge && (
          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0", typeBadge.className)}>
            {typeBadge.label}
          </span>
        )}
        <span className="text-xs text-muted-foreground truncate ml-auto">
          {statusMessage || "OK"}
        </span>
        {run.durationMs != null && run.durationMs > 0 && (
          <span className="text-xs text-muted-foreground font-mono shrink-0">
            {run.durationMs > 1000 ? `${(run.durationMs / 1000).toFixed(1)}s` : `${run.durationMs}ms`}
          </span>
        )}
      </div>
    );
  }

  return (
    <Card
      id={run.id}
      className={cn(
        "border-border bg-surface",
        hasError && "border-status-erreur/30"
      )}
    >
      <CardContent className="p-0">
        {/* Header */}
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
          onClick={onToggle}
        >
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            {isMainFlow && (
              <span className="text-xs font-medium text-neon bg-neon/10 rounded px-2 py-0.5">
                Parcours principal
              </span>
            )}
            {typeBadge && (
              <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded border", typeBadge.className)}>
                {typeBadge.label}
              </span>
            )}
            <span className="text-sm font-medium">{run.flowLabel || "Parcours"}</span>
            {statusMessage && (
              <span className="text-xs text-muted-foreground hidden sm:inline">— {statusMessage}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {run.durationMs != null && run.durationMs > 0 && (
              <span className="text-xs text-muted-foreground font-mono">
                {run.durationMs > 1000 ? `${(run.durationMs / 1000).toFixed(1)}s` : `${run.durationMs}ms`}
              </span>
            )}
            <VerdictBadge verdict={statusToVerdict(run.status)} />
          </div>
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
            {/* Error summary block */}
            {hasError && (
              <div className="rounded-lg border border-status-erreur/20 bg-status-erreur/5 p-3 space-y-1.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-status-erreur shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {run.errorSummary || "Le parcours a échoué."}
                    </p>
                    {run.failedStepName && (
                      <p className="text-xs text-muted-foreground">
                        Erreur détectée sur : <span className="text-foreground font-medium">{run.failedStepName}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Steps */}
            <MainFlowSteps
              steps={run.steps || []}
              stepsSummary={run.stepsSummary}
              findings={run.findings}
            />

            {/* Screenshots */}
            {hasScreenshots ? (
              <EvidenceViewer screenshots={run.assets!.screenshots!} />
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                <ImageOff className="h-3.5 w-3.5" />
                Aucune capture disponible
              </div>
            )}

            {/* Findings */}
            <RunFindings findings={run.findings} />

            {/* Performance */}
            {run.findings?.performanceMetrics && Object.keys(run.findings.performanceMetrics).length > 0 && (
              <PerformanceMetrics metrics={run.findings.performanceMetrics} />
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => run.flowId && onRetest(run.flowId)}
                disabled={retesting || !run.flowId}
              >
                {retesting ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <RotateCcw className="h-3 w-3 mr-1" />
                )}
                Relancer
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

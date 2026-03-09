import { CheckCircle, XCircle, Clock, Loader2, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RunStep, StepsSummary, Findings } from "@/lib/sentinelle-types";

interface MainFlowStepsProps {
  steps: RunStep[];
  stepsSummary?: StepsSummary | null;
  findings?: Findings | null;
  className?: string;
}

function getMetricCount(step: RunStep, findings?: Findings | null): number | null {
  const name = (step.label || step.name).toLowerCase();
  if (name.includes("console")) return findings?.consoleErrors?.length ?? 0;
  if (name.includes("requête") || name.includes("request"))
    return findings?.failedRequests?.filter(r => r.status >= 400 || r.status === 0).length ?? 0;
  return null;
}

function metricCountColor(count: number): string {
  if (count === 0) return "text-status-safe";
  if (count <= 2) return "text-status-alerte";
  return "text-status-erreur";
}

function stepIcon(status: string) {
  switch (status) {
    case "passed":
    case "pass":
      return <CheckCircle className="h-4 w-4 text-status-safe shrink-0" />;
    case "failed":
    case "fail":
      return <XCircle className="h-4 w-4 text-status-erreur shrink-0" />;
    case "running":
      return <Loader2 className="h-4 w-4 text-status-running animate-spin shrink-0" />;
    case "skipped":
      return <Minus className="h-4 w-4 text-muted-foreground shrink-0" />;
    default:
      return <Clock className="h-4 w-4 text-status-pending shrink-0" />;
  }
}

function isFailed(status: string) {
  return status === "failed" || status === "fail";
}

export function MainFlowSteps({ steps, stepsSummary, findings, className }: MainFlowStepsProps) {
  if (!steps || steps.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">Aucune étape détaillée disponible</p>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {steps.map((step, i) => (
        <div key={i}>
          <div
            className={cn(
              "flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors",
              isFailed(step.status) && "bg-status-erreur/5 border-l-2 border-status-erreur"
            )}
          >
            {stepIcon(step.status)}
            <span className={cn("text-sm text-foreground", isFailed(step.status) && "font-medium")}>
              {step.label || step.name}
            </span>
            {step.durationMs != null && step.durationMs > 0 && (
              <span className="text-xs text-muted-foreground ml-auto font-mono">
                {step.durationMs > 1000 ? `${(step.durationMs / 1000).toFixed(1)}s` : `${step.durationMs}ms`}
              </span>
            )}
          </div>
          {isFailed(step.status) && step.detail && (
            <div className="ml-9 mt-1 mb-1 px-2 py-1.5 rounded bg-status-erreur/5 border border-status-erreur/15">
              <code className="text-xs text-foreground/80 break-all">{step.detail}</code>
            </div>
          )}
        </div>
      ))}

      {stepsSummary && (
        <div className="flex items-center gap-2 pt-2 mt-1 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {stepsSummary.passed}/{stepsSummary.total} réussie{stepsSummary.passed > 1 ? "s" : ""}
            {stepsSummary.failed > 0 && (
              <span className="text-status-erreur"> — {stepsSummary.failed} en échec</span>
            )}
            {stepsSummary.skipped > 0 && (
              <span> — {stepsSummary.skipped} ignorée{stepsSummary.skipped > 1 ? "s" : ""}</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

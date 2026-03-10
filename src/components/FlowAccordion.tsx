import { useState } from "react";
import { CheckCircle, AlertTriangle, XCircle, Loader2, ChevronDown, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MainFlowSteps } from "@/components/MainFlowSteps";
import { EvidenceViewer } from "@/components/EvidenceViewer";
import { RunFindings } from "@/components/RunFindings";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { VerdictBadge } from "@/components/VerdictBadge";
import { Button } from "@/components/ui/button";
import { getCheckType, CHECK_TYPE_META } from "@/lib/flow-categories";
import { runSingleFlow } from "@/lib/sentinelle-api";
import type { SuggestedFlow, Run } from "@/lib/sentinelle-types";

type FlowVerdict = "OK" | "ALERTE" | "ERREUR" | "PENDING";

function runToVerdict(run?: Run): FlowVerdict {
  if (!run) return "PENDING";
  if (run.status === "passed") return "OK";
  if (run.status === "failed") return "ALERTE";
  if (run.status === "error") return "ERREUR";
  return "PENDING";
}

function defaultOpen(verdict: FlowVerdict): boolean {
  return verdict === "ERREUR" || verdict === "ALERTE";
}

interface FlowAccordionProps {
  flow: SuggestedFlow;
  run?: Run;
  isMainFlow?: boolean;
  projectId?: string;
  onRetestComplete?: () => void;
  disabled?: boolean;
}

export function FlowAccordion({ flow, run, isMainFlow, projectId, onRetestComplete, disabled }: FlowAccordionProps) {
  const verdict = runToVerdict(run);
  const [open, setOpen] = useState(defaultOpen(verdict));
  const [retesting, setRetesting] = useState(false);
  const checkType = getCheckType(flow);
  const typeMeta = CHECK_TYPE_META[checkType];
  const isPageCheck = checkType === "page-check";

  const stepsCount = run?.stepsSummary?.total ?? run?.steps?.length ?? 0;
  const passedCount = run?.stepsSummary?.passed ?? 0;
  const hasSteps = run?.steps && run.steps.length > 0;
  const hasScreenshots = run?.assets?.screenshots && run.assets.screenshots.length > 0;
  const hasFindings = run?.findings && (
    (run.findings.consoleErrors?.length ?? 0) > 0 ||
    (run.findings.failedRequests?.filter(r => r.status >= 400 || r.status === 0).length ?? 0) > 0
  );
  const hasPerfMetrics = run?.findings?.performanceMetrics && Object.keys(run.findings.performanceMetrics).length > 0;
  const hasDetails = hasSteps || hasScreenshots || hasFindings || hasPerfMetrics;
  const canRetest = projectId && (verdict === "ALERTE" || verdict === "ERREUR") && !retesting && !disabled;

  const handleRetest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectId) return;
    setRetesting(true);
    try {
      await runSingleFlow(projectId, flow.id);
      onRetestComplete?.();
    } catch {
      // silently fail
    } finally {
      setRetesting(false);
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "rounded-lg border bg-surface transition-colors",
          verdict === "ERREUR" && "border-status-erreur/30",
          verdict === "ALERTE" && "border-status-alerte/30",
          verdict === "OK" && "border-border",
          verdict === "PENDING" && "border-border"
        )}
      >
        {/* Header */}
        <CollapsibleTrigger asChild disabled={!hasDetails && verdict === "PENDING"}>
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-3 p-4 text-left",
              hasDetails && "cursor-pointer hover:bg-muted/30 transition-colors"
            )}
          >
            {verdict === "OK" && <CheckCircle className="h-4 w-4 text-status-safe shrink-0" />}
            {verdict === "ALERTE" && <AlertTriangle className="h-4 w-4 text-status-alerte shrink-0" />}
            {verdict === "ERREUR" && <XCircle className="h-4 w-4 text-status-erreur shrink-0" />}
            {verdict === "PENDING" && <Loader2 className="h-4 w-4 text-status-pending animate-spin shrink-0" />}

            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium block truncate">
                {flow.labelFr || flow.goal}
              </span>
              <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded border inline-block mt-0.5", typeMeta.badgeClass)}>
                {typeMeta.badgeLabel}
              </span>
              {verdict === "OK" && isPageCheck && (
                <span className="text-xs text-muted-foreground block mt-0.5">
                  Page accessible — Aucune erreur détectée
                </span>
              )}
              {verdict === "OK" && !isPageCheck && stepsCount > 0 && (
                <span className="text-xs text-muted-foreground block mt-0.5">
                  {passedCount}/{stepsCount} étapes validées
                </span>
              )}
              {verdict === "PENDING" && run && (
                <span className="text-xs text-muted-foreground block mt-0.5">En cours…</span>
              )}
              {(verdict === "ERREUR" || verdict === "ALERTE") && run?.errorSummary && (
                <span className="text-xs text-status-erreur block mt-0.5">
                  {run.errorSummary}
                </span>
              )}
              {(verdict === "ERREUR" || verdict === "ALERTE") && run?.failedStepName && (
                <span className="text-[11px] text-status-erreur/80 block mt-0.5">
                  Étape : {run.failedStepName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {canRetest && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={handleRetest}
                  disabled={retesting}
                >
                  {retesting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3 w-3" />
                  )}
                </Button>
              )}
              <VerdictBadge verdict={verdict} size="sm" />
              {hasDetails && (
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200",
                    open && "rotate-180"
                  )}
                />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Expandable content */}
        {hasDetails && (
          <CollapsibleContent>
            <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
              {hasSteps && (
                <MainFlowSteps
                  steps={run!.steps}
                  stepsSummary={run!.stepsSummary}
                  findings={run?.findings}
                />
              )}
              {hasScreenshots && (
                <EvidenceViewer screenshots={run!.assets!.screenshots!} />
              )}
              {hasFindings && (
                <RunFindings findings={run!.findings} />
              )}
              {hasPerfMetrics && (
                <PerformanceMetrics metrics={run!.findings.performanceMetrics!} />
              )}
            </div>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}

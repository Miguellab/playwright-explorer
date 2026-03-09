import { useState } from "react";
import { CheckCircle, AlertTriangle, XCircle, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MainFlowSteps } from "@/components/MainFlowSteps";
import { EvidenceViewer } from "@/components/EvidenceViewer";
import { RunFindings } from "@/components/RunFindings";
import { VerdictBadge } from "@/components/VerdictBadge";
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
}

export function FlowAccordion({ flow, run, isMainFlow }: FlowAccordionProps) {
  const verdict = runToVerdict(run);
  const [open, setOpen] = useState(defaultOpen(verdict));

  const stepsCount = run?.stepsSummary?.total ?? run?.steps?.length ?? 0;
  const passedCount = run?.stepsSummary?.passed ?? 0;
  const hasSteps = run?.steps && run.steps.length > 0;
  const hasScreenshots = run?.assets?.screenshots && run.assets.screenshots.length > 0;
  const hasFindings = run?.findings && (
    (run.findings.consoleErrors?.length ?? 0) > 0 ||
    (run.findings.failedRequests?.filter(r => r.status >= 400 || r.status === 0).length ?? 0) > 0
  );
  const hasDetails = hasSteps || hasScreenshots || hasFindings;

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
        {/* Header — always visible */}
        <CollapsibleTrigger asChild disabled={!hasDetails && verdict === "PENDING"}>
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-3 p-4 text-left",
              hasDetails && "cursor-pointer hover:bg-muted/30 transition-colors"
            )}
          >
            {/* Verdict icon */}
            {verdict === "OK" && <CheckCircle className="h-4 w-4 text-status-safe shrink-0" />}
            {verdict === "ALERTE" && <AlertTriangle className="h-4 w-4 text-status-alerte shrink-0" />}
            {verdict === "ERREUR" && <XCircle className="h-4 w-4 text-status-erreur shrink-0" />}
            {verdict === "PENDING" && <Loader2 className="h-4 w-4 text-status-pending animate-spin shrink-0" />}

            {/* Flow name + summary */}
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium block truncate">
                {flow.labelFr || flow.goal}
              </span>
              {verdict === "OK" && stepsCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {passedCount}/{stepsCount} étapes validées
                </span>
              )}
              {verdict === "PENDING" && run && (
                <span className="text-xs text-muted-foreground">En cours…</span>
              )}
              {(verdict === "ERREUR" || verdict === "ALERTE") && run?.errorSummary && (
                <span className="text-xs text-status-erreur block mt-0.5">
                  {run.errorSummary}
                </span>
              )}
            </div>

            {/* Badge */}
            <VerdictBadge verdict={verdict} size="sm" />

            {/* Chevron */}
            {hasDetails && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200",
                  open && "rotate-180"
                )}
              />
            )}
          </button>
        </CollapsibleTrigger>

        {/* Expandable content */}
        {hasDetails && (
          <CollapsibleContent>
            <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
              {/* Steps */}
              {hasSteps && (
                <MainFlowSteps
                  steps={run!.steps}
                  stepsSummary={run!.stepsSummary}
                />
              )}

              {/* Screenshots */}
              {hasScreenshots && (
                <EvidenceViewer screenshots={run!.assets!.screenshots!} />
              )}

              {/* Console errors & failed requests */}
              {hasFindings && (
                <RunFindings findings={run!.findings} />
              )}
            </div>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}

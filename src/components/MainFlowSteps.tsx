import { CheckCircle, XCircle, Clock, Loader2, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RunStep } from "@/lib/sentinelle-types";

interface MainFlowStepsProps {
  steps: RunStep[];
  className?: string;
}

function stepIcon(status: string) {
  switch (status) {
    case "passed":
    case "pass":
      return <CheckCircle className="h-4 w-4 text-status-safe" />;
    case "failed":
    case "fail":
      return <XCircle className="h-4 w-4 text-status-erreur" />;
    case "running":
      return <Loader2 className="h-4 w-4 text-status-running animate-spin" />;
    case "skipped":
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Clock className="h-4 w-4 text-status-pending" />;
  }
}

export function MainFlowSteps({ steps, className }: MainFlowStepsProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className={cn("space-y-1.5", className)}>
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-3">
          {stepIcon(step.status)}
          <span className="text-sm text-foreground">{step.label}</span>
          {step.durationMs && step.durationMs > 0 && (
            <span className="text-xs text-muted-foreground ml-auto font-mono">
              {step.durationMs > 1000 ? `${(step.durationMs / 1000).toFixed(1)}s` : `${step.durationMs}ms`}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

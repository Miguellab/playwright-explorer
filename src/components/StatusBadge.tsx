import { cn } from "@/lib/utils";
import type { RunStatus, StepStatus } from "@/lib/types";

const statusConfig: Record<string, { label: string; className: string }> = {
  pass: { label: "PASS", className: "bg-status-pass/15 text-status-pass border-status-pass/30" },
  passed: { label: "PASSED", className: "bg-status-pass/15 text-status-pass border-status-pass/30" },
  fail: { label: "FAIL", className: "bg-status-fail/15 text-status-fail border-status-fail/30" },
  failed: { label: "FAILED", className: "bg-status-fail/15 text-status-fail border-status-fail/30" },
  skipped: { label: "SKIPPED", className: "bg-status-skipped/15 text-status-skipped border-status-skipped/30" },
  running: { label: "RUNNING", className: "bg-status-running/15 text-status-running border-status-running/30" },
  queued: { label: "QUEUED", className: "bg-status-queued/15 text-status-queued border-status-queued/30" },
};

export function StatusBadge({ status }: { status: RunStatus | StepStatus }) {
  const config = statusConfig[status] || statusConfig.queued;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wider", config.className)}>
      {status === "running" && <span className="h-1.5 w-1.5 rounded-full bg-status-running animate-pulse-dot" />}
      {config.label}
    </span>
  );
}

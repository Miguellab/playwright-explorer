// ── Sentinelle MVP Types ──

export type RunStatus = "queued" | "running" | "passed" | "failed" | "error";
export type StepStatus = "passed" | "failed" | "skipped" | "running";
export type Trigger = "release_detected" | "manual" | "scheduled" | "deploy_webhook" | "discovery";
export type IssueSeverity = "critical" | "warning";

export interface RunAssets {
  reportUrl?: string;
  screenshots?: { label: string; filename: string; path: string }[];
}

export interface Run {
  id: string;
  projectId: string;
  trigger: Trigger;
  releaseSignature?: string;
  flowId?: string;
  flowLabel?: string;
  status: RunStatus;
  runnerRunId?: string;
  runnerStatus?: string;
  steps: RunStep[];
  findings: Findings;
  assets?: RunAssets;
  error: string | null;
  durationMs: number | null;
  startedAt: string | null;
  finishedAt: string | null;
}

// ── Onboarding state ──

export interface TestNowResponse {
  runs: { runId: string; flow: string; flowId: string; status: string }[];
  message: string;
}

export interface OnboardingData {
  siteUrl: string;
  name: string;
  checkFrequencyMin: number;
  maxRunsPerDay: number;
  autoTest: boolean;
}

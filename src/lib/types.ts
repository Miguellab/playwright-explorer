export type RunStatus = 'queued' | 'running' | 'passed' | 'failed';
export type StepStatus = 'pass' | 'fail' | 'skipped';

export interface TestStep {
  name: string;
  status: StepStatus;
  durationMs: number;
  note: string | null;
  screenshotUrl: string | null;
}

export interface ConsoleError {
  message: string;
  location: string | null;
}

export interface FailedRequest {
  url: string;
  status: number;
}

export interface Findings {
  consoleErrors: ConsoleError[];
  failedRequests: FailedRequest[];
}

export interface TestRunAssets {
  reportUrl?: string;
  screenshots?: { label: string; url: string }[];
  jsonUrl?: string;
}

export interface TestRun {
  id: string;
  site_url: string;
  scenario_id: string;
  status: RunStatus;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  options: Record<string, unknown>;
  steps: TestStep[];
  findings: Findings;
  report_path: string | null;
  report_url: string | null;
  assets: TestRunAssets;
}

export interface RunOptions {
  headless?: boolean;
  maxRuntimeSec?: number;
  ctaSelector?: string | null;
  successSelector?: string | null;
  fallbackPath?: string | null;
}

export interface AppSettings {
  external_runner_url: string;
  external_runner_api_key: string;
  allow_localhost: boolean;
  max_runs_per_day: number;
}

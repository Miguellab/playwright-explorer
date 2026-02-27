export type RunStatus = 'queued' | 'running' | 'passed' | 'failed';
export type StepStatus = 'pass' | 'fail' | 'skipped';

export interface TestStep {
  name: string;
  status: StepStatus;
  durationMs: number;
  note: string | null;
  detail?: string | null;
  screenshotUrl: string | null;
}

export interface ConsoleError {
  text: string;
  url?: string;
  timestamp?: string;
}

export interface FailedRequest {
  url: string;
  status: number;
}

export interface DiagnosticFrame {
  url: string;
  inputCount: number;
  inputs: string[];
  buttonCount: number;
  buttons: string[];
}

export interface Diagnostic {
  step: string;
  type?: string;
  url?: string;
  title?: string;
  frameCount?: number;
  frames?: DiagnosticFrame[];
  error?: string;
}

export interface Findings {
  consoleErrors: ConsoleError[];
  failedRequests: FailedRequest[];
  diagnostics?: Diagnostic[];
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
  error?: string | null;
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
  // smoke_v1
  ctaSelector?: string | null;
  successSelector?: string | null;
  fallbackPath?: string | null;
  // login_flow
  loginPath?: string;
  email?: string;
  password?: string;
  emailSelector?: string;
  passwordSelector?: string;
  submitSelector?: string;
  successUrl?: string;
  // navigation_check / responsive_check / performance_audit
  paths?: string[];
  assertSelector?: string;
  // form_submission
  formPath?: string;
  fields?: FormField[];
  // responsive_check
  viewports?: { name: string; width: number; height: number }[];
  // performance_audit
  thresholds?: { maxLoadTime?: number; maxFCP?: number };
}

export interface FormField {
  selector: string;
  value: string;
  label?: string;
  type?: 'text' | 'select' | 'checkbox';
}

export interface AppSettings {
  external_runner_url: string;
  external_runner_api_key: string;
  allow_localhost: boolean;
  max_runs_per_day: number;
}

// ── Scenario & Block metadata (from backend API) ──

export interface ScenarioMeta {
  id: string;
  name: string;
  description: string;
  requiredOptions: string[];
  optionalOptions: string[];
}

export interface BlockParamMeta {
  name: string;
  type: string;
  required?: boolean;
  default?: unknown;
  description?: string;
  values?: string[];
}

export interface BlockMeta {
  action: string;
  name: string;
  category: string;
  description: string;
  params: BlockParamMeta[];
}

export interface CustomStep {
  action: string;
  label?: string;
  params: Record<string, unknown>;
  optional?: boolean;
  fatal?: boolean;
}

// ── Sentinelle MVP Types ──

export type RunStatus = "queued" | "running" | "passed" | "failed" | "error";
export type StepStatus = "passed" | "failed" | "skipped" | "running";
export type Trigger = "release_detected" | "manual" | "scheduled" | "deploy_webhook" | "discovery";
export type IssueSeverity = "critical" | "warning";
export type SiteType = "saas" | "ecommerce" | "vitrine" | "blog" | "marketplace" | "webapp" | "landing" | "other";

// ── Performance ──

export interface PerformanceMetrics {
  domContentLoaded?: number;
  loaded?: number;
  firstContentfulPaint?: number;
  domInteractive?: number;
  resourceCount?: number;
  totalTransferSizeKB?: number;
}

// ── Site Analysis ──

export interface SiteAnalysisPage {
  label: string;
  role: string;
  interactiveElements?: string[];
  uxIssues?: string[];
  performance?: PerformanceMetrics;
}

export interface CrossPageAnalysis {
  navigationConsistency: string;
  designConsistency: string;
  criticalPaths: string[];
  missingPages: string[];
}

export interface SiteAnalysis {
  sitePurpose: string;
  siteType: SiteType;
  targetAudience: string;
  keyFeatures: string[];
  crossPageAnalysis: CrossPageAnalysis;
  pages: SiteAnalysisPage[];
}

export interface Goal {
  id: string;
  label: string;
}

export interface SuggestedFlow {
  id: string;
  goal: string;
  labelFr: string;
  descriptionFr: string;
  confidence: number;
  evidence: string[];
  ctaText: string | null;
  pagePath: string | null;
  source?: "nav-link" | "button" | "detected";
  requiresCredentials?: boolean;
  hasCredentials?: boolean;
  credentials?: { email: string; password: string };
  authenticatedOnly?: boolean;
}

// ── Project ──

export interface Project {
  id: string;
  name: string;
  siteUrl: string;
  goal?: string | null;
  description?: string | null;
  siteAnalysis?: SiteAnalysis | null;
  suggestedFlows?: SuggestedFlow[];
  monitoredFlows?: SuggestedFlow[];
  enabled: boolean;
  checkFrequencyMin: number;
  maxRunsPerDay: number;
  runnerBaseUrl: string;
  lastSeenSignature: string | null;
  lastSeenAt: string | null;
  lastCheckedAt: string | null;
  hasRunnerApiKey: boolean;
  configStatus?: "ready" | "no_flows";
  configMessage?: string | null;
  credentialsWarning?: {
    message: string;
    flowIds: string[];
    flowLabels: string[];
  };
  discoveryMeta?: { analysisMode?: string };
  createdAt: string;
  updatedAt: string;
}

export interface SentinelleSettings {
  hasAnthropicApiKey: boolean;
  anthropicApiKey?: string;
  useVisionAnalysis?: boolean;
}

export interface CreateProjectBody {
  name: string;
  siteUrl: string;
  goal?: string;
  checkFrequencyMin: number;
  maxRunsPerDay: number;
  runnerBaseUrl: string;
  runnerApiKey: string;
}

export interface UpdateProjectBody {
  name?: string;
  siteUrl?: string;
  goal?: string;
  enabled?: boolean;
  checkFrequencyMin?: number;
  maxRunsPerDay?: number;
  runnerBaseUrl?: string;
  runnerApiKey?: string;
  suggestedFlows?: SuggestedFlow[];
  monitoredFlows?: SuggestedFlow[];
}

// ── Run ──

export interface RunStep {
  name: string;
  action: string;
  label: string;
  status: StepStatus;
  durationMs?: number;
  detail?: string;
}

export interface ConsoleError {
  text: string;
  url?: string;
  timestamp?: string;
}

export interface FailedRequest {
  url: string;
  status: number;
  timestamp?: string;
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
  diagnostics: Diagnostic[];
}

export interface RunAssets {
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

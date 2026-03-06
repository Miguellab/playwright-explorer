import type {
  Project,
  CreateProjectBody,
  UpdateProjectBody,
  Run,
  SuggestedFlow,
  TestNowResponse,
  SentinelleSettings,
  SiteAnalysis,
  Release,
  ReleaseDetail,
  MainFlowInfo,
} from "./sentinelle-types";

const BASE_URL = import.meta.env.VITE_SENTINELLE_API_URL || "";
const API_KEY = import.meta.env.VITE_SENTINELLE_API_KEY || "";

export const DEFAULT_RUNNER_URL = import.meta.env.VITE_DEFAULT_RUNNER_URL || "";
export const DEFAULT_RUNNER_KEY = import.meta.env.VITE_DEFAULT_RUNNER_KEY || "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
      ...init?.headers,
    },
  });

  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || "Limite quotidienne atteinte") as Error & { status: number };
    err.status = 429;
    throw err;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Erreur ${res.status}`) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  return res.json();
}

// ── Health ──

export async function healthCheck(): Promise<{ service: string; status: string }> {
  return request("/health");
}

// ── Projects ──

export async function createProject(body: CreateProjectBody): Promise<Project> {
  return request("/projects", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function listProjects(): Promise<Project[]> {
  const data = await request<{ projects: Project[] } | Project[]>("/projects");
  return Array.isArray(data) ? data : data.projects ?? [];
}

export async function getProject(id: string): Promise<Project> {
  return request(`/projects/${id}`);
}

export async function updateProject(id: string, body: UpdateProjectBody): Promise<Project> {
  return request(`/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteProject(id: string): Promise<void> {
  await request(`/projects/${id}`, { method: "DELETE" });
}

export async function toggleProject(id: string): Promise<Project> {
  return request(`/projects/${id}/toggle`, { method: "POST" });
}

// ── Main Flow ──

export async function setMainFlow(projectId: string, flowId: string): Promise<{ mainFlowId: string; flowLabel: string; message: string }> {
  return request(`/projects/${projectId}/main-flow`, {
    method: "PUT",
    body: JSON.stringify({ flowId }),
  });
}

export async function getMainFlow(projectId: string): Promise<MainFlowInfo> {
  return request(`/projects/${projectId}/main-flow`);
}

// ── Releases ──

export async function listReleases(projectId: string, limit = 20): Promise<Release[]> {
  const data = await request<{ releases: Release[] }>(`/projects/${projectId}/releases?limit=${limit}`);
  return data.releases ?? [];
}

export async function getRelease(releaseId: string): Promise<ReleaseDetail> {
  return request(`/releases/${releaseId}`);
}

// ── Runs ──

export async function testNow(projectId: string): Promise<TestNowResponse> {
  return request(`/projects/${projectId}/test-now`, { method: "POST" });
}

export async function runSingleFlow(projectId: string, flowId: string): Promise<{ releaseId: string; runId: string; flowId: string; flowLabel: string; message: string }> {
  return request(`/projects/${projectId}/flows/${flowId}/run`, { method: "POST" });
}

export async function listRuns(projectId: string, limit = 20): Promise<Run[]> {
  const data = await request<{ runs: Run[] } | Run[]>(`/projects/${projectId}/runs?limit=${limit}`);
  return Array.isArray(data) ? data : data.runs ?? [];
}

export async function getRun(runId: string): Promise<Run> {
  return request(`/runs/${runId}`);
}

// ── Discovery ──

export interface DiscoverResult {
  runId: string;
  flows: SuggestedFlow[];
  screenshots: { label: string; filename: string; path: string }[];
  siteAnalysis?: SiteAnalysis;
  visionError?: string;
}

export async function discoverFlows(projectId: string): Promise<DiscoverResult> {
  return request<DiscoverResult>(`/projects/${projectId}/discover`, { method: "POST" });
}

export interface AuthenticatedDiscoverResult {
  runId: string;
  flows: SuggestedFlow[];
  loginSuccess: boolean;
  screenshots: { label: string; filename: string; path: string }[];
  siteAnalysis?: SiteAnalysis;
  rawNavigation?: {
    linksCount: number;
    buttonsCount: number;
    formsCount: number;
    visitedPagesCount: number;
  };
}

export async function discoverAuthenticatedFlows(
  projectId: string,
  opts?: { maxPages?: number }
): Promise<AuthenticatedDiscoverResult> {
  return request<AuthenticatedDiscoverResult>(`/projects/${projectId}/discover-authenticated`, {
    method: "POST",
    body: JSON.stringify(opts || {}),
  });
}

// ── Credentials ──

export async function getFlowCredentialsStatus(projectId: string): Promise<{
  flows: { flowId: string; goal: string; labelFr: string; hasCredentials: boolean; credentialFields: string[] }[];
  allConfigured: boolean;
  message: string | null;
}> {
  return request(`/projects/${projectId}/flows/credentials-status`);
}

export async function saveFlowCredentials(
  projectId: string,
  flowId: string,
  credentials: { email: string; password: string; name?: string }
): Promise<{ flowId: string; hasCredentials: boolean; message: string }> {
  return request(`/projects/${projectId}/flows/${flowId}/credentials`, {
    method: "PUT",
    body: JSON.stringify(credentials),
  });
}

export async function deleteFlowCredentials(
  projectId: string,
  flowId: string
): Promise<{ flowId: string; hasCredentials: boolean }> {
  return request(`/projects/${projectId}/flows/${flowId}/credentials`, {
    method: "DELETE",
  });
}

// ── URLs ──

export function getScreenshotUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const separator = path.startsWith("/") ? "" : "/";
  return `${BASE_URL}${separator}${path}`;
}

export function getRunScreenshotUrl(runId: string, filename: string): string {
  return `${BASE_URL}/runs/${runId}/screenshots/${filename}`;
}

export function getTraceUrl(project: Project, tracePath: string): string {
  const base = project.runnerBaseUrl.replace(/\/$/, "");
  const separator = tracePath.startsWith("/") ? "" : "/";
  return `${base}${separator}${tracePath}`;
}

// ── Settings ──

export async function getSettings(): Promise<SentinelleSettings> {
  return request("/settings");
}

export async function updateSettings(body: Partial<SentinelleSettings>): Promise<SentinelleSettings> {
  return request("/settings", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

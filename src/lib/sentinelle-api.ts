import type {
  Goal,
  Project,
  CreateProjectBody,
  UpdateProjectBody,
  Run,
  SuggestedFlow,
  TestNowResponse,
  SentinelleSettings,
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

// ── Goals ──

export async function listGoals(): Promise<Goal[]> {
  const data = await request<{ goals: Goal[] }>("/goals");
  return data.goals;
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

// ── Runs ──

export async function testNow(projectId: string): Promise<TestNowResponse> {
  return request(`/projects/${projectId}/test-now`, { method: "POST" });
}

export async function listRuns(projectId: string, limit = 20): Promise<Run[]> {
  const data = await request<{ runs: Run[] } | Run[]>(`/projects/${projectId}/runs?limit=${limit}`);
  return Array.isArray(data) ? data : data.runs ?? [];
}

export async function getRun(runId: string): Promise<Run> {
  return request(`/runs/${runId}`);
}

export interface DiscoverResult {
  runId: string;
  flows: SuggestedFlow[];
  screenshots: { label: string; filename: string; path: string }[];
}

export async function discoverFlows(projectId: string): Promise<DiscoverResult> {
  return request<DiscoverResult>(`/projects/${projectId}/discover`, { method: "POST" });
}

export async function deleteProject(id: string): Promise<void> {
  await request(`/projects/${id}`, { method: "DELETE" });
}

export async function toggleProject(id: string): Promise<Project> {
  return request(`/projects/${id}/toggle`, { method: "POST" });
}

export function getReportUrl(runId: string): string {
  return `${BASE_URL}/runs/${runId}/report`;
}

export function getScreenshotUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const separator = path.startsWith("/") ? "" : "/";
  return `${BASE_URL}${separator}${path}`;
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

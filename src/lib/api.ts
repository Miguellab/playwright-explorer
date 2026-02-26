import { supabase } from "@/integrations/supabase/client";
import type { TestRun, RunOptions, AppSettings } from "./types";

export async function createTestRun(siteUrl: string, scenarioId: string, options: RunOptions): Promise<{ testRunId: string; status: string }> {
  const { data, error } = await supabase.functions.invoke("test-runs", {
    method: "POST",
    body: { action: "create", siteUrl, scenarioId, options },
  });
  if (error) throw new Error(error.message || "Failed to create test run");
  return data;
}

export async function getTestRun(id: string): Promise<TestRun> {
  const { data, error } = await supabase.functions.invoke("test-runs", {
    method: "POST",
    body: { action: "get", id },
  });
  if (error) throw new Error(error.message || "Failed to get test run");
  return data;
}

export async function listTestRuns(limit = 20): Promise<TestRun[]> {
  const { data, error } = await supabase.functions.invoke("test-runs", {
    method: "POST",
    body: { action: "list", limit },
  });
  if (error) throw new Error(error.message || "Failed to list test runs");
  return data;
}

export async function getSettings(): Promise<AppSettings> {
  const { data, error } = await (supabase as any)
    .from("app_settings")
    .select("key, value");
  if (error) throw new Error(error.message);
  
  const settings: Record<string, unknown> = {};
  for (const row of (data as { key: string; value: unknown }[]) || []) {
    settings[row.key] = typeof row.value === 'string' ? JSON.parse(row.value as string) : row.value;
  }
  
  return {
    runner_mode: (settings.runner_mode as string) === 'external' ? 'external' : 'mock',
    external_runner_url: (settings.external_runner_url as string) || '',
    external_runner_api_key: (settings.external_runner_api_key as string) || '',
    allow_localhost: settings.allow_localhost === true,
    max_runs_per_day: (settings.max_runs_per_day as number) || 10,
  };
}

export async function updateSetting(key: string, value: unknown): Promise<void> {
  const jsonValue = JSON.stringify(value);
  const { error } = await (supabase as any)
    .from("app_settings")
    .update({ value: jsonValue, updated_at: new Date().toISOString() })
    .eq("key", key);
  if (error) throw new Error(error.message);
}

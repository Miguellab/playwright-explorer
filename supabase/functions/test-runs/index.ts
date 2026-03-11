import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Read a setting value from app_settings (service role, server-side only) */
// deno-lint-ignore no-explicit-any
async function getSetting(supabase: any, key: string): Promise<unknown> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", key).single();
  if (!data) return null;
  try {
    return typeof data.value === "string" ? JSON.parse(data.value) : data.value;
  } catch {
    return data.value;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { action } = body;

    // ── CREATE ──────────────────────────────────────────────
    if (action === "create") {
      const { siteUrl, scenarioId, options, steps } = body;

      if (!siteUrl || typeof siteUrl !== "string") {
        return jsonResponse({ error: "siteUrl is required" }, 400);
      }

      // Validate URL scheme
      const allowLocalhost = (await getSetting(supabase, "allow_localhost")) === true;
      if (!siteUrl.startsWith("https://") && !(allowLocalhost && siteUrl.startsWith("http://localhost"))) {
        return jsonResponse({ error: "URL must start with https://" }, 400);
      }

      // Rate limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("test_runs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      const maxRuns = ((await getSetting(supabase, "max_runs_per_day")) as number) || 10;
      if ((count || 0) >= maxRuns) {
        return jsonResponse({ error: `Rate limit: max ${maxRuns} runs per day` }, 429);
      }

      // Concurrency check
      const { data: activeRuns } = await supabase
        .from("test_runs")
        .select("id")
        .in("status", ["queued", "running"]);
      if (activeRuns && activeRuns.length > 0) {
        return jsonResponse({ error: "A run is already in progress" }, 409);
      }

      // Read runner config
      const runnerUrl = (await getSetting(supabase, "external_runner_url")) as string;
      const runnerKey = (await getSetting(supabase, "external_runner_api_key")) as string;

      if (!runnerUrl) {
        return jsonResponse({ error: "Runner not configured. Set the Runner Base URL in Settings." }, 400);
      }

      // Create local row
      const { data: run, error: insertErr } = await supabase
        .from("test_runs")
        .insert({
          site_url: siteUrl,
          scenario_id: scenarioId || "smoke_v1",
          status: "queued",
          options: options || {},
        })
        .select("id, status")
        .single();

      if (insertErr) return jsonResponse({ error: insertErr.message }, 500);

      // Forward to external runner (fire-and-forget)
      const forwardToRunner = async () => {
        try {
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (runnerKey) headers["Authorization"] = `Bearer ${runnerKey}`;

          let resp = await fetch(`${runnerUrl.replace(/\/+$/, "")}/v1/runs`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              siteUrl,
              scenarioId: scenarioId || "smoke_v1",
              options,
              ...(scenarioId === "custom" && steps ? { steps } : {}),
            }),
          });

          if (resp.status === 401 || resp.status === 403) {
            await supabase.from("test_runs").update({
              status: "failed",
              finished_at: new Date().toISOString(),
              steps: [{ name: "Authentication", status: "fail", durationMs: 0, note: "Invalid Runner API key" }],
            }).eq("id", run.id);
            return;
          }

          // Retry on 409/429 (runner busy) — up to 30 attempts, 10s apart
          if (resp.status === 409 || resp.status === 429) {
            let retryResp = resp;
            for (let attempt = 1; attempt < 30; attempt++) {
              await new Promise((r) => setTimeout(r, 10_000));
              retryResp = await fetch(`${runnerUrl.replace(/\/+$/, "")}/v1/runs`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                  siteUrl,
                  scenarioId: scenarioId || "smoke_v1",
                  options,
                  ...(scenarioId === "custom" && steps ? { steps } : {}),
                }),
              });
              if (retryResp.status !== 409 && retryResp.status !== 429) break;
            }
            if (retryResp.status === 409 || retryResp.status === 429) {
              await supabase.from("test_runs").update({
                status: "failed",
                finished_at: new Date().toISOString(),
                steps: [{ name: "Runner", status: "fail", durationMs: 0, note: "Runner busy after 30 retries" }],
              }).eq("id", run.id);
              return;
            }
            // Use the successful retry response going forward
            resp = retryResp;
          }

          if (!resp.ok) {
            const text = await resp.text().catch(() => "Unknown error");
            await supabase.from("test_runs").update({
              status: "failed",
              finished_at: new Date().toISOString(),
              steps: [{ name: "Runner", status: "fail", durationMs: 0, note: `Runner error: ${text.slice(0, 200)}` }],
            }).eq("id", run.id);
            return;
          }

          const result = await resp.json();
          // Store the runner's runId for later polling
          await supabase.from("test_runs").update({
            status: "running",
            started_at: new Date().toISOString(),
            assets: { externalRunId: result.runId || run.id },
          }).eq("id", run.id);
        } catch (e) {
          await supabase.from("test_runs").update({
            status: "failed",
            finished_at: new Date().toISOString(),
            steps: [{ name: "Connection", status: "fail", durationMs: 0, note: `Runner unreachable: ${(e as Error).message}` }],
          }).eq("id", run.id);
        }
      };

      // deno-lint-ignore no-explicit-any
      (globalThis as any).EdgeRuntime?.waitUntil?.(forwardToRunner());
      // deno-lint-ignore no-explicit-any
      if (typeof (globalThis as any).EdgeRuntime === "undefined") {
        forwardToRunner().catch(console.error);
      }

      return jsonResponse({ testRunId: run.id, status: "queued" });
    }

    // ── GET (with external sync) ────────────────────────────
    if (action === "get") {
      const { id } = body;
      const { data, error } = await supabase.from("test_runs").select("*").eq("id", id).single();
      if (error) return jsonResponse({ error: error.message }, 404);

      // If still in progress, poll the external runner for updates
      if (data.status === "queued" || data.status === "running") {
        const runnerUrl = (await getSetting(supabase, "external_runner_url")) as string;
        const runnerKey = (await getSetting(supabase, "external_runner_api_key")) as string;
        const externalRunId = (data.assets as Record<string, unknown>)?.externalRunId || id;

        if (runnerUrl) {
          try {
            const headers: Record<string, string> = {};
            if (runnerKey) headers["Authorization"] = `Bearer ${runnerKey}`;

            const resp = await fetch(`${runnerUrl.replace(/\/+$/, "")}/v1/runs/${externalRunId}`, { headers });

            if (resp.ok) {
              const result = await resp.json();
              const newStatus = result.status || data.status;

              // Update DB if runner reports completion
              if (newStatus === "passed" || newStatus === "failed") {
                const updateData: Record<string, unknown> = {
                  status: newStatus,
                  finished_at: result.finishedAt || new Date().toISOString(),
                  duration_ms: result.durationMs ?? result.duration_ms ?? null,
                  steps: result.steps || [],
                  findings: result.findings || { consoleErrors: [], failedRequests: [] },
                  assets: {
                    ...(data.assets as Record<string, unknown> || {}),
                    screenshots: result.assets?.screenshots || result.screenshots || [],
                  },
                };
                await supabase.from("test_runs").update(updateData).eq("id", id);
                return jsonResponse({ ...data, ...updateData });
              }

              // Still running — update status if changed
              if (newStatus !== data.status) {
                await supabase.from("test_runs").update({ status: newStatus }).eq("id", id);
                data.status = newStatus;
              }
            }
          } catch {
            // Ignore polling errors, return cached data
          }
        }
      }

      return jsonResponse(data);
    }

    // ── LIST ────────────────────────────────────────────────
    if (action === "list") {
      const limit = body.limit || 20;
      const { data, error } = await supabase
        .from("test_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse(data);
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (e) {
    return jsonResponse({ error: (e as Error).message || "Internal error" }, 500);
  }
});

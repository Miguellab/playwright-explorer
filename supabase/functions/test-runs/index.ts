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

function generateMockScreenshotSvg(label: string, siteUrl: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <rect width="1280" height="720" fill="#0f1419"/>
    <rect x="0" y="0" width="1280" height="48" fill="#1a1f26"/>
    <circle cx="24" cy="24" r="6" fill="#ff5f57"/><circle cx="44" cy="24" r="6" fill="#febc2e"/><circle cx="64" cy="24" r="6" fill="#28c840"/>
    <text x="640" y="24" fill="#8b949e" font-family="monospace" font-size="13" text-anchor="middle">${siteUrl}</text>
    <text x="640" y="340" fill="#c9d1d9" font-family="monospace" font-size="20" text-anchor="middle">${label}</text>
    <text x="640" y="380" fill="#484f58" font-family="monospace" font-size="14" text-anchor="middle">Mock Screenshot — CrowdTest Demo</text>
  </svg>`;
}

function generateHtmlReport(run: Record<string, unknown>): string {
  const steps = (run.steps as Array<Record<string, unknown>>) || [];
  const findings = (run.findings as Record<string, unknown[]>) || { consoleErrors: [], failedRequests: [] };
  const consoleErrors = (findings.consoleErrors || []) as Array<Record<string, unknown>>;
  const failedRequests = (findings.failedRequests || []) as Array<Record<string, unknown>>;

  const statusColor = run.status === "passed" ? "#22c55e" : "#ef4444";
  const statusLabel = (run.status as string || "unknown").toUpperCase();

  let nextActions = "";
  if (consoleErrors.length > 0) nextActions += '<li>Fix console errors; verify broken components.</li>';
  if (failedRequests.length > 0) nextActions += '<li>Check API endpoints returning 4xx/5xx; add retry or fix auth.</li>';
  if (!nextActions) nextActions = '<li>All checks passed. No immediate action required.</li>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CrowdTest Report — ${run.site_url}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0d1117;color:#c9d1d9;font-family:'JetBrains Mono',monospace;padding:2rem;max-width:900px;margin:0 auto}
h1{font-size:1.5rem;margin-bottom:.5rem}
h2{font-size:1rem;margin:2rem 0 1rem;color:#8b949e;text-transform:uppercase;letter-spacing:.1em}
.header{border-bottom:1px solid #21262d;padding-bottom:1.5rem;margin-bottom:2rem}
.meta{font-size:.8rem;color:#8b949e;margin-top:.5rem}
.badge{display:inline-block;padding:.25rem .75rem;border-radius:4px;font-size:.75rem;font-weight:700;letter-spacing:.05em}
.pass{background:#22c55e20;color:#22c55e;border:1px solid #22c55e40}
.fail{background:#ef444420;color:#ef4444;border:1px solid #ef444440}
.skipped{background:#eab30820;color:#eab308;border:1px solid #eab30840}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:2rem}
.card{background:#161b22;border:1px solid #21262d;border-radius:8px;padding:1.5rem;text-align:center}
.card .value{font-size:2rem;font-weight:700}
.card .label{font-size:.7rem;color:#8b949e;margin-top:.25rem}
table{width:100%;border-collapse:collapse;margin-bottom:1rem}
th,td{text-align:left;padding:.75rem;border-bottom:1px solid #21262d;font-size:.8rem}
th{color:#8b949e;font-weight:600}
.finding{background:#161b22;border:1px solid #21262d;border-radius:6px;padding:.75rem;margin-bottom:.5rem;font-size:.8rem}
.finding .loc{color:#8b949e;font-size:.7rem}
ul{list-style-type:disc;padding-left:1.5rem}
li{margin-bottom:.5rem;font-size:.85rem}
.footer{margin-top:3rem;padding-top:1rem;border-top:1px solid #21262d;text-align:center;font-size:.7rem;color:#484f58}
</style>
</head>
<body>
<div class="header">
<h1>Playwright CrowdTest Report</h1>
<p style="font-size:.9rem">${run.site_url}</p>
<p class="meta">${run.created_at ? new Date(run.created_at as string).toLocaleString() : ""} · ${run.duration_ms ? ((run.duration_ms as number) / 1000).toFixed(1) + "s" : "—"} · <span class="badge" style="background:${statusColor}20;color:${statusColor};border:1px solid ${statusColor}40">${statusLabel}</span></p>
</div>

<div class="cards">
<div class="card"><div class="value" style="color:${statusColor}">${statusLabel}</div><div class="label">Overall Result</div></div>
<div class="card"><div class="value" style="color:${consoleErrors.length > 0 ? '#ef4444' : '#22c55e'}">${consoleErrors.length}</div><div class="label">Console Errors</div></div>
<div class="card"><div class="value" style="color:${failedRequests.length > 0 ? '#eab308' : '#22c55e'}">${failedRequests.length}</div><div class="label">Failed Requests</div></div>
</div>

<h2>Steps</h2>
<table>
<tr><th>Step</th><th>Status</th><th>Duration</th></tr>
${steps.map((s) => `<tr><td>${s.name}</td><td><span class="badge ${s.status}">${(s.status as string).toUpperCase()}</span></td><td>${s.durationMs}ms</td></tr>`).join("")}
</table>

${consoleErrors.length > 0 ? `<h2>Console Errors</h2>${consoleErrors.slice(0, 3).map((e) => `<div class="finding">${e.message}${e.location ? `<div class="loc">${e.location}</div>` : ""}</div>`).join("")}` : ""}

${failedRequests.length > 0 ? `<h2>Failed Requests</h2>${failedRequests.slice(0, 3).map((r) => `<div class="finding">${r.url} <span style="color:#eab308">→ ${r.status}</span></div>`).join("")}` : ""}

<h2>Next Actions</h2>
<ul>${nextActions}</ul>

<div class="footer">Generated by Playwright CrowdTest Demo</div>
</body>
</html>`;
}

async function runMockScenario(
  supabase: ReturnType<typeof createClient>,
  runId: string,
  siteUrl: string,
) {
  // Update to running
  await supabase.from("test_runs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", runId);

  // Simulate delay
  await new Promise((r) => setTimeout(r, 1500));

  const steps: Array<Record<string, unknown>> = [];
  const screenshots: Array<{ label: string; url: string }> = [];

  // Step 1: Open homepage — always passes
  const s1Duration = 800 + Math.floor(Math.random() * 600);
  steps.push({ name: "Open homepage", status: "pass", durationMs: s1Duration, note: "Page loaded successfully", screenshotUrl: null });
  
  // Upload screenshot 1
  const svg1 = generateMockScreenshotSvg("Step 1: Homepage Loaded", siteUrl);
  const path1 = `runs/${runId}/01-home.svg`;
  await supabase.storage.from("test-assets").upload(path1, new Blob([svg1], { type: "image/svg+xml" }), { contentType: "image/svg+xml", upsert: true });
  const url1 = supabase.storage.from("test-assets").getPublicUrl(path1).data.publicUrl;
  steps[0].screenshotUrl = url1;
  screenshots.push({ label: "Homepage", url: url1 });

  await new Promise((r) => setTimeout(r, 800));

  // Step 2: Find and click CTA — random pass/skip
  const ctaFound = Math.random() > 0.3;
  const s2Duration = ctaFound ? 400 + Math.floor(Math.random() * 400) : 200;
  steps.push({
    name: "Find and click CTA",
    status: ctaFound ? "pass" : "skipped",
    durationMs: s2Duration,
    note: ctaFound ? 'Clicked "Get Started" button' : "CTA not found — skipped",
    screenshotUrl: null,
  });

  if (ctaFound) {
    const svg2 = generateMockScreenshotSvg("Step 2: After CTA Click", siteUrl);
    const path2 = `runs/${runId}/02-after-cta.svg`;
    await supabase.storage.from("test-assets").upload(path2, new Blob([svg2], { type: "image/svg+xml" }), { contentType: "image/svg+xml", upsert: true });
    const url2 = supabase.storage.from("test-assets").getPublicUrl(path2).data.publicUrl;
    steps[1].screenshotUrl = url2;
    screenshots.push({ label: "After CTA", url: url2 });
  }

  await new Promise((r) => setTimeout(r, 600));

  // Step 3: Navigate to key page
  const s3Status = ctaFound ? "pass" : "skipped";
  steps.push({
    name: "Navigate to key page",
    status: s3Status,
    durationMs: s3Status === "pass" ? 500 + Math.floor(Math.random() * 300) : 100,
    note: s3Status === "pass" ? "H1 found on target page" : "Skipped — no navigation occurred",
    screenshotUrl: null,
  });

  const svg3 = generateMockScreenshotSvg("Step 3: Key Page", siteUrl);
  const path3 = `runs/${runId}/03-success.svg`;
  await supabase.storage.from("test-assets").upload(path3, new Blob([svg3], { type: "image/svg+xml" }), { contentType: "image/svg+xml", upsert: true });
  const url3 = supabase.storage.from("test-assets").getPublicUrl(path3).data.publicUrl;
  steps[2].screenshotUrl = url3;
  screenshots.push({ label: "Key Page", url: url3 });

  // Step 4: Collect findings
  const numErrors = Math.floor(Math.random() * 4);
  const numFailedReqs = Math.floor(Math.random() * 3);

  const sampleErrors = [
    { message: "Uncaught TypeError: Cannot read properties of undefined (reading 'map')", location: "app.js:142:23" },
    { message: "Failed to load resource: net::ERR_CONNECTION_REFUSED", location: "api/data:1" },
    { message: "Warning: Each child in a list should have a unique 'key' prop", location: "react-dom.js:84" },
  ];
  const sampleRequests = [
    { url: `${siteUrl}/api/analytics`, status: 500 },
    { url: `${siteUrl}/api/user/profile`, status: 403 },
  ];

  const consoleErrors = sampleErrors.slice(0, numErrors);
  const failedRequests = sampleRequests.slice(0, numFailedReqs);

  steps.push({
    name: "Collect findings",
    status: "pass",
    durationMs: 150,
    note: `Found ${consoleErrors.length} console errors, ${failedRequests.length} failed requests`,
    screenshotUrl: null,
  });

  const findings = { consoleErrors, failedRequests };

  // Determine overall status
  const hasSevereIssues = consoleErrors.length >= 2 || failedRequests.length >= 2;
  const overallStatus = hasSevereIssues ? "failed" : "passed";

  // Step 5: Generate report
  const totalDuration = steps.reduce((sum, s) => sum + (s.durationMs as number), 0) + 2000;

  const runData = {
    site_url: siteUrl,
    status: overallStatus,
    created_at: new Date().toISOString(),
    duration_ms: totalDuration,
    steps,
    findings,
  };

  const reportHtml = generateHtmlReport(runData);
  const reportPath = `runs/${runId}/report.html`;
  await supabase.storage.from("test-assets").upload(reportPath, new Blob([reportHtml], { type: "text/html" }), { contentType: "text/html", upsert: true });

  steps.push({
    name: "Generate report",
    status: "pass",
    durationMs: 200,
    note: "HTML report generated",
    screenshotUrl: null,
  });

  // Final update
  await supabase.from("test_runs").update({
    status: overallStatus,
    finished_at: new Date().toISOString(),
    duration_ms: totalDuration,
    steps,
    findings,
    report_path: reportPath,
    assets: { screenshots, reportUrl: reportPath },
  }).eq("id", runId);
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

    if (action === "create") {
      const { siteUrl, scenarioId, options } = body;

      if (!siteUrl || typeof siteUrl !== "string") {
        return jsonResponse({ error: "siteUrl is required" }, 400);
      }

      // Check rate limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("test_runs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      const { data: maxRunsSetting } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "max_runs_per_day")
        .single();

      const maxRuns = maxRunsSetting?.value ? Number(JSON.parse(maxRunsSetting.value as string)) : 10;
      if ((count || 0) >= maxRuns) {
        return jsonResponse({ error: `Rate limit: max ${maxRuns} runs per day` }, 429);
      }

      // Check concurrency
      const { data: activeRuns } = await supabase
        .from("test_runs")
        .select("id")
        .in("status", ["queued", "running"]);

      if (activeRuns && activeRuns.length > 0) {
        return jsonResponse({ error: "A run is already in progress" }, 409);
      }

      // Create run
      const { data: run, error } = await supabase
        .from("test_runs")
        .insert({
          site_url: siteUrl,
          scenario_id: scenarioId || "smoke_v1",
          status: "queued",
          options: options || {},
        })
        .select("id, status")
        .single();

      if (error) return jsonResponse({ error: error.message }, 500);

      // Check runner mode
      const { data: modeSetting } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "runner_mode")
        .single();

      const mode = modeSetting?.value ? JSON.parse(modeSetting.value as string) : "mock";

      if (mode === "mock") {
        // Fire and forget mock runner (don't await)
        EdgeRuntime?.waitUntil?.(runMockScenario(supabase, run.id, siteUrl));
        // Fallback if waitUntil not available
        if (typeof EdgeRuntime === "undefined") {
          runMockScenario(supabase, run.id, siteUrl).catch(console.error);
        }
      } else {
        // External runner mode
        const { data: urlSetting } = await supabase.from("app_settings").select("value").eq("key", "external_runner_url").single();
        const { data: keySetting } = await supabase.from("app_settings").select("value").eq("key", "external_runner_api_key").single();

        const externalUrl = urlSetting?.value ? JSON.parse(urlSetting.value as string) : "";
        const apiKey = keySetting?.value ? JSON.parse(keySetting.value as string) : "";

        if (!externalUrl) {
          await supabase.from("test_runs").update({ status: "failed", finished_at: new Date().toISOString(), steps: [{ name: "Configuration", status: "fail", durationMs: 0, note: "External runner URL not configured" }] }).eq("id", run.id);
          return jsonResponse({ testRunId: run.id, status: "failed", error: "External runner URL not configured" });
        }

        // Forward to external runner (fire and forget)
        const forwardToExternal = async () => {
          try {
            await supabase.from("test_runs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", run.id);
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

            const resp = await fetch(externalUrl, {
              method: "POST",
              headers,
              body: JSON.stringify({ testRunId: run.id, siteUrl, scenarioId, options }),
            });
            const result = await resp.json();

            await supabase.from("test_runs").update({
              status: result.status || "failed",
              finished_at: new Date().toISOString(),
              duration_ms: result.durationMs,
              steps: result.steps || [],
              findings: result.findings || { consoleErrors: [], failedRequests: [] },
              report_path: result.reportPath,
              assets: result.assets || {},
            }).eq("id", run.id);
          } catch (e) {
            await supabase.from("test_runs").update({
              status: "failed",
              finished_at: new Date().toISOString(),
              steps: [{ name: "External runner", status: "fail", durationMs: 0, note: `Error: ${e.message}` }],
            }).eq("id", run.id);
          }
        };

        EdgeRuntime?.waitUntil?.(forwardToExternal());
        if (typeof EdgeRuntime === "undefined") {
          forwardToExternal().catch(console.error);
        }
      }

      return jsonResponse({ testRunId: run.id, status: "queued" });
    }

    if (action === "get") {
      const { id } = body;
      const { data, error } = await supabase.from("test_runs").select("*").eq("id", id).single();
      if (error) return jsonResponse({ error: error.message }, 404);
      return jsonResponse(data);
    }

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
    return jsonResponse({ error: e.message || "Internal error" }, 500);
  }
});

// Declare EdgeRuntime for TypeScript
declare const EdgeRuntime: { waitUntil?: (p: Promise<unknown>) => void } | undefined;

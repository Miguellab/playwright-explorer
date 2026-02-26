

# External Runner Integration Plan

## Summary
Remove mock mode entirely. All test execution goes through an external Playwright runner service, with the edge function acting as a secure proxy (API key never exposed to the browser).

---

## 1. Settings Page (`/settings`)

**Remove** the mock/external mode toggle. Show only:
- **Runner Base URL** (required) - e.g. `https://my-runner.onrender.com`
- **Runner API Key** (required, password field)
- **Allow localhost URLs** toggle
- **Max runs per day** input

Update the info banner to explain external runner requirements (CORS config, deployment).

Update `AppSettings` type: remove `runner_mode`, keep `external_runner_url` and `external_runner_api_key`.

---

## 2. Edge Function (`supabase/functions/test-runs/index.ts`)

Rewrite to act as a **proxy** to the external runner:

### `action: "create"`
1. Validate siteUrl (https required, localhost check)
2. Rate-limit check (max runs/day from DB)
3. Read `external_runner_url` and `external_runner_api_key` from `app_settings`
4. If URL missing, return 400 with "Runner not configured"
5. POST to `{RunnerBaseUrl}/v1/runs` with `{ siteUrl, scenarioId, options }` and Bearer token
6. On success, insert a row into `test_runs` with the runner's `runId` as the local ID, status "queued"
7. Return `{ testRunId }` to client

### `action: "get"`
1. Read local DB row for the run
2. If status is "queued" or "running", fetch `GET {RunnerBaseUrl}/v1/runs/:id` to get latest status
3. If runner returns completed status, update DB row with steps, findings, duration, reportUrl, screenshots
4. Return normalized `TestRun` object with runner URLs for report/screenshots

### `action: "list"`
- Serve from DB (no change needed, already works)

### Error handling
- Runner unreachable: return 502 with clear message
- Auth failure (401/403 from runner): return 401 with "Invalid Runner API key"
- Runner busy (409/429): return 409 with "Runner busy"

---

## 3. Frontend API Layer (`src/lib/api.ts`)

No structural changes needed -- it already calls the edge function via `supabase.functions.invoke()`. The edge function handles all runner communication.

---

## 4. Types (`src/lib/types.ts`)

- Remove `runner_mode` from `AppSettings`
- Add optional `report_url` field to `TestRun` (direct URL from runner, distinct from `report_path`)
- Add optional `report_url` to `TestRunAssets`

---

## 5. Runner Page (`/runner`)

- Before running, check if settings have a runner URL configured. If not, show a warning with a link to `/settings`.
- Handle new error codes from edge function:
  - 409: "Runner busy -- try again in a minute."
  - 502: "Runner unreachable -- check your Runner URL in Settings."
  - 401: "Invalid Runner API key -- update it in Settings."
- **Report links**: Use `run.assets.reportUrl` directly (external runner URL) instead of constructing Supabase Storage URLs. Open in new tab.
- **Screenshot URLs**: Use URLs from `run.assets.screenshots` directly (served by runner).

---

## 6. Run Detail Page (`/runs/:id`)

- Change report link: use `run.assets.reportUrl` (runner URL) instead of Supabase Storage path
- Screenshots: already using `run.assets.screenshots[].url` -- just ensure these come from runner responses
- Add auto-refresh: if run is still queued/running, poll every 2s (same pattern as Runner page)

---

## 7. Runs List Page (`/runs`)

- No major changes needed -- already reads from DB via edge function

---

## Technical Details

### Edge function runner proxy flow
```text
Browser -> Edge Function -> External Runner
                |
                v
           Supabase DB (stores summary)
```

### Runner API contract (expected from external service)
- `POST /v1/runs` -- create a run, returns `{ runId, status }`
- `GET /v1/runs/:id` -- get run status/results with steps, findings, reportUrl, screenshots

### Security
- API key stored in `app_settings` table, read only by edge function (service role key)
- Browser never sees the runner API key
- Edge function reads settings server-side on each request

### Files to modify
1. `src/lib/types.ts` -- remove `runner_mode`, add `report_url`
2. `src/lib/api.ts` -- minor: settings parsing update
3. `src/pages/SettingsPage.tsx` -- remove mode toggle, update labels
4. `src/pages/Runner.tsx` -- settings check, error handling, report URL logic
5. `src/pages/RunDetail.tsx` -- report URL from assets, add polling
6. `supabase/functions/test-runs/index.ts` -- full rewrite as proxy


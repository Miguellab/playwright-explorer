

## Fix: Dashboard polling and empty state bugs

### Root causes

1. **Polling with no runs**: A release exists with `verdict: "PENDING"` and `runs: []` (release detected but no test launched). The dashboard polls it indefinitely and shows "Vérification en cours…" even though no test is running.
2. **`getRelease(latestRelease.id)` called unconditionally** (line 74): If `latestRelease.id` is ever falsy, it fetches `/releases/null` → 404.
3. **No proper empty state** when releases exist but have no runs, or when no release exists at all.

### Changes in `src/pages/ProjectDashboard.tsx`

**1. Guard all API calls with ID validation**
- Line 74: Add `if (!latestRelease?.id) return;` before `getRelease()`
- Line 96: Already guarded by `pollingReleaseId` check, but add explicit falsy guard

**2. Distinguish "no release" from "PENDING release with no runs"**
- A release with `verdict === "PENDING"` and `runs.length === 0` and `runCount === 0` means no test was launched — treat it like no release for display purposes
- Only start polling if the release actually has runs (`runCount > 0` or `runs.length > 0`)

**3. Improve empty state**
- When no actionable release exists, show: "Sentinelle est prête. Lancez un premier test ou attendez la prochaine publication."
- CTA: "Lancer un test maintenant" (calls `testNow`)
- No VerdictBadge, no spinner

**4. After `testNow`, use the returned `releaseId` for polling**
- Already done (line 116), but also guard against falsy `response.releaseId`

### Summary

1 file modified, ~15 lines changed. Core fix: don't poll or show PENDING UI for releases that have no runs.


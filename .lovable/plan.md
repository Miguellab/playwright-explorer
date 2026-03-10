

## Backend catch-up: 8 features

After reviewing the codebase, several items are already implemented. Here's the status and plan:

### Already done — no changes needed
- **#3 Retest button**: Already in `RunCard` with spinner + polling logic in `ReleaseDetail`
- **#6 errorSummary/failedStepName**: Already displayed in `RunCard` (error summary block) and `FlowAccordion` (line 96-100)
- **#7 Settings page**: `SettingsPage.tsx` already has health check, runner config, Anthropic key with password toggle, vision toggle, and warning when key missing

### To implement

**1. Webhook deploy section in ProjectSettings**

Add a new `Card` section after the Configuration card showing:
- Title "Webhook de déploiement"
- Read-only input with `POST {BASE_URL}/projects/{id}/deploy`
- Copy button using `navigator.clipboard`
- Explanatory text

**2. Enriched verdict (VerdictResult)**

Add to `sentinelle-types.ts`:
```ts
interface VerdictIssue {
  severity: "critical" | "warning" | "pending";
  message: string;
  action?: string;
  details?: string[];
}
interface VerdictResult {
  verdict: ReleaseVerdict;
  headline: string;
  forUser: string;
  forCTO: string;
  issues: VerdictIssue[];
  statusExplanation: string;
  verdictExplanation: string;
}
```

Add `verdictResult?: VerdictResult` to `Release` and `ReleaseDetail` types.

In `ProjectDashboard.tsx`: when `latestRelease?.verdictResult` exists, use its `headline` as label and `forUser` as subtitle instead of hardcoded `verdictContext`. Display issues below the verdict card using a new `VerdictIssues` component.

In `ReleaseDetail.tsx`: show `verdictResult.headline`, issues list, and a collapsible "Détails techniques" section with `forCTO`.

Create `src/components/VerdictIssues.tsx` — renders issue list with severity-colored icons (critical=red XCircle, warning=orange AlertTriangle, pending=blue Clock).

**3. Retest button in FlowAccordion**

Add retest capability to `FlowAccordion` for failed/error flows:
- New props: `projectId?: string`, `onRetestComplete?: () => void`
- When verdict is ALERTE/ERREUR, show a "Retester" button (RotateCcw icon)
- Call `runSingleFlow`, show spinner, then call `onRetestComplete`
- Pass `projectId` and callback from `ProjectDashboard`

**4. Performance metrics component**

Create `src/components/PerformanceMetrics.tsx`:
- Takes `metrics: Record<string, PerformanceMetrics>`
- For each URL, display FCP, domContentLoaded, loaded in ms
- Color: green < 2000ms, orange < 4000ms, red >= 4000ms
- Show resourceCount and totalTransferSizeKB if present
- Compact card layout with monospace values

Integrate in `RunCard` and `FlowAccordion` when `run.findings.performanceMetrics` has entries.

**5. ReleaseDetail improvements**

- Add trigger badge using existing `triggerLabel` pattern from ProjectDashboard (Rocket for release_detected, FlaskConical for manual, Webhook icon for deploy_webhook, RotateCcw for manual_flow_retest)
- Show total duration: sum of all run `durationMs`, formatted as seconds
- Change "Autres parcours" → "Autres vérifications"
- Update subtitle from "parcours testé" → "vérification(s)"

**8. Daily run counter**

Add API call to get daily count. The 429 error already returns `dailyCount` and `maxRunsPerDay`. Approach:
- Track `dailyRunCount` state in ProjectDashboard
- On `testNow` 429 error, parse and display the count
- Show `{dailyRunCount}/{maxRunsPerDay} tests aujourd'hui` next to the test button
- When limit reached, disable button with orange "Limite atteinte" text
- To get initial count without triggering 429: add a lightweight endpoint call or derive from today's runs count

### Files impacted

| File | Changes |
|---|---|
| `src/lib/sentinelle-types.ts` | Add `VerdictIssue`, `VerdictResult`; add `verdictResult?` to Release types |
| `src/components/VerdictIssues.tsx` | New — render enriched verdict issues |
| `src/components/PerformanceMetrics.tsx` | New — performance metrics display |
| `src/pages/ProjectSettings.tsx` | Add webhook deploy section |
| `src/pages/ProjectDashboard.tsx` | Use enriched verdict, add daily counter, pass retest props to FlowAccordion |
| `src/pages/ReleaseDetail.tsx` | Trigger badge, total duration, enriched verdict, updated labels |
| `src/components/FlowAccordion.tsx` | Add retest button, integrate performance metrics |
| `src/components/RunCard.tsx` | Integrate performance metrics |


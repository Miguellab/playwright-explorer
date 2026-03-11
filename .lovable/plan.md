

## Fix Frontend API Contract Alignment

### Context
Several files referenced in the request (Runner.tsx, RunDetail.tsx, StatusBadge.tsx, src/lib/types.ts) do not exist in this project. After auditing the actual codebase, here is what applies and what does not:

| Requested | Actual File | Status |
|---|---|---|
| src/lib/types.ts | src/lib/sentinelle-types.ts | Already correct -- `RunStatus` includes `"error"`, `StepStatus` includes both forms, `RunStep` has `label` and `detail` |
| StatusBadge.tsx | Does not exist | N/A -- project uses `VerdictBadge` |
| Runner.tsx | Does not exist | N/A |
| RunDetail.tsx | src/pages/ReleaseDetail.tsx | Already handles `"error"` status and uses `RunCard` (which delegates to `MainFlowSteps` already using `step.label \|\| step.name`) |
| test-runs edge function | supabase/functions/test-runs/index.ts | Needs fixes |

### Actual changes needed

**1. `supabase/functions/test-runs/index.ts` -- 409 retry + screenshots fix**

In the `forwardToRunner` function (lines 125-131): replace the immediate fail on 409/429 with a retry loop (up to 30 attempts, 10s delay).

In the GET action (line 203): fix screenshots extraction from `result.assets?.screenshots || result.screenshots || []` instead of `result.screenshots || []`.

**2. Tests**

Create vitest test files for contract alignment:
- `src/test/sentinelle-types.test.ts` -- validate type definitions accept both runner and frontend formats
- `src/test/api-consistency.test.ts` -- validate expected API response shapes and edge function screenshot mapping logic

No changes needed to types, components, or pages -- they already handle the runner format correctly.


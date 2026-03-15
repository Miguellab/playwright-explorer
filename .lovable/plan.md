

## Redesign Release Detail Page — Grouped Sections & Simplified Cards

### Overview

Rewrite `src/pages/ReleaseDetail.tsx` to replace the current flat list of RunCards with 3 collapsible category sections, a cleaner anomaly banner with scroll-to-failure, simplified OK cards (no steps), and a separate "Diagnostics techniques" section for Playwright traces.

### Changes

**1. `src/pages/ReleaseDetail.tsx` — Full restructure**

**Header**: Keep as-is (verdict badge, trigger badge, headline, date/count/duration).

**Anomaly banner** (replaces current `vr.forUser` + `VerdictIssues`):
- Short summary: use `vr.forUser` or generate from data (e.g. "Le parcours principal fonctionne. 2 anomalies détectées sur des vérifications secondaires.")
- "Voir les anomalies" button that scrolls to first failed run via `document.getElementById` + `scrollIntoView`
- Keep CTO details collapsible below

**3 accordion sections** using `Collapsible`:
- Group `release.runs` by category: use `run.flowCategory` from `ReleaseRunSummary` (available on release detail runs too via the `Run` type's category, or match against `project.monitoredFlows`). For `ReleaseDetail` which has full `Run[]`, match each `run.flowId` against `project.monitoredFlows` to get category, then use `getCheckType`.
- Section headers: title + count + status summary (e.g. "✓ 4 OK · ⚠ 1 alerte")
- Default state: "Parcours utilisateur" expanded, others collapsed. If any section has failures, expand it too.

**Simplified RunCard for OK runs**:
- Show only: flow label, type badge, verdict badge, status message (from `getStatusMessage`), duration
- Do NOT render steps, screenshots, findings when `status === "passed"`
- Keep full expandable detail only for failed/error runs (steps, screenshots, findings, retest button)

**Diagnostics techniques section** (bottom):
- Separate collapsible section, collapsed by default
- Lists all trace downloads grouped: "Trace — {flowLabel}" with download icon
- Removed from inline run cards

**2. `src/components/RunCard.tsx` — Add compact mode**

Add a `compact?: boolean` prop. When `compact && run.status === "passed"`:
- Render a single-line card: icon + label + type badge + status message + duration + verdict badge
- No expand toggle, no steps, no screenshots
- Keep full mode for failed/error runs (unchanged)

Add `typeBadge?: { label: string; className: string }` prop so ReleaseDetail can pass the category badge.

Add `statusMessage?: string` prop to display category-specific wording.

Add `id` attribute on the card wrapper (`id={run.id}`) for scroll-to-failure.

**3. No changes to types or flow-categories** — all needed data and helpers exist.

### Files impacted

| File | Change |
|---|---|
| `src/pages/ReleaseDetail.tsx` | Full restructure: category grouping, anomaly banner with scroll, traces section |
| `src/components/RunCard.tsx` | Add compact mode, type badge, status message, scroll target id |




## Make ProjectSettings sections collapsible & fix incorrect counts

### Problem: Wrong counts

The header badge shows `categoryCount` which comes from `project.flowClassification.byCategory` — this is the **total number of flows discovered by the backend** per category (e.g. 10 auth flows, 24 core pages), not the number of `suggestedFlows` actually displayed in the UI. The displayed flows are a curated subset.

**Fix**: Replace `categoryCount` with `flows.length` — the actual number of suggested flows shown in each section.

### Collapsible sections

Wrap each flow type section in a `Collapsible` with a clickable header (chevron + title badge + activated count), matching the pattern used in ProjectDashboard and ReleaseDetail.

- Default state: all sections **collapsed** (this is a settings page, not a dashboard)
- Click header to expand/collapse

### Changes to `src/pages/ProjectSettings.tsx`

1. **Import** `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger` and `ChevronDown` from lucide-react

2. **Add state**: `const [sectionOpen, setSectionOpen] = useState<Record<CheckType, boolean>>({ "user-flow": false, "page-check": false, "ui-element": false })`

3. **Fix count**: Replace `categoryCount` with `flows.length` in the badge text

4. **Wrap section** in `Collapsible` with:
   - `CollapsibleTrigger`: the existing header bar (badge + activated count + chevron icon with rotation)
   - `CollapsibleContent`: description + flow cards list

### Files impacted

| File | Change |
|---|---|
| `src/pages/ProjectSettings.tsx` | Fix count bug, wrap sections in Collapsible |


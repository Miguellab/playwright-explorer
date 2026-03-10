

## Refactor: Clear verification model with 3 check types

### 1. New: `src/lib/flow-categories.ts`

Classification helper with corrected logic:

```ts
const USER_FLOW_GOALS = ["LOGIN", "SIGNUP", "BOOK", "BUY", "CONTACT"];

function getCheckType(flow: SuggestedFlow): CheckType {
  if (USER_FLOW_GOALS.includes(flow.goal)) return "user-flow";
  if (flow.source === "detected") return "user-flow";
  if (flow.source === "nav-link" || flow.source === "cta-link" || flow.source === "page-link") return "page-check";
  if (flow.source === "button") return "ui-element";
  return "user-flow";
}
```

Plus metadata per type (title, description, badge color classes) and `groupFlowsByType()` helper.

### 2. `src/pages/ProjectSettings.tsx`

Replace flat "Parcours surveillés" list with 3 collapsible sections grouped by `getCheckType()`. Each section has colored header, description, and flow list with existing checkboxes/star/credentials logic.

### 3. `src/pages/ProjectDashboard.tsx`

- OK subtitle: "Toutes les vérifications configurées sont validées"
- "Autres parcours surveillés" → "Autres vérifications"
- Page-check flows with OK verdict: show "Page accessible — Aucune erreur détectée" instead of step counts

### 4. `src/components/FlowAccordion.tsx`

- Add small colored type badge below flow label
- Page-check flows with OK verdict: "Page accessible" instead of step counts

| File | Change |
|---|---|
| `src/lib/flow-categories.ts` | New — classification + metadata |
| `src/pages/ProjectSettings.tsx` | 3 typed sections |
| `src/pages/ProjectDashboard.tsx` | Wording updates |
| `src/components/FlowAccordion.tsx` | Type badge + page-check status |


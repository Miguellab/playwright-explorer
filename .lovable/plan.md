

## Refactoring: Category-based flow grouping using API `category` field

### Summary
Replace the current client-side flow classification (`flow-categories.ts` using `goal`/`source` heuristics) with the backend's `category` field. Update both the Project Dashboard and Project Settings pages to group flows into 3 sections with category-specific wording and status messages.

### 1. Update types (`src/lib/sentinelle-types.ts`)

Add missing fields to `SuggestedFlow`:
- `category?: "auth" | "transactional" | "core" | "content" | "settings" | "infra"`
- `criticality?: "critical" | "important" | "secondary" | "infra"`
- `businessValue?: number`
- `functionType?: string`

Add to `Project`:
- `flowClassification?: { totalFlows: number; byCategory: Record<string, number>; byCriticality: Record<string, number>; suggestedMainFlowId?: string | null }`

Add to `ReleaseRunSummary`:
- `flowCategory?: string`
- `flowCriticality?: string`

### 2. Rewrite flow-categories (`src/lib/flow-categories.ts`)

Replace the goal/source-based heuristic with `category` field lookup:

| CheckType | category values |
|---|---|
| `user-flow` | `auth`, `transactional` |
| `page-check` | `core`, `content`, `settings` |
| `ui-element` | `infra` |

`getCheckType(flow)` → check `flow.category` first, fall back to current goal-based logic for backward compatibility.

Update descriptions:
- user-flow: "Sentinelle exécute une action utilisateur réelle sur votre application."
- page-check: "Sentinelle vérifie que ces pages restent accessibles et stables après publication."
- ui-element: "Sentinelle vérifie que les éléments essentiels de l'interface sont présents et utilisables."

Add a helper `getStatusMessage(checkType, status, errorSummary?)` returning category-specific wording:
- user-flow: "Parcours validé" / "Parcours échoué — {error}" / "Erreur d'exécution"
- page-check: "Page accessible — Aucune erreur détectée" / "Page inaccessible — {error}" / "Erreur lors de la vérification"
- ui-element: "Élément présent — Aucune erreur détectée" / "Élément absent ou non fonctionnel — {error}" / "Erreur lors de la vérification"

### 3. Update FlowAccordion (`src/components/FlowAccordion.tsx`)

- Use `getStatusMessage()` instead of the current hardcoded status text
- Show `isMainFlow` badge when `isMainFlow` prop is true
- Show `run.durationMs` formatted as seconds
- Show steps summary for all types (not just non-page-checks)
- Use `flow.criticality` to modulate visual weight (bold for critical, subdued for infra)

### 4. Update ProjectDashboard (`src/pages/ProjectDashboard.tsx`)

Replace the current "main flow + others" layout with 3 grouped sections:

1. **Parcours utilisateur** — flows where category is auth/transactional
2. **Pages critiques** — flows where category is core/content/settings
3. **Éléments d'interface** — flows where category is infra

Each section shows: title, count, description, then FlowAccordion cards.

The main flow gets a special badge within its section (not a separate section anymore).

Use `latestRelease.trigger` for the header subtitle instead of `lastRun.trigger`, and use `latestRelease.verdictHeadline` for the verdict subtitle when available.

Match runs from `releaseRuns` to flows by `flowId`.

### 5. Update ProjectSettings (`src/pages/ProjectSettings.tsx`)

Same 3-section grouping using `category` field. Use `flowClassification.byCategory` from project for section header counts (e.g. "Parcours utilisateur (2)").

Main flow selector: only show for auth/transactional and core category flows.

Keep existing: checkbox toggle, credentials config, save logic.

### Files impacted

| File | Change |
|---|---|
| `src/lib/sentinelle-types.ts` | Add `category`, `criticality`, `businessValue`, `functionType` to `SuggestedFlow`; add `flowClassification` to `Project`; add `flowCategory`/`flowCriticality` to `ReleaseRunSummary` |
| `src/lib/flow-categories.ts` | Rewrite `getCheckType` to use `category` field; update descriptions; add `getStatusMessage` helper |
| `src/components/FlowAccordion.tsx` | Use `getStatusMessage`; show duration; adapt visual weight by criticality; show main flow badge |
| `src/pages/ProjectDashboard.tsx` | Replace main/other split with 3 category-based sections; use release trigger/headline for context |
| `src/pages/ProjectSettings.tsx` | Group by category with counts from `flowClassification`; restrict main flow selector to eligible categories |


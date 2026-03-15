

## Make ProjectDashboard sections collapsible (like ReleaseDetail)

### What changes

Wrap the 3 flow sections (Parcours utilisateur, Pages critiques, Éléments d'interface) in `Collapsible` components matching the ReleaseDetail pattern.

### `src/pages/ProjectDashboard.tsx`

**Add state** for section open/close:
```tsx
const [sectionOpen, setSectionOpen] = useState<Record<CheckType, boolean>>({
  "user-flow": true,
  "page-check": false,
  "ui-element": false,
});
```

Auto-expand sections with failures (like ReleaseDetail):
```tsx
useEffect(() => {
  // expand sections that have failed runs
}, [releaseRuns, runs]);
```

**Replace** the current plain `<div>` section wrapper (lines 318-344) with the same `Collapsible` pattern from ReleaseDetail:
- Clickable header bar with chevron, title, count, and status summary (✓ N OK · ⚠ N erreur)
- `CollapsibleContent` wrapping the FlowAccordion cards
- Description text inside the collapsible content
- Default: "user-flow" expanded, others collapsed. Sections with errors auto-expand.

**Add** a `buildStatusSummary` helper (same as ReleaseDetail) that counts OK/erreur/pending from the flows' associated runs.

**Imports**: Add `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger`, `CheckCircle`, `XCircle`, `ChevronDown`.

### Files impacted

| File | Change |
|---|---|
| `src/pages/ProjectDashboard.tsx` | Wrap sections in Collapsible with status summary headers |


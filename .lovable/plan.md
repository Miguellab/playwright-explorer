

## Improve PENDING flow display in ProjectDashboard and FlowAccordion

### Changes

**1. `src/pages/ProjectDashboard.tsx`**

Compute queue context and pass it to each `FlowAccordion`:
- Count total flows, completed runs, and determine queue position for each flow
- Pass new props: `queuePosition`, `totalInQueue`, `completedInQueue`

```tsx
// After findRunForFlow, compute queue stats
const allFlows = SECTION_ORDER.flatMap(type => flowsByType[type]);
const totalFlows = allFlows.length;
const completedRuns = allFlows.filter(f => {
  const r = findRunForFlow(f.id);
  return r && r.status !== "queued" && r.status !== "running";
}).length;
// Queue position: flows without run or with queued status, ordered by array index
let queueIndex = 0;
const queuePositionMap: Record<string, number> = {};
for (const f of allFlows) {
  const r = findRunForFlow(f.id);
  if (!r || r.status === "queued") {
    queuePositionMap[f.id] = completedRuns + queueIndex + 1;
    queueIndex++;
  }
}
```

Pass to FlowAccordion:
```tsx
<FlowAccordion
  ...existing props
  queuePosition={queuePositionMap[flow.id]}
  totalInQueue={totalFlows}
  completedInQueue={completedRuns}
/>
```

**2. `src/components/FlowAccordion.tsx`**

Add props: `queuePosition?: number`, `totalInQueue?: number`, `completedInQueue?: number`.

Update the PENDING display logic:

- **No run at all** (`!run`): Show `Clock` icon (not spinner), text "En attente", and subtitle "Ce parcours sera testé lors du prochain lancement"
- **Run exists with `queued` status**: Show `Clock` icon, text "En file d'attente (N/Total)", and estimated time `~Xs restant` based on `(queuePosition - completedInQueue) * 15`
- **Run exists with `running` status**: Show `Loader2` spinner, text "Test en cours…"

Icon change in header:
```tsx
{verdict === "PENDING" && run?.status === "running" && <Loader2 className="h-4 w-4 animate-spin text-status-pending" />}
{verdict === "PENDING" && run?.status === "queued" && <Clock className="h-4 w-4 text-muted-foreground" />}
{verdict === "PENDING" && !run && <Clock className="h-4 w-4 text-muted-foreground" />}
```

Subtitle area:
```tsx
{verdict === "PENDING" && !run && (
  <span className="text-xs text-muted-foreground">Ce parcours sera testé lors du prochain lancement</span>
)}
{verdict === "PENDING" && run?.status === "queued" && queuePosition && totalInQueue && (
  <span className="text-xs text-muted-foreground">
    En file d'attente ({queuePosition}/{totalInQueue}) — ~{((queuePosition - (completedInQueue ?? 0)) * 15)}s restant
  </span>
)}
{verdict === "PENDING" && run?.status === "running" && (
  <span className="text-xs text-muted-foreground">Test en cours…</span>
)}
```

### Files impacted
| File | Change |
|---|---|
| `src/pages/ProjectDashboard.tsx` | Compute queue position map, pass props to FlowAccordion |
| `src/components/FlowAccordion.tsx` | Add queue props, differentiate no-run vs queued vs running display |




## Split verdict headline into two lines

### Problem
The API returns `verdictHeadline` as a single string (e.g. `"Tout fonctionne — le parcours \"Pipeline — Administration\" est opérationnel."`). It's rendered as one `<h2>`, making it long and hard to scan.

### Solution

**`src/pages/ProjectDashboard.tsx`** — In `verdictContext()`, when `verdictHeadline` is available, split it on the ` — ` separator:
- First part becomes `label` (bold headline): "Tout fonctionne"
- Second part becomes `subtitle` (descriptive): "Le parcours \"Pipeline — Administration\" est opérationnel."
- If no `—` separator exists, fall back to using the full string as label and `verdictResult.forUser` as subtitle (current behavior).

```tsx
if (release.verdictHeadline) {
  const v = release.verdict as "OK" | "ALERTE" | "ERREUR" | "PENDING";
  const parts = release.verdictHeadline.split(" — ");
  const label = parts[0];
  const subtitle = parts.length > 1
    ? parts.slice(1).join(" — ") // rejoin in case there are multiple —
    : release.verdictResult?.forUser ?? "";
  return { label, subtitle, verdict: v };
}
```

This keeps the `VerdictBadge` component unchanged — `label` renders as the bold `<h2>`, `subtitle` renders as the `<p>` below.

### Files impacted

| File | Change |
|---|---|
| `src/pages/ProjectDashboard.tsx` | Split `verdictHeadline` at ` — ` into label + subtitle |




# Fix: Projects Not Displaying + Clean Up

## Problem
The dashboard shows "Aucun projet surveille" even though the API returns a project. This is a data parsing bug.

## Root Cause

The Sentinelle API returns projects wrapped in an object:
```json
{"projects": [{"id": "...", "name": "fit", ...}]}
```

But `listProjects()` in `sentinelle-api.ts` is typed as `Promise<Project[]>` and returns the raw response. In Dashboard.tsx, `Array.isArray(data)` is `false` for `{projects: [...]}`, so it defaults to an empty array.

## Fix (1 file)

**`src/lib/sentinelle-api.ts`** -- `listProjects()` function (line ~63):

Change from:
```typescript
export async function listProjects(): Promise<Project[]> {
  return request("/projects");
}
```

To:
```typescript
export async function listProjects(): Promise<Project[]> {
  const data = await request<{ projects: Project[] } | Project[]>("/projects");
  return Array.isArray(data) ? data : data.projects ?? [];
}
```

This handles both cases (array or wrapped object) and ensures the Dashboard always receives a proper array.

Similarly, check `listRuns()` which is also used in `ProjectDashboard.tsx` with the same `Array.isArray(r)` guard -- the runs API likely has the same pattern. If needed, apply the same fix there.

No layout changes needed -- the current top-nav + centered content design is already correct and clean. No sidebar.



# App Redesign — Clean Dashboard Layout

## Problem
1. Two "new project" buttons (nav bar + page) is redundant
2. The app doesn't feel like a dashboard — it's a collection of disconnected pages
3. Navigation is cluttered with legacy runner pages mixed with Sentinelle pages
4. Build error in edge function needs fixing (TS type on `getSetting`)

---

## 1. Fix Build Error (edge function)

**`supabase/functions/test-runs/index.ts`**: Change `getSetting` signature to accept `any` instead of the strict `ReturnType<typeof createClient>`:

```typescript
async function getSetting(supabase: any, key: string): Promise<unknown> {
```

This resolves all 6 TS2345 errors.

---

## 2. Simplified Navigation (`AppNav.tsx`)

Remove the "+ Nouveau" link from the nav. Keep only:
- **Sentinelle** brand/logo (links to `/`)
- **Projets** tab (links to `/`)
- **Parametres** tab (links to `/settings`)

The "new project" action will only live as a button on the Dashboard page itself.

---

## 3. Dashboard Redesign (`Dashboard.tsx`)

Inspired by image 3 (clean, centered, dark):

- **Header row**: "Mes projets" title on left, single "+ Nouveau projet" button on right (green, prominent)
- **Subtitle**: "Sentinelle surveille vos applications en continu."
- **Empty state** (when 0 projects): Large dashed-border card centered, shield icon, text "Aucun projet surveille", single green "+ Creer un projet" button. No duplicate button in the header when empty (hide header button when no projects).
- **Project cards** (when projects exist): Clean cards with project name, URL, goal badge, last check time, and a subtle status indicator (verdict color dot)

---

## 4. Streamline Routing (`App.tsx`)

Keep all routes but ensure the main flow is:
- `/` — Dashboard (project list)
- `/onboarding` — New project wizard
- `/project/:id` — Project dashboard
- `/project/:id/run/:runId` — Run report
- `/project/:id/settings` — Project settings
- `/settings` — Global settings (runner config)

Legacy runner routes (`/runner`, `/runs`, `/runs/:id`) remain but are not in the main nav.

---

## 5. Onboarding Touch-up (`Onboarding.tsx`)

- Use the shared `AppNav` component instead of a custom minimal header (consistency)
- This keeps navigation consistent across all pages

---

## Files to modify

1. `supabase/functions/test-runs/index.ts` — Fix `getSetting` type (1 line)
2. `src/components/AppNav.tsx` — Remove "+ Nouveau" link, add "Parametres" link
3. `src/pages/Dashboard.tsx` — Redesign: hide header button when empty, cleaner cards
4. `src/pages/Onboarding.tsx` — Use `AppNav` instead of custom header


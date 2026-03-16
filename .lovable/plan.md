

## Full Marketing Landing Page for Sentinelle

### Overview

Create a new `src/pages/Landing.tsx` page with all requested sections (navbar, hero, problem, before/after, features, how it works, bug detection, comparison, pricing, final CTA). Update routing so `/landing` serves this page (or replace the current Index). The page is standalone — it does NOT use `AppLayout` or `AppNav`.

### Routing (`src/App.tsx`)

- Add a new route outside the `AppLayout` wrapper: `<Route path="/landing" element={<Landing />} />`
- Replace the current `/` route to point to `Landing` instead of `Dashboard`, and move Dashboard to `/dashboard` inside `AppLayout`.

### New file: `src/pages/Landing.tsx`

Single self-contained page component (~600 lines). All sections rendered sequentially with consistent spacing (`py-24`). Uses existing design tokens (background, card, primary/neon green, muted-foreground, border, status colors).

**Navbar**: Sticky top bar. Left: Shield icon + "Sentinelle". Center/right: anchor links (Features, Pricing, Docs). Far right: two buttons — "Connexion" (outline, links to `/login`) and "Créer un compte" (primary, links to `/signup`).

**Hero**: Large centered title with neon accent on key phrase. Subtitle in muted-foreground. Two CTA buttons + "Free plan available" small text.

**Problem**: Title + paragraph + 4-step vertical flow diagram using cards with arrow icons between them.

**Before/After**: Two-column grid. Left column (without Sentinelle) uses destructive/red accents. Right column (with Sentinelle) uses primary/green accents. Each is a card with a vertical list of steps.

**Features**: 3-column grid of cards — "Parcours utilisateur", "Pages critiques", "Éléments d'interface". Each card has icon, title, description, example list, and a result badge.

**How it works**: 4-step horizontal (desktop) / vertical (mobile) numbered steps with icons.

**Bug detection**: Simulated terminal/console card showing a real detection scenario with green checkmarks and a red alert line.

**Comparison table**: Styled table with Sentinelle highlighted. Columns: Sentinelle, Cypress, Maestro, Datadog. Uses Check/X icons with green/muted colors.

**Pricing**: 4-column grid of pricing cards. "Maker" card highlighted with a "Populaire" badge and primary border. Each card: plan name, price, feature list, CTA button.

**Final CTA**: Dark card with neon border/glow, title, subtitle, two buttons.

**Footer**: Minimal — "© 2025 Sentinelle" centered.

### Components used

All from existing UI library: `Button`, `Card`, `Badge`, `Table` components, plus lucide icons (`Shield`, `Check`, `X`, `ArrowDown`, `Globe`, `MousePointerClick`, `Layout`, `Zap`, `AlertTriangle`, `Download`, `ChevronRight`).

### Files impacted

| File | Change |
|---|---|
| `src/pages/Landing.tsx` | New file — full landing page |
| `src/App.tsx` | Add `/landing` route, change `/` to Landing, move Dashboard to `/dashboard` |


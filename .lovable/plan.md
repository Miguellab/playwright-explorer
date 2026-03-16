

## Improve Sentinelle Landing Page — Copy, Data & Missing Elements

Single file change: `src/pages/Landing.tsx`. Same structure, improved content throughout.

### Changes

**Navbar** (lines 44-48)
- Add "How it works" link (`#how`) between Features and Pricing
- Keep Docs link
- Change "Créer un compte" to "Create account"

**Hero** (lines 66-91)
- Title: "Deploy with confidence." + "Sentinelle checks your app after every publish."
- Subtitle: "Sentinelle automatically verifies your critical user flows and important pages after each deploy to detect what breaks before your users do."
- Primary CTA: "Start monitoring my app" → `/signup`
- Helper text: "Free plan available."

**New: Product Preview block** — Insert after Hero, before Problem
- Terminal-style card (reuse same pattern as BugDetection) showing:
  ```
  sentinelle run #342
  Publish detected
  Running checks...
  ✓ Login flow
  ✓ Dashboard page
  ✓ API requests
  ✗ Create project button broken
  Alert triggered
  ```

**Problem** (lines 97-131)
- Title: "Every deploy can break something."
- Text: split into 3 sentences as specified
- Replace flow steps: Deploy → Login works normally → A new release breaks the login → Users report the bug

**Before/After** (lines 137-179)
- Without: add "Hotfix deploys" between "Support tickets" and "Lost trust"
- With: change "Automated tests run" → "Automated checks run"

**Features** (lines 185-254)
- User flows desc: add "This ensures that critical functionality still works after a deploy."
- Critical pages desc: "Sentinelle verifies that important pages remain accessible and stable after deploy."
- Interface elements desc: "Sentinelle verifies that important interface elements remain usable."

**How it works** (lines 267-289)
- Add subtitle under title: "Setup time: about 2 minutes. No test scripts required."
- Step descriptions unchanged

**Bug Detection** (lines 295-338)
- Replace terminal content with the new 8-line format (run #342, publish detected, running checks, 3 OK, 1 broken, alert triggered)
- Update terminal header to "sentinelle — run #342"
- Add caption below card: "Sentinelle detects issues before users encounter them."

**Comparison** (lines 354-400)
- Add "Custom Playwright" column (`p` key in data)
- Add "Maintenance required" row: Sentinelle none, Cypress high, Maestro medium, Datadog medium, Custom very high
- Custom Playwright values: deploy=no, discovery=no, UI=yes, infra=no, setup=Difficult, maintenance=Very high

**Pricing** (lines 406-488)
- Change all "runs" → "checks" in feature lists
- Subtitle: "Pricing depends on number of projects and checks per month."
- Add `desc` field to Maker plan: "Perfect for indie makers and side projects."
- Badge text: "Populaire" → "Popular"

**Final CTA** (lines 494-515)
- Title: "Stop deploying blindly."
- CTA: "Start monitoring my app"

### Files impacted

| File | Change |
|---|---|
| `src/pages/Landing.tsx` | Update copy, add product preview section, add comparison column/row, fix pricing wording |


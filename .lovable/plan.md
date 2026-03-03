

## Analyse du problème

Les modifications discutées et "approuvées" dans les messages précédents n'ont **jamais été appliquées au code**. Voici l'état actuel :

- `src/pages/Onboarding.tsx` : toujours 3 étapes avec sélection manuelle d'objectif
- `src/pages/DiscoverFlows.tsx` : **n'existe pas**
- `src/lib/sentinelle-api.ts` : pas de fonction `discoverFlows`
- `src/lib/sentinelle-types.ts` : pas de type `SuggestedFlow`, `goal` toujours obligatoire
- `src/App.tsx` : pas de route `/project/:id/discover`

## Plan d'implémentation complet

### 1. Types (`src/lib/sentinelle-types.ts`)
- Ajouter `SuggestedFlow` (id, goal, labelFr, descriptionFr, confidence, evidence, ctaText, pagePath)
- Rendre `goal` optionnel dans `Project` et `CreateProjectBody`
- Retirer `goal` de `OnboardingData`

### 2. API (`src/lib/sentinelle-api.ts`)
- Ajouter `discoverFlows(projectId)` → `POST /projects/:id/discover`

### 3. Onboarding simplifié (`src/pages/Onboarding.tsx`)
- 2 étapes : Application + Surveillance (supprimer l'étape Objectif)
- Supprimer `listGoals`, `GOAL_META`, `goals`, `selectedGoal`, import `Target`
- `createProject` sans `goal`
- Rediriger vers `/project/:id/discover` après création

### 4. Nouvelle page (`src/pages/DiscoverFlows.tsx`)
- Loading animé avec progression simulée (30-60s)
- Appel `discoverFlows(id)` au mount
- Cards cochables avec confidence, evidence, CTA, pagePath
- Pre-sélection flows > 50% confidence
- Confirmation → `updateProject(id, { goal })` → redirige `/project/:id`

### 5. Route (`src/App.tsx`)
- Ajouter `/project/:id/discover` → `<DiscoverFlows />`

5 fichiers modifiés/créés en parallèle.


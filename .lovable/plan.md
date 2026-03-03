

## Implémentation du flow Discover

Les changements discutés précédemment n'ont jamais été appliqués au code. Voici le plan complet pour les implémenter.

### 1. Types (`src/lib/sentinelle-types.ts`)

- Ajouter `SuggestedFlow` interface (id, goal, labelFr, descriptionFr, confidence, evidence, ctaText, pagePath)
- Rendre `goal` nullable/optionnel dans `Project`
- Retirer `goal` de `CreateProjectBody` (le goal sera défini après discover)
- Retirer `goal` de `OnboardingData`

### 2. API (`src/lib/sentinelle-api.ts`)

- Ajouter `discoverFlows(projectId)` : `POST /projects/:id/discover` retournant `{ runId, flows: SuggestedFlow[], screenshots }`

### 3. Onboarding simplifié (`src/pages/Onboarding.tsx`)

- Passer de 3 étapes à 2 : **Application** + **Surveillance** (supprimer l'étape "Objectif")
- Supprimer `listGoals`, `GOAL_META`, `goals`, `selectedGoal`, l'import `Target`
- `createProject` sans `goal`
- Après création, rediriger vers `/project/:id/discover` au lieu de `/project/:id`
- Texte adapté : "Sentinelle analysera automatiquement les parcours"

### 4. Nouvelle page DiscoverFlows (`src/pages/DiscoverFlows.tsx`)

- Loading animé avec barre de progression (30-60s d'attente)
- Appel `discoverFlows(id)` au mount
- Affichage des flows en cards cochables avec confidence, evidence, CTA, pagePath
- Pre-sélection des flows avec confidence > 50%
- Bouton confirmer : `updateProject(id, { goal: primaryFlow.goal })`
- Redirige vers `/project/:id` après confirmation
- Gestion erreur avec retry

### 5. Route (`src/App.tsx`)

- Ajouter `<Route path="/project/:id/discover" element={<DiscoverFlows />} />`




## Plan : Mise à jour complète du système de découverte des parcours

### Problème
Le code actuel ne correspond pas à la spec API réelle : le format de retour de `discoverFlows` est différent, la confidence est sur 100 (pas 0-1), et les champs `suggestedFlows`/`monitoredFlows` manquent du type Project.

### Changements

#### 1. Types (`src/lib/sentinelle-types.ts`)
- `SuggestedFlow.confidence` : déjà un `number`, OK (on ajuste les seuils dans le UI pour 0-100)
- `SuggestedFlow.ctaText` et `pagePath` : passer à `string | null`
- `Project` : ajouter `suggestedFlows?: SuggestedFlow[]` et `monitoredFlows?: SuggestedFlow[]`
- `UpdateProjectBody` : ajouter `suggestedFlows?` et `monitoredFlows?`

#### 2. API (`src/lib/sentinelle-api.ts`)
- `discoverFlows` retourne maintenant `{ runId, flows, screenshots }` au lieu de `SuggestedFlow[]`

#### 3. Page DiscoverFlows (`src/pages/DiscoverFlows.tsx`)
- Adapter au nouveau format de retour (destructurer `{ flows }`)
- Seuils de confidence sur 100 au lieu de 0-1 (pre-sélection >= 50, couleurs à 70/40)
- Confirmation : PATCH avec `{ goal, suggestedFlows: flows, monitoredFlows: selectedFlows }`
- Ajouter bouton "Relancer la découverte" en secondaire

#### 4. Dashboard projet (`src/pages/ProjectDashboard.tsx`)
- Si `project.monitoredFlows` existe, afficher un résumé sous les infos projet (liste des parcours surveillés avec badges)
- Gérer `goal` nullable (ne pas afficher le badge si vide)

#### 5. Dashboard liste (`src/pages/Dashboard.tsx`)
- Gérer `goal` nullable : ne pas afficher le badge si `project.goal` est vide/null

5 fichiers modifiés.


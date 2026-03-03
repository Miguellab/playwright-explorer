

# Découverte automatique des parcours

## Résumé

Refonte du flow de création de projet : suppression de l'étape "Objectif" obligatoire, remplacement par une découverte automatique post-création qui propose des parcours à surveiller.

## Fichiers impactés

| Fichier | Action |
|---|---|
| `sentinelle-types.ts` | Ajouter `SuggestedFlow`, rendre `goal` nullable, ajouter `monitoredFlows`/`suggestedFlows` au `Project` |
| `sentinelle-api.ts` | Ajouter `discoverFlows()`, rendre `goal` optionnel dans `CreateProjectBody` |
| `Onboarding.tsx` | Refonte : supprimer step 2 (goal), passer de 3 à 2 steps (App + Surveillance), après soumission rediriger vers `/project/:id/discover` |
| `DiscoverFlows.tsx` | **Nouvelle page** — affiche le loading pendant le crawl, puis les cards de parcours suggérés avec checkboxes, bouton de confirmation |
| `App.tsx` | Ajouter route `/project/:id/discover` |

## Détails techniques

### 1. Types — `sentinelle-types.ts`

```ts
export interface SuggestedFlow {
  id: string;
  goal: string;
  labelFr: string;
  descriptionFr: string;
  confidence: number;
  evidence: string[];
  ctaText: string | null;
  pagePath: string | null;
}
```

- `Project.goal` : `string` → `string | null`
- Ajouter `suggestedFlows?: SuggestedFlow[]` et `monitoredFlows?: SuggestedFlow[]` au `Project`
- `CreateProjectBody.goal` : `string` → `string | undefined` (optionnel)

### 2. API — `sentinelle-api.ts`

Ajouter `discoverFlows(projectId)` qui POST `/projects/:id/discover` et retourne `{ runId, flows, screenshots }`.

### 3. Onboarding — simplification

- **2 steps** : "Application" (nom + URL) → "Surveillance" (fréquence + max runs)
- Supprimer step "Objectif" (plus de sélection manuelle de goal)
- Ajouter texte explicatif : "Sentinelle analysera votre site et vous proposera les parcours à surveiller"
- Après `createProject()` → `navigate(/project/${id}/discover)`

### 4. Nouvelle page `DiscoverFlows.tsx`

- Route : `/project/:id/discover`
- Au montage : appelle `discoverFlows(projectId)` (30-60s)
- **État loading** : spinner + "Analyse de votre site en cours..." + progress animation
- **État résultats** : grille de cards, chaque card contient :
  - Checkbox (pré-cochée si confidence > 50%)
  - `labelFr` en titre, `descriptionFr` en description
  - Badge confiance coloré (vert >70, orange 40-70, gris <40)
  - `evidence` en petit texte
  - `ctaText` en surbrillance si présent
- Screenshots du crawl affichés en aperçu
- Bouton "Surveiller les parcours sélectionnés" → `updateProject(id, { monitoredFlows, goal })` → redirect `/project/:id`

### 5. Route — `App.tsx`

Ajouter : `<Route path="/project/:id/discover" element={<DiscoverFlows />} />`


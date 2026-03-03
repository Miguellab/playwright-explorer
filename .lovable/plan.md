

## Onboarding en 3 étapes : Application → Objectifs → Surveillance

### Concept

Fusionner la logique de `DiscoverFlows.tsx` directement dans `Onboarding.tsx` comme étape 2, au lieu de naviguer vers une page séparée après création du projet.

### Nouveau flux

1. **Étape 0 — Application** : Nom + URL (inchangé)
2. **Étape 1 — Objectifs** : Créer le projet, lancer `discoverFlows`, afficher le loading animé puis les cards cochables avec les parcours détectés
3. **Étape 2 — Surveillance** : Fréquence, max tests/jour, auto-test (inchangé mais étape 2 au lieu de 1). Le bouton final confirme les parcours sélectionnés via `updateProject` puis redirige vers `/project/:id`

### Changements

#### `src/pages/Onboarding.tsx`
- Ajouter l'icône `Target` aux STEPS : `[Globe, Target, Eye]` (Application, Objectifs, Surveillance)
- Importer `discoverFlows`, `updateProject`, `Checkbox`, `Badge`, `Progress`, etc.
- Ajouter les states : `flows`, `selected`, `progress`, `messageIdx`, `phase`, `projectId`, `errorMsg`
- **Étape 0 → "Continuer"** : crée le projet via `createProject`, stocke `projectId`, lance `discoverFlows(projectId)` avec loading animé (progress bar + messages tournants)
- **Étape 1** : Affiche le loading pendant l'analyse, puis les cards cochables (même UI que `DiscoverFlows.tsx` actuel). Bouton "Continuer" pour passer à l'étape 2 (disabled si aucun flow sélectionné, sauf si 0 flows détectés). Bouton "Relancer" en secondaire
- **Étape 2** : Config surveillance (inchangée). Le bouton final appelle `updateProject(projectId, { goal, suggestedFlows, monitoredFlows, checkFrequencyMin, maxRunsPerDay })` puis redirige vers `/project/:id`

#### `src/pages/DiscoverFlows.tsx`
- Garder tel quel pour accès standalone via `/project/:id/discover` (relance manuelle depuis le dashboard)

1 fichier modifié : `Onboarding.tsx`.


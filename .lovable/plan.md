

## Remplacer le select "Objectif" par une section "Parcours surveillés" avec checkboxes

### Modifications

**1. `src/lib/sentinelle-types.ts`** — Ajouter `requiresCredentials?: boolean` a `SuggestedFlow`.

**2. `src/pages/ProjectSettings.tsx`** — Changements principaux :

- Supprimer le state `goal` et `goals`, l'import `listGoals`, `Goal`, et les composants `Select*`.
- Ajouter un state `selectedFlowIds: Set<string>` initialise depuis `project.monitoredFlows`.
- Remplacer le bloc Select "Objectif" (lignes 133-147) par une section "Parcours surveilles" :
  - Pour chaque flow dans `project.suggestedFlows`, afficher une ligne avec :
    - `Checkbox` (coche si le flow est dans `selectedFlowIds`)
    - `labelFr`
    - Badge gris avec `confidence%`
    - Badge orange "Identifiants requis" si `requiresCredentials === true`
  - Si `suggestedFlows` est vide, afficher un message "Aucun parcours decouvert"
- Dans `handleSave`, envoyer `monitoredFlows` (les flows selectionnes filtres depuis `suggestedFlows`) au lieu de `goal`.
- Supprimer l'appel `listGoals()` du useEffect.

### Fichiers modifies

1. `src/lib/sentinelle-types.ts`
2. `src/pages/ProjectSettings.tsx`


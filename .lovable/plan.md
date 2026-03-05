

## Découverte authentifiée — Plan d'implémentation

### Résumé
Ajouter le support de la découverte authentifiée (exploration post-login) : nouveau endpoint API, bouton sur le dashboard, badges "Post-login" sur les flows authentifiés.

### Changements

**1. `src/lib/sentinelle-types.ts`**
- Ajouter `authenticatedOnly?: boolean` à l'interface `SuggestedFlow`

**2. `src/lib/sentinelle-api.ts`**
- Ajouter la fonction `discoverAuthenticatedFlows(projectId, opts?)` qui appelle `POST /projects/:id/discover-authenticated`

**3. `src/pages/ProjectDashboard.tsx`**
- Ajouter state `discovering`
- Calculer `hasLoginWithCreds` : `project.monitoredFlows?.some(f => f.goal === "LOGIN" && f.hasCredentials)`
- Ajouter une Card "Zone authentifiée" après le bloc "Parcours surveillés" (ligne ~339) avec bouton "Découvrir les parcours" qui appelle `discoverAuthenticatedFlows`
- Handler : appel API, toast succès/échec login/erreur, refresh project via `getProject`
- Dans la liste des badges de parcours surveillés (ligne ~321), ajouter un badge bleu "Post-login" si `flow.authenticatedOnly`
- Imports : `discoverAuthenticatedFlows` depuis sentinelle-api

**4. `src/pages/ProjectSettings.tsx`**
- Dans la boucle `suggestedFlows.map(...)` (ligne ~215), ajouter un badge bleu "Post-login" à côté des autres badges si `flow.authenticatedOnly`

**5. `src/pages/DiscoverFlows.tsx`**
- Ajouter badge "Post-login" sur les flows avec `authenticatedOnly: true` dans la liste des résultats (ligne ~240)

### Fichiers modifiés

| Fichier | Nature |
|---------|--------|
| `sentinelle-types.ts` | +1 champ optionnel |
| `sentinelle-api.ts` | +1 fonction API |
| `ProjectDashboard.tsx` | Card + bouton + handler + badge |
| `ProjectSettings.tsx` | Badge "Post-login" |
| `DiscoverFlows.tsx` | Badge "Post-login" |


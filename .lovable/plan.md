

## Mise a jour backend : screenshots, decouverte authentifiee, nettoyage

### 1. Screenshots — correction des URLs

**Fichier : `src/lib/sentinelle-api.ts`**

La fonction `getScreenshotUrl` fonctionne deja correctement : elle prefixe `BASE_URL` aux chemins relatifs. Le nouveau format `/runs/{runId}/screenshots/screenshot-1.png` est un chemin relatif qui sera correctement resolu.

**Fichier : `src/hooks/use-authenticated-image.ts`**

Le hook utilise deja `BASE_URL` + Bearer token pour les URLs Sentinelle. Le nouveau format de chemin sera automatiquement gere. Cependant, la logique `isRunnerUrl` n'est plus necessaire puisque les screenshots passent maintenant par le proxy Sentinelle. On peut simplifier en utilisant toujours le token API Sentinelle.

### 2. Decouverte authentifiee — nouveau format de reponse

**Fichier : `src/lib/sentinelle-api.ts`**

Mettre a jour `AuthenticatedDiscoverResult` :
- Supprimer `visionAnalysis` et `visionError`
- Supprimer `allFlows`
- Ajouter `rawNavigation: { linksCount: number; buttonsCount: number; formsCount: number; visitedPagesCount: number }`

**Fichier : `src/lib/sentinelle-types.ts`**

Ajouter le champ `source?: "nav-link" | "button" | "detected"` a l'interface `SuggestedFlow`.

**Fichier : `src/pages/ProjectDashboard.tsx`**

Mettre a jour `handleAuthenticatedDiscovery` :
- Afficher le nombre de parcours trouves dans le toast (deja fait)
- Supprimer toute reference a `visionAnalysis`

**Fichier : `src/pages/DiscoverFlows.tsx`**

- Supprimer l'affichage du `confidence` score (badge %, label confiance elevee/moyenne/faible)
- Supprimer le `visionError` banner
- Grouper les flows par `source` visuellement avec des icones distinctes :
  - `nav-link` : icone Menu, couleur neutre
  - `button` : icone MousePointerClick, couleur accent
  - `detected` : icone Sparkles
- Afficher `pagePath` a cote du label quand disponible (ex: "Pipeline → /admin")
- Afficher `rawNavigation` en texte informatif si disponible (doit etre passe via le state ou re-fetche — on affichera si disponible)
- Mettre a jour le toast de confirmation : "X parcours trouves"

### 3. Nettoyage types

**Fichier : `src/lib/sentinelle-types.ts`**
- Supprimer `verdict` et `verdictSummary` s'ils existent (verification : ils n'existent pas dans les types actuels, deja nettoye)
- Ajouter `source` a `SuggestedFlow`

### Resume des fichiers modifies

| Fichier | Changement |
|---|---|
| `src/lib/sentinelle-types.ts` | Ajouter `source` a `SuggestedFlow` |
| `src/lib/sentinelle-api.ts` | Mettre a jour `AuthenticatedDiscoverResult` (supprimer visionAnalysis/visionError/allFlows, ajouter rawNavigation) |
| `src/hooks/use-authenticated-image.ts` | Simplifier : toujours utiliser le token Sentinelle API |
| `src/pages/DiscoverFlows.tsx` | Supprimer confidence scores, grouper par source, afficher pagePath, supprimer visionError |
| `src/pages/ProjectDashboard.tsx` | Nettoyer handleAuthenticatedDiscovery (supprimer refs visionAnalysis) |


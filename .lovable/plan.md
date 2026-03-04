

## 3 corrections sur le rapport de run

### Probleme 1 : OK + FAILED -- information confuse

Le verdict IA (OK) et le statut technique (FAILED) coexistent sans explication. L'utilisateur ne comprend pas la difference.

**Solution** : Fusionner en une seule banniere claire. Le verdict IA prime (c'est l'info utile). Le statut technique "FAILED" est relégué en detail secondaire avec une explication courte :

- Afficher le verdict IA en gros (VerdictBadge)
- Sous le headline, si `run.status !== "passed"`, afficher un petit texte explicatif : "Le test s'est terminé avec une erreur technique, mais l'analyse IA n'a détecté aucun problème fonctionnel." au lieu d'un badge FAILED brut sans contexte.
- Supprimer le `StatusBadge` isolé dans la bannière verdict -- il crée la confusion.

### Probleme 2 : "Résumé pour vous" vide

La section s'affiche même quand `vs.forUser` est une chaine vide ou undefined. Le `<p>` est rendu avec un contenu vide.

**Solution** : Ne pas afficher la card "Résumé pour vous" si `vs.forUser` est falsy (vide/null/undefined). Condition : `{vs && vs.forUser && (...)}`.

### Probleme 3 : Captures d'écran cassées

L'image affiche l'icone broken-image. L'URL construite par `getScreenshotUrl(shot.path)` est probablement incorrecte (path relatif mal prefixé ou CORS).

**Solution** : 
- Ajouter un handler `onError` sur le `<img>` pour afficher un placeholder au lieu de l'icône cassée.
- Logger l'URL en console pour debug.
- Verifier que `getScreenshotUrl` construit bien l'URL (path commence par `/` ou non). Ajouter un `/` si le path ne commence pas par `/` et n'est pas une URL absolue.

### Fichiers modifies

1. **`src/pages/RunReport.tsx`** : les 3 corrections ci-dessus
2. **`src/lib/sentinelle-api.ts`** : fix potentiel sur `getScreenshotUrl` (ajout du `/` manquant)


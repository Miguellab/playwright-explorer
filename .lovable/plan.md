
Objectif: corriger l’affichage de la carte “Zone authentifiée” pour qu’il suive le même signal que le backend/UI settings (`hasCredentials`) au lieu de dépendre de `credentials.email`.

Constat rapide:
- `src/components/AuthenticatedZone.tsx` utilise actuellement:
  `f.goal === "LOGIN" && f.credentials && f.credentials.email`
- Dans le reste de l’app (`ProjectSettings`, `DiscoverFlows`), l’état “identifiants configurés” repose sur `f.hasCredentials`.
- Comme le backend ne renvoie pas toujours les credentials complets en clair, le check sur `credentials.email` peut rester faux même quand la config est valide.

Plan d’implémentation (1 fichier):
1) Ouvrir `src/components/AuthenticatedZone.tsx`.
2) Dans le `useEffect` de vérification des credentials, remplacer le prédicat `some(...)` par:
   `f.goal === "LOGIN" && f.hasCredentials`
3) Ne rien changer d’autre dans le composant (phases idle/discovering/results/error inchangées).

Validation prévue:
- Cas A: projet avec flow LOGIN + `hasCredentials=true` → la carte “Zone authentifiée” apparaît.
- Cas B: projet avec flow LOGIN + `hasCredentials=false` (ou pas de LOGIN) → la carte reste masquée.
- Vérifier qu’aucune erreur TypeScript/runtime n’est introduite.

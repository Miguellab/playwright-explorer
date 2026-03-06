

## Supprimer reportUrl et le lien "Voir le rapport complet"

### Fichiers à modifier

**1. `src/pages/RunReport.tsx`**
- Supprimer `REPORT_BASE` (ligne 26)
- Supprimer `reportOpen` state (ligne 45)
- Supprimer `ExternalLink` de l'import lucide (ligne 23)
- Supprimer le bloc "Report link" (lignes 330-342)

**2. `src/lib/sentinelle-types.ts`**
- Retirer `reportUrl` de `RunAssets`, ne garder que `screenshots` :
```ts
export interface RunAssets {
  screenshots?: { label: string; filename: string; path: string }[];
}
```

**3. `src/lib/sentinelle-api.ts`**
- Supprimer la fonction `getReportUrl` (lignes 169-171)

**4. `supabase/functions/test-runs/index.ts`**
- Retirer `reportUrl` de l'objet `assets` (ligne 204)
- Retirer `report_path` de `updateData` (ligne 201) si présent

3-4 fichiers, ~20 lignes retirées.


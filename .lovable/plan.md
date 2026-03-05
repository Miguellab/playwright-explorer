

## Suppression du verdict IA — Plan

### Résumé
Supprimer tout le système de verdict IA (OK/ALERTE/ERREUR/EN ATTENTE) et ne garder que `run.status` (passed/failed/error/running/queued) comme seul indicateur affiché.

### Changements

**1. `src/lib/sentinelle-types.ts`**
- Supprimer le type `Verdict`
- Supprimer les interfaces `VerdictIssue`, `VerdictSummary`
- Supprimer les champs `verdict`, `verdictSummary` de l'interface `Run`

**2. Supprimer `src/components/VerdictBadge.tsx`**
- Fichier entier supprimé — plus utilisé nulle part

**3. `src/pages/RunReport.tsx`**
- Supprimer import `VerdictBadge`
- Supprimer `vs`, `hasIssues`, `hasHumanQA`
- Remplacer le bloc verdict banner (lignes 128-166) par un simple header avec `StatusBadge` + durée + date
- Supprimer la section "Résumé pour vous" (lignes 178-215) — plus de `forUser`/`forCTO`
- Supprimer la section "Problèmes détectés" (lignes 326-382) — plus d'issues
- Supprimer imports `Collapsible`, `Terminal`, `UserCheck`

**4. `src/pages/ProjectDashboard.tsx`**
- Supprimer import `VerdictBadge`, `VerdictText`
- Header (ligne 276) : remplacer `latestRun?.verdict ? <VerdictBadge>` par `latestRun ? <StatusBadge status={latestRun.status} />`
- Carte verdict (lignes 411-453) : remplacer le contenu `verdictSummary` par un affichage simple du statut du dernier run avec `StatusBadge` en grand
- Historique (lignes 609-613) : remplacer `run.verdict ? <VerdictBadge> : <StatusBadge>` par toujours `<StatusBadge status={run.status} />`
- Supprimer la légende verdict (ligne 624-626)

**5. `src/pages/Dashboard.tsx`**
- Supprimer import `VerdictBadge`
- Dot de statut (lignes 192-204) : remplacer le mapping `verdict` par un mapping `status` (`passed` → vert, `failed`/`error` → rouge, sinon gris)
- Badge (lignes 211-213) : remplacer `VerdictBadge verdict={...}` par `StatusBadge status={lastRuns[project.id].status}`

**6. `src/pages/Logs.tsx`**
- Supprimer import `VerdictBadge`
- Supprimer la colonne "Verdict" du header et du body
- Supprimer la légende "Statut = ... | Verdict = ..."

### Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `sentinelle-types.ts` | Supprimer `Verdict`, `VerdictIssue`, `VerdictSummary`, champs verdict dans `Run` |
| `VerdictBadge.tsx` | Supprimé entièrement |
| `RunReport.tsx` | Header simplifié avec StatusBadge, suppression sections verdict/issues/résumé |
| `ProjectDashboard.tsx` | StatusBadge partout à la place de VerdictBadge |
| `Dashboard.tsx` | Dot + badge basés sur status au lieu de verdict |
| `Logs.tsx` | Colonne verdict supprimée |


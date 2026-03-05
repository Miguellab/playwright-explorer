

## Ajout de filtres sur l'historique des tests (ProjectDashboard)

### Fichier modifié : `src/pages/ProjectDashboard.tsx`

Ajouter une barre de filtres dans la section "Historique des tests" (lignes 558-616), entre le `CardHeader` et le `CardContent`, avec :

1. **Champ recherche** — filtre sur le parcours (`flowLabel`) et le type de trigger.
2. **Filtre par statut** — `Select` : Tous / Passed / Failed / Error / Running / Queued.
3. **Filtre par date** — Deux `Input type="date"` (début / fin).

### Implementation

- 3 nouveaux states : `historySearch`, `historyStatus`, `historyDateStart`, `historyDateEnd`
- Un `useMemo` `filteredRunGroups` qui filtre `runs` puis regroupe via `groupRuns()`
- La barre de filtres est compacte (plus petite que sur Logs car contexte projet unique — pas de filtre projet)
- Affichage du compteur de résultats si filtré
- Layout : flex-wrap dans le CardContent, au-dessus de la liste

### Composants réutilisés

`Input`, `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `Search` icon — tous déjà importés ou disponibles.


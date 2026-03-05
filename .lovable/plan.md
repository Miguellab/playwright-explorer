

## Ajout filtre par parcours (flowLabel) — Historique des tests

### Fichier modifié : `src/pages/ProjectDashboard.tsx`

1. Ajouter un state `historyFlow` (`"all"` par défaut)
2. Extraire dynamiquement les `flowLabel` distincts depuis `runs` via `useMemo`
3. Ajouter un `Select` "Parcours" entre le filtre statut et les dates
4. Ajouter la condition `historyFlow !== "all"` dans le `filteredRuns` useMemo
5. Inclure `historyFlow` dans les dépendances du useMemo

### Layout mis à jour

```text
[🔍 Rechercher...] [Statut ▼] [Parcours ▼] [Date début] [Date fin]
```

Un seul fichier, ~15 lignes ajoutées.


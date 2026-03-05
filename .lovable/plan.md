

## Ajout de filtres et recherche sur la page Logs

### Fichier modifié : `src/pages/Logs.tsx`

Ajouter une barre de filtres entre le titre et le tableau avec :

1. **Champ recherche** — `Input` avec icône `Search`, filtre sur le nom du projet, le parcours (flowLabel) et le statut. Recherche en temps réel (texte libre).

2. **Filtre par date** — Deux champs `Input type="date"` (date début / date fin) pour filtrer les runs par plage de dates.

3. **Filtre par statut** — `Select` avec les options : Tous, Passed, Failed, Error, Running, Queued.

4. **Filtre par projet** — `Select` peuplé dynamiquement à partir des noms de projets distincts extraits des données chargées. Option "Tous les projets" par défaut.

### Implémentation

- 4 states : `search`, `statusFilter`, `projectFilter`, `dateRange` (start/end)
- Un `useMemo` `filteredRows` qui applique tous les filtres sur `rows`
- La table itère sur `filteredRows` au lieu de `rows`
- Affichage du nombre de résultats filtrés
- Les filtres sont disposés en ligne (flex-wrap) au-dessus du tableau
- Composants utilisés : `Input` (déjà existant), `Select`/`SelectTrigger`/`SelectContent`/`SelectItem` (déjà existants)

### Layout des filtres

```text
[🔍 Rechercher...          ] [Statut ▼] [Projet ▼] [Date début] [Date fin]
```

Responsive : flex-wrap pour mobile.


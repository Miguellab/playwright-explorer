

## Fix: Supprimer le doublon de bouton jaune quand aucune release n'existe

### Probleme

Quand `displayRelease` est `null` (premier test), deux boutons neon s'affichent :
1. "Lancer un premier test" dans la carte empty state (ligne 283)
2. "Lancer un test maintenant" dans la barre d'actions (ligne 304)

### Solution

Conditionner la barre d'actions (lignes 302-339) pour ne s'afficher que quand `displayRelease` existe. Quand il n'y a pas de release, seul le bouton dans la carte empty state suffit.

### Changement

**`src/pages/ProjectDashboard.tsx`** — ligne 302 :

Remplacer :
```
{project.configStatus !== "no_flows" && (
```
Par :
```
{project.configStatus !== "no_flows" && displayRelease && (
```

1 fichier, 1 ligne modifiee.




## Ajouter le réglage "Nombre max de tests par jour" dans les paramètres projet

### Constat
- `maxRunsPerDay` est retourné par l'API sur chaque projet (valeur actuelle : 10)
- L'API supporte `PATCH /api/projects/:id` avec `maxRunsPerDay` dans le body
- Aucun champ dans l'UI ne permet de le consulter ou modifier
- Le toast "Limite atteinte — Réessayez demain" s'affiche sans que l'utilisateur sache quelle est la limite ni ou la changer

### Changement

#### `src/pages/ProjectSettings.tsx`
Ajouter une section "Limites" dans les parametres projet :
- Un champ `Input` de type `number` pour `maxRunsPerDay`, pre-rempli avec la valeur du projet
- Label : "Tests maximum par jour"
- Description : "Nombre maximum de tests pouvant etre lances par jour pour ce projet."
- Min: 1, Max: 100
- Sauvegarde avec le reste du formulaire via `updateProject({ maxRunsPerDay })`

Placer cette section apres le bloc "Surveillance" (enabled/siteUrl) et avant la zone dangereuse (suppression).

### Fichiers impactes
1. `src/pages/ProjectSettings.tsx` — ajout champ maxRunsPerDay


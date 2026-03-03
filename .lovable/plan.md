

## Analyse

La suppression de projet est déjà implémentée dans `ProjectSettings.tsx` (zone de danger en bas de page). Le chemin pour y accéder :

1. Dashboard → cliquer sur la carte projet → **ProjectDashboard**
2. En haut à droite, bouton **"Paramètres"** → **ProjectSettings**
3. Scroller jusqu'à la **Zone de danger** → bouton rouge **"Supprimer"**

Le flow existe mais il est enfoui (3 clics + scroll). 

## Proposition : accès direct à la suppression depuis le Dashboard

Ajouter un **menu contextuel** (dropdown "⋯") sur chaque carte projet dans `Dashboard.tsx` avec les options :
- **Paramètres** → lien vers `/project/:id/settings`
- **Supprimer** → AlertDialog de confirmation directement inline

### Fichiers modifiés

| Fichier | Changement |
|---|---|
| `Dashboard.tsx` | Ajouter un `DropdownMenu` avec icône `MoreVertical` sur chaque carte, contenant "Paramètres" et "Supprimer" avec AlertDialog de confirmation |

### Détail technique

- Importer `DropdownMenu`, `AlertDialog`, `deleteProject` et icônes `MoreVertical`, `Settings`, `Trash2`
- Le dropdown se place à droite de la carte, à côté du Switch existant
- L'option "Supprimer" ouvre un `AlertDialog` identique à celui de `ProjectSettings.tsx`
- Après suppression : retirer le projet de la liste locale + toast "Projet supprimé"

~40 lignes ajoutées dans `Dashboard.tsx`.


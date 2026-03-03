

## Suppression de la zone de danger dans ProjectSettings

Retirer le bloc "Zone de danger" (lignes 222-266) de `src/pages/ProjectSettings.tsx`, ainsi que les imports et states devenus inutiles (`deleteProject`, `AlertDialog*`, `Trash2`, `deleting`, `handleDelete`).

La suppression de projet est déjà gérée via le menu contextuel sur le dashboard.

1 fichier modifié : `src/pages/ProjectSettings.tsx`.


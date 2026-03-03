

## Suppression de la Zone de danger dans ProjectSettings

La suppression de projet est maintenant accessible directement depuis le Dashboard via le menu contextuel (⋯). La "Zone de danger" dans `ProjectSettings.tsx` est donc redondante.

### Modification

**`src/pages/ProjectSettings.tsx`** : Supprimer le bloc `<Separator>` + `<Card className="border-destructive/30">` (zone de danger) ainsi que les imports et state devenus inutiles (`deleteProject`, `AlertDialog*`, `Trash2`, `deleting`, `handleDelete`, `navigate`).


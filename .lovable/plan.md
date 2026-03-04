

## Harmoniser le header projet + ajouter suppression

### 1. Header harmonise (ProjectDashboard.tsx)

**Ligne du titre** : Remplacer le badge `goal` par `VerdictBadge` du dernier run (comme sur les cards du dashboard). Garder le badge "En pause" si desactive.

**Ligne URL** : Fusionner URL + derniere verification sur une seule ligne avec un separateur `·`, comme sur les cards. Supprimer le bloc "Last check info" standalone (lignes 221-227).

### 2. Bouton supprimer le projet

Ajouter un bouton "Supprimer" (icone Trash2, variant destructive/ghost) a cote du bouton Parametres dans le header. Au clic, ouvrir un `AlertDialog` de confirmation (meme pattern que dans Dashboard.tsx). Apres suppression, rediriger vers `/` avec `useNavigate`.

### Imports a ajouter

- `deleteProject` depuis sentinelle-api
- `useNavigate` depuis react-router-dom
- `Trash2` depuis lucide-react
- `AlertDialog` composants depuis ui/alert-dialog
- `VerdictBadge` est deja importe

### Fichier modifie

`src/pages/ProjectDashboard.tsx` uniquement.


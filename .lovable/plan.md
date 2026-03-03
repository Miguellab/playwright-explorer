

# Fix : rendre les runs cliquables dans la page Logs

## Diagnostic

Les liens existent (sur la date), mais ils sont quasi invisibles — pas de couleur distincte, juste un `hover:underline` discret. L'utilisateur ne voit pas qu'on peut cliquer.

## Correction

**`src/pages/Logs.tsx`** — Rendre toute la ligne cliquable en wrappant le `<TableRow>` dans un comportement de navigation, et ajouter un style visuel clair :

1. Ajouter `onClick` + `cursor-pointer` + `hover:bg-muted/50` sur chaque `<TableRow>` pour naviguer vers `/project/{projectId}/run/{runId}`
2. Utiliser `useNavigate` de react-router-dom
3. Garder le lien sur la date mais le rendre plus visible avec `text-primary font-medium`

1 fichier, ~10 lignes modifiées.


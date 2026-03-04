

## Probleme : message d'erreur technique affiché sans raison visible

La condition actuelle est `run.status !== "passed"` -- trop large. Le status peut être autre chose que "passed" (ex: "error", "failed") même si toutes les étapes sont PASS. Le message "erreur technique" s'affiche alors que rien ne le justifie visuellement.

### Correction

Fichier : `src/pages/RunReport.tsx`, ligne 126

Remplacer la condition par :

```tsx
{run.status !== "passed" && vs.verdict === "OK" && run.error && (
```

Ainsi le message ne s'affiche **que** s'il y a réellement une erreur technique (`run.error` est truthy), pas juste parce que le status n'est pas "passed".


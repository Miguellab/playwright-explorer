

## Afficher le statut technique dans le rapport

Dans `src/pages/RunReport.tsx`, dans la bannière verdict (zone avec durée/date), ajouter le `StatusBadge` quand le statut technique n'est pas "passed". Cela rend visible qu'un run est "FAILED" techniquement même si le verdict IA est "OK".

Modification : ajouter `{run.status !== "passed" && <StatusBadge status={run.status} />}` dans la ligne des métadonnées de la bannière verdict.

1 fichier modifié : `src/pages/RunReport.tsx`.




## Remplacer le point noir par une pastille verdict colorée

Le point noir actuel (lignes 158-164 de `Dashboard.tsx`) est statique et n'apporte aucune info. On le remplace par une pastille colorée basée sur le verdict du dernier run.

### Changement unique : `src/pages/Dashboard.tsx`

**Supprimer** le bloc "Status dot" (lignes 158-164) et le remplacer par une pastille colorée dynamique basée sur `lastRuns[project.id]?.verdict` :

- **OK** → pastille verte (`bg-status-pass`)
- **ALERTE** → pastille orange (`bg-status-skipped`)
- **ERREUR** → pastille rouge (`bg-status-fail`)
- **Pas de run / projet désactivé** → pastille grise (`bg-muted-foreground/40`)

La pastille reste un simple `div` rond de 2.5 (ou 3) avec la couleur correspondante. Pas de badge texte, juste le point coloré à gauche du nom pour un aperçu visuel immédiat.

On pourra aussi retirer le `VerdictBadge` dupliqué (lignes 173-175) puisque la pastille porte déjà l'info — ou le garder si vous souhaitez les deux. Par défaut je garde les deux : pastille couleur + badge texte.


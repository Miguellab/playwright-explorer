

## Supprimer le doublon "PASSED"

Le StatusBadge du header (ligne 312) donne déjà le statut global. La carte "Verdict" (lignes 446-500) est redondante : quand le run passe, elle affiche uniquement "PASSED" sans info supplémentaire.

### Solution

**Fichier : `src/pages/ProjectDashboard.tsx`**

Supprimer la carte "Verdict" (le bloc `lg:col-span-2` Card, lignes ~446-500) et réorganiser la grille pour que le bouton "Lancer un test" prenne toute la largeur ou reste dans une grille simplifiée.

Le header conserve le StatusBadge à côté du nom du projet — c'est le seul endroit nécessaire.

Si le run est en cours (`queued`/`running`), le message "Test en cours..." et le spinner seront déplacés directement sous le header ou intégrés dans la zone du bouton test.

Si `run.error` existe (cas `failed`/`error`), l'erreur est déjà visible dans la section "Étapes du dernier test" ou dans le rapport. Pas besoin d'une carte dédiée.

### Résumé

| Élément | Action |
|---|---|
| Header StatusBadge (l.312) | Conservé |
| Carte Verdict (l.446-500) | Supprimée — doublon |
| Message "Test en cours" | Déplacé dans la zone bouton test ou sous le header |
| `run.error` | Visible dans les étapes / rapport |

1 fichier, ~50 lignes retirées/déplacées.


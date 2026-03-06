

## Retirer le radio button, garder uniquement le Switch

### Changement dans `src/pages/DiscoverFlows.tsx`

**Supprimer le bouton radio** (lignes 232-247) qui sert a selectionner le parcours principal.

**Adapter la logique du Switch** : quand le switch est active et qu'il n'y a qu'un seul flow enabled, il devient automatiquement le parcours principal. Le premier flow active devient le main flow par defaut. Quand on desactive un flow qui etait le main flow, le main flow passe au premier flow encore active.

**Retirer l'import `Star`** de lucide-react (plus utilise).

1 fichier, ~20 lignes modifiees.


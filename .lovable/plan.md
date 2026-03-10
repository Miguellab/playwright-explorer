

## Désactiver le bouton "Retester" quand un test global est en cours

### Problème
Quand un test manuel global est lancé (tous les flows), les boutons "Retester" individuels sur chaque `FlowAccordion` restent actifs. Ils devraient être grisés tant que le test global est en cours.

### Solution
- Passer la variable `isActive` (déjà calculée ligne 224) comme nouvelle prop `disabled` aux composants `FlowAccordion`
- Dans `FlowAccordion`, quand `disabled` est `true`, masquer le bouton retest (ou le désactiver)

### Fichiers impactés

| Fichier | Changement |
|---|---|
| `src/components/FlowAccordion.tsx` | Ajouter prop `disabled?: boolean`, désactiver le bouton retest quand `disabled` est true |
| `src/pages/ProjectDashboard.tsx` | Passer `disabled={isActive}` aux deux endroits où `FlowAccordion` est utilisé (lignes 314 et 331) |


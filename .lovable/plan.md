

## Transformer les sections de flows en accordéons

### Changement

Dans `src/pages/ProjectSettings.tsx`, remplacer les `<div>` statiques de chaque catégorie (Parcours utilisateur, Pages critiques, Éléments d'interface) par un composant `Accordion` de shadcn/ui (déjà installé).

Chaque catégorie devient un `AccordionItem` :
- Le **trigger** affiche le badge coloré + le titre + le nombre de flows sélectionnés (ex: "3/5")
- Le **content** contient la description + la liste des flows avec checkboxes

L'accordion sera en mode `multiple` avec toutes les sections ouvertes par défaut (`defaultValue` = les 3 types).

### Fichier impacté

`src/pages/ProjectSettings.tsx` — importer `Accordion, AccordionItem, AccordionTrigger, AccordionContent` et restructurer le rendu des 3 sections (lignes 167-245).




## Afficher `descriptionFr` sous le label de chaque parcours

**Fichier : `src/pages/ProjectSettings.tsx`**

Modifier le bloc d'affichage du flow (lignes 203-216) pour transformer le `div` flex en colonne et ajouter `flow.descriptionFr` en dessous du label :

- Restructurer le conteneur : séparer le label+badges (première ligne) de la description (deuxième ligne)
- Ajouter sous la ligne existante : `{flow.descriptionFr && <p className="font-mono text-xs text-muted-foreground">{flow.descriptionFr}</p>}`
- Le tout reste dans le `<label>` existant pour garder le clic sur la checkbox


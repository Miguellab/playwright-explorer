

# Fix : écran blanc causé par une variable CSS invalide

## Diagnostic

La variable `--sidebar-border: 0 0% 100% / 10%;` casse le build. Tailwind génère `hsl(var(--sidebar-border))`, et la notation `/ 10%` (alpha) à l'intérieur d'un `hsl()` produit du CSS invalide dans certains contextes de compilation Tailwind. Résultat : le bundle JS n'est pas généré → 404 → écran blanc.

## Correction

**Fichier `src/index.css`** (ligne 54) — remplacer la valeur alpha par une couleur HSL simple :

```css
/* Avant */
--sidebar-border: 0 0% 100% / 10%;

/* Après — blanc à 20% de luminosité, pas d'alpha */
--sidebar-border: 220 10% 20%;
```

Une seule ligne à changer.


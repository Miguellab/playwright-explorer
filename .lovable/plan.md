

# Fix : texte "Sentinelle" invisible dans la sidebar

## Diagnostic

Le logo utilise `text-primary` qui en mode light correspond à `hsl(266 4% 20.8%)` — un gris très foncé, quasi invisible sur le fond sombre de la sidebar (`220 18% 10%`).

## Correction

**`src/components/AppSidebar.tsx`** (lignes 35 et 37) — remplacer `text-primary` par `text-sidebar-foreground` pour que le texte et l'icône héritent de la couleur claire de la sidebar :

- Icône Shield : `text-sidebar-foreground`
- Texte "Sentinelle" : `text-sidebar-foreground`

2 classes à changer, 1 fichier.


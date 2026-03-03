

# Fix : liens invisibles dans la sidebar

## Diagnostic

Le problème est dans les variables CSS. La sidebar a un fond sombre (`--sidebar-background: 220 18% 10%`) mais le texte (`--sidebar-foreground`) est quasi-noir (`265 4% 12.9%`). Texte sombre sur fond sombre = invisible.

Les variables `--sidebar-accent` et `--sidebar-accent-foreground` ont le même problème.

## Correction

**Fichier `src/index.css`** — Dans le bloc `:root`, remplacer les variables sidebar par des couleurs claires adaptées au fond sombre :

```css
--sidebar-foreground: 248 0.3% 98.4%;        /* was dark, now light */
--sidebar-primary: 264 24.3% 48.8%;           /* accent violet */
--sidebar-primary-foreground: 248 0.3% 98.4%; /* stays light */
--sidebar-accent: 220 15% 18%;                /* slightly lighter than bg */
--sidebar-accent-foreground: 248 0.3% 98.4%;  /* light text */
--sidebar-border: 0 0% 100% / 10%;            /* subtle light border */
```

Un seul fichier à modifier, 6 lignes.


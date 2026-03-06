

## Harmoniser le bloc "Intelligence Artificielle"

### Changements dans `src/pages/SettingsPage.tsx`

**1. Retirer l'icone Sparkles et le badge "Configurée/Non configurée"** (lignes 140-150)
- Remplacer le `<div className="flex items-center gap-2">` par un simple `<CardTitle>` identique aux autres cartes (comme "Configuration du Runner" ligne 110)

**2. Harmoniser le bouton "Sauvegarder la clé"** (lignes 193-214)
- Retirer `variant="secondary"`
- Changer le label de "Sauvegarder la clé" → "Enregistrer"
- Le bouton utilisera le style `default` comme celui du runner

**3. Nettoyer l'import** : retirer `Sparkles` de l'import lucide (ligne 10)

1 fichier, ~10 lignes modifiées.


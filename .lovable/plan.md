

## Plan : Deplacer la section "Intelligence Artificielle" vers /settings

La configuration de la cle Anthropic est globale (pas liee a un projet). Elle doit etre dans `SettingsPage.tsx` (/settings), pas dans `ProjectSettings.tsx`.

### Modifications

**1. `src/pages/SettingsPage.tsx`** — Ajouter la section IA :
- Importer `getSettings`, `updateSettings` depuis sentinelle-api
- Ajouter les states : `anthropicKey`, `hasAnthropicKey`, `showKey`, `savingKey`
- Appeler `getSettings()` dans le useEffect existant
- Ajouter une Card "Intelligence Artificielle" (apres la card Runner) avec le meme contenu que celui actuellement dans ProjectSettings : icone Sparkles, badge Configuree/Non configuree, champ password avec toggle, texte d'aide, bouton sauvegarder

**2. `src/pages/ProjectSettings.tsx`** — Retirer la section IA :
- Supprimer les states `anthropicKey`, `hasAnthropicKey`, `showKey`, `savingKey`
- Supprimer `getSettings`/`updateSettings` des imports
- Supprimer l'appel `getSettings()` du useEffect (garder seulement `getProject`)
- Supprimer `handleSaveKey`
- Supprimer la Card "Intelligence Artificielle" (lignes 263-325)
- Supprimer les imports `Eye`, `EyeOff`, `Sparkles` si plus utilises (Sparkles reste pour le badge analyse)

### Autocritique

L'erreur venait du fait que le plan precedent n'a pas distingue "configuration globale de l'instance Sentinelle" vs "configuration specifique a un projet". La cle Anthropic est utilisee par le backend pour toutes les decouvertes, pas pour un projet en particulier. La regle a appliquer : si une config est dans `GET/PATCH /settings` (endpoint sans projectId), elle va dans la page globale /settings. Si elle est dans `GET/PATCH /projects/:id`, elle va dans les settings projet.

### Fichiers modifies
1. `src/pages/SettingsPage.tsx`
2. `src/pages/ProjectSettings.tsx`


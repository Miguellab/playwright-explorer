

## Plan : Section "Configuration IA" + badge analyse dans ProjectSettings

### 1. Types (`src/lib/sentinelle-types.ts`)

- Ajouter `discoveryMeta?: { analysisMode?: string }` a l'interface `Project`
- Ajouter interface `SentinelleSettings` : `{ hasAnthropicApiKey: boolean; anthropicApiKey?: string }`

### 2. API (`src/lib/sentinelle-api.ts`)

- `getSettings()` : GET `/settings` → `SentinelleSettings`
- `updateSettings(body)` : PATCH `/settings` → `SentinelleSettings`

### 3. ProjectSettings.tsx — Section "Intelligence Artificielle"

Nouvelle Card apres la card projet existante :
- Titre avec icone `Sparkles` + badge "Configuree" (vert) ou "Non configuree" (gris) selon `hasAnthropicApiKey`
- Champ Input type password pour la cle Anthropic, avec bouton toggle oeil pour visibilite
- Au chargement : appel `getSettings()`, si `hasAnthropicApiKey` afficher la cle masquee retournee
- Texte d'aide sous le champ
- Bouton "Sauvegarder la cle" qui appelle `updateSettings({ anthropicApiKey })`
- State separe : `anthropicKey`, `hasAnthropicKey`, `showKey`, `savingKey`

### 4. ProjectSettings.tsx — Badge analyse sur parcours decouverts

Dans le label "Parcours surveilles" :
- Si `project.discoveryMeta?.analysisMode === "dom+vision"` → Badge violet "Analyse par IA"
- Si `"dom-only"` → Badge gris "Analyse basique"
- Sinon rien

### Fichiers modifies

1. `src/lib/sentinelle-types.ts`
2. `src/lib/sentinelle-api.ts`
3. `src/pages/ProjectSettings.tsx`


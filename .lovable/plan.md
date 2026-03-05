

## Plan : 3 modifications frontend pour les changements backend

### 1. Types (`src/lib/sentinelle-types.ts`)

- Ajouter `configStatus?: "ready" | "no_flows"` et `configMessage?: string | null` a `Project`
- Ajouter `useVisionAnalysis?: boolean` a `SentinelleSettings`
- Ajouter `visionError?: string` a `DiscoverResult` dans `sentinelle-api.ts`

### 2. ProjectDashboard — etat "no_flows" (`src/pages/ProjectDashboard.tsx`)

- Dans le header (ligne 231), conditionner `VerdictBadge` : si `project.configStatus === "no_flows"`, afficher un Badge orange "Configuration" au lieu du verdict
- Dans la carte verdict (lignes 338-366), si `configStatus === "no_flows"` et pas de run actif, afficher le message `configMessage` ou le texte par defaut "Aucun parcours surveille — lancez une decouverte..."
- Bouton "Tester maintenant" (ligne 373-385) : ajouter `project.configStatus === "no_flows"` au `disabled`. Entourer d'un Tooltip avec "Selectionnez d'abord des parcours a surveiller" quand desactive pour cette raison
- Dans `handleTestNow` catch : detecter le code `NO_MONITORED_FLOWS` dans l'erreur et afficher un toast specifique

### 3. Settings — toggle vision (`src/pages/SettingsPage.tsx`)

- Ajouter state `useVisionAnalysis` (boolean, defaut true)
- Charger depuis `getSettings()` dans le useEffect existant
- Dans la Card "Intelligence Artificielle", avant le champ "Cle API Anthropic", ajouter :
  - Un Switch avec label "Utiliser l'analyse IA pour la decouverte des parcours"
  - Description : "Quand active, Claude analyse visuellement les pages pour des scores de confiance plus precis. Necessite une cle API Anthropic valide."
  - `onCheckedChange` envoie `updateSettings({ useVisionAnalysis: value })`
  - Si active et `!hasAnthropicKey` : petit warning ambre "Cle API Anthropic requise pour activer l'analyse IA"

### 4. Decouverte — visionError et badge IA (`src/pages/Onboarding.tsx` + `src/pages/DiscoverFlows.tsx`)

Dans les deux pages, apres le `discoverFlows()` resolve :
- Stocker `result.visionError` dans un nouveau state `visionError`
- Dans la section `phase === "results"`, sous le titre "X parcours detectes" :
  - Si `visionError` : bandeau ambre avec le texte de l'erreur (icone AlertTriangle)
  - Si pas de `visionError` et flows.length > 0 : badge vert "Analyse IA" a cote du titre (icone Sparkles)

### Fichiers modifies
1. `src/lib/sentinelle-types.ts`
2. `src/lib/sentinelle-api.ts`
3. `src/pages/ProjectDashboard.tsx`
4. `src/pages/SettingsPage.tsx`
5. `src/pages/Onboarding.tsx`
6. `src/pages/DiscoverFlows.tsx`


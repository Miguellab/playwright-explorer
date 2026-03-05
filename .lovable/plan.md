

## Plan : Etape "Identifiants" conditionnelle dans l'onboarding

### 1. API (`src/lib/sentinelle-api.ts`)

Ajouter 3 fonctions apres `discoverFlows` :
- `getFlowCredentialsStatus(projectId)` → `GET /projects/:id/flows/credentials-status`
- `saveFlowCredentials(projectId, flowId, credentials)` → `PUT /projects/:id/flows/:flowId/credentials`
- `deleteFlowCredentials(projectId, flowId)` → `DELETE /projects/:id/flows/:flowId/credentials`

### 2. Types (`src/lib/sentinelle-types.ts`)

- Ajouter `hasCredentials?: boolean` a `SuggestedFlow`
- Ajouter `credentialsWarning?` a `Project`

### 3. Onboarding (`src/pages/Onboarding.tsx`)

**Stepper dynamique :**
- Remplacer le `STEPS` constant par `BASE_STEPS` (3 etapes)
- Calculer `hasAuthFlows` = au moins un flow selectionne a `requiresCredentials: true`
- Si `hasAuthFlows` : inserer une 3e etape `{ icon: Lock, label: "Identifiants" }` avant Surveillance → 4 pastilles
- Sinon : 3 pastilles comme aujourd'hui

**Navigation :**
- Bouton "Continuer avec X parcours" (ligne 455-462) : `setStep(hasAuthFlows ? 2 : surveillanceStep)` ou `surveillanceStep` = `hasAuthFlows ? 3 : 2`
- Bouton "Retour" de Surveillance : `setStep(hasAuthFlows ? 2 : 1)`

**Nouvelle etape step === 2 (quand hasAuthFlows) :**
- Card avec titre "Identifiants de test", description
- Pour chaque flow selectionne avec `requiresCredentials`, afficher `<FlowCredentialsForm>` avec :
  - Label du flow + badge goal
  - `onSave` appelle `saveFlowCredentials(projectId, flowId, creds)` puis met a jour le state `flows`
- Bouton "Retour" → step 1
- Bouton "Continuer" → step 3 (toujours actif, pas bloquant)
- Texte informatif : "Vous pouvez configurer les identifiants plus tard..."

**Step Surveillance :**
- Passe de `step === 2` a `step === surveillanceStep` (2 ou 3 selon hasAuthFlows)

### Fichiers modifies
1. `src/lib/sentinelle-api.ts` — 3 fonctions
2. `src/lib/sentinelle-types.ts` — 2 champs
3. `src/pages/Onboarding.tsx` — stepper dynamique + etape credentials


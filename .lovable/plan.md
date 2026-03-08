

## Ajouter la section "Zone authentifiée" au dashboard projet

### Vue d'ensemble

Ajouter sur `ProjectDashboard.tsx` une carte conditionnelle "Zone authentifiée" qui apparait uniquement si un flow LOGIN a des credentials configurés. Cette carte permet de lancer la découverte authentifiée directement depuis le dashboard, avec gestion des états loading/résultats/erreur et sélection des flows découverts.

### Condition d'affichage

Au chargement du dashboard, appeler `getFlowCredentialsStatus(id)`. Afficher la carte si au moins un flow avec `goal === "LOGIN"` a `hasCredentials === true`.

### Fichier modifié : `src/pages/ProjectDashboard.tsx`

**Nouveaux imports** : `getFlowCredentialsStatus`, `discoverAuthenticatedFlows`, `updateProject`, `setMainFlow` depuis sentinelle-api. Icones `Lock`, `ShieldCheck`, `Sparkles`, `CheckCircle2`. Composant `Switch`.

**Nouveaux states** :
- `hasAuthCredentials: boolean` — condition d'affichage
- `authPhase: "idle" | "discovering" | "results" | "error"` — phase de la découverte auth
- `authFlows: SuggestedFlow[]` — flows découverts
- `enabledAuthFlows: Set<string>` — flows sélectionnés
- `authMainFlowId: string | null` — flow principal parmi les auth flows
- `authDiscoveryMsg: number` — index du message de progression
- `authError: string` — message d'erreur

**Nouveau useEffect** : appeler `getFlowCredentialsStatus(id)` au mount, set `hasAuthCredentials` si condition remplie.

**Nouvelle section UI** (après le bloc Verdict, avant les actions) :

1. **Carte "Zone authentifiée"** (`authPhase === "idle"`) :
   - Icone Lock, titre "Zone authentifiée"
   - Description : "Sentinelle peut se connecter à votre application et explorer les pages internes."
   - CTA principal : "Découvrir les parcours internes" → lance `discoverAuthenticatedFlows(id)`
   - CTA secondaire : "Voir les parcours surveillés" → navigue vers settings

2. **Carte progression** (`authPhase === "discovering"`) :
   - Spinner + messages rotatifs (Connexion en cours… / Navigation… / Analyse…)
   - Pas de progress bar (le POST est synchrone, timeout jusqu'à 3min)

3. **Résultats** (`authPhase === "results"`) :
   - Message : "N nouveaux parcours détectés"
   - Liste de FlowCards avec : labelFr, description, confidence (%), toggle surveillance, bouton "Définir comme principal", badge "Principal" si sélectionné
   - Animation framer-motion pour l'apparition
   - CTA : "Commencer la surveillance" → PATCH project avec les flows activés + PUT main-flow

4. **Erreur** (`authPhase === "error"`) :
   - Si `loginSuccess === false` : "La connexion a échoué. Vérifiez les identifiants configurés." + lien vers settings
   - Si 504/500 : message d'erreur de l'API
   - Bouton "Réessayer"

**Fonction `startAuthDiscovery`** :
- Set `authPhase = "discovering"`
- Appel `discoverAuthenticatedFlows(id)` (synchrone, attend la réponse)
- Si `loginSuccess === false` → `authPhase = "error"` avec message spécifique
- Si succès → `authFlows = response.flows`, tous activés par défaut, `authPhase = "results"`
- Toast : "Parcours internes détectés avec succès"
- Catch erreur → `authPhase = "error"` avec `err.message`

**Fonction `handleSaveAuthFlows`** :
- Fusionne les `monitoredFlows` existants du projet avec les auth flows activés
- PATCH project avec `monitoredFlows` mis à jour
- Si `authMainFlowId` défini, PUT main-flow
- Toast succès, refresh projet

### Design

- Carte avec bordure `border-neon/20`, icone Lock en vert neon
- FlowCards : carte sombre, toggle Switch, badge confidence en pourcentage
- Badge "Principal" en vert neon
- Animations framer-motion : fade-in + slide-up pour les cartes
- Messages rotatifs pendant le loading avec interval 4s

### Estimation

1 fichier modifié, ~200 lignes ajoutées.


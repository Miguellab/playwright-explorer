

## Gestion des parcours authentifiés dans DiscoverFlows

### Vue d'ensemble

Ajouter la gestion complète des credentials et de la découverte authentifiée dans l'écran `DiscoverFlows.tsx`. Le flux devient : découverte publique → si un flow LOGIN est détecté, proposer de configurer les credentials → lancer la découverte authentifiée → fusionner les flows → confirmer.

### Fichiers à modifier/créer

#### 1. Nouveau composant : `src/components/CredentialsModal.tsx`

Modal Dialog pour configurer un compte test :
- Titre : "Configurer un compte test"
- Description rassurante sur l'usage des credentials
- Champs : Email, Mot de passe, Nom (optionnel)
- Boutons : Annuler / Enregistrer
- Appel `saveFlowCredentials(projectId, flowId, { email, password, name })`
- Toast de succès, fermeture automatique

#### 2. Modification majeure : `src/pages/DiscoverFlows.tsx`

Ajouter les phases suivantes au flow existant :

**Nouvelles phases** : `"loading" | "results" | "auth-discovery" | "auth-results" | "error"`

**Dans la phase "results"** :
- Chaque FlowCard affiche un indicateur de credentials :
  - Si `flow.goal === "LOGIN"` ou `flow.requiresCredentials` : bouton "Configurer les identifiants" ou badge "Compte test configuré ✓" + "Modifier"
- Quand un flow LOGIN a des credentials configurés, afficher une section "Zone authentifiée" sous les flows :
  - Description : "Sentinelle peut explorer votre application après connexion"
  - CTA : "Découvrir les parcours internes"

**Phase "auth-discovery"** :
- Loading state : "Sentinelle explore votre application après connexion…"
- Appel `discoverAuthenticatedFlows(projectId)`
- Gestion du `loginSuccess === false` → message d'erreur

**Phase "auth-results"** :
- Afficher les flows authentifiés détectés avec badge "Post-login"
- Fusionner avec les flows publics déjà sélectionnés
- Toggle on/off pour chaque nouveau flow
- Résumé : "X nouveaux parcours détectés"

**Logique de confirmation mise à jour** :
- `handleConfirm` fusionne flows publics activés + flows authentifiés activés
- `PATCH /projects/:id` avec tous les monitoredFlows
- `PUT /projects/:id/main-flow`
- Redirect vers dashboard

#### 3. Modification légère : `src/pages/ProjectSettings.tsx`

Ajouter la même gestion de credentials dans les flow cards :
- Importer `CredentialsModal`
- Pour chaque flow avec `requiresCredentials`, afficher le status + bouton configurer/modifier
- Appeler `saveFlowCredentials` / `deleteFlowCredentials`

#### 4. Mise à jour types : `src/lib/sentinelle-types.ts`

Ajouter `requiresCredentials` au type `SuggestedFlow` (déjà optionnel, juste s'assurer qu'il existe — il est déjà là).

Aucune modification API nécessaire — tous les endpoints sont déjà dans `sentinelle-api.ts`.

### Détail UX

**Credential states dans les flow cards :**
- `!hasCredentials && requiresCredentials` → warning orange "⚠ Identifiants requis" + bouton "Configurer"
- `hasCredentials` → badge vert "✓ Compte test configuré" + bouton ghost "Modifier"

**Section Zone authentifiée** (conditionnelle) :
- Apparaît seulement si un flow LOGIN a `hasCredentials === true`
- Carte séparée avec bordure accent, icône Lock
- Deux boutons : "Découvrir les parcours internes" (primaire) / "Passer" (ghost)

**Auth discovery loading** :
- Réutiliser le même pattern que le loading initial (progress bar, messages rotatifs)
- Messages spécifiques : "Connexion en cours…", "Exploration des pages internes…", etc.

**Fusion des flows** :
- Les flows publics restent tels quels
- Les flows authentifiés s'ajoutent en dessous avec un badge "Post-login"
- Tous sont activés par défaut

### Estimation

3 fichiers modifiés/créés, ~400 lignes ajoutées.


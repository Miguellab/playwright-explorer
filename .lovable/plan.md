

## Plan : Verdict "EN ATTENTE" + formulaire credentials par parcours

Ce plan couvre 5 changements : le nouveau verdict, les types, le badge, le formulaire de credentials sur le dashboard projet, et les credentials dans les settings projet.

### 1. Types (`src/lib/sentinelle-types.ts`)

- Ajouter `"EN ATTENTE"` au type `Verdict`
- Ajouter `credentials?: { email: string; password: string }` a `SuggestedFlow`

### 2. Couleur CSS (`src/index.css`)

- Ajouter `--status-pending: 25 95% 53%` (amber/orange) dans `:root` et le theme dark

### 3. VerdictBadge (`src/components/VerdictBadge.tsx`)

- Importer `Clock` depuis lucide-react
- Ajouter l'entree `"EN ATTENTE"` dans `config` : icone Clock, couleur `status-pending`, label "EN ATTENTE"
- Ajouter le texte correspondant dans `VerdictText` : "Ce parcours necessite des identifiants pour un test complet."

### 4. RunReport verdict banner (`src/pages/RunReport.tsx`)

- Ajouter le cas `"EN ATTENTE"` dans le `cn()` du verdict banner (ligne 131-134) : `bg-amber-500/10 border-amber-500/30`

### 5. ProjectDashboard — Credentials inline (`src/pages/ProjectDashboard.tsx`)

Apres le bloc "Monitored flows summary" (ligne 300-309), transformer la liste des flows monitores pour afficher pour chaque flow :
- Si `requiresCredentials && !credentials` : bandeau orange avec message + formulaire inline (email + password + bouton "Enregistrer les identifiants"). Au submit : `PATCH /projects/:id` avec `monitoredFlows` mis a jour incluant les credentials. Apres succes : check vert "Identifiants enregistres" + bouton "Relancer le test"
- Si `requiresCredentials && credentials` : indication discrete "Identifiants configures" (cadenas vert) + bouton "Modifier"
- State local : `credentialsForms: Record<flowId, { email, password, editing, saving }>` 

### 6. ProjectSettings — Credentials par parcours (`src/pages/ProjectSettings.tsx`)

Dans la liste des `suggestedFlows` (lignes 163-185), pour les flows avec `requiresCredentials: true` et qui sont selectionnes :
- Ajouter sous le label du flow deux champs email/password pre-remplis depuis `flow.credentials`
- State : `flowCredentials: Record<flowId, { email, password }>`
- Initialiser depuis `monitoredFlows` au chargement
- Dans `handleSave`, merger les credentials dans les `monitoredFlows` envoyees au PATCH

### Fichiers modifies
1. `src/lib/sentinelle-types.ts`
2. `src/index.css`
3. `src/components/VerdictBadge.tsx`
4. `src/pages/RunReport.tsx`
5. `src/pages/ProjectDashboard.tsx`
6. `src/pages/ProjectSettings.tsx`


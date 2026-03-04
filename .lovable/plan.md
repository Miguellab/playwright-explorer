

## Plan : Adapter le frontend aux changements backend multi-flow

### 1. Types (`src/lib/sentinelle-types.ts`)

- Ajouter `flowId?: string` et `flowLabel?: string` a l'interface `Run`
- Ajouter `statusExplanation?: string` et `verdictExplanation?: string` a `VerdictSummary`
- Creer `TestNowResponse` : `{ runs: { runId: string; flow: string; flowId: string; status: string }[]; message: string }`

### 2. API (`src/lib/sentinelle-api.ts`)

- Modifier le retour de `testNow()` pour renvoyer `TestNowResponse` au lieu de `{ runId, status }`

### 3. ProjectDashboard (`src/pages/ProjectDashboard.tsx`)

- **handleTestNow** : adapter pour recevoir `{ runs: [...] }`, stocker tous les runIds actifs, poll chacun, toast "N tests lances"
- **Historique des runs** : ajouter un `Badge` avec `run.flowLabel` a cote du verdict/status dans chaque ligne
- **Groupement visuel** : regrouper les runs dont `startedAt` est dans un intervalle de 2s (bordure gauche coloree ou separateur de groupe)
- **Legende** : ajouter en bas de la section runs un texte explicatif "Statut = le test s'est-il execute ? | Verdict = votre parcours fonctionne-t-il ?"

### 4. Logs (`src/pages/Logs.tsx`)

- Ajouter une colonne "Parcours" dans le tableau, affichant `run.flowLabel` en Badge
- Meme legende en bas du tableau

### 5. Badges — distinction Statut vs Verdict

- **StatusBadge** (`src/components/StatusBadge.tsx`) : pas de renommage du label (PASS/FAIL reste clair), mais ajouter un support pour un tooltip optionnel (`statusExplanation`)
- **VerdictBadge** (`src/components/VerdictBadge.tsx`) : idem, support tooltip optionnel (`verdictExplanation`)
- Dans **RunReport.tsx** : passer `vs.statusExplanation` et `vs.verdictExplanation` en tooltips sur les badges correspondants

### 6. Report in-app (`src/pages/RunReport.tsx`)

- Remplacer le lien externe `<a href={reportUrl} target="_blank">` (lignes 532-544) par un bouton qui ouvre un `Dialog` plein ecran contenant une `<iframe>` pointant vers `${VITE_SENTINELLE_API_URL}/runs/${runId}/report`
- Ajouter un bouton "Fermer" dans le Dialog
- L'iframe charge directement l'URL (le proxy accepte le meme auth)

### 7. Polling multi-runs

Changer le state `activeRunId: string | null` en `activeRunIds: string[]`. Poller tous les runs actifs en parallele. Quand tous sont termines, rafraichir la liste.

### Fichiers modifies

1. `src/lib/sentinelle-types.ts`
2. `src/lib/sentinelle-api.ts`
3. `src/pages/ProjectDashboard.tsx`
4. `src/pages/RunReport.tsx`
5. `src/pages/Logs.tsx`
6. `src/components/StatusBadge.tsx`
7. `src/components/VerdictBadge.tsx`


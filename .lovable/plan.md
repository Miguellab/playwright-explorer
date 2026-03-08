

## Amélioration de l'affichage des flows en erreur

### Contexte
Actuellement, `ReleaseDetail.tsx` affiche les steps et screenshots pour tous les runs, mais sans traitement spécial pour les erreurs : pas de `errorSummary`, pas de mise en avant de l'étape failed, pas de findings inline par run, pas d'ouverture automatique des runs en erreur.

### Changements

#### 1. Types — `src/lib/sentinelle-types.ts`
Ajouter les nouveaux champs sur `Run` :
- `errorSummary: string | null`
- `failedStepName: string | null`
- `stepsSummary: { total: number; passed: number; failed: number; skipped: number } | null`

Ajouter sur `ReleaseRunSummary` :
- `hasScreenshots?: boolean`
- `screenshotCount?: number`
- `consoleErrorCount?: number`
- `failedRequestCount?: number`
- `errorSummary?: string | null`
- `failedStepName?: string | null`

#### 2. Composant `MainFlowSteps` — `src/components/MainFlowSteps.tsx`
Enrichir pour mettre en avant les étapes failed :
- L'étape `failed`/`fail` reçoit un fond rouge subtil (`bg-status-erreur/5 border-l-2 border-status-erreur`) et affiche `step.detail` en dessous si présent.
- Ajouter une prop optionnelle `stepsSummary` pour afficher un résumé compact en bas : "10/12 réussies — 1 en échec — 1 ignorée".

#### 3. Nouveau composant `RunFindings` — `src/components/RunFindings.tsx`
Composant qui prend `findings: Findings` et affiche inline :
- **Console errors** : les 5 premiers `consoleError.text`, puis "et X autres" si plus.
- **Failed requests** : `{method} {url} — {status}` (ou "Erreur réseau" si status === 0). Limite 5 + "et X autres".
- Si aucun finding : "Aucun détail technique disponible".
Réutilise le style existant de `IssueCard` (couleurs `status-erreur`, `status-alerte`).

#### 4. Nouveau composant `RunCard` — `src/components/RunCard.tsx`
Composant unifié pour afficher un run (main ou secondaire), remplaçant le code inline dupliqué dans `ReleaseDetail.tsx`.

Props : `run: Run`, `isMainFlow: boolean`, `isExpanded: boolean`, `onToggle`, `onRetest`, `retesting: boolean`.

Structure du composant :
- **Header** : badge parcours principal (si main), label du flow, VerdictBadge, chevron toggle.
- **Bloc erreur** (si `run.status === "failed" || "error"`) :
  - Fond rouge subtil `bg-status-erreur/5 border border-status-erreur/20 rounded-lg p-3`.
  - `errorSummary` en texte principal (fallback : "Le parcours a échoué.").
  - Sous-texte : "Erreur détectée sur : {failedStepName}" si disponible.
- **Steps** : `MainFlowSteps` avec `stepsSummary`.
- **Screenshots** : `EvidenceViewer` — si aucune : "Aucune capture disponible".
- **Findings inline** : `RunFindings` — si aucun : "Aucun détail technique disponible".
- **Actions** : bouton Relancer.

#### 5. Refactor `ReleaseDetail.tsx`
- Remplacer le code inline des cards main et other par `<RunCard>`.
- **Auto-expand** : au chargement, pré-ouvrir les runs dont `status === "failed" || "error"`. Les runs `passed` restent fermés.
- Supprimer la section "Issues" globale en bas (les findings sont maintenant inline par run).
- Conserver la section Trace download en bas.

#### 6. Hiérarchie visuelle
- `passed` : accordéon fermé par défaut, compact.
- `failed`/`error` : accordéon ouvert par défaut, bloc errorSummary visible, étape failed mise en avant.
- `running`/`queued` : accordéon fermé, spinner.

### Fichiers impactés
1. `src/lib/sentinelle-types.ts` — ajout champs
2. `src/components/MainFlowSteps.tsx` — enrichir étapes failed + stepsSummary
3. `src/components/RunFindings.tsx` — nouveau composant
4. `src/components/RunCard.tsx` — nouveau composant unifié
5. `src/pages/ReleaseDetail.tsx` — refactor pour utiliser RunCard + auto-expand


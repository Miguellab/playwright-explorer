

## Amélioration de l'historique des tests

### Résumé
Transformer `ReleasesTimeline.tsx` en une page "Historique" unifiée qui fusionne releases et runs manuels isolés, avec type de déclenchement, parcours testé, et bouton Relancer intelligent avec polling.

### Changements

#### 1. Types — `src/lib/sentinelle-types.ts`
- Ajouter `"manual_flow_retest"` au type `Trigger` (actuellement absent).
- Ajouter `trigger` sur `ReleaseRunSummary` (pour les runs dans les releases).

#### 2. Refonte `ReleasesTimeline.tsx` → page "Historique"
**Données** : charger en parallèle `listReleases(id, 50)` + `listRuns(id, 50)` + `getProject(id)`.

**Fusion** : construire une timeline unifiée :
- Chaque release → une entrée avec `detectedAt`, `verdict`, `trigger`, `mainFlowLabel`, `runCount`.
- Les runs avec `trigger === "manual_flow_retest"` qui n'ont pas de `releaseId` correspondant dans les releases chargées → entrées individuelles avec `startedAt`, `status`, `flowLabel`.
- Trier par date décroissante.

**Carte release** (nouvelle publication / test manuel groupé) :
```
[VerdictBadge]  🚀 Nouvelle publication    Flow principal : {mainFlowLabel}
                {date formatée}             {runCount} tests exécutés
```

**Carte run isolé** (retest manuel) :
```
[StatusBadge]   🧪 Retest manuel           {flowLabel}
                {date formatée}
```

**Mapping trigger → label/icône** :
- `release_detected` / `deploy_webhook` → "Nouvelle publication" + `Rocket` icon
- `manual` → "Test manuel" + `FlaskConical` icon
- `manual_flow_retest` → "Retest manuel" + `FlaskConical` icon

**Titre page** : "Historique" (au lieu de "Historique des publications").

**Bouton Relancer** : en haut de page, un bouton "Lancer un test" qui :
- Appelle `POST /projects/:id/test-now`
- Se désactive immédiatement avec spinner + "Test en cours…"
- Poll `listRuns(id, 5)` toutes les 5s pour détecter quand plus aucun run n'est `queued`/`running`
- Se réactive quand tous les runs sont terminés
- Rafraîchit la timeline automatiquement à la fin

**Lien vers détail** : chaque carte release reste cliquable → `/project/:id/release/:releaseId`. Les runs isolés ne sont pas cliquables (pas de page dédiée).

#### 3. Ajustement `ProjectDashboard.tsx`
- Renommer le label du bouton Historique : rien à changer (il dit déjà "Historique").

### Fichiers impactés
1. `src/lib/sentinelle-types.ts` — ajout `manual_flow_retest` au type Trigger
2. `src/pages/ReleasesTimeline.tsx` — refonte complète
3. `src/lib/sentinelle-api.ts` — aucun changement nécessaire (endpoints déjà disponibles)


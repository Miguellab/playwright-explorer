

## Refonte complète de l'interface Sentinelle

### Vue d'ensemble

Transformation de l'application d'un dashboard de monitoring technique vers un **tableau de bord de validation de publication** centré sur le concept de **Release** (et non plus de Run). Nouveau design system dark minimaliste avec accent vert neon (#B6FF3B).

---

### Changements structurels

**Nouveau modele mental** : Publication → Verification → Verdict
- L'unite centrale passe de `Run` a `Release`
- Un `Release` contient plusieurs `Run` (un par flow)
- Le **Parcours principal (Main Flow)** determine le verdict

**Nouvelles routes** :
```text
/                          → Liste des projets (simplifie)
/onboarding                → Ecran 1 : Ajouter un projet
/project/:id/discover      → Ecran 2 : Detection des parcours
/project/:id               → Ecran 3 : Tableau de bord projet
/project/:id/release/:rid  → Ecran 4 : Detail d'une release
/project/:id/releases      → Ecran 5 : Timeline des releases
/project/:id/settings      → Parametres projet (conserve)
/settings                  → Parametres globaux (conserve)
```

---

### 1. Design System & Theme

**Fichier** : `src/index.css`
- Remplacer la palette complete : background `#0E1117`, surface `#151A22`, accent `#B6FF3B`, text `#E6EDF3`, muted `#8B949E`
- Supprimer le theme light, ne garder que dark
- Remplacer les fonts mono par Inter pour le corps, garder mono pour les donnees techniques uniquement

**Fichier** : `tailwind.config.ts`
- Ajouter couleurs custom : `neon: '#B6FF3B'`, `surface: '#151A22'`
- Mettre a jour les status colors pour le nouveau vocabulaire (SAFE/ALERTE/ERREUR)

---

### 2. Types & API

**Fichier** : `src/lib/sentinelle-types.ts`
- Ajouter types `Release`, `ReleaseVerdict`, `ReleaseTrigger`, `ReleaseRunSummary`
- Ajouter `mainFlowId` au type `Project`
- Ajouter `mainFlowId?: string` au `UpdateProjectBody`
- Mettre a jour `TestNowResponse` pour inclure `releaseId`

```ts
export type ReleaseVerdict = "PENDING" | "OK" | "ALERTE" | "ERREUR";
export type ReleaseTrigger = "release_detected" | "manual" | "deploy_webhook" | "manual_flow_retest";

export interface ReleaseRunSummary {
  id: string;
  flowId: string;
  flowLabel: string;
  status: RunStatus;
  durationMs: number | null;
  isMainFlow: boolean;
}

export interface Release {
  id: string;
  projectId: string;
  signature: string | null;
  trigger: ReleaseTrigger;
  verdict: ReleaseVerdict;
  detectedAt: string;
  completedAt: string | null;
  mainFlowId: string | null;
  mainFlowStatus: string | null;
  mainFlowLabel: string | null;
  runCount: number;
  runs: ReleaseRunSummary[];
}

export interface ReleaseDetail extends Release {
  runIds: string[];
  runs: Run[];
}
```

**Fichier** : `src/lib/sentinelle-api.ts`
- Ajouter : `listReleases(projectId, limit)`, `getRelease(releaseId)`, `setMainFlow(projectId, flowId)`, `getMainFlow(projectId)`, `runSingleFlow(projectId, flowId)`
- Mettre a jour `testNow` response pour inclure `releaseId`
- Ajouter helper `getRunScreenshotUrl(runId, filename)` pour la nouvelle route screenshots

---

### 3. Composants UI reutilisables

Creer dans `src/components/` :

**`VerdictBadge.tsx`** : Badge grand format pour SAFE / ALERTE / ERREUR / EN ATTENTE avec couleurs (vert neon, orange, rouge, gris)

**`ReleaseStatusCard.tsx`** : Grande carte verdict avec resultat du main flow, steps du main flow, heure de detection

**`FlowCard.tsx`** : Carte de parcours pour l'ecran de decouverte (nom, confiance, description, selection main flow)

**`ReleaseTimeline.tsx`** : Liste verticale des releases avec verdict, heure, main flow status

**`IssueCard.tsx`** : Carte pour un probleme detecte (erreur API, erreur console, etc.)

**`EvidenceViewer.tsx`** : Grille de screenshots avec lightbox

**`MainFlowSteps.tsx`** : Affichage des etapes du parcours principal avec icones check/warning

---

### 4. Ecran 1 — Ajouter un projet (`Onboarding.tsx`)

Simplifier radicalement :
- Supprimer les 3 etapes, ne garder qu'une seule carte centree
- Champs : Nom du projet, URL de l'application
- CTA : "Analyser mon application" (vert neon)
- Description rassurante sous le CTA
- Supprimer toute la config avancee (frequence, max runs) — valeurs par defaut
- Apres submit : `createProject` puis redirect vers `/project/:id/discover`

---

### 5. Ecran 2 — Detection des parcours (`DiscoverFlows.tsx`)

Refonte :
- Etat de chargement : "Sentinelle identifie les parcours cles de votre application"
- Resultats : cartes de parcours avec nom, score confiance, description
- **Selection du Parcours principal** (radio obligatoire, pas checkbox) — appel `PUT /projects/:id/main-flow`
- Autres parcours : toggle on/off pour la surveillance
- CTA : "Commencer la surveillance" (vert neon)
- Au confirm : `PATCH /projects/:id` avec monitoredFlows + `PUT /projects/:id/main-flow`

---

### 6. Ecran 3 — Tableau de bord projet (`ProjectDashboard.tsx`)

Refonte complete — c'est l'ecran le plus important :

**Header** : Nom du projet, URL, derniere publication detectee

**Carte verdict** (grande, centree) :
- Charge via `GET /projects/:id/releases?limit=1`
- Affiche le verdict : "PRET A PUBLIER" (vert) / "ALERTE DETECTEE" (orange) / "APPLICATION CASSEE" (rouge) / "EN ATTENTE" (gris)
- Sous le verdict : resultat du parcours principal avec etapes (check/warning)
- Charge le main flow via `GET /projects/:id/main-flow`

**Actions** :
- "Lancer un test maintenant" → `POST /projects/:id/test-now`, puis poll `GET /releases/:id` toutes les 3s
- "Voir les details" → lien vers `/project/:id/release/:rid`
- "Historique" → lien vers `/project/:id/releases`

Supprimer : la section historique des runs, les filtres, le groupage de runs, la section site analysis, la section authenticated discovery.

---

### 7. Ecran 4 — Detail d'une release (`ReleaseDetail.tsx`)

Nouveau fichier remplacant `RunReport.tsx` :

**Header** : "Publication detectee a [heure]", verdict badge

**Section Parcours principal** :
- Etapes de validation avec status par etape
- Screenshots du main flow run

**Section Autres parcours** :
- Liste des runs non-main avec status resume
- Expandable pour voir les etapes

**Section Problemes detectes** :
- Erreurs API regroupees (failedRequests)
- Erreurs console (consoleErrors)

**Section Preuves** :
- Screenshots
- Trace download si disponible

**CTA** : "Relancer le test" → `POST /projects/:id/flows/:flowId/run`

Polling : si verdict === "PENDING", poll `GET /releases/:id` toutes les 3s

---

### 8. Ecran 5 — Timeline des releases (`ReleaseTimeline.tsx` page)

Nouveau fichier :
- `GET /projects/:id/releases?limit=50`
- Liste simple : verdict badge, heure, resultat main flow
- Cliquer ouvre le detail

---

### 9. Dashboard projets (`Dashboard.tsx`)

Simplifier :
- Supprimer le status dot base sur les runs
- Charger la derniere release de chaque projet au lieu du dernier run
- Afficher le verdict de la derniere release
- Style dark minimaliste, cartes epurees

---

### 10. Layout & Navigation

**`AppLayout.tsx`** : Supprimer le header avec SidebarTrigger, integrer dans la sidebar

**`AppSidebar.tsx`** : Style dark (`#0E1117`), logo SENTINELLE en vert neon, navigation simplifiee

**`App.tsx`** : Ajouter les nouvelles routes :
- `/project/:id/release/:releaseId` → ReleaseDetail
- `/project/:id/releases` → ReleaseTimelinePage

---

### 11. Fichiers a supprimer/remplacer

- `src/pages/RunReport.tsx` → garde pour backward compat mais n'est plus le chemin principal
- `src/components/SiteAnalysisSection.tsx` → supprimer (plus affiche)
- `src/components/PerformanceMetricsCard.tsx` → deplacer dans ReleaseDetail si pertinent
- `src/pages/Logs.tsx` → simplifier ou supprimer (la timeline des releases remplace)

---

### 12. Animations

- Transition douce du verdict (fade + scale)
- Pulse sur "EN ATTENTE" pendant le polling
- Progress bar lors de la detection des parcours
- Transition des steps qui se remplissent pendant le polling

---

### Estimation

~15 fichiers modifies ou crees, ~2500 lignes. La refonte est massive mais le resultat sera une interface radicalement plus simple et rassurante.

### Ordre d'implementation

1. Design system (CSS + tailwind config)
2. Types & API (nouveaux endpoints releases, main-flow)
3. Composants UI (VerdictBadge, ReleaseStatusCard, etc.)
4. Ecrans dans l'ordre : Onboarding → DiscoverFlows → ProjectDashboard → ReleaseDetail → Timeline → Dashboard
5. Layout & navigation
6. Nettoyage des fichiers obsoletes


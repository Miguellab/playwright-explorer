

## Adaptation frontend aux nouvelles fonctionnalités backend

6 changements regroupés en modifications de types, API, et pages UI.

---

### 1. Types (`src/lib/sentinelle-types.ts`)

Ajouter les nouvelles interfaces et enrichir les existantes :

```ts
// Nouveau : Site Analysis
export type SiteType = "saas" | "ecommerce" | "vitrine" | "blog" | "marketplace" | "webapp" | "landing" | "other";

export interface SiteAnalysisPage {
  label: string;
  role: string;
  interactiveElements?: string[];
  uxIssues?: string[];
  performance?: PerformanceMetrics;
}

export interface CrossPageAnalysis {
  navigationConsistency: string;
  designConsistency: string;
  criticalPaths: string[];
  missingPages: string[];
}

export interface SiteAnalysis {
  sitePurpose: string;
  siteType: SiteType;
  targetAudience: string;
  keyFeatures: string[];
  crossPageAnalysis: CrossPageAnalysis;
  pages: SiteAnalysisPage[];
}

// Nouveau : Performance
export interface PerformanceMetrics {
  domContentLoaded?: number;
  loaded?: number;
  firstContentfulPaint?: number;
  domInteractive?: number;
  resourceCount?: number;
  totalTransferSizeKB?: number;
}

// Enrichir Project
interface Project {
  // ... existants
  description?: string | null;
  siteAnalysis?: SiteAnalysis | null;
}

// Enrichir FailedRequest
interface FailedRequest {
  url: string;
  status: number;
  method?: string;
  resourceType?: string;
  errorText?: string;
  timestamp?: string;
}

// Enrichir Findings
interface Findings {
  consoleErrors: ConsoleError[];
  failedRequests: FailedRequest[];
  diagnostics: Diagnostic[];
  performanceMetrics?: Record<string, PerformanceMetrics>;
}

// Enrichir RunAssets
interface RunAssets {
  screenshots?: { label: string; filename: string; path: string }[];
  tracePath?: string;
}
```

### 2. API (`src/lib/sentinelle-api.ts`)

- Enrichir `DiscoverResult` et `AuthenticatedDiscoverResult` avec `siteAnalysis?: SiteAnalysis`
- Ajouter helper `getTraceUrl(project: Project, tracePath: string): string` qui retourne `${project.runnerBaseUrl}${tracePath}`

### 3. ProjectDashboard (`src/pages/ProjectDashboard.tsx`)

- Afficher `project.description` sous l'URL du site dans le header (texte gris, `text-sm text-muted-foreground`)
- Ajouter une section "Analyse du site" (Card collapsible) quand `project.siteAnalysis` existe, contenant :
  - Badge pour `siteType`, texte pour `sitePurpose`, `targetAudience`
  - Liste des `keyFeatures`
  - Cross-page : `navigationConsistency`, `designConsistency`, `criticalPaths`, `missingPages`
  - Tableau des pages analysees avec role, elements interactifs, problemes UX

### 4. RunReport (`src/pages/RunReport.tsx`)

**Performance metrics** : nouvelle Card apres les screenshots quand `run.findings.performanceMetrics` existe. Tableau avec colonnes : Page, Load, FCP, DOM Ready, Ressources. Coloration : vert < 1s, orange 1-3s, rouge > 3s (pour load et FCP).

**Failed requests enrichies** : dans la section existante, afficher `method` et `resourceType` en badges. Differencer visuellement status 0 (icone `Wifi`/`WifiOff` + `errorText`) vs HTTP 4xx/5xx (icone `AlertTriangle` + code status).

**Trace download** : bouton "Telecharger le trace" quand `run.assets?.tracePath` existe. Necessite le `project.runnerBaseUrl` -- charger le projet via `getProject(projectId)` (deja dans params). Lien vers `{runnerBaseUrl}{tracePath}` en download.

### 5. DiscoverFlows (`src/pages/DiscoverFlows.tsx`)

- Stocker `siteAnalysis` du result de discovery
- Apres la liste des flows, ajouter une section "Analyse du site" montrant les pages analysees (role, elements interactifs, UX issues), parcours critiques et pages manquantes
- La liste de screenshots est deja dans un grid -- s'assurer qu'elle est dans un `ScrollArea` ou `max-h` avec overflow pour gerer un grand nombre de pages
- Sauvegarder `siteAnalysis` dans le projet via `updateProject` au moment du confirm

### 6. Scrollability

- Dans `DiscoverFlows`, wrapper la liste des flows groupes dans un conteneur avec `max-h-[60vh] overflow-y-auto` pour gerer un grand nombre de parcours sans debordement

---

### Fichiers modifies

| Fichier | Changements |
|---|---|
| `src/lib/sentinelle-types.ts` | +6 interfaces, enrichir Project, FailedRequest, Findings, RunAssets |
| `src/lib/sentinelle-api.ts` | Enrichir DiscoverResult, ajouter getTraceUrl |
| `src/pages/ProjectDashboard.tsx` | Description projet + section Analyse du site |
| `src/pages/RunReport.tsx` | Perf metrics, failed requests enrichies, bouton trace |
| `src/pages/DiscoverFlows.tsx` | Afficher siteAnalysis, scroll pour grand nombre de flows |


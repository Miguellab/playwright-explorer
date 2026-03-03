

## Plan : 4 corrections Sentinelle

### 1. Trigger type (`src/lib/sentinelle-types.ts`, ligne 6)
Étendre : `export type Trigger = "release_detected" | "manual" | "scheduled" | "deploy_webhook" | "discovery";`

### 2. Trigger labels (`src/pages/ProjectDashboard.tsx`, lignes 34-38)
Ajouter imports `Rocket`, `Search` depuis lucide-react. Ajouter dans `TRIGGER_LABELS` :
- `deploy_webhook: { icon: Rocket, label: "Deploy webhook" }`
- `discovery: { icon: Search, label: "Découverte" }`

### 3. Bouton supprimer projet (`src/pages/ProjectSettings.tsx`)
- Importer `deleteProject` depuis sentinelle-api, `Dialog`/`DialogContent`/etc., `Trash2`, `useNavigate`
- Ajouter state `deleteOpen` + `deleting`
- Après la Card existante, ajouter une section "Zone de danger" avec bouton rouge qui ouvre un AlertDialog de confirmation
- Sur confirmation : `deleteProject(id)` → `navigate("/")`

### 4. Screenshots URL prefix (`src/lib/sentinelle-api.ts` + `src/pages/RunReport.tsx`)
- Exporter `getScreenshotUrl(path: string)` depuis sentinelle-api : si path commence par `http`, retourner tel quel, sinon préfixer avec `BASE_URL`
- Dans RunReport, importer `getScreenshotUrl` et l'utiliser pour `shot.path` aux lignes 279, 280 et dans le lightbox (ligne 298)

4 fichiers modifiés.


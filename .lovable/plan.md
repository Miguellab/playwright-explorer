

## Diagnostic

Le backend ne renvoie jamais les credentials en clair dans `GET /projects/:id` (pour des raisons de securite). Les flows monitores ont `hasCredentials: true` mais pas de champ `credentials`. Or le code de chargement (ligne 47-49) cherche `f.credentials` qui est toujours `undefined` → les champs sont vides et le badge "Identifiants configures" ne s'affiche pas.

De plus, apres `handleSave`, le `setProject(updated)` ecrase le projet avec la reponse du PATCH qui elle aussi ne contient pas `credentials` → meme probleme.

## Plan

### `src/pages/ProjectSettings.tsx`

**1. Chargement initial (lignes 44-50)** — Utiliser `hasCredentials` pour pre-remplir l'etat :

```ts
const creds: Record<string, { email: string; password: string }> = {};
(p.monitoredFlows ?? []).forEach((f) => {
  if (f.credentials) {
    creds[f.id] = { ...f.credentials };
  } else if (f.hasCredentials) {
    // Le backend ne renvoie pas les credentials en clair,
    // mais signale qu'ils sont configures
    creds[f.id] = { email: "••••••••", password: "••••••••" };
  }
});
```

**2. Tracking des flows deja configures** — Ajouter un state `configuredFlowIds` (Set) pour savoir quels flows ont deja des credentials cote serveur, sans les confondre avec des credentials edites par l'utilisateur :

```ts
const [configuredFlowIds, setConfiguredFlowIds] = useState<Set<string>>(new Set());
```

Initialise dans le useEffect :
```ts
const configured = new Set<string>();
(p.monitoredFlows ?? []).forEach((f) => {
  if (f.hasCredentials) configured.add(f.id);
});
setConfiguredFlowIds(configured);
```

**3. Affichage du formulaire credentials (dans le JSX)** — Si un flow est dans `configuredFlowIds` et que l'utilisateur n'a pas edite les champs, afficher le badge "Identifiants configures" avec un bouton "Modifier" au lieu des champs vides. Quand l'utilisateur clique "Modifier", retirer le flow de `configuredFlowIds` pour afficher le formulaire.

**4. handleSave (ligne 69-74)** — Ne pas envoyer les credentials placeholder. Si le flow est dans `configuredFlowIds` et que les valeurs n'ont pas ete modifiees, ne pas inclure `credentials` dans le body (le backend garde les anciens) :

```ts
.map((f) => {
  const isAlreadyConfigured = configuredFlowIds.has(f.id);
  const creds = flowCredentials[f.id];
  const hasNewCreds = creds && creds.email && creds.password 
    && creds.email !== "••••••••" && creds.password !== "••••••••";
  if (hasNewCreds) return { ...f, credentials: creds };
  return f; // pas de credentials → le backend garde les existants
});
```

**5. Apres sauvegarde** — Mettre a jour `configuredFlowIds` avec les flows qui ont `hasCredentials: true` dans la reponse.

### Fichier modifie
- `src/pages/ProjectSettings.tsx`


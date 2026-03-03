

# Mise à jour frontend Sentinelle v3

5 chantiers, 8 fichiers impactés.

---

## 1. API : `deleteProject` + `toggleProject` — `sentinelle-api.ts`

Ajouter deux fonctions :
```ts
export async function deleteProject(id: string): Promise<void> {
  await request(`/projects/${id}`, { method: "DELETE" });
}

export async function toggleProject(id: string): Promise<Project> {
  return request(`/projects/${id}/toggle`, { method: "POST" });
}
```

## 2. Suppression de projet — `ProjectSettings.tsx`

En bas de page, après le bouton "Sauvegarder" :
- Ajouter un `Separator` puis une zone danger avec un bouton rouge "Supprimer le projet"
- Au clic : ouvrir un `AlertDialog` avec message "Cette action est irréversible. Tous les runs et données seront supprimés."
- Si confirmé : `deleteProject(id)` → `navigate("/")` → toast "Projet supprimé"
- Imports à ajouter : `AlertDialog*`, `useNavigate`, `Trash2`, `deleteProject`

## 3. Toggle enabled — `Dashboard.tsx` + `ProjectDashboard.tsx`

**Dashboard.tsx** :
- Ajouter un `Switch` à droite de chaque carte projet (à côté du chevron implicite)
- `onClick` avec `e.preventDefault()` + `e.stopPropagation()` pour ne pas naviguer
- Appeler `toggleProject(project.id)` et mettre à jour le state local
- Carte en `opacity-60` quand `enabled: false`

**ProjectDashboard.tsx** :
- Ajouter un `Switch` dans le header à côté du nom du projet
- Même logique : `toggleProject` + mise à jour locale de `project.enabled`

## 4. Galerie screenshots — `RunReport.tsx` + `ProjectDashboard.tsx`

**RunReport.tsx** — Nouvelle section après les steps :
- Si `run.assets?.screenshots?.length > 0`, afficher une Card "Captures d'écran"
- Grille responsive : `grid grid-cols-1 md:grid-cols-2 gap-4`
- Chaque screenshot : Card avec `<img>` + label en dessous
- Clic : ouvrir un `Dialog` avec l'image en plein écran

**ProjectDashboard.tsx** :
- Si le dernier run a des screenshots, afficher une petite vignette (48x48) dans la carte verdict

## 5. Nettoyage legacy

**Supprimer les fichiers :**
- `src/pages/Runner.tsx`
- `src/pages/Runs.tsx`
- `src/pages/RunDetail.tsx`
- `src/lib/api.ts`
- `src/lib/types.ts`

**App.tsx** — Supprimer les 3 routes legacy (`/runner`, `/runs`, `/runs/:id`) et leurs imports.

**AppSidebar.tsx** — Déjà propre (pas de lien legacy).

## 6. Types — `sentinelle-types.ts`

`RunStatus` a déjà `"error"`. `RunAssets` utilise déjà `path`. Rien à changer.

---

## Résumé des fichiers

| Fichier | Action |
|---|---|
| `sentinelle-api.ts` | +2 fonctions |
| `ProjectSettings.tsx` | Zone danger + AlertDialog suppression |
| `Dashboard.tsx` | Switch toggle par projet |
| `ProjectDashboard.tsx` | Switch toggle + vignette screenshot |
| `RunReport.tsx` | Galerie screenshots + Dialog plein écran |
| `Runner.tsx`, `Runs.tsx`, `RunDetail.tsx` | Supprimer |
| `api.ts`, `types.ts` | Supprimer |
| `App.tsx` | Retirer routes + imports legacy |


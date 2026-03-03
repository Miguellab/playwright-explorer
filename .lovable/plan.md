

# Refonte layout : sidebar à gauche

Passer du layout actuel (top-nav `AppNav`) à un layout avec sidebar gauche inspiré du screenshot Paytrackr.

## Structure

```text
┌──────────┬──────────────────────────────┐
│ SIDEBAR  │         CONTENT              │
│          │                              │
│ Logo     │  (Dashboard / Logs /         │
│ ──────── │   Settings / ProjectDetail)  │
│ Projets  │                              │
│ Logs     │                              │
│ ──────── │                              │
│ Paramèt. │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

## Menu items

1. **Projets** (`/`) — liste des projets surveillés (Dashboard actuel)
2. **Logs** (`/logs`) — derniers runs cross-projets avec nom du projet associé
3. **Paramètres** (`/settings`) — configuration des runners (SettingsPage actuel)

## Fichiers à créer

**`src/components/AppSidebar.tsx`** — Sidebar avec :
- Logo Sentinelle + Shield icon en haut
- Section "MENU" : Projets (LayoutDashboard), Logs (ScrollText), Paramètres (Settings)
- Collapsible via `collapsible="icon"` du composant Sidebar shadcn
- Highlight de la route active via `NavLink`

**`src/components/AppLayout.tsx`** — Layout wrapper :
- `SidebarProvider` + `AppSidebar` + zone contenu avec `SidebarTrigger` dans un petit header
- Remplace l'ancien pattern `<AppNav />` + `<main>` dans chaque page

## Fichiers à modifier

1. **`src/App.tsx`** — Wrapper les routes principales dans `<AppLayout>`, créer route `/logs`
2. **`src/pages/Dashboard.tsx`** — Retirer `<AppNav />` et le wrapper `min-h-screen`, ne garder que le contenu
3. **`src/pages/ProjectDashboard.tsx`** — Idem
4. **`src/pages/ProjectSettings.tsx`** — Idem
5. **`src/pages/SettingsPage.tsx`** — Idem
6. **`src/pages/RunReport.tsx`** — Idem
7. **`src/pages/Onboarding.tsx`** — Idem

## Nouveau fichier

**`src/pages/Logs.tsx`** — Page "Logs" :
- Charge tous les projets via `listProjects()`
- Pour chaque projet, charge les derniers runs via `listRuns(projectId)`
- Affiche un tableau : Date, Projet (nom), Statut, Verdict, Durée, lien vers le détail
- Trié par date décroissante

## Pas de changement

- Aucune modification backend / API
- Les pages legacy (`/runner`, `/runs`, `/runs/:id`) restent accessibles mais en dehors du layout sidebar


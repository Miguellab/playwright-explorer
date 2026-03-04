

## Corrections page Paramètres

### 1. Icône verte pour API connectée
L'icône `CheckCircle` utilise `text-primary` qui n'est pas vert. Changer en `text-green-500` pour que ce soit visuellement clair.

### 2. Runner URL/Key éditables + sauvegarde
Les champs sont actuellement `readOnly` avec des valeurs hardcodées depuis les env vars. Il faut :
- Charger les valeurs depuis `app_settings` Supabase (clés `external_runner_url` et `external_runner_api_key`)
- Rendre les inputs éditables (retirer `readOnly`, `bg-muted`)
- Ajouter un bouton "Enregistrer" qui upsert les valeurs dans `app_settings`
- Utiliser les env vars comme fallback si rien n'est en DB

### Fichier modifié : `src/pages/SettingsPage.tsx`

- Ajouter des states `runnerUrl` / `runnerKey` initialisés depuis Supabase puis fallback env vars
- Charger depuis `supabase.from("app_settings").select(...)` au mount
- Bouton "Enregistrer" qui fait `upsert` sur `app_settings` pour les deux clés
- Icône check en `text-green-500`


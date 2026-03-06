

# Mise à jour Sentinelle — Verdicts FR + améliorations

## Ce qui est déjà fait (v3 précédente)
- `deleteProject`, `toggleProject` existent dans `sentinelle-api.ts`
- Toggle Switch sur Dashboard + ProjectDashboard
- Zone danger suppression dans ProjectSettings
- Galerie screenshots dans RunReport
- Pages legacy supprimées

## Ce qui reste à faire

### 1. Remplacer les verdicts SAFE/RISKY/FAILED → OK/ALERTE/ERREUR

**`src/lib/sentinelle-types.ts`** (ligne 3) :
- `Verdict = "OK" | "ALERTE" | "ERREUR"`
- Ajouter `action?: string` à `VerdictIssue` (ligne 101-106)

**`src/components/VerdictBadge.tsx`** — Refonte complète du mapping :
- `OK` → `CheckCircle`, vert, label "OK"
- `ALERTE` → `AlertTriangle`, orange, label "ALERTE"  
- `ERREUR` → `XCircle`, rouge, label "ERREUR"
- Mettre à jour `VerdictText` avec les nouveaux textes FR

### 2. Refonte affichage verdict dans RunReport.tsx

Remplacer le header actuel (lignes 113-136) par :
- **Bannière colorée pleine largeur** en haut : fond vert/orange/rouge selon verdict, avec icône + verdict + headline en bold
- `forUser` affiché en `whitespace-pre-line` sous la bannière
- **Section "Détails techniques"** : `Collapsible` qui affiche `forCTO` en `font-mono` (déjà importé le composant)
- **Issues** : chaque issue affiche severity badge + message + `action` en italique (nouveau champ)

### 3. Badge verdict sur les cartes Dashboard

**`src/pages/Dashboard.tsx`** — Dans chaque carte projet :
- Le projet ne contient pas les données du dernier run. Deux options : (a) fetch les runs pour chaque projet, ou (b) afficher juste le statut dot existant.
- **Approche retenue** : charger `listRuns(p.id, 1)` pour chaque projet au chargement du Dashboard, stocker le dernier run par projet, afficher un petit `VerdictBadge` à côté du nom + headline en sous-texte.

### 4. Collapsible CTO dans RunReport

Ajouter un `Collapsible` dans la section "Résumé pour vous" (lignes 149-167) avec un bouton "Détails techniques" qui révèle `vs.forCTO` en monospace.

---

## Fichiers modifiés

| Fichier | Changement |
|---|---|
| `sentinelle-types.ts` | Verdict → OK/ALERTE/ERREUR, `action` dans VerdictIssue |
| `VerdictBadge.tsx` | Nouveau mapping couleurs/icônes/textes FR |
| `RunReport.tsx` | Bannière verdict colorée, collapsible CTO, issues avec action |
| `Dashboard.tsx` | Fetch dernier run par projet, afficher verdict badge + headline |

4 fichiers, ~80 lignes modifiées.




## Simplification de l'écran projet

### Résumé
Refonte de `ProjectDashboard.tsx` pour : verdict contextualisé avec sous-titre dynamique, dernier événement basé sur le dernier run, séparation parcours principal / autres parcours surveillés, suppression boutons Détails/Historique du bas, ajout icône Historique dans le header, renommage du bouton test, et affichage inline du statut de chaque flow.

### Changements

#### 1. Mise à jour `VerdictBadge.tsx`
Modifier le composant `lg` pour accepter des props optionnelles `subtitle` et `label` qui surchargent les valeurs par défaut. Cela permet au dashboard de passer le texte dynamique sans dupliquer le composant.

Ajouter les props :
- `label?: string` — surcharge `config.label`
- `subtitle?: string` — surcharge `config.headline`

#### 2. Refonte `ProjectDashboard.tsx`

**Données chargées** : `getProject(id)` + `listReleases(id, 1)` + `listRuns(id, 5)` + `getMainFlow(id)` en parallèle.

**Header** :
- Nom projet + URL (inchangé)
- Dernier événement dynamique : trouver le dernier run (`runs[0]`), mapper son `trigger` → label ("Dernière publication détectée", "Dernier test manuel", "Dernier retest manuel") + `timeAgo(run.startedAt)`
- Actions header : `[⚙ Paramètres]` + `[🕘 Historique]` (icône `History`, lien vers `/project/:id/releases`)

**Carte verdict** :
- Utiliser `verdict` de la dernière release
- Mapping dynamique :
  - `OK` → label "Publication vérifiée", subtitle "Tous les parcours surveillés fonctionnent correctement."
  - `ALERTE` → "Problème détecté après publication", subtitle avec count des runs failed
  - `ERREUR` → "Problème détecté après publication", subtitle avec `mainFlowLabel`
  - `PENDING` → "Vérification en cours…", subtitle "Les tests sont en cours d'exécution."
  - Aucune release → "En attente de publication", subtitle "Aucune publication n'a encore été détectée."

**Parcours principal** (si `mainFlowId` existe) :
- Trouver le flow dans `monitoredFlows` où `id === mainFlowId`
- Trouver le dernier run correspondant dans les runs chargés (filtrer par `flowId`)
- Afficher : nom du flow, statut du run (VerdictBadge sm), `stepsSummary` ("X/Y étapes réussies"), `errorSummary` si échec
- Garder `MainFlowSteps` si les steps sont disponibles

**Autres parcours surveillés** :
- Les flows de `monitoredFlows` dont `id !== mainFlowId`
- Pour chaque flow, trouver le dernier run correspondant
- Afficher : flowLabel, statut du run, résumé étapes, errorSummary si échec
- Section titre : "Parcours surveillés" (ou "Autres parcours surveillés" si mainFlow existe)

**Zone authentifiée** : inchangée.

**Actions** (en bas) :
- Un seul bouton : "Lancer un test manuel" (au lieu de "Lancer un test maintenant")
- Suppression des boutons Détails et Historique
- Pendant l'exécution : désactivé + spinner + "Test en cours…"
- Polling `listRuns(id, 5)` toutes les 5s pour détecter la fin (aucun run `queued`/`running`)

### Fichiers impactés
1. `src/components/VerdictBadge.tsx` — ajout props `label`/`subtitle` optionnelles
2. `src/pages/ProjectDashboard.tsx` — refonte complète


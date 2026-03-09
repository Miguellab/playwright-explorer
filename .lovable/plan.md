

## Affichage conditionnel des flows selon leur statut

### Résumé
Transformer le `FlowCard` en accordeon intelligent : compact pour les succes (nom + badge + count), detaille automatiquement pour les erreurs (etapes, screenshots, findings). Reduire le bruit visuel quand tout fonctionne.

### Changements

#### 1. Refonte du `FlowCard` dans `ProjectDashboard.tsx`

Remplacer le `FlowCard` actuel par un composant accordeon avec comportement conditionnel :

**OK (passed)** — Ferme par defaut :
- Ligne compacte : nom du flow + badge OK + "{N} etapes validees"
- Bouton discret "Voir les details" qui ouvre l'accordeon
- Contenu deploye : `MainFlowSteps` + `EvidenceViewer` + `RunFindings`

**ERREUR (failed/error)** — Ouvert automatiquement :
- Affiche immediatement : `errorSummary`, `MainFlowSteps` (etape echouee mise en evidence), `EvidenceViewer`, `RunFindings`

**ALERTE** — Semi-ouvert :
- Affiche le resume du probleme (`errorSummary`)
- Etapes repliees avec bouton pour les voir

**PENDING (queued/running)** — Ferme :
- Ligne compacte avec spinner + "En cours..."

Utiliser `Collapsible` de Radix (deja installe) pour le mecanisme d'ouverture/fermeture.

#### 2. Suppression de la section `MainFlowSteps` separee

Actuellement le parcours principal affiche ses etapes dans une `Card` separee sous le `FlowCard`. Integrer les etapes directement dans le `FlowCard` accordeon du parcours principal, pour eviter la duplication.

Supprimer le bloc `mainFlowSteps` autonome (lignes 323-336) et charger les steps depuis le run correspondant.

#### 3. Chargement des steps par run

Pour afficher les etapes dans un FlowCard, utiliser `run.steps` du run correspondant. Si les steps ne sont pas disponibles dans le run initial (car `listRuns` ne retourne pas toujours les steps complets), les charger via `getRelease` comme c'est deja fait pour le main flow.

### Fichiers impactes
1. `src/pages/ProjectDashboard.tsx` — refonte FlowCard en accordeon, suppression section steps separee


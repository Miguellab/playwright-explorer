

## Nettoyage : afficher uniquement ce qui est actionnable

Apres audit de toutes les pages, voici les elements non-actionnables identifies :

### 1. RunReport.tsx — Diagnostics uniquement si erreurs

La section "Diagnostics" affiche des etapes internes du runner (Audit Connexion, Audit page cible) sans valeur pour l'utilisateur. On la conditionne a la presence d'au moins un diagnostic avec un champ `error`, et on n'affiche que ceux qui ont une erreur.

**Lignes 304-326** : remplacer la condition `run.findings?.diagnostics && run.findings.diagnostics.length > 0` par un filtre sur les diagnostics ayant une erreur. N'afficher que les diagnostics avec `error`.

### 2. ProjectSettings.tsx — Retirer le score de confiance

Le badge `{flow.confidence}%` (ligne 216-218) n'est pas actionnable. L'utilisateur ne peut rien faire de ce pourcentage. A supprimer.

### 3. ProjectSettings.tsx — Retirer les badges "mode d'analyse"

Les badges "Analyse par IA" / "Analyse basique" (lignes 185-195) sont des details internes de la decouverte. L'utilisateur n'a pas besoin de savoir quel mode a ete utilise. A supprimer.

### 4. DiscoverFlows.tsx — Retirer les evidence badges

Les badges `evidence` (lignes 284-292) affichent des artefacts internes de detection (ex: "has login form", "nav detected"). Pas actionnable. A supprimer.

### 5. DiscoverFlows.tsx — Retirer le badge goal

Le badge `{flow.goal}` (lignes 267-269) est une classification interne (LOGIN, CHECKOUT, etc.). L'utilisateur voit deja le label FR et la description. Pas actionnable. A supprimer.

### Resume

| Fichier | Element retire/modifie | Raison |
|---|---|---|
| `RunReport.tsx` | Diagnostics affiches seulement si erreur | Info debug interne |
| `ProjectSettings.tsx` | Badge `confidence %` | Score interne |
| `ProjectSettings.tsx` | Badges mode d'analyse | Detail technique |
| `DiscoverFlows.tsx` | Badges `evidence` | Artefacts internes |
| `DiscoverFlows.tsx` | Badge `goal` | Classification interne |

4 fichiers, suppressions simples (~30 lignes retirees).


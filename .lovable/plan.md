

## Réorganisation des cards projets

Le problème : le `goal` ("SIGNUP") et les `monitoredFlows` ("Inscription", "Connexion") font doublon et la hiérarchie d'information n'est pas claire.

### Nouvelle structure de chaque card

```text
┌──────────────────────────────────────────────────────┐
│ ● fit2                              ✓ OK         🔘  │
│   ↗ sweatsession-start.lovable.app  ⏱ à l'instant    │
│   [Inscription]  [Connexion]                          │
└──────────────────────────────────────────────────────┘
```

**Ligne 1** : dot + nom projet + verdict badge + toggle (à droite)
**Ligne 2** : URL + dernière surveillance
**Ligne 3** : badges des parcours surveillés (monitoredFlows)

### Changements dans `src/pages/Dashboard.tsx`

Supprimer le badge `goal` et le badge "En attente" de la ligne du nom. Ne garder que :
- Nom du projet + `VerdictBadge` (ou "En attente" si pas de verdict) + "En pause" si désactivé
- Supprimer le headline du verdict (`verdictSummary.headline`) — info trop détaillée pour la liste
- Garder les `monitoredFlows` en dernière ligne

Cela élimine la redondance goal/flows et rend la lecture immédiate.

1 fichier modifié.


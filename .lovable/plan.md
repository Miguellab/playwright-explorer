

## Affichage obligatoire des metriques dans les etapes de test

### Probleme
Les etapes "Erreurs console" et "Requetes en echec" s'affichent sans valeur numerique quand le compte est 0. L'utilisateur ne sait pas si l'audit a ete effectue.

### Plan

**1. `src/components/MainFlowSteps.tsx`** — Enrichir l'affichage des etapes metriques

Detecter les etapes de type metrique par leur nom (ex: contient "console" ou "requete"/"request") et injecter le compteur correspondant depuis les `findings` du run.

Probleme : `MainFlowSteps` ne recoit pas les `findings`. Il faut ajouter une prop `findings` optionnelle.

- Ajouter `findings?: Findings | null` aux props
- Pour les etapes dont le nom correspond a "Erreurs console" ou "Requetes en echec", afficher le compteur a cote du label
- Colorer le compteur : 0 → `text-status-safe` (vert), 1-2 → `text-status-alerte` (orange), ≥3 → `text-status-erreur` (rouge)
- Format : `{label} ({count})` ou `{label} — {count}` avec couleur adaptee

Helper pour determiner le compteur :
```ts
function getMetricCount(step: RunStep, findings?: Findings | null): number | null {
  const name = (step.label || step.name).toLowerCase();
  if (name.includes("console")) return findings?.consoleErrors?.length ?? 0;
  if (name.includes("requête") || name.includes("request")) 
    return findings?.failedRequests?.filter(r => r.status >= 400 || r.status === 0).length ?? 0;
  return null; // not a metric step
}

function metricCountColor(count: number): string {
  if (count === 0) return "text-status-safe";
  if (count <= 2) return "text-status-alerte";
  return "text-status-erreur";
}
```

Rendu dans la ligne de l'etape, apres le label :
```tsx
{metricCount !== null && (
  <span className={cn("text-xs font-mono font-medium ml-1", metricCountColor(metricCount))}>
    ({metricCount})
  </span>
)}
```

**2. `src/components/FlowAccordion.tsx`** — Passer `findings` a `MainFlowSteps`

Ajouter la prop `findings` lors de l'appel :
```tsx
<MainFlowSteps steps={run!.steps} stepsSummary={run!.stepsSummary} findings={run?.findings} />
```

### Fichiers impactes
1. `src/components/MainFlowSteps.tsx` — ajout prop `findings`, helper de comptage, affichage du compteur colore
2. `src/components/FlowAccordion.tsx` — passage de `findings` a `MainFlowSteps`




## Probleme

Sur la ligne 138-139 du `RunReport.tsx`, le `VerdictBadge` (verdict IA = "OK") et le `StatusBadge` (statut technique = "FAILED") sont affiches cote a cote sans distinction. C'est contradictoire et perturbant : l'utilisateur voit "OK" en vert et "FAILED" en rouge.

Le verdict IA et le statut technique sont deux choses differentes :
- **Verdict** = analyse IA du resultat fonctionnel (ce qui compte pour l'utilisateur)
- **Statut** = resultat technique de l'execution (interet dev/debug)

## Solution

Quand un verdict IA existe, **ne plus afficher le StatusBadge dans le banner principal**. Le statut technique reste visible dans la ligne "Durée / date" sous forme de texte discret, ou dans les details techniques.

### Changement dans `src/pages/RunReport.tsx`

**Banner verdict (lignes 137-140)** : retirer `StatusBadge` du banner quand un verdict existe. Ajouter le statut technique en petit texte sous la duree uniquement si le statut differe du verdict (ex: verdict OK mais statut failed).

```
Avant :
  <VerdictBadge verdict={vs.verdict} />
  <StatusBadge status={run.status} />

Apres :
  <VerdictBadge verdict={vs.verdict} />
  {/* StatusBadge retire du banner */}
```

Dans la zone duree/date (lignes 147-152), ajouter un indicateur discret si le statut technique differe :

```tsx
{run.status !== "passed" && vs.verdict === "OK" && (
  <span className="text-muted-foreground/60 text-[10px]">
    (statut technique : {run.status})
  </span>
)}
```

Cela garde l'info technique accessible sans creer de confusion visuelle.

### Fichier modifie

| Fichier | Changement |
|---------|-----------|
| `src/pages/RunReport.tsx` | Retirer StatusBadge du banner verdict, ajouter statut technique en texte discret |


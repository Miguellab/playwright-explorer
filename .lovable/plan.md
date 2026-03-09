

## Désactiver le bouton "Relancer" jusqu'à la fin du test

### Problème
Actuellement, `setRetesting(null)` est appelé dans le `finally` du `handleRetest`, donc le bouton redevient actif dès que l'appel API HTTP retourne (quelques ms), pas quand le test est réellement terminé.

### Solution

**`src/pages/ReleaseDetail.tsx`** :
- Changer `retesting` de `string | null` en `Set<string>` pour permettre plusieurs retests simultanés sur des flows différents.
- Dans `handleRetest` : ajouter le `flowId` au Set, ne PAS le retirer dans le `finally`.
- Dans le polling existant (qui tourne tant que `isActive`), ou dans un nouveau polling déclenché par le retest : quand le run du flow retesté passe en statut terminé (`passed`/`failed`/`error`), retirer le `flowId` du Set.
- On peut détecter qu'un flow est "en cours" en vérifiant si son run le plus récent a un statut `running` ou `queued` dans les données de la release.

Approche simplifiée : après un retest, activer le polling sur la release (si pas déjà actif). À chaque tick du poll, pour chaque flowId dans `retesting`, vérifier si le run correspondant est terminé et le retirer du Set.

**`src/components/RunCard.tsx`** : aucun changement nécessaire, la prop `retesting` boolean fonctionne déjà.

### Détail du changement dans ReleaseDetail.tsx

1. `const [retesting, setRetesting] = useState<Set<string>>(new Set());`
2. `handleRetest` : ajoute le flowId au Set, ne le retire pas dans finally (sauf en cas d'erreur API).
3. Dans le `useEffect` de polling (ou un nouveau) : à chaque refresh de la release, parcourir `retesting` et retirer les flowIds dont le run n'est plus `running`/`queued`.
4. Passer `retesting={retesting.has(run.flowId)}` au `RunCard`.

### Fichiers impactés
1. `src/pages/ReleaseDetail.tsx`


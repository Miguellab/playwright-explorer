

## Fix: Affichage du pourcentage de confiance

Le score `confidence` arrive déjà en pourcentage (ex: 9000 = 9000%) depuis le backend. Multiplier par 100 donne des valeurs absurdes comme "9000%".

### Changement

**`src/components/AuthenticatedZone.tsx`** ligne 260 :
- Remplacer `{Math.round(flow.confidence * 100)}%` par `{Math.round(flow.confidence)}%`

1 fichier, 1 ligne.


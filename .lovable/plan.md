

## Fix : Afficher la "Zone authentifiée" en utilisant les données projet

### Cause
`AuthenticatedZone` appelle `getFlowCredentialsStatus` via API. Si cet appel échoue silencieusement, la section ne s'affiche jamais.

### Changement

**`src/components/AuthenticatedZone.tsx`** :

1. Remplacer le `useEffect` lignes 51-60 par une vérification locale sur le projet :

```tsx
useEffect(() => {
  const allFlows = [
    ...(project.monitoredFlows ?? []),
    ...(project.suggestedFlows ?? []),
  ];
  const hasLogin = allFlows.some(
    (f) => f.goal === "LOGIN" && f.credentials && f.credentials.email
  );
  setHasAuthCredentials(hasLogin);
  setCheckingCredentials(false);
}, [project]);
```

2. Supprimer l'import de `getFlowCredentialsStatus`.

1 fichier, ~10 lignes modifiées.


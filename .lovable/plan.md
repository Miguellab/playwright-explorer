

## Amélioration des cards projets sur le Dashboard

Le problème : les cards n'affichent que le `goal` (ex: "SIGNUP") mais pas les parcours surveillés (`monitoredFlows`). Le dashboard projet (`ProjectDashboard.tsx`) les affiche correctement, mais pas la liste sur `Dashboard.tsx`.

### Changement dans `src/pages/Dashboard.tsx`

Après la ligne avec le headline du verdict (ligne 210), ajouter l'affichage des `monitoredFlows` :

```tsx
{project.monitoredFlows && project.monitoredFlows.length > 0 && (
  <div className="flex items-center gap-1.5 flex-wrap">
    {project.monitoredFlows.map((flow) => (
      <Badge key={flow.id} variant="secondary" className="font-mono text-[10px]">
        {flow.labelFr}
      </Badge>
    ))}
  </div>
)}
```

Cela affichera les badges "Inscription", "Connexion", etc. sous l'URL du projet, de façon cohérente avec la vue détaillée du projet.

1 fichier modifié : `src/pages/Dashboard.tsx`.


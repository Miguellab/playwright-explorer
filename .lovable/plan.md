

## Plan : Supprimer les doublons de credentials

### 1. `src/pages/Onboarding.tsx`

**Imports** — Retirer `FlowCredentialsForm`, `saveFlowCredentials`, `Lock` (ligne 17, 22, 27).

**Stepper** — Remplacer la logique dynamique (lignes 86-101 + 219-222) par un stepper fixe 3 etapes et un simple `selectedFlows` memo. Supprimer `hasAuthFlows`, `CREDENTIALS_STEP`, `SURVEILLANCE_STEP`, `authFlows`.

**Navigation** :
- "Continuer avec X parcours" (ligne 485) → `setStep(2)` toujours
- "Aucun parcours" continue (ligne 404) → `setStep(2)`
- Bouton "Retour" surveillance (ligne 616) → `setStep(1)` toujours

**Supprimer** le bloc entier step Identifiants (lignes 500-555).

**Step Surveillance** — Condition `step === SURVEILLANCE_STEP` (ligne 558) → `step === 2`. Ajouter un bandeau info si des flows auth sont selectionnes :
```tsx
{selectedFlows.some((f) => f.requiresCredentials) && (
  <div className="rounded-md bg-status-pending/10 border border-status-pending/30 px-3 py-2">
    <p className="font-mono text-xs text-status-pending">
      Certains parcours necessitent des identifiants. Vous pourrez les configurer dans les parametres du projet apres la creation.
    </p>
  </div>
)}
```

### 2. `src/pages/ProjectDashboard.tsx`

**Imports** — Retirer `FlowCredentialsForm` (ligne 6). Verifier si `updateProject` est utilise ailleurs → il ne l'est pas dans ce fichier apres suppression, donc le retirer aussi (ligne 19).

**Remplacer** le bloc credentials (lignes 327-345) par un simple avertissement avec lien vers les parametres :
```tsx
{project.monitoredFlows.some((f) => f.requiresCredentials && !f.credentials) && (
  <div className="flex items-center justify-between rounded-lg border border-status-pending/30 bg-status-pending/5 p-3">
    <p className="font-mono text-xs text-status-pending">
      Certains parcours necessitent des identifiants de test.
    </p>
    <Link to={`/project/${project.id}/settings`}>
      <Button variant="outline" size="sm" className="font-mono text-xs">
        <Settings className="mr-1 h-3 w-3" /> Configurer
      </Button>
    </Link>
  </div>
)}
```

### 3. Fichiers inchanges
- `src/pages/ProjectSettings.tsx` — deja correct
- `src/components/FlowCredentialsForm.tsx` — conserve pour usage futur

### Fichiers modifies
1. `src/pages/Onboarding.tsx`
2. `src/pages/ProjectDashboard.tsx`


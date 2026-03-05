

## Fix: Bannière "identifiants manquants" persistante sur le Dashboard

### Cause
Le backend ne renvoie jamais l'objet `credentials` (pour securite), mais renvoie `hasCredentials: true`. Le dashboard verifie `!f.credentials` (toujours `undefined`) au lieu de `!f.hasCredentials`.

### Changement

**`src/pages/ProjectDashboard.tsx` — ligne 326**

Remplacer :
```ts
f.requiresCredentials && !f.credentials
```
Par :
```ts
f.requiresCredentials && !f.hasCredentials
```

Un seul caractere change dans un seul fichier.


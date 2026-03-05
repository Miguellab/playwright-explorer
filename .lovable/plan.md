

## Analyse

Le backend ne renvoie pas les credentials en clair (ni email ni mot de passe) pour des raisons de securite — il renvoie uniquement `hasCredentials: true`. Donc quand on clique "Modifier", on ne peut pas pre-remplir les champs avec les valeurs precedentes car elles ne sont pas disponibles cote client.

## Deux options

### Option A — Changement backend (recommande)
Modifier le backend pour renvoyer l'email en clair mais masquer le mot de passe (ex: `credentials: { email: "user@test.com", password: null }`). Cela permet de pre-remplir l'email quand on clique "Modifier", et le mot de passe reste a re-saisir.

Ce n'est pas faisable cote Lovable car le backend est externe.

### Option B — Cache local (frontend only)
Apres une sauvegarde reussie, conserver les credentials saisis dans le state local pour la session en cours. Ainsi, si l'utilisateur clique "Modifier" sans avoir recharge la page, les champs sont pre-remplis. Apres un rechargement de page, seul le badge "Identifiants configures" apparait (sans les valeurs).

### Changement prevu (Option B)

**`src/pages/ProjectSettings.tsx`**

1. Stocker les credentials "reels" dans un state separe `savedCredentials` apres une sauvegarde reussie
2. Quand l'utilisateur clique "Modifier", pre-remplir les champs avec `savedCredentials[flowId]` au lieu de vider les champs
3. Si pas de `savedCredentials` (page rechargee), les champs restent vides avec un placeholder explicatif

C'est la meilleure solution possible sans modification backend.


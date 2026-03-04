

## Rétablir la configuration du Runner dans les Parametres

Remplacer le message info ("La configuration du runner...") par une card editable avec les champs Runner URL et Runner API Key, pré-remplis depuis les variables d'environnement (`DEFAULT_RUNNER_URL`, `DEFAULT_RUNNER_KEY`).

### Changement dans `src/pages/SettingsPage.tsx`

Remplacer le bloc info (lignes 56-63) par une nouvelle Card "Configuration du Runner" :

- **Runner URL** : champ `Input` pré-rempli avec `DEFAULT_RUNNER_URL` depuis `sentinelle-api.ts` (lecture seule pour l'instant, car c'est une variable d'env)
- **Runner API Key** : champ `Input` type password, pré-rempli avec `DEFAULT_RUNNER_KEY`, masqué par défaut
- Un texte explicatif : "Ces valeurs par defaut sont utilisees lors de la creation de nouveaux projets."

Les valeurs proviennent des exports `DEFAULT_RUNNER_URL` et `DEFAULT_RUNNER_KEY` déjà disponibles dans `sentinelle-api.ts`. Ces champs seront en lecture seule (affichage de la config actuelle) car ce sont des variables d'environnement non modifiables depuis le frontend.

1 fichier modifié : `src/pages/SettingsPage.tsx`.


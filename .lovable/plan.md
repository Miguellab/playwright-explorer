

## Ajouter un toggle visibilite sur le champ Runner API Key

Ajouter un state `showRunnerKey` et un bouton oeil sur le champ Runner API Key, identique a celui du champ Anthropic.

### Modifications

**`src/pages/SettingsPage.tsx`** :
- Ajouter state `showRunnerKey` (false par defaut)
- Remplacer le champ Input runner-key (lignes 126-133) par un wrapper `relative` avec Input + bouton toggle Eye/EyeOff, meme pattern que le champ Anthropic

1 fichier, ~10 lignes modifiees.


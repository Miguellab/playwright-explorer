

## Fix: texte des requetes en echec qui deborde

### Probleme
Dans `RunFindings.tsx`, le `<span>` qui affiche les URLs des requetes en echec (ligne 74) n'a pas de classe pour gerer le debordement. Les URLs longues (Google Analytics, etc.) sortent du conteneur.

### Changement

**`src/components/RunFindings.tsx`** — ligne 74 :
- Remplacer `<span className="text-xs font-mono text-foreground/80">` par `<span className="text-xs font-mono text-foreground/80 break-all block">`
- `break-all` permet de couper les URLs longues a n'importe quel caractere
- `block` assure que le span prend toute la largeur disponible

Meme traitement que celui deja applique aux erreurs console (ligne 38 : `<code className="text-xs text-foreground/80 break-all block">`).

### Fichier impacte
1. `src/components/RunFindings.tsx` — ajout `break-all block` sur le span des requetes en echec


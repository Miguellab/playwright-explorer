

## Probleme

Les screenshots sont servis par l'API Sentinelle qui requiert un header `Authorization: Bearer ...`. Un `<img src="...">` ne peut pas envoyer de headers custom, donc l'image echoue systematiquement.

## Solution

Creer un hook `useAuthenticatedImage` qui :
1. Fait un `fetch` avec le header Authorization vers l'URL du screenshot
2. Convertit la reponse en blob URL (`URL.createObjectURL`)
3. Utilise ce blob URL comme `src` de l'image
4. Nettoie le blob URL au unmount (`URL.revokeObjectURL`)

### Fichiers modifies

**`src/hooks/use-authenticated-image.ts`** (nouveau)
- Hook qui prend une URL, fait le fetch avec API key, retourne `{ src, loading, error }`

**`src/pages/RunReport.tsx`**
- Remplacer les `<img src={getScreenshotUrl(shot.path)}>` par un composant `AuthImage` qui utilise le hook
- Creer un petit composant `AuthImage` inline ou separe qui affiche un skeleton pendant le chargement et le placeholder "Image non disponible" en cas d'erreur
- Meme chose pour le lightbox

### Detail du hook

```ts
function useAuthenticatedImage(url: string) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let revoke: string | null = null;
    fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } })
      .then(r => r.ok ? r.blob() : Promise.reject())
      .then(blob => {
        revoke = URL.createObjectURL(blob);
        setSrc(revoke);
      })
      .catch(() => setError(true));
    return () => { if (revoke) URL.revokeObjectURL(revoke); };
  }, [url]);

  return { src, loading: !src && !error, error };
}
```


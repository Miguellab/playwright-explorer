

# Mise à jour du contrat API Sentinelle v2

3 axes de changements à appliquer.

---

## 1. Mise à jour des types — `src/lib/sentinelle-types.ts`

Ajouter les champs `name` et `action` à l'interface `RunStep` :

```ts
interface RunStep {
  name: string;       // legacy, = label
  action: string;     // type technique (navigate, screenshot, click_first_match, etc.)
  label: string;      // texte à afficher
  status: StepStatus;
  durationMs?: number;
  detail?: string;
}
```

## 2. Icônes par action dans les steps — nouveau helper + 3 pages

Créer un composant utilitaire `StepActionIcon` dans `src/components/StepActionIcon.tsx` qui mappe `step.action` vers une icône Lucide :

| action | icône |
|---|---|
| `launch_browser` | `Globe` |
| `navigate` | `ExternalLink` |
| `screenshot` | `Camera` |
| `page_audit` | `ClipboardCheck` |
| `click_first_match` / `click` | `MousePointer` |
| `check_console` | `Terminal` |
| `check_network` | `Wifi` |
| fallback | `CircleDot` |

Modifier l'affichage des steps dans **3 fichiers** pour ajouter l'icône avant le label :

- **`src/pages/RunReport.tsx`** (lignes ~191-201) — ajouter `<StepActionIcon>` avant `step.label`
- **`src/pages/ProjectDashboard.tsx`** (lignes ~279-289) — idem
- **`src/pages/RunDetail.tsx`** (lignes ~114-121) — idem (page legacy)

## 3. Onboarding étape 3 — texte explicatif

**`src/pages/Onboarding.tsx`** (lignes ~296-343) — Ajouter sous le titre "Surveillance" un bloc d'explications pour l'utilisateur :

- Sentinelle vérifie le site à la fréquence choisie
- Un test est lancé automatiquement si un changement est détecté
- Le max de tests/jour évite la surcharge
- Les tests manuels comptent dans le quota

4 bullet points en texte `text-xs text-muted-foreground` dans une div sous les contrôles existants.

---

## Résumé des fichiers modifiés

| Fichier | Changement |
|---|---|
| `src/lib/sentinelle-types.ts` | Ajouter `name`, `action` à `RunStep` |
| `src/components/StepActionIcon.tsx` | **Nouveau** — composant icône par action |
| `src/pages/RunReport.tsx` | Icône action avant chaque step label |
| `src/pages/ProjectDashboard.tsx` | Idem |
| `src/pages/RunDetail.tsx` | Idem |
| `src/pages/Onboarding.tsx` | Texte explicatif étape 3 |


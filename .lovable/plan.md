

# Mise en conformité avec le contrat API Sentinelle

## Constat

L'API retourne `{"projects":[]}` — aucun projet n'existe côté backend. Ce n'est pas un bug frontend. Le projet "fit" a probablement été supprimé ou créé avec une autre clé API.

Cependant, en comparant le code avec le contrat API fourni, il y a **5 incompatibilités** qui causeraient des bugs dès qu'on crée un projet ou qu'on lance un test.

---

## 1. Goal IDs incorrects (`sentinelle-types.ts` + `Onboarding.tsx`)

L'API retourne `BOOK` et `BUY`, mais le code utilise `BOOKING` et `PURCHASE` dans les fallbacks et le mapping `GOAL_META`.

**Fichier `src/pages/Onboarding.tsx`** :
- Renommer les clés de `GOAL_META` : `BOOKING` -> `BOOK`, `PURCHASE` -> `BUY`
- Mettre à jour les fallback goals (lignes 86-89) : `BOOKING` -> `BOOK`, `PURCHASE` -> `BUY`

---

## 2. Type `Project` incomplet (`sentinelle-types.ts`)

L'API retourne `runnerBaseUrl` dans la réponse projet, mais le type ne l'inclut pas. Aussi `createdByUserId` n'est pas dans le contrat.

**Fichier `src/lib/sentinelle-types.ts`** :
- Ajouter `runnerBaseUrl: string` au type `Project`
- Retirer `createdByUserId` (pas dans le contrat API)

---

## 3. Type `RunStep` ne correspond pas au contrat API (`sentinelle-types.ts`)

L'API retourne des steps avec `{ action, label, status, durationMs }` mais le type utilise `{ name, status, detail, durationMs }`.

**Fichier `src/lib/sentinelle-types.ts`** :
```typescript
export interface RunStep {
  action: string;      // was "name"
  label: string;       // was absent (used "name" for display)
  status: StepStatus;
  durationMs?: number; // optional per contract
  detail?: string;     // keep for backwards compat
}
```

**Fichier `src/pages/ProjectDashboard.tsx`** :
- Remplacer `step.name` par `step.label` dans l'affichage (ligne 297)

---

## 4. `RunStatus` manque le statut `"error"` (`sentinelle-types.ts`)

Le contrat indique `queued -> running -> passed | failed | error`. Le type actuel manque `"error"`.

**Fichier `src/lib/sentinelle-types.ts`** :
```typescript
export type RunStatus = "queued" | "running" | "passed" | "failed" | "error";
```

Le polling dans `ProjectDashboard.tsx` (ligne 88) doit aussi traiter `"error"` comme terminal :
```typescript
if (updated.status === "passed" || updated.status === "failed" || updated.status === "error") {
```

---

## 5. Fallback goals dans `Onboarding.tsx` et `ProjectSettings.tsx`

Les deux pages ont des fallbacks avec les mauvais IDs (`BOOKING`, `PURCHASE`).

**Fichier `src/pages/ProjectSettings.tsx`** (lignes 49-53) :
- Remplacer `BOOKING` -> `BOOK`, `PURCHASE` -> `BUY`
- Mettre à jour les labels : "Booking" -> "Book / Schedule", "Purchase" -> "Buy / Checkout"

---

## Fichiers à modifier

1. **`src/lib/sentinelle-types.ts`** — Corriger `Project`, `RunStep`, `RunStatus`
2. **`src/pages/Onboarding.tsx`** — Fix `GOAL_META` keys + fallback goals
3. **`src/pages/ProjectDashboard.tsx`** — `step.name` -> `step.label`, polling includes `"error"`
4. **`src/pages/ProjectSettings.tsx`** — Fix fallback goal IDs

Aucune base de données ou edge function à modifier. Après ces corrections, l'onboarding créera des projets avec les bons goal IDs et les runs s'afficheront correctement.

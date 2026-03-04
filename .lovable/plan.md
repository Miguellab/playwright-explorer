

## Fix: Images use wrong API key

The `useAuthenticatedImage` hook always sends the Sentinelle API key. But screenshots are hosted on the Playwright Runner which requires its own separate key (`VITE_DEFAULT_RUNNER_KEY`).

### Root cause

- Screenshot URLs point to `playwrightrunner-production.up.railway.app`
- The hook sends `Authorization: Bearer s#!/nelle2026` (Sentinelle key)
- The runner expects `Authorization: Bearer super_secret_key_123` (runner key)
- Result: 401 error, "Image non disponible"

### Fix in `src/hooks/use-authenticated-image.ts`

Import the runner base URL and key from env vars. Detect if the URL starts with the runner base URL, and if so, use the runner key instead of the Sentinelle key.

```ts
const RUNNER_URL = import.meta.env.VITE_DEFAULT_RUNNER_URL || "";
const RUNNER_KEY = import.meta.env.VITE_DEFAULT_RUNNER_KEY || "";

// In the fetch:
const isRunnerUrl = RUNNER_URL && url.startsWith(RUNNER_URL);
const token = isRunnerUrl ? RUNNER_KEY : API_KEY;

fetch(url, {
  headers: token ? { Authorization: `Bearer ${token}` } : {},
})
```

No other files need to change. Just reload the page after the fix to test.


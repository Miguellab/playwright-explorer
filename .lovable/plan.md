

# Fix: Settings Page "Failed to load settings"

## Root Cause
The `getSettings()` function in `src/lib/api.ts` calls `JSON.parse(row.value)` on values from the `app_settings` table. Since the `value` column is `jsonb`, the Supabase JS client already deserializes these values automatically. Calling `JSON.parse` on an already-parsed string like `"mock"` or `""` throws a `SyntaxError`, which causes the entire settings load to fail.

Similarly, `updateSetting()` calls `JSON.stringify(value)` before storing, which would double-encode values on save.

## Fix (1 file)

**`src/lib/api.ts`** -- `getSettings()` function:
- Remove `JSON.parse` -- use `row.value` directly since Supabase already parses jsonb
- In `updateSetting()`, pass `value` directly to the update call instead of `JSON.stringify()`-ing it (Supabase client handles jsonb serialization)

The fix is ~4 lines changed in the two functions.


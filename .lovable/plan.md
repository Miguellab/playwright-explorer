

## Update Landing Page Logo to Match App Branding

**`src/pages/Landing.tsx`** — Line 39-42: Remove the `Shield` icon and change "Sentinelle" to uppercase "SENTINELLE" with `text-neon` color (matching the sidebar style `text-sm font-bold tracking-tight text-neon`).

```tsx
// Before
<Link to="/" className="flex items-center gap-2 font-mono text-sm font-bold tracking-tight text-primary">
  <Shield className="h-4 w-4" />
  Sentinelle
</Link>

// After
<Link to="/" className="text-sm font-bold tracking-tight text-neon">
  SENTINELLE
</Link>
```

Also remove `Shield` from the lucide import if no longer used elsewhere on the page.


# Red-CORAL — AI Agent Guidelines

Interactive map of organized crime incidents in South America, built for the Harvard T.H. Chan School of Public Health's Atrocity Prevention Lab. **All UI strings are in Spanish** — never introduce English-language UI text.

## Code Style

- **TypeScript strict mode** with zero unused locals/params (prefix unused args with `_`)
- **ESLint**: `--max-warnings 0` — no warnings tolerated. `react-hooks/exhaustive-deps` is OFF.
- **Imports**: both bare (`from 'types'`) via `baseUrl: "src"` and aliased (`from '@/types'`) work; match existing imports in the file you're editing.
- **Styling**: Tailwind CSS with custom `harvard-*`, `shade`, `tint` palette and `merriweather`/`proxima-nova` fonts defined in `tailwind.config.js`.
- **Icons**: `lucide-react` exclusively.
- **Dropdowns/popovers**: `@floating-ui/react` — no component library. See `src/components/filters/BaseFilter.tsx` for the pattern.

## Architecture

- **Single context**: `src/context/DBContext.tsx` holds all app data (Categories, Types, Incidents). No Redux. Access via `useDB()` hook. A raw `db` export exists for use outside React (e.g., cluster icon functions in `IncidentLayer`).
- **Data flow**: Firebase Storage JSON snapshots → `DBContext` → components. Admins also get Firestore delta updates for docs modified after the snapshot's `readAt` timestamp.
- **User tiers**: `'public' | 'paid' | 'admin'` — resolved from Firestore `Permissions` collection.
- **Caching**: IndexedDB with 24-hour TTL for public/paid tiers. Admin data is never cached. See `src/utils/indexedDB.ts`.
- **Soft deletes**: Docs marked `deleted: true` with `updatedAt` timestamp; purged during publish.
- **CRUD mutations** intentionally mutate state without full rerender to avoid resetting the map view (marked with 🚨 in code).
- **`typeID`** on `Incident` can be `string | string[]` — always handle both cases.
- **Lazy loading**: Admin pages use `React.lazy()` + `Suspense`.

## Dual Filter Systems

1. **Map page** (`src/pages/Map.tsx`): Simple `MarkerFilters` object via `useState` + `filterIncidents()` utility.
2. **Stats/Publish pages** (`src/filters/filterReducer.ts`): Reducer-based composable filters with `NOT`/`OR` meta-filters. Each filter type has a component (in `src/components/filters/`) and a predicate function. State persists to `localStorage`.

## Build & Commands

```sh
pnpm install          # Install deps (pnpm 10.9.0 required)
pnpm dev              # Vite dev server
pnpm build            # tsc type-check + vite build
pnpm lint             # ESLint (zero warnings)
pnpm format           # Prettier
```

No test framework is configured — there are no test files.

## Firebase & Environment

Firestore collections: `Incidents`, `Categories`, `Types`, `Permissions`.
Publish workflow (`src/utils/publish.ts`): snapshots Firestore → uploads tiered JSON files (`publicState.json`, `state.json`, `adminCheckpointState.json`) to Cloud Storage → deletes soft-deleted docs.

Required env vars (all `VITE_` prefixed): `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`, `STADIA_KEY`, `ANALYTICS_URL`.

## Key Files

| Area | Files |
|---|---|
| Data layer | `src/context/DBContext.tsx`, `src/types.ts`, `src/utils.ts` |
| Map | `src/pages/Map.tsx`, `src/components/layers/IncidentLayer.tsx` |
| Filters | `src/filters/filterReducer.ts`, `src/components/filters/` |
| Admin | `src/pages/AdminCRUD.tsx`, `src/pages/PublishAdmin.tsx` |
| Stats | `src/pages/StatsDashboard.tsx`, `src/components/graphs/` |
| Caching | `src/utils/indexedDB.ts` |
| Routing | `src/App.tsx` |

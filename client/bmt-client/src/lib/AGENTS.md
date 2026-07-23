# DOX: src/lib

## Purpose

Integration and persistence boundary — external API wrappers and data storage.

## Ownership

App maintainers; changes here affect data durability and third-party connectivity.

## Local Contracts

- **Database**: `db.ts` initializes sql.js (SQLite WASM), falls back to `localStorage`. Exposes `initDB`, `saveTasks`, `loadTasks`, `saveUserStats`, `loadUserStats`, `clearDB`.
- **Google Calendar**: `google-calendar.ts` — OAuth2 flow and Calendar event creation. Config via `VITE_GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_SECRET`.
- **Google Drive**: `google-drive.ts` — Drive integration boundary.
- **Google Keep**: `google-keep.ts` — Keep integration boundary.
- **Types**: imports from `../types`; no React imports.

## Work Guidance

- Keep this folder free of React concerns; lib functions should be callable from non-React contexts.
- When changing persistence, preserve existing `localStorage` fallback keys (`bmt-tasks`, `bmt-userStats`).
- Google integrations should fail gracefully when env vars are absent (`isGoogleConfigured` guards exist in `google-calendar.ts`; extend the same pattern elsewhere).

## Verification

- `pnpm run tsc`
- `pnpm run test`
- `pnpm run lint`

## Child DOX Index

None.

# DOX: src

## Purpose

App boundary — entry point, root styles, global state, and core types for Beast Mode Todo.

## Ownership

App maintainers; changes here affect every feature.

## Local Contracts

- **Entry**: `src/main.tsx` mounts `src/App.tsx`.
- **State**: `src/store.ts` exports `useAppStore` (Zustand 5 with persist). Timer interval helper functions are also exported from here.
- **Types**: `src/types.ts` defines `Task`, `TimeLog`, `UserStats`, `TaskStats`, plus helpers (`generateId`, `formatDuration`, `formatTime`, `getTaskStats`, `getMotivationMessage`).
- **Styles**: `src/index.css` holds global styles, Tailwind directives, and animations.
- **Persistence**: managed via Zustand partialize/migrate in `src/store.ts`; no direct `localStorage` access exists in this folder.

## Work Guidance

- Keep UI concerns out of `src/store.ts`; derive presentation values in components.
- Keep domain helpers in `src/types.ts` so lib/services can share them without importing React.
- Treat `src/App.tsx` as a thin composition root — orchestrate, don't hold business logic.

## Verification

- `pnpm run tsc`
- `pnpm run test`
- `pnpm run lint`

## Child DOX Index

- `src/components/` — React component boundary (UI layer). See `src/components/AGENTS.md`.
- `src/lib/` — Integration and persistence boundary (Google APIs, database). See `src/lib/AGENTS.md`.
- `src/test/` — Vitest tests and setup boundary. See `src/test/AGENTS.md`.
- `src/assets/` — Static media boundary. See `src/assets/AGENTS.md`.

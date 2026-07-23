# DOX: client/bmt-client

## Purpose

React frontend for Beast Mode Todo — a focus time-tracking app with XP, streaks, and Beast Mode motivation.

## Ownership

App maintainers; responsible for UI, state management, integrations, and tests.

## Local Contracts

- **Package manager**: pnpm (package.json committed; package-lock.json present from prior npm usage)
- **Build / bundle**: Vite + Rolldown plugin
- **Language**: TypeScript + React 19 (with Babel React Compiler)
- **State**: Zustand 5
- **UI**: Tailwind CSS v4, Base UI
- **Persistence / integrations**: sql.js, Google Calendar, Google Drive, Google Keep
- **Tests**: Vitest (unit/component) + Testing Library + jsdom; coverage via v8
- **Lint / format**: ESLint (typescript-eslint, react-hooks, react-refresh) — no formatter configured yet
- **Entry**: `src/main.tsx` → `src/App.tsx`

## Work Guidance

No repo-specific standards beyond the Local Contracts above. Follow existing file/component naming conventions in `src/components/`.

## Verification

- `pnpm run tsc` — TypeScript check (strict via `tsconfig.app.json`)
- `pnpm run test` — Vitest unit/component suite
- `pnpm run lint` — ESLint
- `pnpm run build` — Vite production build

## Child DOX Index

- `src/` — app entry, global state, core types, and styles. See `src/AGENTS.md`.
- `src/components/` — React component boundary (UI layer). See `src/components/AGENTS.md`.
- `src/lib/` — integration and persistence boundary (Google APIs, sql.js/localStorage). See `src/lib/AGENTS.md`.
- `src/test/` — Vitest tests and setup boundary. See `src/test/AGENTS.md`.
- `src/assets/` — static media boundary. See `src/assets/AGENTS.md`.

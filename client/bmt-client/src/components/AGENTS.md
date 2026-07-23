# DOX: src/components

## Purpose

React component boundary for Beast Mode Todo — all presentational and interactive UI pieces.

## Ownership

App maintainers; changes here affect user experience and accessibility.

## Local Contracts

- **Framework**: React 19 + TypeScript (Babel React Compiler enabled project-wide).
- **Styling**: Tailwind CSS v4 utility classes; Base UI primitives where used.
- **State access**: Components read/write global state via `useAppStore` from `../store`.
- **Naming**: files use PascalCase, default export per file.
- **Existing components**: Header, Footer, TimerPanel, TimerStatsDisplay, TaskLists, TaskItem, AddTask, StatsDisplay, WeeklySummary, MotivationBanner, EmptyState, GoogleCalendar, Help.

## Work Guidance

- Follow the existing component shape: props interface + default export function component.
- Keep components focused on rendering + simple derived state; dispatch store actions rather than embedding business logic.
- Maintain accessibility patterns already present: `aria-label`, `role`, `sr-only`, keyboard focus handling.
- Reuse existing icons from `lucide-react`; do not add icon libraries.

## Verification

- `pnpm run test` — component/unit tests via Vitest + Testing Library
- `pnpm run tsc`
- `pnpm run lint`

## Child DOX Index

None.

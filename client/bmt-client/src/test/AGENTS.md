# DOX: src/test

## Purpose

Vitest unit/component test boundary — tests, fixtures, and test setup.

## Ownership

App maintainers; changes here affect correctness gates.

## Local Contracts

- **Runner**: Vitest v4 with jsdom environment.
- **Setup**: `src/test/setup.ts` configures the test environment.
- **Coverage**: v8 provider (`pnpm run test:coverage`).
- **Existing suites**:
  - `store.test.ts` — Zustand store actions, timer interval, persistence partialization, motivation messages.
  - `TaskItem.test.tsx` — TaskItem component behavior.
  - `TimerPanel.test.tsx` — TimerPanel component behavior.
  - `types.test.ts` — types-level helpers.

## Work Guidance

- Keep test files colocated in this folder; do not add `__tests__` directories alongside source.
- When mocking, prefer explicit vi.fn over implicit module mocking unless the module is side-effect-heavy.
- Store tests should reset state in `beforeEach` and stop the timer interval in `afterEach`.

## Verification

- `pnpm run test`
- `pnpm run test:coverage`
- `pnpm run tsc`

## Child DOX Index

None.

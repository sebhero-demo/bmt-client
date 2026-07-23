# Beast Mode Todo — Timer Orchestrator Spec

## Problem Statement

Timer behavior is tightly coupled to Zustand store setters. Start, pause, resume, and complete transitions each repeat ad-hoc session math, log-closing, and stat recomputation inside the store. This makes the logic hard to test in isolation and error-prone to extend. Every new feature that touches time tracking — Beast Mode streaks, manual time entry, future retrospectives — must navigate the same procedural maze instead of calling a clean interface.

## Solution

Extract the timer state machine into a dedicated `TimerSession` module. One instance per active task session. The module owns transitions, log closing, duration accumulation, and stat recomputation. The store becomes a thin adapter that instantiates `TimerSession` on task start, forwards transitions, and applies returned patches. Persistence stays with the store/`db.ts`; the session module is persistence-ignorant.

## User Stories

1. As a user, I want to start a task and see the timer running, so that I can focus on execution.
2. As a user, I want to pause an active task and resume it later, so that interruptions do not lose my progress.
3. As a user, I want automatic stats recomputation after every timer transition, so that my min/max/average times stay accurate without manual refresh.
4. As a user, I want the open time log to close correctly when I pause or complete a task, so that every session is recorded accurately.
5. As a user, I want the active task to switch cleanly when I start another task, so that only one timer runs at a time.
6. As a developer, I want to unit-test timer transitions without React or Zustand, so that bugs in state transitions are caught before they reach the UI.
7. As a developer, I want the store file to shrink as timer logic moves out, so that store behavior stays readable.
8. As a developer, I want persistence logic to remain in one place, so that adding SQLite or localStorage does not require touching timer transitions.
9. As a user, I want manual time logs to participate in the same stat recomputation, so that manually logged time is treated consistently with tracked time.
10. As a user, I want task total duration to update correctly on completion, so that XP and historical averages reflect true elapsed time.

## Implementation Decisions

- A new `TimerSession` class will live in a separate module. One instance represents one active task session. It is created when a task starts and replaced/discarded on transition.
- `TimerSession` methods will return a patch/event object describing what changed: closed logs, session seconds, updated task fields, motivation message, and any side effects needed by the store.
- The store will own `timerSeconds` accumulation and the `setInterval` tick. `TimerSession` will never call `Date.now()` or `setInterval`; it is a pure domain module driven only by discrete transitions and the current `timerSeconds` value supplied by the store.
- Persistence is handled by the store and existing `db.ts`/localStorage paths. `TimerSession` does not write or read storage.
- The store will keep responsibility for task array mutation and Zustand `set()` calls. `TimerSession` only computes what should happen.

## Testing Decisions

- Test `TimerSession` in isolation: unit tests cover each transition with fake task data and assert returned patches. No React, Zustand, or browser APIs required.
- Test that the store applies patches correctly from `TimerSession` return values.
- Existing tests for `TaskItem` behavior, stats display, and time formatting remain unchanged unless seam changes force adapter updates.
- Tests should assert external behavior: given inputs, the patch indicates the right closed logs, durations, and stat updates — not method-call counts or internal mutations.

## Out of Scope

- Changing the UI layout or component hierarchy.
- Introducing a new persistence backend beyond the existing SQLite/localStorage seam.
- Modifying task creation, deletion, or redo flows unless required by the extraction.
- Gamification loops beyond stat recomputation side effects already implied by current behavior.

## Further Notes

- No ADRs were found in `docs/`. Domain glossary lives in `project.md`.
- This spec is intentionally limited to one new seam (`TimerSession`) to minimize blast radius. Future deepening candidates — repository interface, App render surface, domain logic in `types.ts` — remain out of scope until this seam is stable.

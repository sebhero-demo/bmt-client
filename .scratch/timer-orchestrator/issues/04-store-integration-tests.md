# 04 — Refactor store integration tests to cover patch application

**What to build:** `store.test.ts` verifies the adapter actually applies `TimerSession` patches to Zustand state and clears the timer correctly. Edge cases tested: starting a new task while another is active, completing a paused task, and manual entry after a tracked session.

**Blocked by:** 01 — Create `TimerSession` module with start, pause, and resume transitions, 02 — Add complete and manual time-entry transitions

**Status:** ready-for-agent

- [ ] Store test starts a task and asserts `activeTaskId`, `isTimerRunning`, and the new open `TimeLog`
- [ ] Store test pauses and resumes and asserts the timer fields and log state match patch contents
- [ ] Store test completes an active task and asserts XP, `totalDurationSeconds`, stats, and timer cleanup
- [ ] Store test adds a manual time log and asserts it participates in stat recomputation
- [ ] Store test switches active tasks and asserts the previous task is paused before the new one starts
- [ ] All timer-related tests run with fixed-time mocks to avoid flakiness

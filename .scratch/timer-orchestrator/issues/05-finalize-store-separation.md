# 05 — Finalize separation: store keeps only adapter logic

**What to build:** `TimerSession` is verified to have no imports of Zustand, `setInterval`, `Date.now`, or persistence. The store file shrinks to Zustand `set()` calls, the interval service, and patch application. Cleanup removes any leftover inline session-math duplicates.

**Blocked by:** 03 — Unit-test `TimerSession` in isolation, 04 — Refactor store integration tests to cover patch application

**Status:** ready-for-agent

- [ ] `TimerSession` imports only types and helpers — no React, Zustand, or browser APIs
- [ ] Store `startTask`, `pauseTask`, `resumeTask`, `completeTask`, `addManualTimeLog` contain no inline `Date.now()` math
- [ ] Store file size is reduced by removing repeated session logic
- [ ] `tick` action remains purely additive to `timerSeconds` with no session accumulation logic
- [ ] All existing tests pass against the refactored store

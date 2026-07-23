# 02 — Add complete and manual time-entry transitions

**What to build:** `completeTask` and `addManualTimeLog` are wired to `TimerSession`. Completing a task accumulates final session seconds, awards XP, closes the open log, and recomputes stats. Manual time-entry produces closed logs that participate in the same stat aggregation. The seam is now complete for every transition the app uses today.

**Blocked by:** 01 — Create `TimerSession` module with start, pause, and resume transitions

**Status:** ready-for-agent

- [ ] `completeTask` delegates final session accumulation and log closing to `TimerSession`
- [ ] `completeTask` computes XP from the returned patch and updates `userStats`
- [ ] `addManualTimeLog` creates a closed `TimeLog` and applies the same stat-recomputation patch used by tracked sessions
- [ ] Store actions `completeTask` and `addManualTimeLog` apply `TimerSession` patches without duplicating session math

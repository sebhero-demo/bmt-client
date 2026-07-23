# 01 — Create `TimerSession` module with start, pause, and resume transitions

**What to build:** A new `TimerSession` module owns the first half of timer transitions. The store becomes a thin adapter for `startTask`, `pauseTask`, and `resumeTask`. The module returns patch objects describing closed logs, duration changes, and stat updates. Persistence and the interval service remain in the store.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] `TimerSession` class lives in its own module with one instance per active task session
- [ ] `start` transition creates a new open `TimeLog`, initializes timer state, and returns a patch
- [ ] `pause` transition computes session seconds, closes the last open log, and returns a patch
- [ ] `resume` transition opens a new `TimeLog` and returns a patch
- [ ] Store actions `startTask`, `pauseTask`, `resumeTask` delegate to `TimerSession` and apply the returned patch
- [ ] `TimerSession` never imports Zustand, `setInterval`, `Date.now`, or persistence logic

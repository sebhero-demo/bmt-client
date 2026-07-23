# 03 — Unit-test `TimerSession` in isolation

**What to build:** Pure unit tests for every transition pass fake tasks and a supplied `Date.now` value, then assert the returned patch has the right closed logs, `sessionSeconds`, updated task fields, and stat deltas — no React, Zustand, or browser APIs involved.

**Blocked by:** 01 — Create `TimerSession` module with start, pause, and resume transitions, 02 — Add complete and manual time-entry transitions

**Status:** ready-for-agent

- [ ] `start` returns a patch with a new open `TimeLog` and zeroed timer fields
- [ ] `pause` returns a patch with the previous open log closed, `sessionSeconds` from the supplied clock, and updated task stats
- [ ] `resume` returns a patch with a new open `TimeLog` without closing the prior session
- [ ] `complete` returns a patch that closes the open log, accumulates final seconds, recomputes min/max/avg/runs, and awards XP
- [ ] Manual log entry returns a patch with the new closed `TimeLog` and updated stats
- [ ] Starting a new task while another is active causes the old session to pause and return a close patch

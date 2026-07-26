# Extract timer state machine into dedicated session module

`TimerSession` was extracted from inline store logic to isolate timer transitions, log closing, and stat recomputation. This avoids repeating ad-hoc session math across start/pause/resume/complete and makes the behavior unit-testable without React or Zustand.

The store owns persistence, timer ticks, and task array mutation. `TimerSession` is persistence-ignorant and driven only by discrete transitions plus the current `timerSeconds` value supplied by the store.

# Beast Mode Todo

A hyper-focused time-tracking todo app where each task has a built-in timer, and historical completion times drive gamification (XP, streaks, Beast Mode).

## Language

**Task**:
A named work item the user creates to track execution time. It is the aggregate root that stores both its current execution state and the full history of work sessions.
_Avoid_: Todo-item, activity

**TimeLog**:
A single work session inside a task. Each log records when the session started, when it ended, and the resulting duration in seconds. A task accumulates multiple TimeLogs over its lifetime.
_Avoid_: Entry, log, record

**TaskStatus**:
The lifecycle state of a task at any moment: `idle` → `in_progress` → `paused` → `completed`. A task can move from `paused` back to `in_progress` (resume).
_Avoid_: Phase, stage

**User**:
A person using the app. The user has persistent stats (XP, streak) and owns all their tasks. Authentication is pending; currently local-only.
_Avoid_: Account, player, profile

**XP (Experience Points)**:
A numeric reward granted when a task is completed. Base XP is earned for finishing; bonus XP is awarded when the task finishes faster than the historical average time.
_Avoid_: Score, points

**CurrentStreak**:
The number of consecutive tasks completed within the same time period without a break that resets the count.
_Avoid_: Combo, multiplier

**Beast Mode**:
A toggled user state that activates when a streak threshold is met. While active, it alters UI presentation and may increase XP gain rate.
_Avoid_: Power mode, turbo

**Min/Avg/Max Time**:
Computed statistics derived from the durations of all completed TimeLogs sharing the same task title. They represent best, average, and worst historical performance on that activity.
_Avoid_: Stats, metrics, thresholds

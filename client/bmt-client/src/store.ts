import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, UserStats, TimeLog } from './types';
import { generateId, getTaskStats, getMotivationMessage } from './types';

// ============================================
// Types (assumes Task/TimeLog exist in ./types)
// Ensure your Task type includes optional/stat fields:
//   minTimeSeconds?: number
//   maxTimeSeconds?: number
//   avgTimeSeconds?: number
//   runsCount?: number
// ============================================

interface AppState {
  tasks: Task[];
  activeTaskId: string | null;
  userStats: UserStats;
  timerSeconds: number;
  isTimerRunning: boolean;
  timerStartTime: number | null;
  motivationMessage: { emoji: string; text: string; type: string } | null;
  announcement: string | null;
  isLoading: boolean;
  error: string | null;

  addTask: (title: string) => void;
  deleteTask: (id: string) => void;
  startTask: (id: string) => void;
  pauseTask: (id: string) => void;
  resumeTask: (id: string) => void;
  completeTask: (id: string) => void;
  updateTaskTitle: (id: string, title: string) => void;
  updateTaskTime: (id: string, durationSeconds: number) => void;
  addManualTimeLog: (id: string, durationSeconds: number, date: string) => void;
  redoTask: (id: string) => void;

  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  tick: () => void;
  resetTimer: () => void;

  addXP: (amount: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  toggleBeastMode: () => void;

  clearMotivationMessage: () => void;
  setAnnouncement: (message: string | null) => void;
  clearError: () => void;

  getActiveTask: () => Task | null;
  getTodaysStats: () => { completed: number; active: number; totalMinutes: number };
}

// ============================================
// Helpers
// ============================================
const calculateXP = (seconds: number): number => Math.max(10, Math.floor(seconds / 60));

const isToday = (dateString: string): boolean => {
  try {
    const date = Temporal.Instant.from(dateString).toZonedDateTimeISO(Temporal.Now.timeZoneId());
    const today = Temporal.Now.plainDateISO();
    return date.toPlainDate().equals(today);
  } catch {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }
};

// Compute min/max/avg/runs/total from a timeLogs array
function computeStatsFromLogs(timeLogs: TimeLog[]) {
  const durations = timeLogs
    .map((l) => (typeof l.durationSeconds === 'number' ? l.durationSeconds : 0))
    .filter((d) => d > 0);

  if (durations.length === 0) {
    return {
      minTimeSeconds: 0,
      maxTimeSeconds: 0,
      avgTimeSeconds: 0,
      runsCount: 0,
      totalSeconds: 0,
    };
  }

  const totalSeconds = durations.reduce((a, b) => a + b, 0);
  const minTimeSeconds = Math.min(...durations);
  const maxTimeSeconds = Math.max(...durations);
  const avgTimeSeconds = Math.round(totalSeconds / durations.length);
  const runsCount = durations.length;

  return { minTimeSeconds, maxTimeSeconds, avgTimeSeconds, runsCount, totalSeconds };
}

// Close an open timeLog (last one with no endTime) and compute its duration based on timerSeconds + timerStartTime
function closeActiveLog(task: Task, sessionSeconds: number, nowIso: string): TimeLog[] {
  const logs = [...task.timeLogs];
  if (logs.length === 0) return logs;
  const last = logs[logs.length - 1];
  if (last && !last.endTime) {
    logs[logs.length - 1] = {
      ...last,
      endTime: nowIso,
      durationSeconds: sessionSeconds,
    };
  }
  return logs;
}

// ============================================
// Store
// ============================================
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // initial state
      tasks: [],
      activeTaskId: null,
      userStats: {
        xp: 0,
        currentStreak: 0,
        isBeastModeActive: false,
        lastActiveDate: null,
      },
      timerSeconds: 0,
      isTimerRunning: false,
      timerStartTime: null,
      motivationMessage: null,
      announcement: null,
      isLoading: false,
      error: null,

      // Add task with initial stat fields
      addTask: (title) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        const newTask: Task = {
          id: generateId(),
          title: trimmed,
          status: 'idle',
          timeLogs: [],
          totalDurationSeconds: 0,
          createdAt: new Date().toISOString(),
          completedAt: null,
          // new stat fields:
          minTimeSeconds: 0,
          maxTimeSeconds: 0,
          avgTimeSeconds: 0,
          runsCount: 0,
        } as Task;
        set((state) => ({ tasks: [newTask, ...state.tasks], announcement: `Task added: ${trimmed}` }));
        setTimeout(() => set({ announcement: null }), 1000);
      },

      deleteTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          activeTaskId: state.activeTaskId === id ? null : state.activeTaskId,
          isTimerRunning: state.activeTaskId === id ? false : state.isTimerRunning,
          timerStartTime: state.activeTaskId === id ? null : state.timerStartTime,
          timerSeconds: state.activeTaskId === id ? 0 : state.timerSeconds,
          announcement: task ? `Deleted: ${task.title}` : null,
        }));
        setTimeout(() => set({ announcement: null }), 1000);
      },

      startTask: (id) => {
        const { tasks, activeTaskId, isTimerRunning } = get();
        if (activeTaskId && activeTaskId !== id && isTimerRunning) {
          get().pauseTask(activeTaskId);
        }
        const task = tasks.find((t) => t.id === id);
        if (!task || task.status === 'completed') return;

        const now = new Date().toISOString();
        const newLog: TimeLog = {
          id: generateId(),
          startTime: now,
          endTime: null,
          durationSeconds: 0,
        };
        // Start a fresh session timer for this run
        set((state) => ({
          activeTaskId: id,
          timerSeconds: 0,
          isTimerRunning: true,
          timerStartTime: Date.now(),
          motivationMessage: getMotivationMessage(getTaskStats(state.tasks)),
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status: 'in_progress', timeLogs: [...t.timeLogs, newLog] } : t.status === 'in_progress' && t.id !== id ? { ...t, status: 'paused' } : t
          ),
          announcement: `Started: ${task.title}`,
        }));
        setTimeout(() => set({ announcement: null }), 1000);
      },

      pauseTask: (id) => {
        const { tasks, timerSeconds, timerStartTime } = get();
        const task = tasks.find((t) => t.id === id);
        if (!task || task.status !== 'in_progress') return;
        const nowIso = new Date().toISOString();

        // compute elapsed for this session (timerSeconds plus running delta)
        let sessionSeconds = timerSeconds;
        if (timerStartTime) sessionSeconds = timerSeconds + Math.floor((Date.now() - timerStartTime) / 1000);

        // close active log and add sessionSeconds to totalDurationSeconds
        const updatedLogs = closeActiveLog(task, sessionSeconds, nowIso);
        set((state) => ({
          isTimerRunning: false,
          timerStartTime: null,
          timerSeconds: 0,
          tasks: state.tasks.map((t) => {
            if (t.id === id) {
              const newTotal = (t.totalDurationSeconds || 0) + sessionSeconds;
              // compute updated stats using all logs (including this closed one)
              const stats = computeStatsFromLogs(updatedLogs);
              return {
                ...t,
                status: 'paused',
                timeLogs: updatedLogs,
                totalDurationSeconds: newTotal,
                minTimeSeconds: stats.minTimeSeconds,
                maxTimeSeconds: stats.maxTimeSeconds,
                avgTimeSeconds: stats.avgTimeSeconds,
                runsCount: stats.runsCount,
              };
            }
            return t;
          }),
          activeTaskId: state.activeTaskId === id ? null : state.activeTaskId,
          announcement: `Paused: ${task.title}`,
        }));
        setTimeout(() => set({ announcement: null }), 1000);
      },

      resumeTask: (id) => {
        const { tasks, activeTaskId, isTimerRunning } = get();
        const task = tasks.find((t) => t.id === id);
        if (!task || task.status !== 'paused') return;
        if (activeTaskId && activeTaskId !== id && isTimerRunning) {
          get().pauseTask(activeTaskId);
        }
        const nowIso = new Date().toISOString();
        const newLog: TimeLog = {
          id: generateId(),
          startTime: nowIso,
          endTime: null,
          durationSeconds: 0,
        };
        set((state) => ({
          activeTaskId: id,
          timerSeconds: 0,
          isTimerRunning: true,
          timerStartTime: Date.now(),
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: 'in_progress', timeLogs: [...t.timeLogs, newLog] } : t.status === 'in_progress' && t.id !== id ? { ...t, status: 'paused' } : t)),
          announcement: `Resumed: ${task.title}`,
        }));
        setTimeout(() => set({ announcement: null }), 1000);
      },

      // Complete a task: close active run (if exists), compute stats, preserve logs
      completeTask: (id) => {
        const { tasks, userStats, timerSeconds, timerStartTime } = get();
        const task = tasks.find((t) => t.id === id);
        if (!task || task.status === 'completed') return;
        const nowIso = new Date().toISOString();

        // Determine session time if the task is currently in_progress
        let currentSessionTime = 0;
        if (task.status === 'in_progress') {
          currentSessionTime = timerSeconds;
          if (timerStartTime) currentSessionTime += Math.floor((Date.now() - timerStartTime) / 1000);
        }

        // Close the last open log if the task was in_progress (startTask/resumeTask added one)
        const updatedLogs = task.status === 'in_progress' ? closeActiveLog(task, currentSessionTime, nowIso) : [...task.timeLogs];

        // recompute totals and stats across all logs (manual logs included)
        const stats = computeStatsFromLogs(updatedLogs);
        const totalDuration = stats.totalSeconds || task.totalDurationSeconds || 0;

        const xpGained = calculateXP(totalDuration);

        set((state) => ({
          // clear timer/session state if this was the active task
          activeTaskId: state.activeTaskId === id ? null : state.activeTaskId,
          isTimerRunning: state.activeTaskId === id ? false : state.isTimerRunning,
          timerStartTime: state.activeTaskId === id ? null : state.timerStartTime,
          timerSeconds: 0,
          userStats: {
            ...state.userStats,
            xp: state.userStats.xp + xpGained,
          },
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                ...t,
                status: 'completed',
                completedAt: nowIso,
                totalDurationSeconds: totalDuration,
                timeLogs: updatedLogs,
                // write computed stats onto the task
                minTimeSeconds: stats.minTimeSeconds,
                maxTimeSeconds: stats.maxTimeSeconds,
                avgTimeSeconds: stats.avgTimeSeconds,
                runsCount: stats.runsCount,
              }
              : t
          ),
          announcement: `Completed: ${task.title}. Gained ${xpGained} XP!`,
        }));
        setTimeout(() => set({ announcement: null }), 2000);
      },

      updateTaskTitle: (id, title) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        set((state) => ({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, title: trimmed } : t)) }));
      },

      updateTaskTime: (id, durationSeconds) => {
        set((state) => ({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, totalDurationSeconds: durationSeconds } : t)) }));
      },

      // Add a manual time log and recompute stats
      addManualTimeLog: (id, durationSeconds, date) => {
        const newLog: TimeLog = { id: generateId(), startTime: date, endTime: date, durationSeconds };
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id === id) {
              const logs = [...t.timeLogs, newLog];
              const stats = computeStatsFromLogs(logs);
              return {
                ...t,
                timeLogs: logs,
                totalDurationSeconds: (t.totalDurationSeconds || 0) + durationSeconds,
                minTimeSeconds: stats.minTimeSeconds,
                maxTimeSeconds: stats.maxTimeSeconds,
                avgTimeSeconds: stats.avgTimeSeconds,
                runsCount: stats.runsCount,
              };
            }
            return t;
          }),
        }));
      },

      // Redo a completed task: keep all old logs & stats, reset status so a fresh timed run can be recorded
      redoTask: (id) => {
        set((state) => {
          const task = state.tasks.find((t) => t.id === id);
          if (!task) return {};
          // If the task was active (shouldn't be if completed), stop the timer session
          const wasActive = state.activeTaskId === id;
          // Keep timeLogs and computed stats intact; set status to idle and clear completedAt
          return {
            tasks: state.tasks.map((t) =>
              t.id === id
                ? {
                  ...t,
                  status: 'idle',
                  completedAt: null,
                  // keep totalDurationSeconds and timeLogs intact so history & stats remain
                  // user wants to "start fresh" for the next recorded run, so we do NOT wipe logs
                }
                : t
            ),
            activeTaskId: wasActive ? null : state.activeTaskId,
            isTimerRunning: wasActive ? false : state.isTimerRunning,
            timerStartTime: wasActive ? null : state.timerStartTime,
            // If this was active, clear session timer
            timerSeconds: wasActive ? 0 : state.timerSeconds,
            announcement: task ? `Redo: ${task.title}` : null,
          };
        });
        setTimeout(() => set({ announcement: null }), 1000);
      },

      // Timer actions (unchanged logic, tick accumulates session progress)
      startTimer: () => set((state) => ({ isTimerRunning: true, timerStartTime: state.timerStartTime || Date.now() })),
      pauseTimer: () =>
        set((state) => {
          if (!state.timerStartTime) return { isTimerRunning: false };
          const elapsed = Math.floor((Date.now() - state.timerStartTime) / 1000);
          return { isTimerRunning: false, timerSeconds: state.timerSeconds + elapsed, timerStartTime: null };
        }),
      resumeTimer: () => set({ isTimerRunning: true, timerStartTime: Date.now() }),
      stopTimer: () => set({ isTimerRunning: false, timerSeconds: 0, timerStartTime: null }),
      tick: () => {
        set((state) => {
          if (!state.isTimerRunning || !state.timerStartTime) return {};
          const elapsed = Math.floor((Date.now() - state.timerStartTime) / 1000);
          if (elapsed <= 0) return {};
          return { timerSeconds: state.timerSeconds + elapsed, timerStartTime: Date.now() };
        });
      },
      resetTimer: () => set({ timerSeconds: 0, isTimerRunning: false, timerStartTime: null }),

      // User stats
      addXP: (amount) => set((state) => ({ userStats: { ...state.userStats, xp: state.userStats.xp + amount } })),
      incrementStreak: () => set((state) => ({ userStats: { ...state.userStats, currentStreak: state.userStats.currentStreak + 1 } })),
      resetStreak: () => set((state) => ({ userStats: { ...state.userStats, currentStreak: 0 } })),
      toggleBeastMode: () => {
        set((state) => {
          const newState = !state.userStats.isBeastModeActive;
          return { userStats: { ...state.userStats, isBeastModeActive: newState }, announcement: newState ? 'Beast Mode activated!' : 'Beast Mode deactivated' };
        });
        setTimeout(() => set({ announcement: null }), 1500);
      },

      clearMotivationMessage: () => set({ motivationMessage: null }),
      setAnnouncement: (message) => set({ announcement: message }),
      clearError: () => set({ error: null }),

      getActiveTask: () => {
        const { tasks, activeTaskId } = get();
        return tasks.find((t) => t.id === activeTaskId) || null;
      },

      getTodaysStats: () => {
        const { tasks } = get();
        const todayTasks = tasks.filter((t) => t.completedAt && isToday(t.completedAt));
        const activeToday = tasks.filter((t) => t.timeLogs.some((log) => isToday(log.startTime)));
        return {
          completed: todayTasks.length,
          active: activeToday.filter((t) => t.status !== 'completed').length,
          totalMinutes: Math.floor(todayTasks.reduce((sum, t) => sum + (t.totalDurationSeconds || 0), 0) / 60),
        };
      },
    }),
    {
      name: 'beast-mode-todo-storage',
      partialize: (state) => ({
        tasks: state.tasks,
        userStats: state.userStats,
        timerSeconds: state.timerSeconds,
        isTimerRunning: state.isTimerRunning,
        timerStartTime: state.timerStartTime,
        activeTaskId: state.activeTaskId,
      }),
      version: 2,
      migrate: (persistedState: any, version: number) => {
        try {
          if (!persistedState) return persistedState;
          if (version < 2) {
            return { ...(persistedState as any), timerStartTime: null, isTimerRunning: false, timerSeconds: 0 };
          }
          return persistedState;
        } catch {
          return persistedState;
        }
      },
    }
  )
);

// ============================================
// Timer Service
// ============================================
let timerInterval: ReturnType<typeof setInterval> | null = null;
export const startTimerInterval = () => {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    const state = useAppStore.getState();
    if (state.isTimerRunning && state.activeTaskId) {
      state.tick();
    }
  }, 1000);
};
export const stopTimerInterval = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};
export const pauseAllTasks = () => {
  const state = useAppStore.getState();
  if (state.activeTaskId) {
    state.pauseTask(state.activeTaskId);
  }
};
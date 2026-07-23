import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, UserStats, TimeLog } from './types';
import { generateId, getTaskStats, getMotivationMessage } from './types';
import { TimerSession, computeStats } from './lib/timer-session';

// ============================================
// AppState
// ============================================
interface AppState {
  // Tasks
  tasks: Task[];
  activeTaskId: string | null;
  // User Stats
  userStats: UserStats;
  // Timer
  timerSeconds: number;
  isTimerRunning: boolean;
  timerStartTime: number | null;
  // UI / accessibility
  motivationMessage: { emoji: string; text: string; type: string } | null;
  announcement: string | null;
  isLoading: boolean;
  error: string | null;

  // Task actions
  addTask: (title: string) => void;
  deleteTask: (id: string) => void;
  startTask: (id: string) => void;
  pauseTask: (id: string) => void;
  resumeTask: (id: string) => void;
  completeTask: (id: string) => void;
  redoTask: (id: string) => void;
  updateTaskTitle: (id: string, title: string) => void;
  updateTaskTime: (id: string, durationSeconds: number) => void;
  addManualTimeLog: (id: string, durationSeconds: number, date: string) => void;

  // Timer actions
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  tick: () => void;
  resetTimer: () => void;

  // User stats
  addXP: (amount: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  toggleBeastMode: () => void;

  // small helpers
  clearMotivationMessage: () => void;
  setAnnouncement: (message: string | null) => void;
  clearError: () => void;

  // computed helpers
  getActiveTask: () => Task | null;
  getTodaysStats: () => { completed: number; active: number; totalMinutes: number };
}

// ============================================
// Store
// ============================================
const isToday = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
};

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

      // Add a new task (initialize stat fields)
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
          // computed stats
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

      // Start a task: pause any other running task, append a new open timeLog, start session timer
      startTask: (id) => {
        const { activeTaskId, isTimerRunning, tasks } = get();
        if (activeTaskId && activeTaskId !== id && isTimerRunning) {
          get().pauseTask(activeTaskId);
        }

        const task = tasks.find((t) => t.id === id);
        if (!task || task.status === 'completed') return;
        const nowIso = new Date().toISOString();
        const newLog: TimeLog = { id: generateId(), startTime: nowIso, endTime: null, durationSeconds: 0 };

        const session = new TimerSession(task);
        const patch = session.start(0, newLog);

        const allStats = getTaskStats(tasks);
        const taskStat = allStats.find((s) => s.title === task.title);
        const motivation = getMotivationMessage(taskStat);

        set((state) => ({
          activeTaskId: id,
          timerSeconds: 0,
          isTimerRunning: true,
          timerStartTime: Date.now(),
          motivationMessage: motivation,
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...patch } : t.status === 'in_progress' && t.id !== id ? { ...t, status: 'paused' } : t
          ),
          announcement: `Started: ${task.title}`,
        }));
        setTimeout(() => set({ announcement: null }), 1000);
      },

      // Pause a running task: close the open log, add session seconds to total, recompute stats
      pauseTask: (id) => {
        const { tasks, timerSeconds, timerStartTime } = get();
        const task = tasks.find((t) => t.id === id);
        if (!task || task.status !== 'in_progress') return;
        const nowIso = new Date().toISOString();

        let sessionSeconds = timerSeconds || 0;
        if (timerStartTime) sessionSeconds += Math.floor((Date.now() - timerStartTime) / 1000);

        const session = new TimerSession(task);
        const patch = session.pause(sessionSeconds, { nowIso });

        set((state) => ({
          isTimerRunning: false,
          timerStartTime: null,
          timerSeconds: 0,
          activeTaskId: state.activeTaskId === id ? null : state.activeTaskId,
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
          announcement: `Paused: ${task.title}`,
        }));
        setTimeout(() => set({ announcement: null }), 1000);
      },

      // Resume a paused task: add a new open timeLog and start session timer (timerSeconds reset)
      resumeTask: (id) => {
        const { activeTaskId, isTimerRunning } = get();
        if (activeTaskId && activeTaskId !== id && isTimerRunning) {
          get().pauseTask(activeTaskId);
        }

        const task = get().tasks.find((t) => t.id === id);
        if (!task || task.status !== 'paused') return;
        const nowIso = new Date().toISOString();
        const newLog: TimeLog = { id: generateId(), startTime: nowIso, endTime: null, durationSeconds: 0 };

        const session = new TimerSession(task);
        const patch = session.resume(0, newLog);

        set((state) => ({
          activeTaskId: id,
          timerSeconds: 0,
          isTimerRunning: true,
          timerStartTime: Date.now(),
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...patch } : t.status === 'in_progress' && t.id !== id ? { ...t, status: 'paused' } : t
          ),
          announcement: `Resumed: ${task.title}`,
        }));
        setTimeout(() => set({ announcement: null }), 1000);
      },

      // Complete a task: close open log (if any), recompute stats (min/max/avg) from all logs, save totals, and reset session
      completeTask: (id) => {
        const { tasks, timerSeconds, timerStartTime } = get();
        const task = tasks.find((t) => t.id === id);
        if (!task || task.status === 'completed') return;
        const nowIso = new Date().toISOString();

        let sessionSeconds = 0;
        if (task.status === 'in_progress') {
          sessionSeconds = timerSeconds || 0;
          if (timerStartTime) sessionSeconds += Math.floor((Date.now() - timerStartTime) / 1000);
        }

        const session = new TimerSession(task);
        const { patch, xpGained } = session.complete(sessionSeconds, { nowIso });

        set((state) => ({
          activeTaskId: state.activeTaskId === id ? null : state.activeTaskId,
          isTimerRunning: state.activeTaskId === id ? false : state.isTimerRunning,
          timerStartTime: state.activeTaskId === id ? null : state.timerStartTime,
          timerSeconds: 0,
          userStats: {
            ...state.userStats,
            xp: state.userStats.xp + xpGained,
          },
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
          announcement: `Completed: ${task.title}. Gained ${xpGained} XP!`,
        }));
        setTimeout(() => set({ announcement: null }), 2000);
      },

      // Redo: keep all logs & stats, set task back to idle so the next run is fresh
      redoTask: (id) => {
        set((state) => {
          const task = state.tasks.find((t) => t.id === id);
          if (!task) return {};
          const wasActive = state.activeTaskId === id;
          return {
            tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: 'idle', completedAt: null } : t)),
            activeTaskId: wasActive ? null : state.activeTaskId,
            isTimerRunning: wasActive ? false : state.isTimerRunning,
            timerStartTime: wasActive ? null : state.timerStartTime,
            timerSeconds: wasActive ? 0 : state.timerSeconds,
            announcement: task ? `Redo: ${task.title}` : null,
          };
        });
        setTimeout(() => set({ announcement: null }), 1000);
      },

      updateTaskTitle: (id, title) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        set((state) => ({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, title: trimmed } : t)) }));
      },

      // Replace totalDurationSeconds (useful admin action)
      updateTaskTime: (id, durationSeconds) => {
        set((state) => ({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, totalDurationSeconds: durationSeconds } : t)) }));
      },

      // Add manual time log and recompute stats
      addManualTimeLog: (id, durationSeconds, date) => {
        const newLog: TimeLog = { id: generateId(), startTime: date, endTime: date, durationSeconds };
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== id) return t;
            const logs = [...t.timeLogs, newLog];
            const stats = computeStats(logs);
            return {
              ...t,
              timeLogs: logs,
              totalDurationSeconds: (t.totalDurationSeconds || 0) + durationSeconds,
              minTimeSeconds: stats.minTimeSeconds,
              maxTimeSeconds: stats.maxTimeSeconds,
              avgTimeSeconds: stats.avgTimeSeconds,
              runsCount: stats.runsCount,
            };
          }),
        }));
      },

      // Timer actions
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

      // Computed helpers
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
// Timer service (global interval)
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
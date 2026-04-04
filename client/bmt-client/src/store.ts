import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, UserStats, TimeLog } from './types';
import { generateId } from './types';

// ============================================
// Types
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
 // Accessibility state for notifications
 announcement: string | null;
 isLoading: boolean;
 error: string | null;
 // Actions - Tasks
 addTask: (title: string) => void;
 deleteTask: (id: string) => void;
 startTask: (id: string) => void;
 pauseTask: (id: string) => void;
 resumeTask: (id: string) => void;
 completeTask: (id: string) => void;
 updateTaskTitle: (id: string, title: string) => void;
 updateTaskTime: (id: string, durationSeconds: number) => void;
 addManualTimeLog: (id: string, durationSeconds: number, date: string) => void;
 // Actions - Timer
 startTimer: () => void;
 pauseTimer: () => void;
 resumeTimer: () => void;
 stopTimer: () => void;
 tick: () => void;
 resetTimer: () => void;
 // Actions - User Stats
 addXP: (amount: number) => void;
 incrementStreak: () => void;
 resetStreak: () => void;
 toggleBeastMode: () => void;
 // Accessibility actions
 setAnnouncement: (message: string | null) => void;
 clearError: () => void;
 // Computed
 getActiveTask: () => Task | null;
 getTodaysStats: () => { completed: number; active: number; totalMinutes: number };
}

// ============================================
// Helpers
// ============================================
const calculateXP = (seconds: number): number => {
 // Minimum 10 XP, 1 XP per minute
 return Math.max(10, Math.floor(seconds / 60));
};

const isToday = (dateString: string): boolean => {
 const date = new Date(dateString);
 const today = new Date();
 return (
   date.getDate() === today.getDate() &&
   date.getMonth() === today.getMonth() &&
   date.getFullYear() === today.getFullYear()
 );
};

// ============================================
// Store
// ============================================
export const useAppStore = create<AppState>()(
 persist(
   (set, get) => ({
     // Initial State
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
     announcement: null,
     isLoading: false,
     error: null,

     // Task Actions
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
       };
       
       set((state) => ({
         tasks: [newTask, ...state.tasks],
         announcement: `Task added: ${trimmed}`,
       }));

       // Clear announcement after screen readers have time
       setTimeout(() => set({ announcement: null }), 1000);
     },

     deleteTask: (id) => {
       const task = get().tasks.find((t) => t.id === id);
       set((state) => ({
         tasks: state.tasks.filter((t) => t.id !== id),
         activeTaskId: state.activeTaskId === id ? null : state.activeTaskId,
         isTimerRunning: state.activeTaskId === id ? false : state.isTimerRunning,
         announcement: task ? `Deleted: ${task.title}` : null,
       }));
       setTimeout(() => set({ announcement: null }), 1000);
     },

     startTask: (id) => {
       const { tasks, activeTaskId, isTimerRunning } = get();
       
       // Pause any currently active task first
       if (activeTaskId && activeTaskId !== id && isTimerRunning) {
         get().pauseTask(activeTaskId);
       }

       const task = tasks.find((t) => t.id === id);
       if (!task || task.status === 'completed') return;

       const now = new Date().toISOString();
       const timeLog: TimeLog = {
         id: generateId(),
         startTime: now,
         endTime: null,
         durationSeconds: 0,
       };

       set((state) => ({
         activeTaskId: id,
         timerSeconds: 0,
         isTimerRunning: true,
         tasks: state.tasks.map((t) =>
           t.id === id
             ? { 
                 ...t, 
                 status: 'in_progress', 
                 timeLogs: [...t.timeLogs, timeLog] 
               }
             : t.status === 'in_progress' && t.id !== id
               ? { ...t, status: 'paused' }
               : t
         ),
         announcement: `Started: ${task.title}`,
       }));
       setTimeout(() => set({ announcement: null }), 1000);
     },

     pauseTask: (id) => {
       const { tasks, timerSeconds } = get();
       const task = tasks.find((t) => t.id === id);
       if (!task || task.status !== 'in_progress') return;

       const now = new Date().toISOString();

       set((state) => ({
         isTimerRunning: false,
         timerSeconds: 0,
         tasks: state.tasks.map((t) => {
           if (t.id === id) {
             // Close the last open time log
             const updatedLogs = [...t.timeLogs];
             if (updatedLogs.length > 0) {
               const lastLog = updatedLogs[updatedLogs.length - 1];
               if (!lastLog.endTime) {
                 updatedLogs[updatedLogs.length - 1] = {
                   ...lastLog,
                   endTime: now,
                   durationSeconds: timerSeconds,
                 };
               }
             }
             return { 
               ...t, 
               status: 'paused', 
               timeLogs: updatedLogs,
               totalDurationSeconds: t.totalDurationSeconds + timerSeconds,
             };
           }
           return t;
         }),
         announcement: `Paused: ${task.title}`,
       }));
       setTimeout(() => set({ announcement: null }), 1000);
     },

     resumeTask: (id) => {
       const { tasks, activeTaskId, isTimerRunning } = get();
       const task = tasks.find((t) => t.id === id);
       if (!task || task.status !== 'paused') return;

       // Pause any currently active task
       if (activeTaskId && activeTaskId !== id && isTimerRunning) {
         get().pauseTask(activeTaskId);
       }

       const now = new Date().toISOString();
       const timeLog: TimeLog = {
         id: generateId(),
         startTime: now,
         endTime: null,
         durationSeconds: 0,
       };

       set((state) => ({
         activeTaskId: id,
         timerSeconds: 0,
         isTimerRunning: true,
         tasks: state.tasks.map((t) =>
           t.id === id
             ? { ...t, status: 'in_progress', timeLogs: [...t.timeLogs, timeLog] }
             : t.status === 'in_progress' && t.id !== id
               ? { ...t, status: 'paused' }
               : t
         ),
         announcement: `Resumed: ${task.title}`,
       }));
       setTimeout(() => set({ announcement: null }), 1000);
     },

     completeTask: (id) => {
       const { tasks, userStats, timerSeconds } = get();
       const task = tasks.find((t) => t.id === id);
       if (!task || task.status === 'completed') return;

       const now = new Date().toISOString();
       const currentSessionTime = task.status === 'in_progress' ? timerSeconds : 0;
       const totalDuration = task.totalDurationSeconds + currentSessionTime;
       const xpGained = calculateXP(totalDuration);

       // Close the last time log if currently running
       const updatedLogs = [...task.timeLogs];
       if (updatedLogs.length > 0) {
         const lastLog = updatedLogs[updatedLogs.length - 1];
         if (!lastLog.endTime) {
           updatedLogs[updatedLogs.length - 1] = {
             ...lastLog,
             endTime: now,
             durationSeconds: currentSessionTime,
           };
         }
       }

       set((state) => ({
         activeTaskId: state.activeTaskId === id ? null : state.activeTaskId,
         isTimerRunning: state.activeTaskId === id ? false : state.isTimerRunning,
         timerSeconds: state.activeTaskId === id ? 0 : state.timerSeconds,
         userStats: {
           ...state.userStats,
           xp: state.userStats.xp + xpGained,
         },
         tasks: state.tasks.map((t) =>
           t.id === id
             ? {
                 ...t,
                 status: 'completed',
                 completedAt: now,
                 totalDurationSeconds: totalDuration,
                 timeLogs: updatedLogs,
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
       
       set((state) => ({
         tasks: state.tasks.map((t) =>
           t.id === id ? { ...t, title: trimmed } : t
         ),
       }));
     },

    // Update total duration for a task
    updateTaskTime: (id, durationSeconds) => {
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, totalDurationSeconds: durationSeconds } : t
        ),
      }));
    },

    // Add a manual time log
    addManualTimeLog: (id, durationSeconds, date) => {
      const newLog: TimeLog = {
        id: generateId(),
        startTime: date,
        endTime: date,
        durationSeconds,
      };
      
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { 
            ...t, 
            totalDurationSeconds: t.totalDurationSeconds + durationSeconds,
            timeLogs: [...t.timeLogs, newLog]
          } : t
        ),
      }));
    },

     // Timer Actions
     startTimer: () => set({ isTimerRunning: true }),
     pauseTimer: () => set({ isTimerRunning: false }),
     resumeTimer: () => set({ isTimerRunning: true }),
     stopTimer: () => set({ isTimerRunning: false, timerSeconds: 0 }),
     
     tick: () => {
       set((state) => ({ timerSeconds: state.timerSeconds + 1 }));
     },
     
     resetTimer: () => set({ timerSeconds: 0, isTimerRunning: false }),

     // User Stats Actions
     addXP: (amount) => {
       set((state) => ({
         userStats: { ...state.userStats, xp: state.userStats.xp + amount },
       }));
     },

     incrementStreak: () => {
       set((state) => ({
         userStats: { ...state.userStats, currentStreak: state.userStats.currentStreak + 1 },
       }));
     },

     resetStreak: () => {
       set((state) => ({
         userStats: { ...state.userStats, currentStreak: 0 },
       }));
     },

     toggleBeastMode: () => {
       set((state) => {
         const newState = !state.userStats.isBeastModeActive;
         return {
           userStats: { ...state.userStats, isBeastModeActive: newState },
           announcement: newState ? 'Beast Mode activated!' : 'Beast Mode deactivated',
         };
       });
       setTimeout(() => set({ announcement: null }), 1500);
     },

     // Accessibility
     setAnnouncement: (message) => set({ announcement: message }),
     clearError: () => set({ error: null }),

     // Computed
     getActiveTask: () => {
       const { tasks, activeTaskId } = get();
       return tasks.find((t) => t.id === activeTaskId) || null;
     },

     getTodaysStats: () => {
       const { tasks } = get();
       const todayTasks = tasks.filter((t) => 
         t.completedAt && isToday(t.completedAt)
       );
       
       const activeToday = tasks.filter((t) => 
         t.timeLogs.some((log) => isToday(log.startTime))
       );

       return {
         completed: todayTasks.length,
         active: activeToday.filter((t) => t.status !== 'completed').length,
         totalMinutes: Math.floor(
           todayTasks.reduce((sum, t) => sum + t.totalDurationSeconds, 0) / 60
         ),
       };
     },
   }),
   {
     name: 'beast-mode-todo-storage',
     partialize: (state) => ({
       tasks: state.tasks,
       userStats: state.userStats,
     }),
     version: 1,
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
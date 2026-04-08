// ============================================
// Core Types - Beast Mode Todo
// ============================================

export type TaskStatus = 'idle' | 'in_progress' | 'paused' | 'completed';

export interface TimeLog {
  id: string;
  startTime: string;      // ISO string
  endTime: string | null; // ISO string or null while running
  durationSeconds: number; // 0 while running, >0 for closed/manual logs
}



export interface Task {
  id: string;
  title: string;
  status: 'idle' | 'in_progress' | 'paused' | 'completed';
  timeLogs: TimeLog[];
  totalDurationSeconds: number;
  createdAt: string;
  completedAt: string | null;
  // computed stats (optional on older tasks)
  minTimeSeconds?: number;
  maxTimeSeconds?: number;
  avgTimeSeconds?: number;
  runsCount?: number;
}

export interface UserStats {
  xp: number;
  currentStreak: number;
  isBeastModeActive: boolean;
}

export interface TaskStats {
  title: string;
  minTimeSeconds: number;
  maxTimeSeconds: number;
  avgTimeSeconds: number;
  completionCount: number;
}

// Helper functions
export const generateId = (): string => {
  // Use crypto.getRandomValues as fallback for browsers without randomUUID
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: generate UUID-like string
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const getTaskStats = (tasks: Task[]): TaskStats[] => {
  const map = new Map<string, { durations: number[]; taskCount: number }>();

  for (const task of tasks) {
    if (task.status !== 'completed') continue;
    if (!task.completedAt) continue;

    // Use totalDurationSeconds as the duration value
    const durationToUse = task.totalDurationSeconds;
    if (durationToUse >= 0) {
      const existing = map.get(task.title) ?? { durations: [], taskCount: 0 };
      existing.durations.push(durationToUse);
      existing.taskCount += 1;
      map.set(task.title, existing);
    }
  }

  const stats: TaskStats[] = [];
  map.forEach(({ durations, taskCount }, title) => {
    if (!durations.length) return;
    const total = durations.reduce((a, b) => a + b, 0);
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    const avg = Math.round(total / durations.length);

    stats.push({
      title,
      minTimeSeconds: min,
      maxTimeSeconds: max,
      avgTimeSeconds: avg,
      completionCount: taskCount,
    });
  });

  return stats.sort((a, b) => b.completionCount - a.completionCount);
};

export interface MotivationMessage {
  emoji: string;
  text: string;
  type: 'new' | 'challenge' | 'record';
}

export const getMotivationMessage = (taskStat: TaskStats | undefined): MotivationMessage | null => {
  if (!taskStat) {
    return {
      emoji: '✨',
      text: 'Ny utmaning! Starta din timer.',
      type: 'new',
    };
  }

  const { completionCount, avgTimeSeconds, minTimeSeconds } = taskStat;

  if (completionCount === 1) {
    return {
      emoji: '🎯',
      text: `Din genomsnittstid är ${formatDuration(avgTimeSeconds)}. Kan du slå den?`,
      type: 'challenge',
    };
  }

  // 2+ completions
  return {
    emoji: '🏆',
    text: `Ditt record är ${formatDuration(minTimeSeconds)}! Slå din egen siffra.`,
    type: 'record',
  };
};
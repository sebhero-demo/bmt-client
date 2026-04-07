// ============================================
// Core Types - Beast Mode Todo
// ============================================

export type TaskStatus = 'idle' | 'in_progress' | 'paused' | 'completed';

export interface TimeLog {
  id: string;
  startTime: string;      // ISO string
  endTime: string | null; // ISO string
  durationSeconds: number;
}

export interface Task {
  id: string;
  title: string;          // Used to group recurring tasks for Min/Max/Avg
  status: TaskStatus;
  timeLogs: TimeLog[];
  totalDurationSeconds: number; 
  createdAt: string;
  completedAt: string | null;
  googleDriveLink?: string; // Optional integration link
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
  const taskMap = new Map<string, Task[]>();
  
  // Group completed tasks by title
  tasks.forEach(task => {
    if (task.status === 'completed' && task.completedAt) {
      const existing = taskMap.get(task.title) || [];
      existing.push(task);
      taskMap.set(task.title, existing);
    }
  });
  
  // Calculate stats for each group
  const stats: TaskStats[] = [];
  taskMap.forEach((taskGroup, title) => {
    const durations = taskGroup.map(t => t.totalDurationSeconds);
    // Skip groups with no valid durations
    if (durations.length === 0 || durations.every(d => d === 0)) {
      return;
    }
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    stats.push({
      title,
      minTimeSeconds: min,
      maxTimeSeconds: max,
      avgTimeSeconds: Math.round(avg),
      completionCount: taskGroup.length,
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
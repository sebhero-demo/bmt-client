import type { Task, TimeLog } from '../types';

export interface TaskPatch {
  status?: Task['status'];
  timeLogs?: TimeLog[];
  totalDurationSeconds?: number;
  minTimeSeconds?: number;
  maxTimeSeconds?: number;
  avgTimeSeconds?: number;
  runsCount?: number;
  completedAt?: string | null;
}

export interface TransitionContext {
  nowIso: string;
}

export interface CompleteResult {
  patch: TaskPatch;
  xpGained: number;
}

export function computeStats(timeLogs: TimeLog[]) {
  const durations = (timeLogs || [])
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

function closeLastOpenLog(logs: TimeLog[], sessionSeconds: number, nowIso: string): TimeLog[] {
  if (!logs || logs.length === 0) return logs;
  const copy = [...logs];
  const last = copy[copy.length - 1];
  if (last && !last.endTime) {
    copy[copy.length - 1] = { ...last, endTime: nowIso, durationSeconds: sessionSeconds };
  }
  return copy;
}

export class TimerSession {
  private readonly task: Task;

  constructor(task: Task) {
    this.task = task;
  }

  start(_sessionSeconds: number, newLog: TimeLog): TaskPatch {
    if (this.task.status === 'completed') return {};
    return {
      status: 'in_progress',
      timeLogs: [...this.task.timeLogs, newLog],
    };
  }

  resume(_sessionSeconds: number, newLog: TimeLog): TaskPatch {
    if (this.task.status !== 'paused') return {};
    return {
      status: 'in_progress',
      timeLogs: [...this.task.timeLogs, newLog],
    };
  }

  pause(sessionSeconds: number, ctx: TransitionContext): TaskPatch {
    if (this.task.status !== 'in_progress') return {};
    const updatedLogs = closeLastOpenLog(this.task.timeLogs, sessionSeconds, ctx.nowIso);
    const newTotal = (this.task.totalDurationSeconds || 0) + sessionSeconds;
    const stats = computeStats(updatedLogs);
    return {
      status: 'paused',
      timeLogs: updatedLogs,
      totalDurationSeconds: newTotal,
      minTimeSeconds: stats.minTimeSeconds,
      maxTimeSeconds: stats.maxTimeSeconds,
      avgTimeSeconds: stats.avgTimeSeconds,
      runsCount: stats.runsCount,
    };
  }

  complete(sessionSeconds: number, ctx: TransitionContext): CompleteResult {
    if (this.task.status === 'completed') return { patch: {}, xpGained: 0 };
    const nowIso = ctx.nowIso;
    const updatedLogs = this.task.status === 'in_progress'
      ? closeLastOpenLog(this.task.timeLogs, sessionSeconds, nowIso)
      : [...this.task.timeLogs];
    const stats = computeStats(updatedLogs);
    const totalDuration = stats.totalSeconds || this.task.totalDurationSeconds || 0;
    const xpGained = Math.max(10, Math.floor(totalDuration / 60));
    return {
      patch: {
        status: 'completed',
        completedAt: nowIso,
        timeLogs: updatedLogs,
        totalDurationSeconds: totalDuration,
        minTimeSeconds: stats.minTimeSeconds,
        maxTimeSeconds: stats.maxTimeSeconds,
        avgTimeSeconds: stats.avgTimeSeconds,
        runsCount: stats.runsCount,
      },
      xpGained,
    };
  }
}

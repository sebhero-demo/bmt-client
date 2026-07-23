import { describe, it, expect } from 'vitest';
import { TimerSession, computeStats } from '../lib/timer-session';
import type { Task, TimeLog } from '../types';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Test',
  status: 'idle',
  timeLogs: [],
  totalDurationSeconds: 0,
  createdAt: new Date().toISOString(),
  completedAt: null,
  minTimeSeconds: 0,
  maxTimeSeconds: 0,
  avgTimeSeconds: 0,
  runsCount: 0,
  ...overrides,
});

describe('TimerSession', () => {
  describe('start', () => {
    it('returns in_progress with appended log for idle task', () => {
      const task = makeTask();
      const session = new TimerSession(task);
      const newLog = { id: 'log-1', startTime: '2024-01-01T00:00:00Z', endTime: null as string | null, durationSeconds: 0 };
      const patch = session.start(0, newLog);
      expect(patch.status).toBe('in_progress');
      expect(patch.timeLogs).toHaveLength(1);
      expect(patch.timeLogs![0]).toEqual(newLog);
    });

    it('returns empty patch for completed task', () => {
      const task = makeTask({ status: 'completed' });
      const session = new TimerSession(task);
      expect(session.start(0, { id: 'log-1', startTime: '', endTime: null, durationSeconds: 0 })).toEqual({});
    });
  });

  describe('resume', () => {
    it('returns in_progress with appended log for paused task', () => {
      const task = makeTask({ status: 'paused' });
      const session = new TimerSession(task);
      const newLog = { id: 'log-1', startTime: '2024-01-01T00:00:00Z', endTime: null as string | null, durationSeconds: 0 };
      const patch = session.resume(0, newLog);
      expect(patch.status).toBe('in_progress');
      expect(patch.timeLogs).toHaveLength(1);
    });

    it('returns empty patch for non-paused task', () => {
      const task = makeTask({ status: 'idle' });
      const session = new TimerSession(task);
      expect(session.resume(0, { id: 'log-1', startTime: '', endTime: null, durationSeconds: 0 })).toEqual({});
    });
  });

  describe('pause', () => {
    it('returns paused with closed log and updated stats for in_progress task', () => {
      const task = makeTask({
        status: 'in_progress',
        timeLogs: [{ id: 'log-1', startTime: '2024-01-01T00:00:00Z', endTime: null, durationSeconds: 0 }],
        totalDurationSeconds: 0,
      });
      const session = new TimerSession(task);
      const patch = session.pause(60, { nowIso: '2024-01-01T01:00:00Z' });
      expect(patch.status).toBe('paused');
      expect(patch.timeLogs?.[0].endTime).toBe('2024-01-01T01:00:00Z');
      expect(patch.timeLogs?.[0].durationSeconds).toBe(60);
      expect(patch.totalDurationSeconds).toBe(60);
      expect(patch.minTimeSeconds).toBe(60);
      expect(patch.avgTimeSeconds).toBe(60);
      expect(patch.runsCount).toBe(1);
    });

    it('returns empty patch for non-in_progress task', () => {
      const task = makeTask({ status: 'idle' });
      const session = new TimerSession(task);
      expect(session.pause(60, { nowIso: '' })).toEqual({});
    });
  });

  describe('complete', () => {
    it('returns completed patch with closed log and stats for in_progress task', () => {
      const task = makeTask({
        status: 'in_progress',
        timeLogs: [{ id: 'log-1', startTime: '2024-01-01T00:00:00Z', endTime: null, durationSeconds: 0 }],
        totalDurationSeconds: 0,
      });
      const session = new TimerSession(task);
      const result = session.complete(120, { nowIso: '2024-01-01T02:00:00Z' });
      expect(result.patch.status).toBe('completed');
      expect(result.patch.completedAt).toBe('2024-01-01T02:00:00Z');
      expect(result.patch.timeLogs?.[0].durationSeconds).toBe(120);
      expect(result.patch.totalDurationSeconds).toBe(120);
      expect(result.xpGained).toBe(10);
    });

    it('returns completed patch without closing logs for idle task', () => {
      const task = makeTask({
        status: 'idle',
        timeLogs: [{ id: 'log-1', startTime: '2024-01-01T00:00:00Z', endTime: null, durationSeconds: 0 }],
      });
      const session = new TimerSession(task);
      const result = session.complete(0, { nowIso: '2024-01-01T01:00:00Z' });
      expect(result.patch.status).toBe('completed');
      expect(result.patch.timeLogs?.[0].endTime).toBeNull();
      expect(result.xpGained).toBe(10);
    });

    it('returns empty result for already completed task', () => {
      const task = makeTask({ status: 'completed' });
      const session = new TimerSession(task);
      expect(session.complete(0, { nowIso: '' })).toEqual({ patch: {}, xpGained: 0 });
    });
  });
});

describe('computeStats', () => {
  it('returns zeros for empty logs', () => {
    expect(computeStats([])).toEqual({
      minTimeSeconds: 0,
      maxTimeSeconds: 0,
      avgTimeSeconds: 0,
      runsCount: 0,
      totalSeconds: 0,
    });
  });

  it('computes stats from logs', () => {
    const logs: TimeLog[] = [
      { id: '1', startTime: '', endTime: '', durationSeconds: 60 },
      { id: '2', startTime: '', endTime: '', durationSeconds: 120 },
    ];
    expect(computeStats(logs)).toEqual({
      minTimeSeconds: 60,
      maxTimeSeconds: 120,
      avgTimeSeconds: 90,
      runsCount: 2,
      totalSeconds: 180,
    });
  });

  it('ignores non-positive durations', () => {
    const logs: TimeLog[] = [
      { id: '1', startTime: '', endTime: '', durationSeconds: 0 },
      { id: '2', startTime: '', endTime: '', durationSeconds: 60 },
    ];
    expect(computeStats(logs).runsCount).toBe(1);
  });
});

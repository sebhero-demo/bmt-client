import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTaskStats, formatDuration, formatTime, generateId, getMotivationMessage } from '../types';
import type { Task, TimeLog } from '../types';

describe('generateId', () => {
  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it('generates valid ID format', () => {
    const id = generateId();
    // Accept both real UUID and test-uuid format from mock
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    const isTestUuid = /^test-uuid-[a-z0-9]+$/i.test(id);
    expect(isUuid || isTestUuid).toBe(true);
  });
});

describe('formatDuration', () => {
  it('formats 0 seconds', () => {
    expect(formatDuration(0)).toBe('0s');
  });

  it('formats seconds only', () => {
    expect(formatDuration(30)).toBe('30s');
    expect(formatDuration(59)).toBe('59s');
    expect(formatDuration(1)).toBe('1s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(60)).toBe('1m 0s');
    expect(formatDuration(90)).toBe('1m 30s');
    expect(formatDuration(125)).toBe('2m 5s');
    expect(formatDuration(3599)).toBe('59m 59s');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(3600)).toBe('1h 0m');
    expect(formatDuration(3660)).toBe('1h 1m');
    expect(formatDuration(7200)).toBe('2h 0m');
    expect(formatDuration(7325)).toBe('2h 2m');
  });

  it('formats large durations', () => {
    expect(formatDuration(86400)).toBe('24h 0m');
    expect(formatDuration(90000)).toBe('25h 0m');
  });
});

describe('formatTime', () => {
  it('formats 0 seconds', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats seconds only', () => {
    expect(formatTime(30)).toBe('00:30');
    expect(formatTime(59)).toBe('00:59');
  });

  it('formats minutes and seconds', () => {
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(90)).toBe('01:30');
    expect(formatTime(599)).toBe('09:59');
  });

  it('formats tens of minutes', () => {
    expect(formatTime(600)).toBe('10:00');
    expect(formatTime(3600)).toBe('60:00');
    expect(formatTime(3661)).toBe('61:01');
  });
});

describe('getTaskStats', () => {
  const makeLog = (durationSeconds: number): TimeLog => ({
    id: generateId(),
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    durationSeconds,
  });

  // Helper to create a completed task with specific time logs
  const makeTask = (title: string, logs: TimeLog[], completedAt?: string): Task => ({
    id: generateId(),
    title,
    status: 'completed',
    timeLogs: logs,
    totalDurationSeconds: logs.reduce((sum, l) => sum + l.durationSeconds, 0),
    createdAt: new Date().toISOString(),
    completedAt: completedAt || new Date().toISOString(),
  });

  it('returns empty array when no tasks', () => {
    expect(getTaskStats([])).toEqual([]);
  });

  it('returns empty array when no completed tasks', () => {
    const tasks: Task[] = [
      { ...makeTask('A', [{ id: generateId(), startTime: '', endTime: '', durationSeconds: 100 }]), status: 'idle' },
      { ...makeTask('B', [{ id: generateId(), startTime: '', endTime: '', durationSeconds: 200 }]), status: 'in_progress' },
    ];
    expect(getTaskStats(tasks)).toEqual([]);
  });

  it('calculates stats for single task', () => {
    const tasks = [makeTask('Task', [makeLog(600)])];
    const stats = getTaskStats(tasks);
    
    expect(stats).toHaveLength(1);
    expect(stats[0].title).toBe('Task');
    expect(stats[0].minTimeSeconds).toBe(600);
    expect(stats[0].maxTimeSeconds).toBe(600);
    expect(stats[0].avgTimeSeconds).toBe(600);
    expect(stats[0].completionCount).toBe(1);
  });

  it('calculates min, max, avg for multiple completions', () => {
    const tasks = [
      makeTask('Task', [makeLog(300)]),
      makeTask('Task', [makeLog(600)]),
      makeTask('Task', [makeLog(900)]),
    ];
    const stats = getTaskStats(tasks);
    
    expect(stats[0].minTimeSeconds).toBe(300);
    expect(stats[0].maxTimeSeconds).toBe(900);
    expect(stats[0].avgTimeSeconds).toBe(600);
    expect(stats[0].completionCount).toBe(3);
  });

  it('groups tasks by title', () => {
    const tasks = [
      makeTask('A', [makeLog(300)]),
      makeTask('B', [makeLog(600)]),
      makeTask('A', [makeLog(450)]),
    ];
    const stats = getTaskStats(tasks);
    
    expect(stats).toHaveLength(2);
    
    const taskA = stats.find(s => s.title === 'A');
    const taskB = stats.find(s => s.title === 'B');
    
    expect(taskA?.completionCount).toBe(2);
    expect(taskB?.completionCount).toBe(1);
  });

  it('excludes non-completed tasks', () => {
    const tasks: Task[] = [
      makeTask('A', [makeLog(100)]),
      { ...makeTask('B', [makeLog(200)]), status: 'in_progress' },
      { ...makeTask('C', [makeLog(300)]), status: 'idle' },
      { ...makeTask('D', [makeLog(400)]), status: 'paused' },
    ];
    const stats = getTaskStats(tasks);
    
    expect(stats).toHaveLength(1);
    expect(stats[0].title).toBe('A');
  });

  it('excludes tasks without completedAt', () => {
    const task: Task = {
      ...makeTask('Test', [makeLog(100)]),
      completedAt: undefined as any,
    };
    expect(getTaskStats([task])).toEqual([]);
  });

  it('excludes tasks with null completedAt', () => {
    const task: Task = {
      ...makeTask('Test', [makeLog(100)]),
      completedAt: null,
    };
    expect(getTaskStats([task])).toEqual([]);
  });

  it('sorts by completion count descending', () => {
    const tasks = [
      makeTask('Rare', [makeLog(100)]),
      makeTask('Common', [makeLog(100)]),
      makeTask('Common', [makeLog(100)]),
      makeTask('Common', [makeLog(100)]),
      makeTask('Medium', [makeLog(100)]),
      makeTask('Medium', [makeLog(100)]),
    ];
    const stats = getTaskStats(tasks);
    
    expect(stats[0].title).toBe('Common');
    expect(stats[1].title).toBe('Medium');
    expect(stats[2].title).toBe('Rare');
  });

  it('handles single task with multiple completed logs by deriving stats from logs', () => {
    const logs: TimeLog[] = [
      { id: 'log-1', startTime: '2023-01-01T10:00:00Z', endTime: '2023-01-01T10:02:00Z', durationSeconds: 120 },
      { id: 'log-2', startTime: '2023-01-02T10:00:00Z', endTime: '2023-01-02T10:05:00Z', durationSeconds: 300 },
    ];
    const task: Task = {
      id: 'task-1',
      title: 'Redo Task',
      status: 'completed',
      timeLogs: logs,
      totalDurationSeconds: 420,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    const stats = getTaskStats([task]);

    expect(stats).toHaveLength(1);
    expect(stats[0].title).toBe('Redo Task');
    expect(stats[0].completionCount).toBe(2);
    expect(stats[0].minTimeSeconds).toBe(120);
    expect(stats[0].maxTimeSeconds).toBe(300);
    expect(stats[0].avgTimeSeconds).toBe(210);
  });

  it('rounds avgTimeSeconds', () => {
    const tasks = [
      makeTask('Task', [makeLog(100)]),
      makeTask('Task', [makeLog(101)]),
      makeTask('Task', [makeLog(102)]),
    ];
    const stats = getTaskStats(tasks);
    
    // 303 / 3 = 101 exactly
    expect(stats[0].avgTimeSeconds).toBe(101);
  });

  it('handles tasks with zero duration', () => {
    const tasks = [makeTask('Zero', [makeLog(0)])];
    const stats = getTaskStats(tasks);
    
    // Zero-duration logs are excluded, so the task contributes no stats
    expect(stats).toHaveLength(0);
  });

  it('handles very large durations', () => {
    const tasks = [makeTask('Long', [makeLog(86400)])]; // 24 hours
    const stats = getTaskStats(tasks);
    
    expect(stats[0].avgTimeSeconds).toBe(86400);
  });

  it('handles many different task titles', () => {
    const tasks = Array.from({ length: 20 }, (_, i) => makeTask(`Task ${i}`, [makeLog(60)]));
    const stats = getTaskStats(tasks);
    
    expect(stats).toHaveLength(20);
  });
});

describe('getMotivationMessage', () => {
  const makeStats = (completionCount: number, avgTimeSeconds: number, minTimeSeconds: number) => ({
    title: 'Test Task',
    completionCount,
    avgTimeSeconds,
    minTimeSeconds,
    maxTimeSeconds: avgTimeSeconds * 2,
  });

  it('returns new task message when no stats', () => {
    const result = getMotivationMessage(undefined);
    
    expect(result?.emoji).toBe('✨');
    expect(result?.text).toContain('Ny utmaning');
    expect(result?.type).toBe('new');
  });

  it('returns challenge message for 1 completion', () => {
    const stats = makeStats(1, 300, 180);
    const result = getMotivationMessage(stats);
    
    expect(result?.emoji).toBe('🎯');
    expect(result?.text).toContain('genomsnittstid');
    expect(result?.type).toBe('challenge');
  });

  it('returns record message for 2+ completions', () => {
    const stats = makeStats(3, 300, 180);
    const result = getMotivationMessage(stats);
    
    expect(result?.emoji).toBe('🏆');
    expect(result?.text).toContain('record');
    expect(result?.type).toBe('record');
  });

  it('includes formatted duration in message', () => {
    const stats = makeStats(1, 600, 300); // 10 min avg
    const result = getMotivationMessage(stats);
    
    expect(result?.text).toContain('10m');
  });

  it('returns correct record time for multiple completions', () => {
    const stats = makeStats(5, 300, 120); // 2 min record
    const result = getMotivationMessage(stats);
    
    expect(result?.text).toContain('2m');
  });
});
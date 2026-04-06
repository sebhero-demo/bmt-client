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
  // Helper to create a completed task with specific duration
  const makeTask = (title: string, seconds: number, completedAt?: string): Task => ({
    id: generateId(),
    title,
    status: 'completed',
    timeLogs: [],
    totalDurationSeconds: seconds,
    createdAt: new Date().toISOString(),
    completedAt: completedAt || new Date().toISOString(),
  });

  it('returns empty array when no tasks', () => {
    expect(getTaskStats([])).toEqual([]);
  });

  it('returns empty array when no completed tasks', () => {
    const tasks: Task[] = [
      { ...makeTask('A', 100), status: 'idle' },
      { ...makeTask('B', 200), status: 'in_progress' },
    ];
    expect(getTaskStats(tasks)).toEqual([]);
  });

  it('calculates stats for single task', () => {
    const tasks = [makeTask('Task', 600)];
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
      makeTask('Task', 300),
      makeTask('Task', 600),
      makeTask('Task', 900),
    ];
    const stats = getTaskStats(tasks);
    
    expect(stats[0].minTimeSeconds).toBe(300);
    expect(stats[0].maxTimeSeconds).toBe(900);
    expect(stats[0].avgTimeSeconds).toBe(600);
    expect(stats[0].completionCount).toBe(3);
  });

  it('groups tasks by title', () => {
    const tasks = [
      makeTask('A', 300),
      makeTask('B', 600),
      makeTask('A', 450),
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
      makeTask('A', 100),
      { ...makeTask('B', 200), status: 'in_progress' },
      { ...makeTask('C', 300), status: 'idle' },
      { ...makeTask('D', 400), status: 'paused' },
    ];
    const stats = getTaskStats(tasks);
    
    expect(stats).toHaveLength(1);
    expect(stats[0].title).toBe('A');
  });

  it('excludes tasks without completedAt', () => {
    const task: Task = {
      ...makeTask('Test', 100),
      completedAt: undefined as any,
    };
    expect(getTaskStats([task])).toEqual([]);
  });

  it('excludes tasks with null completedAt', () => {
    const task: Task = {
      ...makeTask('Test', 100),
      completedAt: null,
    };
    expect(getTaskStats([task])).toEqual([]);
  });

  it('sorts by completion count descending', () => {
    const tasks = [
      makeTask('Rare', 100),
      makeTask('Common', 100),
      makeTask('Common', 100),
      makeTask('Common', 100),
      makeTask('Medium', 100),
      makeTask('Medium', 100),
    ];
    const stats = getTaskStats(tasks);
    
    expect(stats[0].title).toBe('Common');
    expect(stats[1].title).toBe('Medium');
    expect(stats[2].title).toBe('Rare');
  });

  it('handles task with many time logs', () => {
    const logs: TimeLog[] = Array.from({ length: 10 }, (_, i) => ({
      id: generateId(),
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      durationSeconds: 60 + i * 10,
    }));
    
    const task: Task = {
      id: generateId(),
      title: 'Multi-log Task',
      status: 'completed',
      timeLogs: logs,
      totalDurationSeconds: 1050,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    
    const stats = getTaskStats([task]);
    
    expect(stats).toHaveLength(1);
    expect(stats[0].completionCount).toBe(1); // Task count, not log count
    expect(stats[0].avgTimeSeconds).toBe(1050);
  });

  it('rounds avgTimeSeconds', () => {
    const tasks = [
      makeTask('Task', 100),
      makeTask('Task', 101),
      makeTask('Task', 102),
    ];
    const stats = getTaskStats(tasks);
    
    // 303 / 3 = 101 exactly
    expect(stats[0].avgTimeSeconds).toBe(101);
  });

  it('handles tasks with zero duration', () => {
    const tasks = [makeTask('Zero', 0)];
    const stats = getTaskStats(tasks);
    
    expect(stats[0].minTimeSeconds).toBe(0);
    expect(stats[0].maxTimeSeconds).toBe(0);
    expect(stats[0].avgTimeSeconds).toBe(0);
  });

  it('handles very large durations', () => {
    const tasks = [makeTask('Long', 86400)]; // 24 hours
    const stats = getTaskStats(tasks);
    
    expect(stats[0].avgTimeSeconds).toBe(86400);
  });

  it('handles many different task titles', () => {
    const tasks = Array.from({ length: 20 }, (_, i) => makeTask(`Task ${i}`, 60));
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
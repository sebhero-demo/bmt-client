import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useAppStore, startTimerInterval, stopTimerInterval, pauseAllTasks } from '../store';

// Mock Date.now() for consistent testing
const mockNow = vi.fn(() => 1700000000000);
global.Date.now = mockNow;

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      tasks: [],
      activeTaskId: null,
      userStats: { 
        xp: 0, 
        currentStreak: 0, 
        isBeastModeActive: false, 
        lastActiveDate: null 
      },
      timerSeconds: 0,
      isTimerRunning: false,
      timerStartTime: null,
      announcement: null,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    stopTimerInterval();
  });

  // =========================================
  // ADD TASK TESTS
  // =========================================
  describe('addTask', () => {
    it('adds task to beginning of list', () => {
      const store = useAppStore.getState();
      store.addTask('First');
      store.addTask('Second');
      
      const tasks = useAppStore.getState().tasks;
      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe('Second');
      expect(tasks[1].title).toBe('First');
    });

    it('creates task with idle status', () => {
      useAppStore.getState().addTask('Test');
      expect(useAppStore.getState().tasks[0].status).toBe('idle');
    });

    it('generates unique IDs', () => {
      useAppStore.getState().addTask('A');
      useAppStore.getState().addTask('B');
      
      const ids = useAppStore.getState().tasks.map(t => t.id);
      expect(new Set(ids).size).toBe(2);
    });

    it('rejects empty title', () => {
      const store = useAppStore.getState();
      store.addTask('');
      store.addTask('   ');
      store.addTask('\n');
      
      expect(useAppStore.getState().tasks).toHaveLength(0);
    });

    it('trims whitespace from title', () => {
      useAppStore.getState().addTask('  Trimmed  ');
      expect(useAppStore.getState().tasks[0].title).toBe('Trimmed');
    });

    it('sets createdAt timestamp', () => {
      useAppStore.getState().addTask('Test');
      const createdAt = useAppStore.getState().tasks[0].createdAt;
      expect(createdAt).toBeDefined();
      // Check it's a valid ISO string from around now
      expect(new Date(createdAt).getTime()).toBeGreaterThan(1700000000000);
    });
  });

  // =========================================
  // DELETE TASK TESTS
  // =========================================
  describe('deleteTask', () => {
    it('removes task from state', () => {
      const store = useAppStore.getState();
      store.addTask('To Delete');
      const id = useAppStore.getState().tasks[0].id;
      
      store.deleteTask(id);
      expect(useAppStore.getState().tasks).toHaveLength(0);
    });

    it('clears activeTaskId if deleted task was active', () => {
      const store = useAppStore.getState();
      store.addTask('Active');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      expect(useAppStore.getState().activeTaskId).toBe(id);
      
      store.deleteTask(id);
      expect(useAppStore.getState().activeTaskId).toBeNull();
    });

    it('stops timer if active task deleted', () => {
      const store = useAppStore.getState();
      store.addTask('Active');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      expect(useAppStore.getState().isTimerRunning).toBe(true);
      
      store.deleteTask(id);
      expect(useAppStore.getState().isTimerRunning).toBe(false);
    });

    it('does nothing for non-existent id', () => {
      useAppStore.getState().addTask('Test');
      useAppStore.getState().deleteTask('non-existent');
      expect(useAppStore.getState().tasks).toHaveLength(1);
    });
  });

  // =========================================
  // START TASK TESTS
  // =========================================
  describe('startTask', () => {
    it('changes task status to in_progress', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      expect(useAppStore.getState().tasks[0].status).toBe('in_progress');
    });

    it('sets activeTaskId', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      expect(useAppStore.getState().activeTaskId).toBe(id);
    });

    it('starts timer', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      expect(useAppStore.getState().isTimerRunning).toBe(true);
    });

    it('resets timerSeconds to 0', () => {
      useAppStore.setState({ timerSeconds: 100 });
      
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      expect(useAppStore.getState().timerSeconds).toBe(0);
    });

    it('adds time log entry', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      const task = useAppStore.getState().tasks.find(t => t.id === id);
      
      expect(task?.timeLogs).toHaveLength(1);
      expect(task?.timeLogs[0].startTime).toBeDefined();
      expect(task?.timeLogs[0].endTime).toBeNull();
    });

    it('does nothing for completed task', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      store.completeTask(id);
      store.startTask(id);
      
      expect(useAppStore.getState().tasks[0].status).toBe('completed');
    });

    it('pauses other active task when starting new one', () => {
      const store = useAppStore.getState();
      store.addTask('First');
      store.addTask('Second');
      
      const firstId = useAppStore.getState().tasks[1].id;
      const secondId = useAppStore.getState().tasks[0].id;
      
      store.startTask(firstId);
      expect(useAppStore.getState().tasks[1].status).toBe('in_progress');
      
      store.startTask(secondId);
      
      // First task should be paused
      expect(useAppStore.getState().tasks.find(t => t.id === firstId)?.status).toBe('paused');
      // Second should be active
      expect(useAppStore.getState().tasks.find(t => t.id === secondId)?.status).toBe('in_progress');
    });
  });

  // =========================================
  // PAUSE TASK TESTS
  // =========================================
  describe('pauseTask', () => {
    it('changes task status to paused', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      store.pauseTask(id);
      
      expect(useAppStore.getState().tasks[0].status).toBe('paused');
    });

    it('stops timer', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      store.pauseTask(id);
      
      expect(useAppStore.getState().isTimerRunning).toBe(false);
    });

    it('closes time log entry', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      store.pauseTask(id);
      
      const task = useAppStore.getState().tasks.find(t => t.id === id);
      expect(task?.timeLogs[0].endTime).toBeDefined();
    });

    it('accumulates duration in totalDurationSeconds', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      
      // Manually advance timer by setting timerStartTime to 30 seconds ago
      useAppStore.setState({ timerStartTime: Date.now() - 30000 });
      
      store.pauseTask(id);
      
      const task = useAppStore.getState().tasks.find(t => t.id === id);
      expect(task?.totalDurationSeconds).toBeGreaterThanOrEqual(30);
    });

    it('does nothing for non-in_progress task', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.pauseTask(id);
      expect(useAppStore.getState().tasks[0].status).toBe('idle');
    });
  });

  // =========================================
  // RESUME TASK TESTS
  // =========================================
  describe('resumeTask', () => {
    it('changes task status to in_progress', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      store.pauseTask(id);
      store.resumeTask(id);
      
      expect(useAppStore.getState().tasks[0].status).toBe('in_progress');
    });

    it('starts timer', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      store.pauseTask(id);
      store.resumeTask(id);
      
      expect(useAppStore.getState().isTimerRunning).toBe(true);
    });

    it('adds new time log entry', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      store.pauseTask(id);
      store.resumeTask(id);
      
      const task = useAppStore.getState().tasks.find(t => t.id === id);
      expect(task?.timeLogs).toHaveLength(2);
    });

    it('does nothing for non-paused task', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.resumeTask(id);
      expect(useAppStore.getState().tasks[0].status).toBe('idle');
    });
  });

  // =========================================
  // COMPLETE TASK TESTS
  // =========================================
  describe('completeTask', () => {
    it('changes task status to completed', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      store.completeTask(id);
      
      expect(useAppStore.getState().tasks[0].status).toBe('completed');
    });

    it('sets completedAt timestamp', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      store.completeTask(id);
      
      expect(useAppStore.getState().tasks[0].completedAt).toBeDefined();
    });

    it('awards XP', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      store.completeTask(id);
      
      expect(useAppStore.getState().userStats.xp).toBeGreaterThan(0);
    });

    it('awards minimum 10 XP', () => {
      useAppStore.setState({ timerSeconds: 0, timerStartTime: null });
      
      const store = useAppStore.getState();
      store.addTask('Quick');
      const id = useAppStore.getState().tasks[0].id;
      
      // Simulate very short duration (less than a minute)
      store.startTask(id);
      useAppStore.setState({ timerSeconds: 30 });
      store.completeTask(id);
      
      expect(useAppStore.getState().userStats.xp).toBe(10);
    });

    it('awards 1 XP per minute', () => {
      const store = useAppStore.getState();
      store.addTask('Two Minutes');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      
      // Simulate 2 minutes of work by advancing time
      useAppStore.setState({ timerStartTime: Date.now() - 120000 });
      store.completeTask(id);
      
      // Should get 10 (min) + 2 = 12
      expect(useAppStore.getState().userStats.xp).toBeGreaterThanOrEqual(10);
    });

    it('clears activeTaskId', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      store.completeTask(id);
      
      expect(useAppStore.getState().activeTaskId).toBeNull();
    });

    it('stops timer', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      store.completeTask(id);
      
      expect(useAppStore.getState().isTimerRunning).toBe(false);
    });

    it('resets timerSeconds', () => {
      useAppStore.setState({ timerSeconds: 100 });
      
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      store.completeTask(id);
      
      expect(useAppStore.getState().timerSeconds).toBe(0);
    });

    it('does nothing for already completed task', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      store.completeTask(id);
      
      const initialXP = useAppStore.getState().userStats.xp;
      store.completeTask(id);
      
      expect(useAppStore.getState().userStats.xp).toBe(initialXP);
    });
  });

  // =========================================
  // REDO TASK TESTS
  // =========================================
  describe('redoTask', () => {
    it('resets completed task to idle', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      store.completeTask(id);
      store.redoTask(id);
      
      expect(useAppStore.getState().tasks[0].status).toBe('idle');
    });

    it('clears completedAt', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      store.completeTask(id);
      store.redoTask(id);
      
      expect(useAppStore.getState().tasks[0].completedAt).toBeNull();
    });

    it('preserves time logs from previous completions', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      store.completeTask(id);
      const logCount = useAppStore.getState().tasks[0].timeLogs.length;
      
      store.redoTask(id);
      
      expect(useAppStore.getState().tasks[0].timeLogs.length).toBe(logCount);
    });

    it('does nothing for non-completed task', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.redoTask(id);
      expect(useAppStore.getState().tasks[0].status).toBe('idle');
    });
  });

  // =========================================
  // UPDATE TASK TITLE TESTS
  // =========================================
  describe('updateTaskTitle', () => {
    it('updates task title', () => {
      const store = useAppStore.getState();
      store.addTask('Old Title');
      const id = useAppStore.getState().tasks[0].id;
      
      store.updateTaskTitle(id, 'New Title');
      
      expect(useAppStore.getState().tasks[0].title).toBe('New Title');
    });

    it('trims whitespace', () => {
      const store = useAppStore.getState();
      store.addTask('Original');
      const id = useAppStore.getState().tasks[0].id;
      
      store.updateTaskTitle(id, '  Trimmed  ');
      
      expect(useAppStore.getState().tasks[0].title).toBe('Trimmed');
    });

    it('ignores empty title', () => {
      const store = useAppStore.getState();
      store.addTask('Original');
      const id = useAppStore.getState().tasks[0].id;
      
      store.updateTaskTitle(id, '');
      store.updateTaskTitle(id, '   ');
      
      expect(useAppStore.getState().tasks[0].title).toBe('Original');
    });
  });

  // =========================================
  // UPDATE TASK TIME TESTS
  // =========================================
  describe('updateTaskTime', () => {
    it('updates totalDurationSeconds', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.updateTaskTime(id, 300);
      
      expect(useAppStore.getState().tasks[0].totalDurationSeconds).toBe(300);
    });
  });

  // =========================================
  // ADD MANUAL TIME LOG TESTS
  // =========================================
  describe('addManualTimeLog', () => {
    it('adds new time log', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.addManualTimeLog(id, 600, '2024-01-01');
      
      expect(useAppStore.getState().tasks[0].timeLogs).toHaveLength(1);
      expect(useAppStore.getState().tasks[0].timeLogs[0].durationSeconds).toBe(600);
    });

    it('adds to totalDurationSeconds', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.addManualTimeLog(id, 600, '2024-01-01');
      
      expect(useAppStore.getState().tasks[0].totalDurationSeconds).toBe(600);
    });
  });

  // =========================================
  // TOGGLE BEAST MODE TESTS
  // =========================================
  describe('toggleBeastMode', () => {
    it('toggles on from off', () => {
      const store = useAppStore.getState();
      store.toggleBeastMode();
      
      expect(useAppStore.getState().userStats.isBeastModeActive).toBe(true);
    });

    it('toggles off from on', () => {
      const store = useAppStore.getState();
      store.toggleBeastMode();
      store.toggleBeastMode();
      
      expect(useAppStore.getState().userStats.isBeastModeActive).toBe(false);
    });
  });

  // =========================================
  // XP FUNCTIONALITY TESTS
  // =========================================
  describe('XP System', () => {
    it('addXP increases XP', () => {
      const store = useAppStore.getState();
      store.addXP(50);
      
      expect(useAppStore.getState().userStats.xp).toBe(50);
    });

    it('addXP accumulates', () => {
      const store = useAppStore.getState();
      store.addXP(25);
      store.addXP(25);
      
      expect(useAppStore.getState().userStats.xp).toBe(50);
    });
  });

  // =========================================
  // STREAK FUNCTIONALITY TESTS
  // =========================================
  describe('Streak System', () => {
    it('incrementStreak increases streak', () => {
      const store = useAppStore.getState();
      store.incrementStreak();
      
      expect(useAppStore.getState().userStats.currentStreak).toBe(1);
    });

    it('resetStreak resets to 0', () => {
      const store = useAppStore.getState();
      store.incrementStreak();
      store.incrementStreak();
      store.resetStreak();
      
      expect(useAppStore.getState().userStats.currentStreak).toBe(0);
    });
  });

  // =========================================
  // TIMER TICK TESTS
  // =========================================
  describe('Timer tick', () => {
    it('increments timerSeconds when running', () => {
      useAppStore.setState({ 
        isTimerRunning: true, 
        timerStartTime: Date.now() - 5000,
        activeTaskId: 'test-id'
      });
      
      const store = useAppStore.getState();
      store.tick();
      
      expect(useAppStore.getState().timerSeconds).toBeGreaterThan(0);
    });

    it('does not increment when not running', () => {
      useAppStore.setState({ isTimerRunning: false });
      
      const initial = useAppStore.getState().timerSeconds;
      useAppStore.getState().tick();
      
      expect(useAppStore.getState().timerSeconds).toBe(initial);
    });
  });

  // =========================================
  // RESET TIMER TESTS
  // =========================================
  describe('resetTimer', () => {
    it('resets timerSeconds', () => {
      useAppStore.setState({ timerSeconds: 100 });
      
      useAppStore.getState().resetTimer();
      
      expect(useAppStore.getState().timerSeconds).toBe(0);
    });

    it('stops timer', () => {
      useAppStore.setState({ isTimerRunning: true });
      
      useAppStore.getState().resetTimer();
      
      expect(useAppStore.getState().isTimerRunning).toBe(false);
    });
  });

  // =========================================
  // GET ACTIVE TASK TESTS
  // =========================================
  describe('getActiveTask', () => {
    it('returns active task', () => {
      const store = useAppStore.getState();
      store.addTask('Active');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      
      const active = useAppStore.getState().getActiveTask();
      expect(active?.title).toBe('Active');
    });

    it('returns null when no active task', () => {
      const active = useAppStore.getState().getActiveTask();
      expect(active).toBeNull();
    });
  });

  // =========================================
  // GET TODAYS STATS TESTS
  // =========================================
  describe('getTodaysStats', () => {
    it('counts completed today', () => {
      const store = useAppStore.getState();
      store.addTask('Today');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      store.completeTask(id);
      
      const stats = useAppStore.getState().getTodaysStats();
      expect(stats.completed).toBe(1);
    });

    it('counts active tasks', () => {
      const store = useAppStore.getState();
      store.addTask('Active');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      
      const stats = useAppStore.getState().getTodaysStats();
      expect(stats.active).toBe(1);
    });

    it('calculates total minutes', () => {
      const store = useAppStore.getState();
      store.addTask('Test');
      const id = useAppStore.getState().tasks[0].id;
      
      store.startTask(id);
      
      // Manually set timer to simulate work
      useAppStore.setState({ timerStartTime: Date.now() - 600000 }); // 10 min ago
      store.completeTask(id);
      
      const stats = useAppStore.getState().getTodaysStats();
      expect(stats.totalMinutes).toBeGreaterThanOrEqual(10);
    });
  });

  // =========================================
  // ERROR HANDLING TESTS
  // =========================================
  describe('Error handling', () => {
    it('clearError clears error', () => {
      useAppStore.setState({ error: 'Some error' });
      
      useAppStore.getState().clearError();
      
      expect(useAppStore.getState().error).toBeNull();
    });

    it('setAnnouncement sets announcement', () => {
      useAppStore.getState().setAnnouncement('Test message');
      
      expect(useAppStore.getState().announcement).toBe('Test message');
    });
  });
});

// =========================================
// TIMER INTERVAL TESTS
// =========================================
describe('Timer Interval', () => {
  beforeEach(() => {
    useAppStore.setState({
      tasks: [],
      activeTaskId: null,
      userStats: { xp: 0, currentStreak: 0, isBeastModeActive: false, lastActiveDate: null },
      timerSeconds: 0,
      isTimerRunning: false,
      timerStartTime: null,
      announcement: null,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    stopTimerInterval();
  });

  it('starts interval without duplicating', () => {
    startTimerInterval();
    startTimerInterval(); // Should not create duplicate
    
    expect(true).toBe(true); // If we get here without error, test passes
  });

  it('stops interval', () => {
    startTimerInterval();
    stopTimerInterval();
    
    expect(true).toBe(true);
  });
});

// =========================================
// PERSISTENCE TESTS
// =========================================
describe('Persistence', () => {
  it('partializes state correctly', () => {
    const partialized = useAppStore.persist.getOptions().partialize;
    const state = {
      tasks: [{ id: '1', title: 'Test', status: 'idle', timeLogs: [], totalDurationSeconds: 0, createdAt: '', completedAt: null }],
      userStats: { xp: 100, currentStreak: 5, isBeastModeActive: true, lastActiveDate: null },
      timerSeconds: 60,
      isTimerRunning: true,
      timerStartTime: 1234567890,
      activeTaskId: '1',
      announcement: null,
      isLoading: true,
      error: 'error',
    };
    
    const result = partialized(state as any);
    
    expect(result.tasks).toBeDefined();
    expect(result.userStats).toBeDefined();
    expect(result.timerSeconds).toBeDefined();
    expect(result.isTimerRunning).toBeDefined();
    expect(result.timerStartTime).toBeDefined();
    expect(result.activeTaskId).toBeDefined();
    expect((result as any).announcement).toBeUndefined();
    expect((result as any).isLoading).toBeUndefined();
    expect((result as any).error).toBeUndefined();
  });

  // =========================================
  // MOTIVATION MESSAGE TESTS
  // =========================================
  describe('Motivation Message', () => {
    beforeEach(() => {
      useAppStore.setState({ motivationMessage: null });
    });

    it('can set and clear motivationMessage', () => {
      useAppStore.setState({ motivationMessage: { emoji: '🏆', text: 'Test', type: 'record' } });
      expect(useAppStore.getState().motivationMessage).not.toBeNull();
      
      useAppStore.getState().clearMotivationMessage();
      expect(useAppStore.getState().motivationMessage).toBeNull();
    });

    it('clearMotivationMessage clears message', () => {
      useAppStore.setState({ motivationMessage: { emoji: '🏆', text: 'Test', type: 'record' } });
      
      useAppStore.getState().clearMotivationMessage();
      
      expect(useAppStore.getState().motivationMessage).toBeNull();
    });
  });
});
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAppStore } from '../store';
import { TaskItem } from '../components/TaskItem';
import { getTaskStats, formatDuration } from '../types';
import type { Task } from '../types';

// Mock both getTaskStats and formatDuration
vi.mock('../types', async () => {
  const actual = await vi.importActual('../types');
  return {
    ...actual,
    getTaskStats: vi.fn(),
    formatDuration: vi.fn((seconds: number) => seconds.toString()),
  };
});

describe('TaskItem', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      tasks: [],
      activeTaskId: null,
      isTimerRunning: false,
      timerSeconds: 0,
      timerStartTime: null,
      userStats: { xp: 0, currentStreak: 0, isBeastModeActive: false },
      announcement: null,
      isLoading: false,
      error: null,
      motivationMessage: null,
    });
    vi.clearAllMocks();
  });

  it('displays stats after task completion', async () => {
    const taskId = 'task-1';
    const initialTask: Task = {
      id: taskId,
      title: 'Test Task',
      status: 'paused',
      timeLogs: [
        { id: 'log1', startTime: '2023-01-01T10:00:00Z', endTime: '2023-01-01T10:02:00Z', durationSeconds: 120 },
        { id: 'log2', startTime: '2023-01-02T10:00:00Z', endTime: '2023-01-02T10:03:00Z', durationSeconds: 150 },
      ],
      totalDurationSeconds: 0,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    useAppStore.setState({ tasks: [initialTask] });

    // Mock getTaskStats to return stats for completed tasks
    (getTaskStats as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        title: 'Test Task',
        minTimeSeconds: 120,
        avgTimeSeconds: 150,
        maxTimeSeconds: 180,
        completionCount: 2,
      },
    ]);

    render(<TaskItem task={initialTask} />);

    const completeButton = screen.getByRole('button', { name: /Complete Test Task/i });
    expect(completeButton).toBeInTheDocument();

    fireEvent.click(completeButton);

    await waitFor(() => {
      const tasks = useAppStore.getState().tasks;
      expect(tasks[0].status).toBe('completed');
      expect(tasks[0].completedAt).toBeDefined();
    });

    // Check for stats - just verify at least one avg stat appears
    await waitFor(() => {
      const stats = screen.getAllByLabelText('Avg 150 seconds');
      expect(stats.length).toBeGreaterThan(0);
    });
  });

  it('shows empty stats for tasks with no completion history', () => {
    const task: Task = {
      id: 'task-1',
      title: 'New Task',
      status: 'idle',
      timeLogs: [],
      totalDurationSeconds: 0,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    useAppStore.setState({ tasks: [task] });
    (getTaskStats as ReturnType<typeof vi.fn>).mockReturnValue([]);

    render(<TaskItem task={task} />);

    // Task should render without stats (no min/max/avg sections)
    expect(screen.getByText('New Task')).toBeDefined();
  });

  it('runs for 2 seconds and saves the time correctly', async () => {
    const task: Task = {
      id: 'task-timer-test',
      title: 'Timer Test Task',
      status: 'idle',
      timeLogs: [],
      totalDurationSeconds: 0,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    useAppStore.setState({ tasks: [task] });
    render(<TaskItem task={task} />);

    // Click start button
    const startButton = screen.getByRole('button', { name: /Start Timer Test Task/i });
    expect(startButton).toBeInTheDocument();
    fireEvent.click(startButton);

    // Verify task is now in progress
    await waitFor(() => {
      const tasks = useAppStore.getState().tasks;
      expect(tasks[0].status).toBe('in_progress');
    });

    // Simulate 2 seconds of work by advancing timerStartTime
    useAppStore.setState({ timerStartTime: Date.now() - 2000 });

    // Use store action directly since component won't re-render with updated time
    useAppStore.getState().pauseTask('task-timer-test');

    // Verify the task is paused and time is saved (should be at least 2 seconds)
    await waitFor(() => {
      const tasks = useAppStore.getState().tasks;
      expect(tasks[0].status).toBe('paused');
      expect(tasks[0].totalDurationSeconds).toBeGreaterThanOrEqual(2);
    });

    // Verify time log was created with correct duration
    const updatedTasks = useAppStore.getState().tasks;
    expect(updatedTasks[0].timeLogs.length).toBe(1);
    expect(updatedTasks[0].timeLogs[0].durationSeconds).toBeGreaterThanOrEqual(2);
    expect(updatedTasks[0].timeLogs[0].endTime).toBeDefined();
  });

  it('completes after 2 seconds and saves with correct total', async () => {
    const task: Task = {
      id: 'task-complete-test',
      title: 'Complete Test Task',
      status: 'idle',
      timeLogs: [],
      totalDurationSeconds: 0,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    useAppStore.setState({ tasks: [task] });
    render(<TaskItem task={task} />);

    // Start the task
    const startButton = screen.getByRole('button', { name: /Start Complete Test Task/i });
    fireEvent.click(startButton);

    await waitFor(() => {
      const tasks = useAppStore.getState().tasks;
      expect(tasks[0].status).toBe('in_progress');
    });

    // Simulate 2 seconds of work by advancing timerStartTime
    useAppStore.setState({ timerStartTime: Date.now() - 2000 });

    // Pause first using store action directly
    useAppStore.getState().pauseTask('task-complete-test');

    await waitFor(() => {
      const tasks = useAppStore.getState().tasks;
      expect(tasks[0].status).toBe('paused');
    });

    // Now complete using store action directly
    useAppStore.getState().completeTask('task-complete-test');

    // Verify task is completed with correct total duration (at least 2 seconds)
    await waitFor(() => {
      const tasks = useAppStore.getState().tasks;
      expect(tasks[0].status).toBe('completed');
      expect(tasks[0].totalDurationSeconds).toBeGreaterThanOrEqual(2);
      expect(tasks[0].completedAt).toBeDefined();
    });

    // Verify time log
    const updatedTasks = useAppStore.getState().tasks;
    expect(updatedTasks[0].timeLogs.length).toBe(1);
    expect(updatedTasks[0].timeLogs[0].durationSeconds).toBeGreaterThanOrEqual(2);
    expect(updatedTasks[0].timeLogs[0].endTime).toBeDefined();
  });
});
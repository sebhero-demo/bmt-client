import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAppStore } from '../store';
import TimerPanel from '../components/TimerPanel';

// Reset store before each test
beforeEach(() => {
  useAppStore.setState({
    tasks: [],
    activeTaskId: null,
    userStats: { xp: 0, currentStreak: 0, isBeastModeActive: false },
    timerSeconds: 0,
    isTimerRunning: false,
    timerStartTime: null,
    motivationMessage: null,
    announcement: null,
    isLoading: false,
    error: null,
  });
});

describe('TimerPanel', () => {
  describe('rendering', () => {
    it('displays task title', () => {
      render(<TimerPanel activeTaskTitle="Focus" timerSeconds={0} isTimerRunning={false} timerStartTime={null} totalDurationSeconds={0} />);
      expect(screen.getByText('Focus')).toBeDefined();
    });

    it('displays formatted time in MM:SS format', () => {
      render(<TimerPanel activeTaskTitle="Focus" timerSeconds={125} isTimerRunning={false} timerStartTime={null} totalDurationSeconds={0} />);
      expect(screen.getByText('02:05')).toBeDefined();
    });

    it('shows green color class when timer is running', () => {
      render(<TimerPanel activeTaskTitle="Focus" timerSeconds={0} isTimerRunning={true} timerStartTime={null} totalDurationSeconds={0} />);
      const timer = screen.getByRole('timer');
      expect(timer.className).toContain('text-green-500');
    });

    it('shows yellow color class when timer is paused', () => {
      render(<TimerPanel activeTaskTitle="Focus" timerSeconds={0} isTimerRunning={false} timerStartTime={null} totalDurationSeconds={0} />);
      const timer = screen.getByRole('timer');
      expect(timer.className).toContain('text-yellow-500');
    });
  });

  describe('accessibility', () => {
    it('has correct aria-label', () => {
      render(<TimerPanel activeTaskTitle="Focus" timerSeconds={0} isTimerRunning={false} timerStartTime={null} totalDurationSeconds={0} />);
      expect(screen.getByLabelText('Active timer for Focus')).toBeDefined();
    });

    it('has aria-live when running', () => {
      render(<TimerPanel activeTaskTitle="Focus" timerSeconds={0} isTimerRunning={true} timerStartTime={null} totalDurationSeconds={0} />);
      const timer = screen.getByRole('timer');
      expect(timer.getAttribute('aria-live')).toBe('polite');
    });

    it('does not have aria-live when paused', () => {
      render(<TimerPanel activeTaskTitle="Focus" timerSeconds={0} isTimerRunning={false} timerStartTime={null} totalDurationSeconds={0} />);
      const timer = screen.getByRole('timer');
      expect(timer.getAttribute('aria-live')).toBeNull();
    });

    it('has role="timer"', () => {
      render(<TimerPanel activeTaskTitle="Focus" timerSeconds={0} isTimerRunning={false} timerStartTime={null} totalDurationSeconds={0} />);
      expect(screen.getByRole('timer')).toBeDefined();
    });
  });

  describe('visual states', () => {
    it('displays running status badge when active', () => {
      render(<TimerPanel activeTaskTitle="Focus" timerSeconds={0} isTimerRunning={true} timerStartTime={null} totalDurationSeconds={0} />);
      expect(screen.getByText('Running')).toBeDefined();
    });

    it('displays paused status badge when paused', () => {
      render(<TimerPanel activeTaskTitle="Focus" timerSeconds={0} isTimerRunning={false} timerStartTime={null} totalDurationSeconds={0} />);
      expect(screen.getByText('Paused')).toBeDefined();
    });
  });

  describe('running elapsed time', () => {
    it('displays timerSeconds plus running delta while timer is running', () => {
      const now = Date.now();
      useAppStore.setState({
        timerSeconds: 0,
        isTimerRunning: true,
        timerStartTime: now - 5000,
        activeTaskId: 'task-1',
        tasks: [{ id: 'task-1', title: 'Focus', status: 'in_progress', timeLogs: [], totalDurationSeconds: 0, createdAt: new Date().toISOString(), completedAt: null }],
      });

      render(<TimerPanel activeTaskTitle="Focus" timerSeconds={0} isTimerRunning={true} timerStartTime={now - 5000} totalDurationSeconds={0} />);
      // The component should display 00:05 because the running delta is 5 seconds
      expect(screen.getByText('00:05')).toBeDefined();
    });

    it('displays exactly timerSeconds when timer is paused', () => {
      useAppStore.setState({
        timerSeconds: 125,
        isTimerRunning: false,
        timerStartTime: null,
      });

      render(<TimerPanel activeTaskTitle="Focus" timerSeconds={125} isTimerRunning={false} timerStartTime={null} totalDurationSeconds={0} />);
      expect(screen.getByText('02:05')).toBeDefined();
    });
  });
});

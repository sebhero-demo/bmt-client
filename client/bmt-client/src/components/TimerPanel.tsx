import { Play, Pause } from "lucide-react";
import { type JSX, useMemo } from "react";
import { useAppStore } from "../store";
import { formatTime } from "../types";
import TimerStatsDisplay from "./TimerStatsDisplay";

type Props = {
  activeTaskTitle: string;
  timerSeconds: number;
  isTimerRunning: boolean;
};

export default function TimerPanel({ activeTaskTitle, timerSeconds, isTimerRunning }: Props): JSX.Element {
  const { /* start/pause/resume/complete handlers could be selected here if rendering controls are added */ } = useAppStore();

  const timerLabel = useMemo(() => (isTimerRunning ? 'Running' : 'Paused'), [isTimerRunning]);

  return (
    <section
      className="rounded-2xl p-6 sm:p-8 text-center animate-fade-in delay-100 bg-zinc-900 border border-zinc-800 shadow-2xl shadow-black/40"
      aria-label={`Active timer for ${activeTaskTitle}`}
    >
      {/* Task title - improved spacing */}
      <div className="text-base sm:text-lg mb-6 truncate font-medium px-4 text-zinc-300 leading-relaxed">
        {activeTaskTitle}
      </div>

      {/* Timer display - BIGGER with visual punch */}
      <div
        className={`text-6xl sm:text-7xl font-display font-black tabular-nums tracking-tighter leading-none ${
          isTimerRunning 
            ? 'text-green-500 drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]' 
            : 'text-yellow-500 drop-shadow-[0_0_20px_rgba(234,179,8,0.3)]'
        } ${isTimerRunning ? 'animate-pulse-glow' : ''}`}
        role="timer"
        aria-live={isTimerRunning ? 'polite' : undefined}
        aria-atomic="true"
      >
        <span className="sr-only">Elapsed time: </span>
        {formatTime(timerSeconds)}
      </div>

      {/* Status badge - improved */}
      <div className="flex items-center justify-center gap-2 mt-6">
        <span
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${
            isTimerRunning 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          }`}
          role="status"
        >
          {isTimerRunning ? (
            <Play className="w-4 h-4 fill-current" aria-hidden="true" />
          ) : (
            <Pause className="w-4 h-4 fill-current" aria-hidden="true" />
          )}
          {timerLabel}
        </span>
      </div>

      {/* Timer stats below */}
      <div className="mt-6 pt-4 border-t border-zinc-800">
        <TimerStatsDisplay taskTitle={activeTaskTitle} currentSeconds={timerSeconds} />
      </div>
    </section>
  );
}
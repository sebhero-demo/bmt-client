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
  // We only read actions when needed; component receives timer state as props for render stability
  const { /* start/pause/resume/complete handlers could be selected here if rendering controls are added */ } = useAppStore();

  const timerLabel = useMemo(() => (isTimerRunning ? 'Running' : 'Paused'), [isTimerRunning]);

  return (
    <section
      className="rounded-2xl p-6 sm:p-8 text-center animate-fade-in delay-100 bg-zinc-900 border border-zinc-800 shadow-2xl shadow-black/40"
      aria-label={`Active timer for ${activeTaskTitle}`}
    >
      <div className="text-sm sm:text-base mb-4 truncate font-medium px-2 text-zinc-400">{activeTaskTitle}</div>

      <div
        className={`text-5xl sm:text-6xl font-bold tabular-nums tracking-tight leading-none ${isTimerRunning ? 'text-green-500' : 'text-yellow-500'}`}
        role="timer"
        aria-live={isTimerRunning ? 'polite' : undefined}
        aria-atomic="true"
      >
        <span className="sr-only">Elapsed time: </span>
        {formatTime(timerSeconds)}
      </div>

      <div className="flex items-center justify-center gap-2 mt-4">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider ${
            isTimerRunning ? 'bg-green-500/15 text-green-500' : 'bg-yellow-500/15 text-yellow-500'
          }`}
          role="status"
        >
          {isTimerRunning ? <Play className="w-3 h-3 fill-current" aria-hidden="true" /> : <Pause className="w-3 h-3 fill-current" aria-hidden="true" />}
          {timerLabel}
        </span>
      </div>

      <TimerStatsDisplay taskTitle={activeTaskTitle} currentSeconds={timerSeconds} />
    </section>
  );
}
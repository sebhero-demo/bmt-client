import { TrendingDown, Flame, TrendingUp } from "lucide-react";
import { type JSX, useMemo } from "react";
import { useAppStore } from "../store";
import { getTaskStats } from "../types";


type Props = {
  taskTitle: string;
  currentSeconds: number;
};

export default function TimerStatsDisplay({ taskTitle, currentSeconds }: Props): JSX.Element | null {
  const tasks = useAppStore((s) => s.tasks);

  const taskStat = useMemo(() => {
    const all = getTaskStats(tasks);
    return all.find((s) => s.title === taskTitle) ?? null;
  }, [tasks, taskTitle]);

  if (!taskStat) return null;

  const isUnderAverage = currentSeconds < taskStat.avgTimeSeconds;
  const isUnderRecord = currentSeconds < taskStat.minTimeSeconds;
  const isOverMax = currentSeconds > taskStat.maxTimeSeconds;
  const avg = Math.max(1, taskStat.avgTimeSeconds); // avoid div by zero
  const progressPercent = Math.min(100, (currentSeconds / avg) * 100);

  return (
    <div className="mt-6 space-y-4">
      <div className="relative">
        <div className="h-2 rounded-full overflow-hidden bg-zinc-800">
          <div
            className={`h-full transition-all duration-500 ease-out rounded-full ${isUnderAverage ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${progressPercent}%` }}
            aria-hidden="true"
          />
        </div>
        {/* average marker (positioned using percentage) */}
        <div
          className="absolute top-0 w-0.5 h-2 bg-zinc-500 opacity-50"
          style={{ left: `${Math.min(100, (taskStat.avgTimeSeconds / Math.max(1, taskStat.maxTimeSeconds)) * 100)}%` }}
          title="Average"
          aria-hidden="true"
        />
      </div>

      <div className="flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-green-400" aria-hidden="true" />
          <span className="text-text-muted">Record:</span>
          <span className="font-mono font-semibold text-green-400">{Math.round(taskStat.minTimeSeconds / 60)}m</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-text-muted">Medel:</span>
          <span className="font-mono font-semibold text-text-secondary">{Math.round(taskStat.avgTimeSeconds / 60)}m</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-text-muted">Max:</span>
          <span className={`font-mono font-semibold ${isOverMax ? 'text-red-400' : 'text-text-muted'}`}>
            {Math.round(taskStat.maxTimeSeconds / 60)}m
          </span>
        </div>
      </div>

      {isUnderRecord && (
        <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-green-500/20 border border-green-500/30 animate-pulse">
          <Flame className="w-4 h-4 text-green-400" aria-hidden="true" />
          <span className="text-sm font-semibold text-green-400">🔥 Du slår ditt record!</span>
        </div>
      )}

      {isOverMax && (
        <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-500/20 border border-red-500/30">
          <TrendingUp className="w-4 h-4 text-red-400" aria-hidden="true" />
          <span className="text-sm font-semibold text-red-400">Över din max-tid</span>
        </div>
      )}
    </div>
  );
}
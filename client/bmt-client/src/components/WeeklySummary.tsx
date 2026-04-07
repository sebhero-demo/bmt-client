import { type JSX } from 'react';
import { useMemo } from 'react';
import { useAppStore } from '../store';
import { formatDuration } from '../types';
import { TrendingUp, TrendingDown, Target, Calendar, Clock, Zap, Flame } from 'lucide-react';

interface WeekData {
  date: string;
  completedTasks: number;
  totalMinutes: number;
  xpEarned: number;
}

export default function WeeklySummary(): JSX.Element {
  const { tasks, userStats } = useAppStore();

  const weekData = useMemo<WeekData[]>(() => {
    const now = new Date();
    const days: WeekData[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTasks = tasks.filter(t => 
        t.status === 'completed' && t.completedAt?.startsWith(dateStr)
      );
      
      days.push({
        date: dateStr,
        completedTasks: dayTasks.length,
        totalMinutes: Math.round(dayTasks.reduce((sum, t) => sum + t.totalDurationSeconds, 0) / 60),
        xpEarned: dayTasks.reduce((sum, t) => {
          // XP calculation from store
          const secs = t.totalDurationSeconds;
          return sum + Math.max(10, Math.floor(secs / 60));
        }, 0),
      });
    }
    return days;
  }, [tasks]);

  const totals = useMemo(() => ({
    tasks: weekData.reduce((sum, d) => sum + d.completedTasks, 0),
    minutes: weekData.reduce((sum, d) => sum + d.totalMinutes, 0),
    xp: weekData.reduce((sum, d) => sum + d.xpEarned, 0),
  }), [weekData]);

  const avgPerDay = totals.tasks / 7;

  if (totals.tasks === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <p>Ingen data ännu denna vecka</p>
        <p className="text-xs mt-2">Börja med dina tasks!</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 sm:p-5 border border-zinc-800 bg-zinc-900/50">
      <h2 className="text-sm font-display font-bold text-zinc-200 mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        Denna vecka
      </h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-zinc-800/50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
            <Target className="w-3 h-3" />
            <span className="text-xs">Tasks</span>
          </div>
          <div className="text-xl font-bold text-zinc-100">{totals.tasks}</div>
          <div className="text-xs text-zinc-500">~{avgPerDay.toFixed(1)}/dag</div>
        </div>
        
        <div className="bg-zinc-800/50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
            <Clock className="w-3 h-3" />
            <span className="text-xs">Tid</span>
          </div>
          <div className="text-xl font-bold text-zinc-100">{Math.round(totals.minutes / 60)}h</div>
          <div className="text-xs text-zinc-500">{Math.round(totals.minutes / 7)}m/dag</div>
        </div>
      </div>

      {/* XP */}
      <div className="bg-yellow-500/10 rounded-xl p-3 mb-4 border border-yellow-500/30">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span className="text-sm text-yellow-400 font-bold">{totals.xpEarned} XP</span>
          <span className="text-xs text-yellow-500/70">denna vecka</span>
        </div>
      </div>

      {/* Streak */}
      {userStats.currentStreak > 0 && (
        <div className="flex items-center gap-2 text-orange-400">
          <Flame className="w-4 h-4" />
          <span className="text-sm font-medium">
            🔥 {userStats.currentStreak} dag streak!
          </span>
        </div>
      )}
    </div>
  );
}
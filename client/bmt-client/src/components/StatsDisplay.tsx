import { Flame, Zap, Trophy } from 'lucide-react';
import { getTaskStats } from '../types';
import { useAppStore } from '../store';
import { Switch } from '@base-ui/react/switch';

export const StatsDisplay = () => {
const { userStats, toggleBeastMode } = useAppStore();

return (
  <section 
    className="grid grid-cols-3 gap-2 sm:gap-3"
    aria-label="Your statistics"
  >
    {/* XP */}
    <div 
      className="bg-bg-card rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center border border-border min-h-[80px]"
      role="region"
      aria-label="Experience points"
    >
      <Zap 
        className="text-accent-yellow mb-1.5 w-5 h-5 flex-shrink-0" 
        aria-hidden="true" 
      />
      <span 
        className="text-2xl sm:text-3xl font-bold text-text-primary tabular-nums tracking-tight"
        aria-label={`${userStats.xp} experience points`}
      >
        {userStats.xp}
      </span>
      <span className="text-[10px] sm:text-xs text-text-muted uppercase tracking-wider mt-0.5 font-medium">
        XP
      </span>
    </div>

    {/* Streak */}
    <div 
      className="bg-bg-card rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center border border-border min-h-[80px]"
      role="region"
      aria-label="Current streak"
    >
      <Flame 
        className="text-accent-yellow mb-1.5 w-5 h-5 flex-shrink-0" 
        aria-hidden="true" 
      />
      <span 
        className="text-2xl sm:text-3xl font-bold text-text-primary tabular-nums tracking-tight"
        aria-label={`${userStats.currentStreak} day streak`}
      >
        {userStats.currentStreak}
      </span>
      <span className="text-[10px] sm:text-xs text-text-muted uppercase tracking-wider mt-0.5 font-medium">
        Streak
      </span>
    </div>

    {/* Beast Mode */}
    <div 
      className="bg-bg-card rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center border border-border min-h-[80px]"
      role="region"
      aria-label="Beast mode toggle"
    >
      <Switch.Root
        checked={userStats.isBeastModeActive}
        onCheckedChange={toggleBeastMode}
        className={`
          w-12 sm:w-14 h-7 sm:h-8 rounded-full transition-all duration-200 relative
          data-[checked]:bg-accent-purple data-[unchecked]:bg-bg-hover
          focus:outline-none focus:ring-2 focus:ring-accent-purple focus:ring-offset-2 
          focus:ring-offset-bg-card cursor-pointer touch-manipulation min-h-[44px]
        `}
        aria-label="Toggle Beast Mode"
      >
        <Switch.Thumb 
          className="
            absolute top-0.5 left-0.5 sm:top-1 sm:left-1 
            w-6 h-6 rounded-full bg-white shadow-lg
            transition-transform duration-200 ease-spring
            data-[checked]:translate-x-5 sm:data-[checked]:translate-x-6
          " 
        />
      </Switch.Root>
      
      <div className="flex items-center gap-1 mt-1.5">
        <Trophy 
          className={`w-4 h-4 flex-shrink-0 ${userStats.isBeastModeActive ? 'text-accent-purple' : 'text-text-muted'}`}
          aria-hidden="true" 
        />
        <span 
          className={`text-xs sm:text-sm font-bold tabular-nums ${userStats.isBeastModeActive ? 'text-accent-purple' : 'text-text-primary'}`}
          aria-live="polite"
        >
          {userStats.isBeastModeActive ? 'ON' : 'OFF'}
        </span>
      </div>
      <span className="text-[10px] sm:text-xs text-text-muted uppercase tracking-wider mt-0.5 font-medium">
        Beast
      </span>
    </div>
  </section>
);
};

export const TaskStatsDisplay = () => {
const { tasks } = useAppStore();
const taskStats = getTaskStats(tasks);

if (taskStats.length === 0) {
  return null;
}

return (
  <section 
    className="bg-bg-card rounded-2xl p-4 sm:p-5 border border-border"
    aria-label="Task history statistics"
  >
    <h2 className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wider">
      Task History
    </h2>
    
    <ul 
      className="space-y-3"
      aria-label="Recent task statistics"
    >
      {taskStats.slice(0, 5).map((stat) => (
        <li key={stat.title}>
          <div className="flex items-center justify-between text-sm min-h-[44px]">
            <span 
              className="truncate text-text-primary font-medium pr-4"
              title={stat.title}
            >
              {stat.title}
            </span>
            <div className="flex items-center gap-2 sm:gap-3 text-text-muted flex-shrink-0">
              <span 
                className="bg-bg-hover px-2 py-1 rounded text-xs font-medium min-w-[24px] text-center"
                aria-label={`Completed ${stat.completionCount} times`}
              >
                {stat.completionCount}×
              </span>
              <span className="text-xs tabular-nums">
                {Math.round(stat.avgTimeSeconds / 60)}m <span className="sr-only">average</span>
                <span aria-hidden="true">avg</span>
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
    
    {taskStats.length > 5 && (
      <button
        className="w-full mt-4 py-3 text-xs text-text-muted hover:text-text-secondary hover:bg-bg-hover rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-accent-green min-h-[44px] font-medium"
        aria-label={`View all ${taskStats.length} task statistics`}
      >
        View all {taskStats.length} tasks
      </button>
    )}
  </section>
);
};
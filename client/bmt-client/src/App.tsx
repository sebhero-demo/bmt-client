import { useEffect, useRef } from 'react';
import { useAppStore, startTimerInterval, stopTimerInterval } from './store';
import { TaskItem } from './components/TaskItem';
import { AddTask } from './components/AddTask';
import { StatsDisplay, TaskStatsDisplay } from './components/StatsDisplay';
import { formatTime } from './types';
import { Trophy, Pause, Play } from 'lucide-react';
import "./index.css"

function App() {
 const { 
   tasks, 
   activeTaskId, 
   timerSeconds, 
   isTimerRunning,
   userStats,
 } = useAppStore();
 const mainRef = useRef<HTMLElement>(null);

 useEffect(() => {
   startTimerInterval();
   return () => stopTimerInterval();
 }, []);

 const activeTask = tasks.find(t => t.id === activeTaskId);
 const activeTasks = tasks.filter(t => t.status !== 'completed');
 const completedTasks = tasks.filter(t => t.status === 'completed');

 return (
   <div className="min-h-screen flex flex-col safe-area-inset" style={{ backgroundColor: 'var(--bg-dark)' }}>
     {/* Grain texture overlay */}
     <div className="grain-overlay" aria-hidden="true" />

     {/* Skip Link for Keyboard Navigation */}
     <a 
       href="#main-content" 
       className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-green-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-medium"
     >
       Skip to main content
     </a>

     {/* Header - Sticky with proper semantics */}
     <header 
       className="sticky top-0 z-20 px-4 py-4 shadow-sm"
       style={{ 
         backgroundColor: 'rgba(10, 10, 10, 0.95)', 
         backdropFilter: 'blur(12px)',
         borderBottom: '1px solid var(--border)'
       }}
       role="banner"
     >
       <div className="max-w-lg mx-auto w-full">
         <div className="flex items-center justify-between min-h-[44px]">
           <div className="flex-1">
             <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
               Beast Mode
             </h1>
             <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Focus. Track. Conquer.</p>
           </div>
           
           {/* Beast Mode indicator with proper contrast */}
           {userStats.isBeastModeActive && (
             <div 
               className="flex items-center gap-1.5 rounded-full px-3 py-1.5 min-h-[32px] animate-pulse-glow"
               style={{ 
                 backgroundColor: 'rgba(168, 85, 247, 0.15)', 
                 border: '1px solid rgba(168, 85, 247, 0.4)'
               }}
               role="status"
               aria-label="Beast mode is active"
             >
               <Trophy className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} aria-hidden="true" />
               <span className="text-xs font-bold tracking-wide uppercase" style={{ color: 'var(--accent-purple)' }}>
                 Beast
               </span>
             </div>
           )}
         </div>
       </div>
     </header>

     {/* Main Content */}
     <main 
       id="main-content"
       ref={mainRef}
       className="flex-1 px-4 py-4 sm:py-6 outline-none"
       tabIndex={-1}
       role="main"
     >
       <div className="max-w-lg mx-auto space-y-5 w-full">
         
         {/* Timer Display - High contrast, large touch targets */}
         {activeTask && (
           <section 
             className="rounded-2xl p-6 sm:p-8 text-center animate-fade-in delay-100"
             style={{ 
               backgroundColor: 'var(--bg-card)', 
               border: '1px solid var(--border)',
               boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)'
             }}
             aria-label={`Active timer for ${activeTask.title}`}
           >
             <div className="text-sm sm:text-base mb-4 truncate font-medium px-2" style={{ color: 'var(--text-secondary)' }}>
               {activeTask.title}
             </div>
             
             <div 
               className="text-5xl sm:text-6xl font-bold tabular-nums tracking-tight leading-none"
               style={{ color: isTimerRunning ? 'var(--accent-green)' : 'var(--accent-yellow)' }}
               role="timer"
               aria-live={isTimerRunning ? 'polite' : 'off'}
               aria-atomic="true"
             >
               <span className="sr-only">Elapsed time: </span>
               {formatTime(timerSeconds)}
             </div>
             
             <div className="flex items-center justify-center gap-2 mt-4">
               <span 
                 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider"
                 style={{ 
                   backgroundColor: isTimerRunning ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                   color: isTimerRunning ? 'var(--accent-green)' : 'var(--accent-yellow)'
                 }}
                 role="status"
               >
                 {isTimerRunning ? (
                   <>
                     <Play className="w-3 h-3 fill-current" aria-hidden="true" />
                     Running
                   </>
                 ) : (
                   <>
                     <Pause className="w-3 h-3 fill-current" aria-hidden="true" />
                     Paused
                   </>
                 )}
               </span>
             </div>
           </section>
         )}

         {/* Stats - Proper heading hierarchy */}
         <section aria-label="Your statistics" className="animate-fade-in delay-200">
           <StatsDisplay />
         </section>

         {/* Add Task - Clear section labeling */}
         <section aria-labelledby="add-task-heading" className="animate-fade-in delay-300">
           <h2 id="add-task-heading" className="sr-only">Add new task</h2>
           <AddTask />
         </section>

         {/* Task Lists - Proper list semantics */}
         <div className="space-y-6">
           
           {/* Active Tasks */}
           {activeTasks.length > 0 && (
             <section aria-labelledby="active-tasks-heading" className="animate-fade-in delay-400">
               <h2 
                 id="active-tasks-heading" 
                 className="text-xs font-semibold mb-3 px-1 uppercase tracking-wider"
                 style={{ color: 'var(--text-secondary)' }}
               >
                 Active
                 <span className="ml-1.5 font-normal" style={{ color: 'var(--text-muted)' }}>
                   ({activeTasks.length})
                 </span>
               </h2>
               <ul 
                 className="space-y-3"
                 role="list"
                 aria-label={`${activeTasks.length} active tasks`}
               >
                 {activeTasks.map(task => (
                   <li key={task.id}>
                     <TaskItem task={task} />
                   </li>
                 ))}
               </ul>
             </section>
           )}

           {/* Completed Tasks */}
           {completedTasks.length > 0 && (
             <section aria-labelledby="completed-tasks-heading" className="animate-fade-in delay-500">
               <h2 
                 id="completed-tasks-heading" 
                 className="text-xs font-semibold mb-3 px-1 uppercase tracking-wider"
                 style={{ color: 'var(--text-secondary)' }}
               >
                 Completed
                 <span className="ml-1.5 font-normal" style={{ color: 'var(--text-muted)' }}>
                   ({completedTasks.length})
                 </span>
               </h2>
               <ul 
                 className="space-y-3"
                 role="list"
                 aria-label={`${completedTasks.length} completed tasks`}
               >
                 {completedTasks.slice(0, 5).map(task => (
                   <li key={task.id}>
                     <TaskItem task={task} />
                   </li>
                 ))}
               </ul>
               
               {completedTasks.length > 5 && (
                 <button 
                   className="w-full text-center text-sm mt-4 py-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black min-h-[44px]"
                   style={{ color: 'var(--text-muted)' }}
                   aria-label={`Show ${completedTasks.length - 5} more completed tasks`}
                 >
                   +{completedTasks.length - 5} more
                 </button>
               )}
             </section>
           )}

           {/* Empty State - Proper role and contrast */}
           {tasks.length === 0 && (
             <div 
               className="text-center py-12 sm:py-16 px-4 animate-fade-in delay-200"
               role="status"
               aria-live="polite"
             >
               <div 
                 className="text-5xl sm:text-6xl mb-4"
                 aria-hidden="true"
                 role="img"
                 aria-label="Target emoji"
               >
                 🎯
               </div>
               <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>No tasks yet</p>
               <p className="text-sm mt-2 px-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                 Add a task above to start tracking your focus time
               </p>
             </div>
           )}
         </div>

         {/* Task History Stats */}
         <TaskStatsDisplay />
       </div>
     </main>

     {/* Footer for additional info if needed */}
     <footer className="px-4 py-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
       <div className="max-w-lg mx-auto">
         <p>Keyboard shortcuts: Enter to add, Space to toggle timer</p>
       </div>
     </footer>
   </div>
 );
}

export default App;
import { type JSX, useRef, useEffect } from "react";
import { AddTask } from "./components/AddTask";
import EmptyState from "./components/EmptyState";
import Footer from "./components/Footer";
import Header from "./components/Header";
import MotivationBanner from "./components/MotivationBanner";
import { StatsDisplay, TaskStatsDisplay } from "./components/StatsDisplay";
import TaskLists from "./components/TaskLists";
import TimerPanel from "./components/TimerPanel";
import { useAppStore, startTimerInterval, stopTimerInterval } from "./store";


export default function App(): JSX.Element {
  const mainRef = useRef<HTMLElement | null>(null);

  // Select only the pieces we need to avoid unnecessary re-renders
  //  const { tasks, activeTaskId, timerSeconds, isTimerRunning, timerStartTime, motivationMessage, clearMotivationMessage } =
  //   useAppStore(
  //     (s) => ({
  //       tasks: s.tasks,
  //       activeTaskId: s.activeTaskId,
  //       timerSeconds: s.timerSeconds,
  //       isTimerRunning: s.isTimerRunning,
  //       timerStartTime: s.timerStartTime,
  //       motivationMessage: s.motivationMessage,
  //       clearMotivationMessage: s.clearMotivationMessage,
  //     }), shallow
  //   );

  const tasks = useAppStore(s => s.tasks);
  const activeTaskId = useAppStore(s => s.activeTaskId);
  const timerSeconds = useAppStore(s => s.timerSeconds);
  const isTimerRunning = useAppStore(s => s.isTimerRunning);
  const timerStartTime = useAppStore(s => s.timerStartTime);
  const motivationMessage = useAppStore(s => s.motivationMessage);
  const clearMotivationMessage = useAppStore(s => s.clearMotivationMessage);

  // Recalculate timerSeconds on mount if timer was running when state was persisted
  useEffect(() => {
    if (isTimerRunning && timerStartTime) {
      const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
      // add elapsed and reset timerStartTime to now
      useAppStore.setState((state) => ({
        timerSeconds: state.timerSeconds + elapsed,
        timerStartTime: Date.now(),
      }));
    }
    // start the global interval once
    startTimerInterval();
    return () => stopTimerInterval();
    // Intentionally run only on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeTask = tasks.find((t) => t.id === activeTaskId);
  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <div className="min-h-screen flex flex-col safe-area-inset bg-black">
      <div className="grain-overlay" aria-hidden="true" />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-green-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-medium"
      >
        Skip to main content
      </a>

      <Header />

      {motivationMessage && (
        <MotivationBanner message={motivationMessage} onClose={clearMotivationMessage} />
      )}

      <main id="main-content" ref={mainRef} className="flex-1 px-4 py-4 sm:py-6 outline-none" tabIndex={-1} role="main">
        <div className="max-w-lg mx-auto space-y-5 w-full">
          {activeTask ? (
            <TimerPanel activeTaskTitle={activeTask.title} timerSeconds={timerSeconds} isTimerRunning={isTimerRunning} />
          ) : null}

          <section aria-label="Your statistics" className="animate-fade-in delay-200">
            <StatsDisplay />
          </section>

          <section aria-labelledby="add-task-heading" className="animate-fade-in delay-300">
            <h2 id="add-task-heading" className="sr-only">
              Add new task
            </h2>
            <AddTask />
          </section>

          <TaskLists activeTasks={activeTasks} completedTasks={completedTasks} tasksTotal={tasks.length} />

          <TaskStatsDisplay />

          {tasks.length === 0 && <EmptyState />}
        </div>
      </main>

      <Footer />
    </div>
  );
}
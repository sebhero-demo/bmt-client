import type { JSX } from "react";
import type { Task } from "../types";
import { TaskItem } from "./TaskItem";

type Props = {
  activeTasks: Task[];
  completedTasks: Task[];
  tasksTotal: number;
};

export default function TaskLists({ activeTasks, completedTasks, tasksTotal }: Props): JSX.Element {
  const activeCount = activeTasks.length;
  const completedCount = completedTasks.length;

  return (
    <div className="space-y-6">
      {activeCount > 0 && (
        <section aria-labelledby="active-tasks-heading" className="animate-fade-in delay-400">
          <h2 id="active-tasks-heading" className="text-xs font-semibold mb-3 px-1 uppercase tracking-wider text-zinc-400">
            Active
            <span className="ml-1.5 font-normal text-zinc-500">({activeCount})</span>
          </h2>

          <ul className="space-y-3" role="list" aria-label={`${activeCount} active tasks`}>
            {activeTasks.map((task) => (
              <li key={task.id}>
                <TaskItem task={task} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {completedCount > 0 && (
        <section aria-labelledby="completed-tasks-heading" className="animate-fade-in delay-500">
          <h2 id="completed-tasks-heading" className="text-xs font-semibold mb-3 px-1 uppercase tracking-wider text-zinc-400">
            Completed
            <span className="ml-1.5 font-normal text-zinc-500">({completedCount})</span>
          </h2>

          <ul className="space-y-3" role="list" aria-label={`${completedCount} completed tasks`}>
            {completedTasks.slice(0, 5).map((task) => (
              <li key={task.id}>
                <TaskItem task={task} />
              </li>
            ))}
          </ul>

          {completedCount > 5 && (
            <button
              className="w-full text-center text-sm mt-4 py-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black min-h-11 text-zinc-500"
              aria-label={`Show ${completedCount - 5} more completed tasks`}
            >
              +{completedCount - 5} more
            </button>
          )}
        </section>
      )}
    </div>
  );
}
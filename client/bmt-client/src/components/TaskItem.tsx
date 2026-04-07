import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Trash2, Check, Clock, Edit3, X, AlertTriangle, Timer, RotateCcw, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import type { Task } from '../types';
import { formatDuration, getTaskStats } from '../types';
import { useAppStore } from '../store';

// Props: prefer taskId, but accept full task for backwards-compatibility
interface TaskItemProps {
  taskId?: string;
  task?: Task;
}

const roundBtnBase = `
  rounded-full flex items-center justify-center
  min-w-[48px] min-h-[48px] sm:min-w-11 sm:min-h-11
  p-3 sm:p-2.5 transition-all duration-200
  active:scale-95 cursor-pointer
  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900
`;

export const TaskItem: React.FC<TaskItemProps> = ({ taskId: propId, task: propTask }) => {
  // prefer the explicit id prop; fall back to a passed task object
  const id = propId ?? propTask?.id;
  // Select the up-to-date task from the store (prevents stale find() issues)
  const task = useAppStore((s) => (id ? s.tasks.find((t) => t.id === id) ?? null : null));

  // Select store actions and timer parts individually to avoid re-renders and TS issues
  const startTask = useAppStore((s) => s.startTask);
  const pauseTask = useAppStore((s) => s.pauseTask);
  const resumeTask = useAppStore((s) => s.resumeTask);
  const completeTask = useAppStore((s) => s.completeTask);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const updateTaskTitle = useAppStore((s) => s.updateTaskTitle);
  const updateTaskTime = useAppStore((s) => s.updateTaskTime);
  const redoTask = useAppStore((s) => s.redoTask);

  const activeTaskId = useAppStore((s) => s.activeTaskId);
  const timerSeconds = useAppStore((s) => s.timerSeconds);
  const timerStartTime = useAppStore((s) => s.timerStartTime);
  const isTimerRunning = useAppStore((s) => s.isTimerRunning);

  // Local UI state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState<string>(propTask?.title ?? '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTimeEdit, setShowTimeEdit] = useState(false);
  const [editMinutes, setEditMinutes] = useState<string | undefined>(undefined);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const confirmDeleteButtonRef = useRef<HTMLButtonElement | null>(null);
  const deleteButtonRef = useRef<HTMLButtonElement | null>(null);

  // keep editTitle in sync if the task coming from the store changes
  useEffect(() => {
    if (task) setEditTitle(task.title);
  }, [task?.title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (showDeleteConfirm && confirmDeleteButtonRef.current) confirmDeleteButtonRef.current.focus();
  }, [showDeleteConfirm]);

  // If no id or no task found, render nothing (or could show a placeholder)
  if (!id || !task) return null;

  const isActive = activeTaskId === task.id;
  const isCompleted = task.status === 'completed';

  // Compute current visible duration:
  // - base is totalDurationSeconds (sum of closed sessions / manual logs)
  // - if this task is the active one and timer is running, include timerSeconds plus running delta
  let displaySeconds = task.totalDurationSeconds || 0;
  if (isActive && isTimerRunning) {
    const runningDelta = timerStartTime ? Math.floor((Date.now() - timerStartTime) / 1000) : 0;
    displaySeconds += (timerSeconds || 0) + runningDelta;
  } else if (isActive && !isTimerRunning) {
    // if active but not running (paused), timerSeconds already contains accumulated session seconds
    displaySeconds += (timerSeconds || 0);
  }

  const formattedDuration = formatDuration(displaySeconds);

  // Handlers (guard actions with availability)
  const handleStart = () => startTask && startTask(task.id);
  const handlePause = () => pauseTask && pauseTask(task.id);
  const handleResume = () => resumeTask && resumeTask(task.id);
  const handleComplete = () => completeTask && completeTask(task.id);
  const handleDelete = () => setShowDeleteConfirm(true);
  const confirmDelete = () => {
    deleteTask && deleteTask(task.id);
    setShowDeleteConfirm(false);
  };
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    deleteButtonRef.current?.focus();
  };

  const handleSaveTitle = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== task.title) {
      updateTaskTitle && updateTaskTitle(task.id, trimmed);
    }
    setIsEditing(false);
  };

  const openTimeEdit = () => {
    setEditMinutes(Math.floor((task.totalDurationSeconds || 0) / 60).toString());
    setShowTimeEdit(true);
  };
  const saveTimeEdit = () => {
    const mins = parseInt(editMinutes ?? '0') || 0;
    updateTaskTime && updateTaskTime(task.id, mins * 60);
    setShowTimeEdit(false);
  };

  // Basic stats display helper (uses existing getTaskStats if desired)
  const taskStats = getTaskStats ? getTaskStats(useAppStore.getState().tasks).find((s) => s.title === task.title) : null;

  return (
    <>
      <article
        className={`
          flex flex-col gap-3 p-4 sm:p-5 rounded-2xl transition-all duration-200
          ${isActive ? 'bg-green-500/10 border-2 border-green-500/30' : 'bg-zinc-900 border border-zinc-700 hover:border-zinc-500'}
          ${isCompleted ? 'opacity-75' : ''}
        `}
        aria-label={`${isCompleted ? 'Completed' : task.status}: ${task.title}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`
              shrink-0 w-3 h-3 rounded-full ring-2 ring-zinc-900
              ${isCompleted ? 'bg-green-500' : isActive ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}
            `}
            aria-hidden="true"
          />

          <div className="flex items-center gap-1.5 shrink-0" role="group" aria-label={`Actions for ${task.title}`}>
            {!isCompleted && !isEditing && (
              <>
                {task.status === 'idle' && (
                  <button type="button" onClick={handleStart} aria-label={`Start ${task.title}`} title={`Start ${task.title}`} className={`${roundBtnBase} bg-green-500 hover:bg-green-600 text-white focus:ring-green-500`}>
                    <Play className="w-5 h-5 fill-current" aria-hidden="true" />
                  </button>
                )}

                {task.status === 'in_progress' && (
                  <button type="button" onClick={handlePause} aria-label={`Pause ${task.title}`} title={`Pause ${task.title}`} className={`${roundBtnBase} bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500`}>
                    <Pause className="w-5 h-5 fill-current" aria-hidden="true" />
                  </button>
                )}

                {task.status === 'paused' && (
                  <>
                    <button type="button" onClick={handleResume} aria-label={`Resume ${task.title}`} title={`Resume ${task.title}`} className={`${roundBtnBase} bg-green-500 hover:bg-green-600 text-white focus:ring-green-500`}>
                      <Play className="w-5 h-5 fill-current" aria-hidden="true" />
                    </button>

                    <button type="button" onClick={handleComplete} aria-label={`Complete ${task.title}`} title={`Complete ${task.title}`} className={`${roundBtnBase} bg-green-500/80 hover:bg-green-500 text-white focus:ring-green-500`}>
                      <Check className="w-5 h-5" aria-hidden="true" />
                    </button>
                  </>
                )}
              </>
            )}

            {isCompleted && (
              <>
                <span className="flex items-center gap-1.5 text-green-500 text-sm font-semibold px-2 py-1 bg-green-500/10 rounded-lg">
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Done</span>
                </span>

                <button type="button" onClick={() => redoTask && redoTask(task.id)} aria-label={`Redo ${task.title}`} title={`Redo ${task.title}`} className={`${roundBtnBase} bg-zinc-700 hover:bg-zinc-600 text-zinc-300 focus:ring-zinc-500`}>
                  <RotateCcw className="w-5 h-5" aria-hidden="true" />
                </button>
              </>
            )}

            {!isEditing && (
              <button ref={deleteButtonRef} type="button" onClick={handleDelete} aria-label={`Delete ${task.title}`} className={`${roundBtnBase} text-zinc-500 hover:text-red-500 hover:bg-red-500/10 focus:ring-red-500`}>
                <Trash2 className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <form onSubmit={(e) => { e.preventDefault(); handleSaveTitle(); }} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') { setEditTitle(task.title); setIsEditing(false); } }}
                className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-3 py-2.5 text-zinc-100 text-base min-h-11 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-zinc-500"
                aria-label="Edit task title"
              />

              <button type="submit" aria-label="Save changes" className="p-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white">
                <Check className="w-5 h-5" aria-hidden="true" />
              </button>

              <button type="button" onClick={() => { setEditTitle(task.title); setIsEditing(false); }} aria-label="Cancel editing" className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </form>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0 py-1">
                <h3 className={`font-medium text-base leading-snug pr-2 ${isCompleted ? 'line-through text-zinc-500' : 'text-zinc-100'}`} title={task.title}>
                  {task.title}
                </h3>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500 mt-1.5">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <time dateTime={`PT${Math.floor(displaySeconds / 60)}M`} className="tabular-nums">
                      {formattedDuration}
                    </time>
                  </div>

                  {task.timeLogs?.length > 0 && <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full">{task.timeLogs.length} sessions</span>}

                  <span className="text-[10px] text-red-400 font-mono">({task.totalDurationSeconds ?? 0}s)</span>

                  {/* Stats block */}
                  {taskStats && (
                    <div className="flex items-center gap-2 text-xs mt-2">
                      {taskStats.completionCount > 1 && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg font-semibold bg-zinc-800 text-zinc-400">
                          <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Bästa</span>
                          <span className="font-mono">{formatDuration(taskStats.minTimeSeconds)}</span>
                        </span>
                      )}

                      <span
                        className="flex items-center gap-1 px-2 py-1 rounded-lg font-semibold bg-zinc-800 text-zinc-300"
                        aria-label={`Avg ${taskStats.avgTimeSeconds} seconds`}
                      >
                        <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{formatDuration(taskStats.avgTimeSeconds)}</span>
                      </span>

                      {taskStats.completionCount > 1 && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg font-semibold bg-zinc-800 text-zinc-400">
                          <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Max</span>
                          <span className="font-mono">{formatDuration(taskStats.maxTimeSeconds)}</span>
                        </span>
                      )}
                      <div className="flex items-center gap-2 text-xs mt-2">
                        {/* Min */}
                        {typeof taskStats.minTimeSeconds === 'number' && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400">
                            <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
                            <span className="font-mono">{formatDuration(taskStats.minTimeSeconds)}</span>
                          </span>
                        )}


                        {/* Avg */}
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 text-zinc-300" aria-label={`Avg ${taskStats.avgTimeSeconds} seconds`}>
                          <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{formatDuration(taskStats.avgTimeSeconds)}</span>
                        </span>


                        {/* Max */}
                        {typeof taskStats.maxTimeSeconds === 'number' && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400">
                            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                            <span className="font-mono">{formatDuration(taskStats.maxTimeSeconds)}</span>
                          </span>
                        )}

                      </div>
                    </div>

                  )}
                </div>
              </div>

              {!isCompleted && (
                <div className="flex gap-1">
                  <button type="button" onClick={() => setIsEditing(true)} aria-label={`Edit ${task.title}`} className="shrink-0 p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100">
                    <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={openTimeEdit} aria-label={`Edit time for ${task.title}`} className="shrink-0 p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100">
                    <Timer className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </article>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) cancelDelete(); }}>
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full border border-zinc-700 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 shrink-0 text-red-500" aria-hidden="true" />
              <h2 className="text-lg font-bold text-zinc-100">Delete Task?</h2>
            </div>

            <p className="text-zinc-400 mb-6 leading-relaxed">Are you sure you want to delete <strong className="text-zinc-100">"{task.title}"</strong>? This action cannot be undone.</p>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={cancelDelete} className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100">Cancel</button>
              <button type="button" onClick={confirmDelete} ref={confirmDeleteButtonRef} className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Time edit dialog */}
      {showTimeEdit && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowTimeEdit(false); }}>
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full border border-zinc-700 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Timer className="w-6 h-6 text-yellow-500" aria-hidden="true" />
              <h2 className="text-lg font-bold text-zinc-100">Adjust Time</h2>
            </div>

            <p className="text-zinc-400 mb-4">Enter the total time spent (in minutes) for "{task.title}"</p>

            <input id="edit-minutes" type="number" min="0" value={editMinutes ?? ''} onChange={(e) => setEditMinutes(e.target.value)} placeholder="Minutes" className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3 text-zinc-100 text-lg" />

            <div className="flex gap-3 justify-end mt-4">
              <button type="button" onClick={() => setShowTimeEdit(false)} className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100">Cancel</button>
              <button type="button" onClick={saveTimeEdit} className="px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white">Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskItem;
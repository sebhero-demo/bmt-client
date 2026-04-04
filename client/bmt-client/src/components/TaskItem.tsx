import React, { useState, useId, useRef, useEffect } from 'react';
import { Play, Pause, Trash2, Check, Clock, Edit3, X, AlertTriangle } from 'lucide-react';
import type { Task } from '../types';
import { formatDuration } from '../types';
import { useAppStore } from '../store';
import { Button } from '@base-ui/react/button';
import { Field } from '@base-ui/react/field';

interface TaskItemProps {
  task: Task;
}

const roundBtnBase = `
  rounded-full flex items-center justify-center
  min-w-[48px] min-h-[48px] sm:min-w-[44px] sm:min-h-[44px]
  p-3 sm:p-2.5 transition-all duration-200
  active:scale-95 cursor-pointer
  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900
`;

export const TaskItem = ({ task }: TaskItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputId = useId();
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const confirmDeleteButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    activeTaskId,
    timerSeconds,
    isTimerRunning,
    startTask,
    pauseTask,
    resumeTask,
    completeTask,
    deleteTask,
    updateTaskTitle,
  } = useAppStore();

  const isActive = activeTaskId === task.id;
  const isCompleted = task.status === 'completed';

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (showDeleteConfirm && confirmDeleteButtonRef.current) {
      confirmDeleteButtonRef.current.focus();
    }
  }, [showDeleteConfirm]);

  const handleStart = () => startTask(task.id);
  const handlePause = () => pauseTask(task.id);
  const handleResume = () => resumeTask(task.id);
  const handleComplete = () => completeTask(task.id);
  const handleDelete = () => setShowDeleteConfirm(true);

  const confirmDelete = () => {
    deleteTask(task.id);
    setShowDeleteConfirm(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    deleteButtonRef.current?.focus();
  };

  const handleSaveTitle = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== task.title) {
      updateTaskTitle(task.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setIsEditing(false);
  };

  const currentDuration = isActive && isTimerRunning
    ? task.totalDurationSeconds + timerSeconds
    : task.totalDurationSeconds;

  const formattedDuration = formatDuration(currentDuration);

  const getStatusLabel = () => {
    if (isCompleted) return 'Completed';
    if (task.status === 'in_progress') return 'In progress';
    if (task.status === 'paused') return 'Paused';
    return 'Not started';
  };

  return (
    <>
      <article
        className={`
          flex items-center gap-3 p-3 sm:p-4 rounded-2xl transition-all duration-200
          ${isActive
            ? 'bg-green-500/10 border-2 border-green-500/30'
            : 'bg-zinc-900 border border-zinc-700 hover:border-zinc-500'
          }
          ${isCompleted ? 'opacity-75' : ''}
        `}
        aria-label={`${getStatusLabel()}: ${task.title}`}
      >
        {/* Status dot */}
        <div
          className={`
            flex-shrink-0 w-3 h-3 rounded-full ring-2 ring-zinc-900
            ${isCompleted
              ? 'bg-green-500'
              : isActive
                ? 'bg-green-500 animate-pulse'
                : 'bg-zinc-500'
            }
          `}
          aria-hidden="true"
        />

        {/* Task content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <form
              onSubmit={(e) => { e.preventDefault(); handleSaveTitle(); }}
              className="flex items-center gap-2"
            >
              <Field.Root className="flex-1">
                <Field.Label htmlFor={inputId} className="sr-only">
                  Edit task title
                </Field.Label>
                <input
                  ref={inputRef}
                  id={inputId}
                  type="text"
                  value={editTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditTitle(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  className="
                    w-full bg-zinc-700 border border-zinc-600 rounded-xl
                    px-3 py-2.5 text-zinc-100 text-base min-h-[44px]
                    focus:outline-none focus:ring-2 focus:ring-green-500
                    placeholder:text-zinc-500
                  "
                />
              </Field.Root>

              <Button
                type="submit"
                aria-label="Save changes"
                className="
                  p-2.5 rounded-xl min-w-[44px] min-h-[44px]
                  flex items-center justify-center cursor-pointer
                  bg-green-500 hover:bg-green-600 text-white
                  transition-colors focus:outline-none focus:ring-2
                  focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-zinc-900
                "
              >
                <Check className="w-5 h-5" aria-hidden="true" />
              </Button>

              <Button
                type="button"
                onClick={handleCancelEdit}
                aria-label="Cancel editing"
                className="
                  p-2.5 rounded-xl min-w-[44px] min-h-[44px]
                  flex items-center justify-center cursor-pointer
                  bg-zinc-800 hover:bg-zinc-700 text-zinc-100
                  transition-colors focus:outline-none focus:ring-2
                  focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-900
                "
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </Button>
            </form>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0 py-1">
                <h3
                  className={`
                    font-medium text-base leading-snug pr-2
                    ${isCompleted ? 'line-through text-zinc-500' : 'text-zinc-100'}
                  `}
                  title={task.title}
                >
                  {task.title}
                </h3>

                <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1.5">
                  <Clock className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <time
                    dateTime={`PT${Math.floor(currentDuration / 60)}M`}
                    className="tabular-nums"
                  >
                    {formattedDuration}
                  </time>
                  {task.timeLogs.length > 0 && (
                    <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full">
                      {task.timeLogs.length} sessions
                    </span>
                  )}
                </div>
              </div>

              {!isCompleted && (
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  aria-label={`Edit ${task.title}`}
                  className="
                    flex-shrink-0 p-2.5 rounded-xl
                    min-w-[44px] min-h-[44px] flex items-center justify-center
                    text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800
                    transition-colors cursor-pointer
                    focus:outline-none focus:ring-2 focus:ring-green-500
                    focus:ring-offset-2 focus:ring-offset-zinc-900
                  "
                >
                  <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div
          className="flex items-center gap-1.5 flex-shrink-0"
          role="group"
          aria-label={`Actions for ${task.title}`}
        >
          {!isCompleted && !isEditing && (
            <>
              {task.status === 'idle' && (
                <Button
                  type="button"
                  onClick={handleStart}
                  aria-label={`Start ${task.title}`}
                  className={`${roundBtnBase} bg-green-500 hover:bg-green-600 text-white focus:ring-green-500`}
                >
                  <Play className="w-5 h-5 fill-current" aria-hidden="true" />
                </Button>
              )}

              {task.status === 'in_progress' && (
                <Button
                  type="button"
                  onClick={handlePause}
                  aria-label={`Pause ${task.title}`}
                  className={`${roundBtnBase} bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500`}
                >
                  <Pause className="w-5 h-5 fill-current" aria-hidden="true" />
                </Button>
              )}

              {task.status === 'paused' && (
                <>
                  <Button
                    type="button"
                    onClick={handleResume}
                    aria-label={`Resume ${task.title}`}
                    className={`${roundBtnBase} bg-green-500 hover:bg-green-600 text-white focus:ring-green-500`}
                  >
                    <Play className="w-5 h-5 fill-current" aria-hidden="true" />
                  </Button>

                  <Button
                    type="button"
                    onClick={handleComplete}
                    aria-label={`Complete ${task.title}`}
                    className={`${roundBtnBase} bg-green-500/80 hover:bg-green-500 text-white focus:ring-green-500`}
                  >
                    <Check className="w-5 h-5" aria-hidden="true" />
                  </Button>
                </>
              )}
            </>
          )}

          {isCompleted && (
            <span className="flex items-center gap-1.5 text-green-500 text-sm font-semibold px-2 py-1 bg-green-500/10 rounded-lg">
              <Check className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Done</span>
            </span>
          )}

          {!isEditing && (
            <Button
              type="button"
              onClick={handleDelete}
              aria-label={`Delete ${task.title}`}
              ref={deleteButtonRef}
              className={`${roundBtnBase} text-zinc-500 hover:text-red-500 hover:bg-red-500/10 focus:ring-red-500`}
            >
              <Trash2 className="w-5 h-5" aria-hidden="true" />
            </Button>
          )}
        </div>
      </article>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          aria-describedby="delete-desc"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) cancelDelete(); }}
        >
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full border border-zinc-700 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 flex-shrink-0 text-red-500" aria-hidden="true" />
              <h2 id="delete-title" className="text-lg font-bold text-zinc-100">
                Delete Task?
              </h2>
            </div>

            <p id="delete-desc" className="text-zinc-400 mb-6 leading-relaxed">
              Are you sure you want to delete{' '}
              <strong className="text-zinc-100">"{task.title}"</strong>?{' '}
              This action cannot be undone.
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                onClick={cancelDelete}
                className="
                  px-5 py-2.5 rounded-xl min-h-[44px] font-medium cursor-pointer
                  bg-zinc-800 hover:bg-zinc-700 text-zinc-100
                  transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500
                "
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={confirmDelete}
                ref={confirmDeleteButtonRef}
                className="
                  px-5 py-2.5 rounded-xl min-h-[44px] font-medium cursor-pointer
                  bg-red-500 hover:bg-red-600 text-white
                  transition-colors focus:outline-none focus:ring-2 focus:ring-red-500
                "
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

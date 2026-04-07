import { type JSX } from 'react';

export default function EmptyState(): JSX.Element {
  return (
    <div className="text-center py-12 sm:py-16 px-4 animate-fade-in delay-200" role="status" aria-live="polite">
      <div className="text-5xl sm:text-6xl mb-4" aria-hidden="true" role="img" aria-label="Target emoji">
        🎯
      </div>
      <p className="text-lg font-medium text-zinc-400">No tasks yet</p>
      <p className="text-sm mt-2 px-4 leading-relaxed text-zinc-500">Add a task above to start tracking your focus time</p>
    </div>
  );
}
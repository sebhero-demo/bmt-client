import { type JSX } from 'react';
import { Trophy } from 'lucide-react';
import { useAppStore } from '../store';

export default function Header(): JSX.Element {
  const isBeastModeActive = useAppStore((s) => s.userStats.isBeastModeActive);

  return (
    <header className="sticky top-0 z-20 px-4 py-4 shadow-sm bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800" role="banner">
      <div className="max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between min-h-11">
          <div className="flex-1">
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight leading-tight text-white">Beast Mode</h1>
            <p className="text-xs mt-0.5 text-zinc-400">Focus. Track. Conquer.</p>
          </div>

          {isBeastModeActive && (
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 min-h-8 animate-pulse-glow bg-purple-500/15 border border-purple-500/40"
              role="status"
              aria-label="Beast mode is active"
            >
              <Trophy className="w-4 h-4 text-purple-500" aria-hidden="true" />
              <span className="text-xs font-bold tracking-wide uppercase text-purple-500">Beast</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
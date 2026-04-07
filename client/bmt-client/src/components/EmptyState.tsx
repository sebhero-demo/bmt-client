import { type JSX } from 'react';
import { ArrowDown, Zap } from 'lucide-react';

export default function EmptyState(): JSX.Element {
  return (
    <div 
      className="text-center py-16 sm:py-20 px-6 animate-fade-in delay-200" 
      role="status" 
      aria-live="polite"
    >
      {/* Visual element - stylized target */}
      <div className="relative inline-flex mb-6" aria-hidden="true">
        <div className="w-20 h-20 rounded-full border-4 border-zinc-700 flex items-center justify-center animate-pulse">
          <Zap className="w-8 h-8 text-yellow-500" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
          <ArrowDown className="w-4 h-4 text-zinc-500" />
        </div>
      </div>
      
      <h2 className="text-xl sm:text-2xl font-display font-bold text-zinc-200 mb-3">
        Ready to focus?
      </h2>
      
      <p className="text-base text-zinc-400 max-w-xs mx-auto leading-relaxed">
        Add a task above and start your timer. Build your streak. Become the beast.
      </p>
      
      {/*激励 badges */}
      <div className="flex items-center justify-center gap-3 mt-8">
        <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-zinc-800/50 text-zinc-500 border border-zinc-700/50">
          🔥 Streak
        </span>
        <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-zinc-800/50 text-zinc-500 border border-zinc-700/50">
          ⏱️ Track
        </span>
        <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-zinc-800/50 text-zinc-500 border border-zinc-700/50">
          🏆 XP
        </span>
      </div>
    </div>
  );
}
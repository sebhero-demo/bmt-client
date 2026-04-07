import  { useEffect } from 'react';
import { Sparkles, Target, Award } from 'lucide-react';

type Message = { emoji: string; text: string; type: string };

export default function MotivationBanner({ message, onClose }: { message: Message; onClose: () => void }): JSX.Element {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const iconMap = {
    new: Sparkles,
    challenge: Target,
    record: Award,
  } as const;

  const Icon = iconMap[message.type as keyof typeof iconMap] ?? Sparkles;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-30 animate-bounce-in" role="alert" aria-live="polite">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border bg-zinc-900 ${message.type === 'record' ? 'border-purple-500/50' : 'border-green-500/30'}`}>
        <span className="text-2xl" aria-hidden="true">
          {message.emoji}
        </span>
        <div className="max-w-70">
          <p className="text-sm font-medium text-white">{message.text}</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-bg-hover transition-colors" aria-label="Dismiss">
          <span className="sr-only">×</span>
          <span aria-hidden="true" className="text-lg">
            ×
          </span>
        </button>
      </div>
    </div>
  );
}
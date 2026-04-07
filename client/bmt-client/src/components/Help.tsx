import { type JSX } from 'react';
import { useState } from 'react';
import { HelpCircle, X, Plus, Play, Pause, Square, Clock, Trophy, Flame, Zap, BarChart3, Settings, ExternalLink } from 'lucide-react';

const guides = [
  {
    title: 'Kom igång',
    icon: Plus,
    content: `1. Lägg till en task i rutan ovan
2. Tryck på pilen för att starta timern
3. När du är klar, tryck på bocken
4. Tiden sparas automatiskt!`
  },
  {
    title: 'Timer kontroller',
    icon: Clock,
    content: `▶️ Spela - Starta timern
⏸️ Pausa - Pausa utan att avsluta
✅ Klart - Spara tiden och markera klar`
  },
  {
    title: 'Statistik',
    icon: BarChart3,
    content: `Efter varje klar task visas:
📊 Medel - din genomsnittstid
🏆 Bästa - din snabbaste tid
📈 Max - din långsammaste tid

Tidigare tasks jämförs automatiskt!`
  },
  {
    title: 'XP & Streaks',
    icon: Trophy,
    content: `⭐ Slutför en task = 10+ XP
⚡ Förd below genomsnitt = bonus XP
🔥 3 tasks under genomsnitt = BEAST MODE!`
  },
  {
    title: 'Beast Mode',
    icon: Flame,
    content: `Aktivera beast mode för:
• Extra XP multiplier
• Lila/grön theme
• Psykologiskt "high"</`
  },
  {
    title: 'Google integration',
    icon: ExternalLink,
    content: `För att aktivera:
1. Följ SETUP.md
2. Skapa Google OAuth i Cloud Console
3. Lägg till credentials i .env`
  },
];

export default function Help(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [activeGuide, setActiveGuide] = useState(0);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 shadow-lg transition-all hover:scale-105"
        aria-label="Hjälp"
      >
        <HelpCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Hjälp"
    >
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-display font-bold text-white">Hjälp</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"
            aria-label="Stäng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guide tabs */}
        <div className="flex gap-1 p-2 overflow-x-auto border-b border-zinc-800">
          {guides.map((guide, i) => (
            <button
              key={guide.title}
              onClick={() => setActiveGuide(i)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeGuide === i 
                  ? 'bg-zinc-700 text-white' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <guide.icon className="w-3 h-3 inline mr-1" />
              {guide.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {(() => {
              const Guide = guides[activeGuide];
              const Icon = Guide.icon;
              return (
                <>
                  <div className="p-2 rounded-lg bg-zinc-800 shrink-0">
                    <Icon className="w-5 h-5 text-zinc-400" />
                  </div>
                  <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
                    {Guide.content}
                  </pre>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
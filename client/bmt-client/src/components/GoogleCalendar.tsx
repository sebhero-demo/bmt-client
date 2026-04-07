import { type JSX } from 'react';
import { Calendar, ExternalLink, Zap, Clock } from 'lucide-react';
import { useState } from 'react';
import { isGoogleConfigured, type GoogleTokens, type CalendarEvent } from '../lib/google-calendar';

export default function GoogleCalendarUI(): JSX.Element {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const connect = () => {
    if (!isGoogleConfigured()) { setErr('Sätt VITE_GOOGLE_CLIENT_ID i .env'); return; }
    const state = crypto.randomUUID();
    sessionStorage.setItem('google_oauth_state', state);
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      redirect_uri: window.location.origin + '/oauth/callback',
      response_type: 'code', scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
      access_type: 'offline', state, prompt: 'consent',
    })}`;
  };

  if (!isGoogleConfigured()) {
    return (
      <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
        <span className="text-sm text-zinc-500">Google Calendar: configure VITE_GOOGLE_CLIENT_ID i .env</span>
      </div>
    );
  }

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-zinc-200">Kalender</span>
        </div>
        {!connected ? (
          <button onClick={connect} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium">
            <ExternalLink className="w-3 h-3" /> Anslut
          </button>
        ) : (
          <button onClick={() => setConnected(false)} className="text-xs text-zinc-500">Koppla loss</button>
        )}
      </div>
      {connected && events.length > 0 && (
        <div className="space-y-1 mb-2">
          {events.slice(0,3).map(e => (
            <div key={e.id} className="flex items-center gap-2 p-1.5 rounded bg-zinc-800/30 text-xs">
              <Clock className="w-3 h-3 text-zinc-500" />
              <span className="truncate text-zinc-400">{e.summary}</span>
            </div>
          ))}
        </div>
      )}
      {err && <p className="text-xs text-red-400">{err}</p>}
    </div>
  );
}
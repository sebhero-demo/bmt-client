// Google Calendar Service for BMT
// Configure via environment variables:
// VITE_GOOGLE_CLIENT_ID
// VITE_GOOGLE_CLIENT_SECRET

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '';

export const isGoogleConfigured = (): boolean => Boolean(CLIENT_ID && CLIENT_SECRET);

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ');

const REDIRECT_URI = window.location.origin + '/oauth/callback';

export const getGoogleAuthUrl = (state: string): string => {
  if (!CLIENT_ID) throw new Error('OAuth not configured');
  const params = new URLSearchParams({
    client_id: CLIENT_ID, redirect_uri: REDIRECT_URI, response_type: 'code',
    scope: SCOPES, access_type: 'offline', state, prompt: 'consent',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
};

export const exchangeCode = async (code: string): Promise<GoogleTokens> => {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI, grant_type: 'authorization_code',
    }),
  });
  return res.json();
};

export const createFocusEvent = async (t: GoogleTokens, title: string, mins: number, start: Date): Promise<CalendarEvent> => {
  const end = new Date(start.getTime() + mins * 60 * 1000);
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST', headers: {
      'Authorization': `Bearer ${t.access_token}`, 'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: `🎯 ${title}`, description: 'Focus session from BMT',
      start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() },
      reminders: { useDefault: true },
    }),
  });
  return res.json();
};

export const listEvents = async (t: GoogleTokens, max = 10): Promise<CalendarEvent[]> => {
  const params = new URLSearchParams({ maxResults: max.toString(), timeMin: new Date().toISOString(), orderBy: 'startTime' });
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { 'Authorization': `Bearer ${t.access_token}` } });
  const d = await res.json();
  return d.items || [];
};

export interface GoogleTokens { access_token: string; refresh_token?: string; expires_in: number; token_type: string; }
export interface CalendarEvent { id: string; summary: string; description?: string; start: { dateTime: string }; end: { dateTime: string }; }
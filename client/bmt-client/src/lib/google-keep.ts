// Google Keep Service for BMT
// Quick capture from Keep notes to tasks

import { GoogleTokens } from './google-calendar';

const KEEP_API = 'https://keep.googleapis.com/v1';

// List Keep notes (needs proper OAuth scope)
export const listNotes = async (tokens: GoogleTokens): Promise<KeepNote[]> => {
  const res = await fetch(`${KEEP_API}/notes?fields=notes`, {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` },
  });
  const data = await res.json();
  return data.notes || [];
};

// Create task from Keep note
export const createTaskFromNote = (note: KeepNote): { title: string; notes: string } => {
  const text = note.title || note.text || '';
  const firstLine = text.split('\n')[0].trim();
  return {
    title: firstLine.substring(0, 100), // Max 100 chars
    notes: text,
  };
};

export interface KeepNote {
  name: string;
  title?: string;
  text?: string;
  createdTime?: string;
  updatedTime?: string;
}
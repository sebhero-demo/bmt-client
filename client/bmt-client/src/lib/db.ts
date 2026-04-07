// Local database using better-sqlite3
// Works in browser via SQLite WASM, or Node.js/bun

import type { Task, TimeLog, UserStats } from '../types';

let db: any = null;

export const initDB = async () => {
  if (typeof window === 'undefined') return; // Server
  
  // Try SQLite WASM first (browser), fallback to localStorage
  try {
    const initSqlJs = (await import('sql.js')).default;
    const SQL = await initSqlJs();
    db = new SQL.Database();
    
    // Create tables
    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        status TEXT DEFAULT 'idle',
        timeLogs TEXT DEFAULT '[]',
        totalDurationSeconds INTEGER DEFAULT 0,
        createdAt TEXT,
        completedAt TEXT
      );
      CREATE TABLE IF NOT EXISTS userStats (
        id INTEGER PRIMARY KEY,
        xp INTEGER DEFAULT 0,
        currentStreak INTEGER DEFAULT 0,
        isBeastModeActive INTEGER DEFAULT 0,
        lastActiveDate TEXT
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
    console.log('[DB] SQLite initialized');
  } catch (e) {
    console.log('[DB] Using localStorage fallback');
  }
};

export const saveTasks = (tasks: Task[]) => {
  if (!db) {
    // localStorage fallback
    localStorage.setItem('bmt-tasks', JSON.stringify(tasks));
    return;
  }
  const stmt = db.prepare('INSERT OR REPLACE INTO tasks VALUES (?, ?, ?, ?, ?, ?, ?)');
  tasks.forEach(t => {
    stmt.run([t.id, t.title, t.status, JSON.stringify(t.timeLogs), t.totalDurationSeconds, t.createdAt, t.completedAt]);
  });
  stmt.free();
};

export const loadTasks = (): Task[] => {
  if (!db) {
    const data = localStorage.getItem('bmt-tasks');
    if (!data) return [];
    try {
      const tasks = JSON.parse(data);
      return tasks.map((t: any) => ({
        ...t,
        timeLogs: typeof t.timeLogs === 'string' ? JSON.parse(t.timeLogs) : t.timeLogs,
      }));
    } catch { return []; }
  }
  const results = db.exec('SELECT * FROM tasks');
  if (!results.length) return [];
  return results[0].values.map((row: any[]) => ({
    id: row[0],
    title: row[1],
    status: row[2],
    timeLogs: JSON.parse(row[3] || '[]'),
    totalDurationSeconds: row[4] || 0,
    createdAt: row[5],
    completedAt: row[6],
  }));
};

export const saveUserStats = (stats: UserStats) => {
  if (!db) {
    localStorage.setItem('bmt-userStats', JSON.stringify(stats));
    return;
  }
  db.run('INSERT OR REPLACE INTO userStats VALUES (1, ?, ?, ?, ?)', 
    [stats.xp, stats.currentStreak, stats.isBeastModeActive ? 1 : 0, stats.lastActiveDate]);
};

export const loadUserStats = (): UserStats | null => {
  if (!db) {
    const data = localStorage.getItem('bmt-userStats');
    return data ? JSON.parse(data) : null;
  }
  const results = db.exec('SELECT * FROM userStats WHERE id = 1');
  if (!results.length || !results[0].values.length) return null;
  const row = results[0].values[0];
  return {
    xp: row[1],
    currentStreak: row[2],
    isBeastModeActive: row[3] === 1,
    lastActiveDate: row[4],
  };
};

export const clearDB = () => {
  if (db) {
    db.run('DELETE FROM tasks');
    db.run('DELETE FROM userStats');
  } else {
    localStorage.removeItem('bmt-tasks');
    localStorage.removeItem('bmt-userStats');
  }
};
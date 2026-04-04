# LLM Coding Instructions: Beast Mode Todo (Client-Side)

**Status:** ⚠️ FIX IN PROGRESS

## Remaining Issues (TypeScript Errors)

Fixa dessa filer:

### 1. StatsDisplay.tsx (LÄGG TILL)
Rad 49: Lägg till saknad import:
```typescript
import { getTaskStats } from '../types';
```

### 2. TaskItem.tsx
- Rad 6: Ta bort `Square` från lucide import (den används inte)
- Rad 7: Ändra `Task` till type import:
```typescript
import type { Task } from '../types';
```
- Ta bort oanvänd `currentDuration` variabel

### 3. store.ts
Ta bort oanvända:
- `TaskStatus` (används inte)
- `userStats` (används inte)

---

Sen bygg och testa med:
```bash
npm run tsc && npm run dev
```

**Role:** You are an expert Frontend Developer and AI Coding Assistant. Your task is to build the client-side application for "Beast Mode Todo" based on the specifications below. 

**Context:** "Beast Mode Todo" is a hyper-focused productivity app that replaces the traditional to-do backlog with an "Active List". Every task has a built-in timer. The app tracks the time spent on tasks and calculates the Min, Max, and Average times for recurring tasks to help users estimate better. It includes gamification (XP, streaks, "Beast Mode") and integrates with Google Calendar, Keep, and Drive.

---

## 🛠 Tech Stack & Architecture

*   **Build Tool:** Vite
*   **Framework:** React 18+ (Functional Components & Hooks only)
*   **Language:** TypeScript (Strict Mode enabled)
*   **Styling:** Tailwind CSS (utility-first styling)
*   **Component Library:** Base UI (Headless, unstyled accessible components to be styled using Tailwind CSS)
*   **State Management:** Zustand or React Context API (for global state like User XP, Active Timers, and Task Lists)
*   **Icons:** Lucide React or similar minimal icon library

### Core Data Models (TypeScript Interfaces)

Before writing UI code, strictly adhere to these data models to ensure consistency:

```typescript
type TaskStatus = 'idle' | 'in_progress' | 'paused' | 'completed';

interface TimeLog {
  id: string;
  startTime: string; // ISO string
  endTime: string | null; // ISO string
  durationSeconds: number;
}

interface Task {
  id: string;
  title: string;          // Used to group recurring tasks for Min/Max/Avg
  status: TaskStatus;
  timeLogs: TimeLog[];
  totalDurationSeconds: number; 
  createdAt: string;
  completedAt: string | null;
  googleDriveLink?: string; // Optional integration link
}

interface UserStats {
  xp: number;
  currentStreak: number;
  isBeastModeActive: boolean;
}

interface TaskStats {
  title: string;
  minTimeSeconds: number;
  maxTimeSeconds: number;
  avgTimeSeconds: number;
  completionCount: number;
}

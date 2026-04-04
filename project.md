# Project Specification: Beast Mode Todo

**Beast Mode Todo** is, at its core, a powerful and immediate to-do list where time tracking and historical data are at the absolute center. By intentionally omitting complex concepts like a traditional product backlog, the app focuses entirely on direct action. Every task you add is strictly about *what* needs to be done in the near term and *how much time* it actually takes in reality.

## Core Concept: Time Tracking and Todo

**Simple Explanation:** 
This is a highly intuitive to-do list where every task has a built-in stopwatch. You type in what you need to do, hit start, and when you are finished, the app saves the time. The next time you do the same task, the app tells you how fast you usually are, and you earn points if you beat your own record.

**Detailed Explanation:** 
The system architecture is built around an event-driven database model where each *Todo-item* is linked to a *Time-log*. By removing the backlog, the cognitive load on the user is significantly reduced; the interface encourages creating only tasks that will actually be executed in the immediate future (e.g., "Today" or "This Week"). The core value is delivered through the algorithmic processing of time logs, which automatically generates dynamic thresholds (*Min*, *Max*, and *Average* times) for recurring activity patterns.

## Core Features

To maximize efficiency, the interface and features are hyper-focused on execution:

*   **The Active List:** A central view where the user adds tasks for the day or week. There is no hidden list to procrastinate with; everything is visible and ready to be acted upon.
*   **Active Time Tracking (Timer):** Every task features a clear "Play/Pause/Stop" button. The active timer is prominently displayed in the UI (potentially as a floating widget) to keep the user anchored in deep work.
*   **Historical Time Analysis:** When a task is marked as complete, and the user has done a similarly named task before (e.g., "Clean the bathroom" or "Answer emails"), the system immediately displays the aggregated data: your fastest time (*Min*), your slowest time (*Max*), and your average time (*Average*).
*   **Manual Adjustment:** Because users sometimes forget to stop a timer, there must be a frictionless way to retroactively adjust the time spent or log time completely manually.

## Gamification & Simplified Personal Scrum

Even without a backlog, we can apply agile principles and game mechanics to drive user engagement and productivity. The following table illustrates how these concepts are integrated directly into the active to-do list:

| Concept | Implementation in Beast Mode Todo | Effect on the User |
| :--- | :--- | :--- |
| **Sprints (Timeboxing)** | The user creates "Today's List". This acts as a micro-sprint. The goal is to clear the board before the day ends. | Creates a clear timeframe and reduces anxiety over uncompleted tasks. |
| **Retrospectives (Insights)** | A weekly summary screen showing total time worked and how accurate the user's time estimations were compared to their historical *Average*. | Helps the user become highly realistic and accurate in their future planning. |
| **Experience Points (XP)** | The user receives base XP for completing any task. Bonus XP is awarded if the task is completed faster than the historical *Average*. | Triggers intrinsic motivation and a desire to work more efficiently. |
| **Beast Mode (Streak)** | Activates when the user completes a set number of tasks under their *Average* time in a row. The UI can shift color themes and apply XP multipliers. | Provides a visual and psychological "high" that encourages sustained deep focus. |

## Google Integrations: A Seamless Flow

The integrations must serve the purpose of quickly getting tasks into the list and scheduling them, without creating unnecessary friction.

1.  **Google Calendar (Timeblocking):** Tasks from your active list can be dragged and dropped directly into an integrated calendar view to block out time during the day. When the timer is started in the app, the calendar event can update in real-time to show as "Busy/In Progress".
2.  **Google Keep (Quick Capture):** An "Import from Keep" button. This allows the user to quickly convert loose thoughts, notes, or checklists from Keep directly into concrete, trackable tasks in **Beast Mode Todo**.
3.  **Google Drive (Contextual Files):** Quickly link a specific Drive document to a task. If the task is "Write monthly report", the correct Google Docs file automatically opens when you press the "Play" button on the timer.

## System Architecture and Database

To store time data and enable real-time synchronization between web and mobile platforms, a robust database is the heart of the system.

*   **Database Structure:** You need a relational database (like `PostgreSQL`) or a well-designed NoSQL database (like `Firebase/Firestore` or `Supabase`). The database must store tables/collections for *Users*, *Tasks*, and *TimeEntries*.
*   **Data Calculation:** To prevent UI lag, the calculation of Min, Max, and Average times should occur either asynchronously on the backend server or through optimized database aggregation queries every time a new task is marked as complete.
*   **Cross-Platform Codebase:** Build the frontend using `React Native` (for iOS and Android apps) and `React.js` (for the web app). Share as much business logic (e.g., timer functions, API calls, and state management) as possible between the platforms using a monorepo setup.

## Summary

In this streamlined version, **Beast Mode Todo** is a hyper-focused productivity engine. By eliminating the backlog and putting all focus on an active list, the built-in timer, and the algorithmic analysis of *Min*, *Max*, and *Average* times, you create a tool that doesn't just tell the user *what* to do—it actively trains them to become faster and more time-aware. Combined with targeted Google integrations and a stable cloud database, it provides a seamless experience for finding flow and getting things done.

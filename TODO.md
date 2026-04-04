# Beast Mode Todo — TODO + Backlog

## ✅ Implemented Features

| Feature | Status | Kommentar |
|---------|--------|------------|
| Active List | ✅ Done | Alla tasks synliga, inga hidden lists |
| Active Time Tracking | ✅ Done | Timer med play/pause/stop + resume |
| Task Status Management | ✅ Done | idle → in_progress → paused → completed |
| XP System | ✅ Done | 10 XP min, 1 XP/min, bonus för snabbare än genomsnitt |
| Streak Counter | ✅ Done | currentStreak i UserStats |
| Beast Mode | ✅ Done | Toggle med UI-förändring |
| Task History Stats | ✅ Done | Min/Max/Avg per task-title i StatsDisplay |
| Local Storage Persistence | ✅ Done | Zustand med persist middleware |
| Accessibility | ✅ Done | sr-only, aria-labels, skip links, keyboard nav |

---

## 🔶 TODO — Things to Fix/Add

### Design / UI

- [ ] **D1:** Byt till distinctive fonts (för närvarande system-zinc)
- [ ] **D2:** Förbättra färgschema (för närvarande basic zinc)
- [ ] **D3:** Lägg till visual effects (noise, gradient mesh, grain)
- [ ] **D4:** Förbättra animations (staggered load, micro-interactions)

### Features

- [ ] **F1:** Manual time adjustment — möjlighet att justera tid i efterhand
- [ ] **F2:** Google Calendar integration — timeblocking
- [ ] **F3:** Google Keep import — snabb-input från Keep
- [ ] **F4:** Google Drive — koppla filer till tasks
- [ ] **F5:** Weekly retrospective summary — veckovis statistik
- [ ] **F6:** Database/backend — PostgreSQL/Firebase för cross-platform sync

### Technical

- [ ] **T1:** React Native — mobilapp version
- [ ] **T2:** API-lager för Google integrations
- [ ] **T3:** Unit tests

---

## 📋 Backlog — User Stories

### Sprint 1 — Design Polish (prioritet: MEDEL)

- **US-DESIGN-1:** Som användare vill jag ha ett distinkt UI så att appen känns unik och minnesvärd
  - Acceptance: Nya fonts (display + body), custom CSS variables, cohesive theme
  - Estimat: 5 pt

- **US-DESIGN-2:** Som användare vill jag ha visuella effekter som skapar atmosfär
  - Acceptance: Noise texture/grain overlay, gradient background, förbättrade shadows
  - Estimat: 3 pt

- **US-DESIGN-3:** Som användare vill jag ha mjuka animationer som gör appen levande
  - Acceptance: Staggered page load, hover states, timer transitions
  - Estimat: 3 pt

### Sprint 2 — Manual Time (prioritet: HÖG)

- **US-TIME-1:** Som användare vill jag kunna justera tiden för en task i efterhand
  - Acceptance: Edit time-logs,手动 input av duration, spara ändringar
  - Estimat: 5 pt

- **US-TIME-2:** Som användare vill jag kunna logga tid manuellt utan timer
  - Acceptance: "Log time manually" button, datum + duration input
  - Estimat: 3 pt

### Sprint 3 — Google Integrations (prioritet: MEDEL)

- **US-GOOGLE-1:** Som användare vill jag kunna importera tasks från Google Keep
  - Acceptance: "Import from Keep" knapp, lista notes, konvertera till tasks
  - Estimat: 5 pt

- **US-GOOGLE-2:** Som användare vill jag kunna timeblocka med Google Calendar
  - Acceptance: Drag-drop till kalender, create events, "In Progress" status
  - Estimat: 8 pt

- **US-GOOGLE-3:** Som användare vill jag kunna koppla Google Drive-filer till tasks
  - Acceptance: Link input, öppen fil vid timer-start
  - Estimat: 3 pt

### Sprint 4 — Insights (prioritet: MEDEL)

- **US-INSIGHT-1:** Som användare vill jag se veckovis sammanfattning
  - Acceptance: Total time, tasks completed, accuracy vs average, veckovisa trends
  - Estimat: 5 pt

- **US-INSIGHT-2:** Som användare vill jag se historisk data i Min/Max/Avg format
  - Acceptance: Visas redan vid varje task, förbättra presentation
  - Estimat: 2 pt

### Sprint 5 — Backend (prioritet: LÅG)

- **US-BACKEND-1:** Som användare vill jag ha mina data synkade mellan webb och mobil
  - Acceptanc: PostgreSQL/Firebase backend, REST/GraphQL API
  - Estimat: 13 pt

- **US-BACKEND-2:** Som användare vill jag ha en mobilapp
  - Acceptance: React Native app med delad logik
  - Estimat: 13 pt

---

## 📊 Totalsammanfattning

| Kategori | Points |
|----------|--------|
| Design | 11 pt |
| Manual Time | 8 pt |
| Google Integrations | 16 pt |
| Insights | 7 pt |
| Backend | 26 pt |
| **Total** | **68 pt** |

---

## 🏃‍♂️ Nästa steg

1. Välj Sprint 1 (Design) och börja med F1-F3
2. Eller börja med Sprint 2 (Manual Time) för högre affärsvärde

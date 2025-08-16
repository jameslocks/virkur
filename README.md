# Virkur

_A super simple, mobile-first workout tracker (PWA)._

- **Vanilla TS + Vite 7**
- **Tailwind CSS v4** (CSS-first, tokens via `@theme`)
- **Dexie** (IndexedDB) for local/offline data
- **Chart.js** (lazy-loaded on History)
- **vite-plugin-pwa** for installable/offline app

## ✨ Features

- Add activities with dynamic fields (number, enum, duration, etc.)
- Quick reps logic: `sets` + `reps_list` (CSV or single number)
- Today view (recent entries), History view (weekly totals, 4 weeks)
- Edit/Delete entries with Undo toast
- Activity Manager (create/edit/archive, field editor, “Sets + Reps” preset)
- Settings: Export/Import JSON
- Offline-first PWA

## 🧰 Requirements

- Node **>= 20.19** or **>= 22.12** (recommended: latest LTS)
- npm (comes with Node)

## 🚀 Getting started

```bash
# 1) Install deps
npm install

# 2) Dev server
npm run dev

# 3) Production build + local preview
npm run build
npm run preview

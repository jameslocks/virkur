[![CI](https://github.com/jameslocks/virkur/actions/workflows/pages.yml/badge.svg)](https://github.com/jameslocks/virkur/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Live app:** https://jameslocks.github.io/virkur/

# Virkur

_A super simple, mobile-first workout tracker (PWA)._

- **Vanilla TypeScript + Vite 7**
- **Tailwind CSS v4** (CSS-first; tokens via `@theme` in `src/style.css`)
- **Dexie (IndexedDB)** for offline/local-first data
- **Chart.js** (lazy-loaded on History)
- **vite-plugin-pwa** for installable/offline app shell

---

## ✨ Features

- Add activities with dynamic fields (number, enum, text, duration, date, bool)
- Reps logic: `sets` + `reps_list` (CSV or single number) → **automatic total**
- Today view (today + recent), History view (weekly totals, last 4 weeks)
- Entry detail (edit, delete with **Undo** toast)
- Activity Manager (create/edit/archive, field editor, “Sets + Reps” preset)
- Settings → Export/Import JSON
- Offline-first + PWA install

---

## 🧰 Requirements

- Node **≥ 20.19** or **≥ 22.12** (recommended: latest LTS)
- npm (ships with Node)

---

## 🚀 Getting started

```bash
# 1) Install deps
npm install

# 2) Run dev server
npm run dev

# 3) Production build + local preview
npm run build
npm run preview
```

Open http://localhost:5173 for dev or the preview URL printed by Vite.

---

## 🗂 Project structure

```
src/
  style.css                # Tailwind v4 + @theme tokens
  main.ts                  # PWA register + app mount
  vite-env.d.ts

  lib/
    calc.ts                # duration/pace parsing & formatting
    reps.ts                # derive total reps from sets/reps_list
    stats.ts               # weekly totals, streaks
    summary.ts             # human-readable entry summaries
    storage.ts             # export/import helpers
    router.ts              # hash route parsing

  ui/
    app.ts                 # layout (header + bottom nav)
    toast.ts               # undo toast
    screens/
      today.ts             # today + recent
      add.ts               # dynamic form per activity
      history.ts           # charts (lazy Chart.js)
      entry.ts             # edit/delete entry
      settings.ts          # export/import UI
      activities.ts        # activity manager (fields, archive)

  db.ts                    # Dexie schema + migrations
  seed.ts                  # default activities
  types.ts                 # Activity/Field/Entry types
  util/id.ts               # id/uuid helper
```

---

## 🎨 Theming (Tailwind v4)

Tailwind v4 is **CSS-first**. Tokens live in `src/style.css` inside an `@theme` block. We alias the base color to the `-500` shade so classes like `bg-ink` map cleanly.

```css
@theme {
  /* aliases (base = 500) */
  --color-ink:    var(--color-ink-500);
  --color-orange: var(--color-orange-500);
  --color-amber:  var(--color-amber-500);
  --color-butter: var(--color-butter-500);
  --color-mint:   var(--color-mint-500);

  /* ink ramp (cool, base #16151A) */
  --color-ink-100: #E6E7EA;
  --color-ink-300: #9EA3AC;
  --color-ink-500: #16151A;
  --color-ink-700: #101216;
  --color-ink-900: #0A0B0D;

  /* orange */
  --color-orange-100: #F9E5DC;
  --color-orange-300: #ECB195;
  --color-orange-500: #D45113;
  --color-orange-700: #9F3D0E;
  --color-orange-900: #6A280A;

  /* amber */
  --color-amber-100: #FEF1E2;
  --color-amber-300: #FCD4A9;
  --color-amber-500: #F9A03F;
  --color-amber-700: #BB782F;
  --color-amber-900: #7C5020;

  /* butter */
  --color-butter-100: #FEFAF1;
  --color-butter-300: #FCF0D6;
  --color-butter-500: #F8DDA4;
  --color-butter-700: #BAA67B;
  --color-butter-900: #7C6E52;

  /* mint */
  --color-mint-100: #FBFEF7;
  --color-mint-300: #F2FDE8;
  --color-mint-500: #E3FACC;
  --color-mint-700: #AABC99;
  --color-mint-900: #727D66;
}
```

Usage examples: `bg-ink`, `bg-ink-700`, `text-butter-300`, `bg-orange-700 hover:bg-orange-900`, etc.

---

## 📈 Charts

- Chart.js is **lazy-loaded** on the History screen to keep the main bundle small.
- Weekly totals show the last **4** ISO weeks (stacked bars).

---

## 🧱 Architecture notes

- Local-first: everything works offline; PWA caches app shell.
- Data model is simple: `activities`, `entries`. Activities can be **archived** (hidden from Add) but history is preserved.
- Reps logic is generic: any activity with keys `sets` and `reps_list` (or `total_reps`) will summarize/aggregate.

---

## 🌐 Deploy to GitHub Pages

1. Ensure `vite.config.ts` has the correct `base` for your repo:
   ```ts
   export default defineConfig({
     base: '/virkur/', // '/<REPO_NAME>/'
     plugins: [/* tailwind, pwa */],
   })
   ```
2. Push to `main`. GitHub Actions builds and deploys to Pages (workflow in `.github/workflows/pages.yml`).
3. In **Settings → Pages**, set:
   - **Build and deployment** → **Source: GitHub Actions** (usually auto-detected).

**Custom domain?** Add your DNS and a `CNAME` at repo root if desired (optional).

---

## 🤝 Contributing

Issues and PRs welcome. Keep PRs small and focused. Please run:

```bash
npm run typecheck && npm run build
```

---

## 📜 License

MIT — see [LICENSE](./LICENSE).

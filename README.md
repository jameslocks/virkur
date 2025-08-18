[![CI](https://github.com/jameslocks/virkur/actions/workflows/pages.yml/badge.svg)](https://github.com/jameslocks/virkur/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Live app:** https://jameslocks.github.io/virkur/

# Virkur

A super simple, mobile-first workout tracker (PWA).  
Local-first, offline-capable, installable, and open source.

- Vanilla **TypeScript** + **Vite 7**
- **Tailwind CSS v4** (CSS-first; tokens via `@theme` in `src/style.css`)
- **Dexie** (IndexedDB) for local storage
- **Chart.js** (lazy-loaded on History)
- **vite-plugin-pwa** for installable/offline app shell

---

## ✨ Features

- **Add entries** quickly with activity-specific fields  
  (number, enum, text, duration, date, bool)
- **Sets + Reps logic**: `sets` + `reps_list` (CSV or single) → automatic total
- **Today** view (today + latest entries)
- **History** view: **stacked bar chart** by activity for the **last 4 weeks** + friendly “Recent” list
- **Entry detail**: edit, delete with **Undo** toast
- **Activity Manager**: create/edit/archive activities, field editor, “Sets + Reps” preset, optional presets
- **Backup**: Export JSON (friendly filename) • Import with **summary + confirm** (safe **merge/upsert**, no deletions)
- **PWA updates**: automatic update toast (**Refresh**); Settings → About → **Check for updates**
- **Accessibility**: skip-to-content link, input zoom fix on iOS (16px controls), `aria-current` on nav, reduced-motion disables chart animation
- **Branding**: crisp SVG header logo; PWA icons for install

---

## Requirements

- **Node** ≥ 20.19 or ≥ 22.12 (Node 24 used in CI)
- **npm** (ships with Node)

---

## Getting started

```bash
# 1) Install deps
npm install

# 2) Run dev server
npm run dev

# 3) Production build + local preview
npm run build
npm run preview
```

Open http://localhost:5173 for dev, or use the preview URL printed by Vite.

---

## Project structure

```
src/
  style.css                # Tailwind v4 + @theme tokens
  main.ts                  # PWA register + a11y hooks + app mount
  vite-env.d.ts
  lib/
    date.ts                # local date helpers (no UTC gotchas)
    summary.ts             # human-readable entry summaries
    storage.ts             # export/import helpers (with summarizeBackup)
    a11y.ts                # skip link, aria-current, iOS input zoom fix
    charts-a11y.ts         # prefers-reduced-motion for Chart.js
    router.ts              # hash route parsing
  ui/
    app.ts                 # layout (header + bottom nav)
    toast.ts               # toast with Undo action
    screens/
      today.ts             # today + recent (friendly rendering)
      add.ts               # dynamic form per activity
      history.ts           # stacked 4-week chart by activity + recent
      entry.ts             # edit/delete entry
      settings.ts          # export/import + seed + about + update check
      activities.ts        # activity manager (fields, archive, presets)
  db.ts                    # Dexie schema + migrations (activities, entries, settings)
  seed.ts                  # default activities + ensureSeed()
  types.ts                 # Activity/Field/Entry/Settings types
  util/id.ts               # id helper
```

---

## Theming (Tailwind v4)

Tailwind v4 is CSS-first. Tokens live in `src/style.css` inside an `@theme` block.  
We alias each base color to the `-500` shade so utilities like `bg-ink` map cleanly.

Example (snippet):

```css
@theme {
  /* aliases (base = 500) */
  --color-ink:    var(--color-ink-500);
  --color-orange: var(--color-orange-500);
  --color-amber:  var(--color-amber-500);
  --color-butter: var(--color-butter-500);
  --color-mint:   var(--color-mint-500);

  /* ink ramp (base #16151A) */
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

Usage: `bg-ink`, `bg-ink-700`, `text-butter-300`, `bg-orange-700 hover:bg-orange-900`, etc.

---

## Charts

- Chart.js is **lazy-loaded** on the History screen to keep the main bundle small.
- Weekly chart shows the **last 4 ISO weeks**, **stacked by activity**.

---

## Privacy

Data never leaves your device. Everything is stored locally in your browser (IndexedDB via Dexie).  
**Export/Import** lets you back up or migrate. Import **merges** by ID (no deletions).

---

## Deploy to GitHub Pages

1) Ensure `vite.config.ts` has the correct base for your repo:

```ts
export default defineConfig({
  base: '/virkur/', // '/<REPO_NAME>/'
  plugins: [/* tailwind, pwa */],
})
```

2) Push to `main`. GitHub Actions runs tests, builds, and deploys (see `.github/workflows/pages.yml`).  
3) In **Settings → Pages**, select “GitHub Actions” as the source (usually automatic).

---

## Tests

Playwright E2E covers:

- Add → Edit → Delete → **Undo**
- **Export → Import** round-trip preserves counts
- App mounts/smoke test

Run locally:

```bash
npx playwright install --with-deps
npm run test:e2e
```

In CI, Pages deploy is **gated** on E2E success and publishes the Playwright HTML report as an artifact.

---

## Versioning & About

Version, commit, build time, and authors are injected at build by Vite and displayed in **Settings → About**.  
To release:

```bash
npm version patch|minor|major && git push --follow-tags
```

---

## Contributing

Issues and PRs welcome. Keep PRs small and focused.

```bash
npm run typecheck && npm run build
```

---

## License

MIT — see [LICENSE](./LICENSE).

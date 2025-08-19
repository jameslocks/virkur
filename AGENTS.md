# Repository Guidelines

## Project Structure & Module Organization
- `src/`: app code. Key areas: `lib/` (pure utils), `ui/` (views/components; `ui/screens/*`), `db.ts` (Dexie schema), `seed.ts`, `style.css` (Tailwind v4 + `@theme`).
- `public/`: static assets (icons, logo, manifest icons).
- `tests/`: Playwright end‑to‑end specs.
- `dist/`: production build output (generated).
- `docs/`: project documentation and assets.

## Build, Test, and Development Commands
- `npm run dev`: start Vite dev server at `http://localhost:5173`.
- `npm run build`: type‑check + bundle to `dist/`.
- `npm run preview`: serve the built app on port 4173.
- `npm run typecheck`: strict TypeScript checks (no emit).
- `npm run test:e2e`: run Playwright tests against `vite preview`.
- `npm run test:e2e:install`: install Playwright browsers/deps (first run or CI).

## Coding Style & Naming Conventions
- TypeScript, strict mode. Prefer small, pure functions in `src/lib`.
- Indentation: 2 spaces; files UTF‑8 LF.
- Naming: files/folders lowercase; keep names short (`ui/screens/today.ts`). Variables/functions use `camelCase`; types/interfaces `PascalCase`.
- Exports: prefer named exports for utilities; default is fine for single‑component modules.
- CSS: Tailwind utility‑first. Tokens live in `src/style.css` under `@theme`.

## Testing Guidelines
- Framework: Playwright (`tests/*.spec.ts`). Keep specs independent; reset state via UI flows.
- Run locally: `npm run build && npm run test:e2e` (ensure `npm run test:e2e:install` once).
- Selectors: favor roles/text; add `data-testid` only when necessary.

## Commit & Pull Request Guidelines
- Conventional Commits style is used (e.g., `feat(today): add local-date filter`, `fix(build): json import attributes`).
- PRs: keep focused; include description, linked issues, and screenshots/GIFs for UI changes.
- Before opening: `npm run typecheck && npm run build && npm run test:e2e` should pass.

## Security & Configuration Tips
- GitHub Pages base path is `/virkur/`. If the repo name changes, update `vite.config.ts` (PWA `base`, `start_url`, `scope`) and `playwright.config.ts` `baseURL`.
- Do not commit secrets. The app is static and stores user data locally via Dexie; avoid adding network calls without a review of privacy implications.

## Versioning & Releases
- Version bumps: when asked to "appropriately bump the version number", use `npm version patch|minor|major` (do not edit `package.json` directly).
- Confirmation step: always ask whether this bump is a release. If confirmed, proceed with tagging and changelog.
- Generate changelog: `npm run changelog -- --level <patch|minor|major>` to create/update `CHANGELOG.md` for the next version (or `--version X.Y.Z`).
- Release flow (Conventional Commits based):
  - Identify previous tag: `git describe --tags --abbrev=0` (or none if first release).
  - Generate changelog: `npm run changelog -- --level <level>`.
  - Commit the changelog: `git add CHANGELOG.md && git commit -m "docs(changelog): update for vX.Y.Z"`.
  - Run the version bump (creates a commit and tag): `npm version <level> -m "chore(release): %s"`.
  - Push branch and tags: `git push && git push --tags`.
  - Optionally, create a GitHub Release using the tag and changelog content.
  - If we maintain a Pages site, ensure CI completes after the tag push.

Notes:
- For prereleases (e.g., betas), use `npm version preminor --preid=beta` as needed.
- If the changelog is large, group items by type (feat, fix, chore, docs, refactor).

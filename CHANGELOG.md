# Changelog

## v1.2.0 - 2025-08-19

### Features
- show 'style' indicator on Today and History cards when activity has enum "style" field
- add enum options editor in Activity Manager\n\n- Show textarea for enum field options\n- Bind key/label/type/required/options inputs\n- Re-render on type changes to toggle options\n- Bump version to 1.1.0

### Fixes
- make reps list formatting consistent with explicit "reps" label\n\n- List form now shows e.g. \n- Updated both Today summary helper and History recent summarizer
- remove '• style' indicator from Today and History cards\n\n- Keep style value in summaries only; no title suffix

### Performance
- render shell immediately, seed in background, lazy-load non-landing screens\n\n- Remove blocking await on ensureSeed; re-render after seed completes\n- Dynamic import Add/History/Settings/Activities/Entry to slim initial chunk

### Docs
- document version bump and release flow
- add CI + license badges, live link; update features, theming, tests, and privacy sections

### Chores
- bump to v1.2.0
- ignore TODO.md (local planning list)
- add simple changelog generator and npm script\n\n- scripts/changelog.mjs creates CHANGELOG.md sections from commits since last tag\n- Supports --level or --version\n- Wire as npm run changelog and document in AGENTS.md

### Other
- Update
- v1 update


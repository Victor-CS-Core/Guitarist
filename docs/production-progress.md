# Production conversion progress — 2026-09-23

Guitarist's approved [design](superpowers/specs/2026-09-23-production-accounts-design.md) and [plan](superpowers/plans/2026-09-23-production-accounts.md) have been pushed to `main`. Implementation is underway on `codex/product-accounts`.

## Complete

- Created an isolated feature branch and worktree so the current published demo stays stable.
- Added a Sites-compatible Worker build alongside the existing React SPA.
- Added the D1 schema for accounts, student records, sessions, and login throttling, packaged as a Sites migration.
- Added revision-checked student record persistence and a test using a real local D1 implementation.
- Verified the branch builds `dist/server/index.js`, `dist/client/`, and `dist/.openai/`.
- Baseline test suite: 15 passing tests; TypeScript, lint, and production build pass as of the completed persistence task.

## In progress

- Authentication route tests are written and intentionally failing: the login, session, and request-protection routes have not been implemented yet. These failures prove the planned behavior is not accidentally supplied by the current Worker shell.
- The next implementation step is password hashing, one-time admin bootstrap from a hosted secret, secure sessions, and login throttling.

## Remaining before release

- Teacher-only student creation, password reset, and disable controls.
- Server-authorized practice, assessments, assignments, and notes with student isolation.
- Login-first SPA, API-backed state, and removal of demo data and role switching.
- Browser and security checks, private deployment verification, then the approved public-audience cutover.

The live Site and GitHub `main` still run the previous demo. No real student data has been created or imported. The requested initial admin password is not present in the repository; it will be configured only as a hosted secret during cutover.

# Production conversion progress — 2026-09-24

Guitarist's approved [design](superpowers/specs/2026-09-23-production-accounts-design.md) and [plan](superpowers/plans/2026-09-23-production-accounts.md) have been pushed to `main`. Implementation is underway on `codex/product-accounts`.

## Complete

- Created an isolated feature branch and worktree so the current published demo stays stable.
- Added a Sites-compatible Worker build alongside the existing React SPA.
- Added the D1 schema for accounts, student records, sessions, and login throttling, packaged as a Sites migration.
- Added revision-checked student record persistence and a test using a real local D1 implementation.
- Verified the branch builds `dist/server/index.js`, `dist/client/`, and `dist/.openai/`.
- Baseline test suite: 15 passing tests; TypeScript, lint, and production build pass as of the completed persistence task.
- Added one-time teacher bootstrap from a server-only secret, salted password hashing, rate-limited login, secure cookie sessions, logout revocation, and disabled-account rejection.
- Server checkpoint verification: 24 passing tests, TypeScript, lint, production build, and production-dependency audit passed.
- Added teacher-only student creation using a display name, username, and password, plus password reset and account disabling with session revocation.
- Added server-authorized `/api/state` and `/api/commands` routes. Student responses exclude other students and teacher notes; duplicate practice submissions remain idempotent and stale revisions return a conflict.
- Replaced the public entry route with a login-only screen and removed the demo role switcher, fictional students, and browser-local persistence from the production UI.
- Connected teacher account creation, password reset, disabling, assessments, assignments, notes, and student practice to authenticated API state.
- Browser-tested sign-in, protected deep links, username-only student creation, cross-browser practice persistence, sign-out, password reset and disable revocation, and teacher-approved chapter unlock. Four Playwright tests pass against local D1.
- Private Sites deployment provisioned D1 and all four expected tables. Hosted smoke testing found the Worker caps one PBKDF2 derivation at 100,000 iterations, so password hashing now uses that supported limit and has a regression test. The corrected version is pending redeployment.

## In progress

- Final hardening, accessibility and browser review, private deployment, and production smoke checks.

## Remaining before release

- Complete validation of the current UI checkpoint and address any release findings.
- Configure the initial teacher password as a hosted secret, deploy privately, verify hosted D1 and auth, then perform the approved public-audience cutover.

The live Site and GitHub `main` still run the previous demo. No real student data has been created or imported. The requested initial admin password is not present in the repository; it will be configured only as a hosted secret during cutover.

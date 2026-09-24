# Guitarist production release progress — 2026-09-24

Guitarist is live at [guitarist-practice.ktr0nn.chatgpt.site](https://guitarist-practice.ktr0nn.chatgpt.site) as a public, login-first SPA for students ages 13+. The approved [design](superpowers/specs/2026-09-23-production-accounts-design.md) and [plan](superpowers/plans/2026-09-23-production-accounts.md) are implemented.

## Complete

- Replaced the fictional browser-local demo with a Sites Worker API, Sites-managed D1 database, and real teacher/student sessions.
- Bootstrapped the teacher username `Ktr0nn` using the requested password as a one-time hosted secret. The secret has been removed; only a salted password verifier remains in D1. No password or local `.dev.vars` file is included in Git or the deployment archive.
- Added teacher-created student accounts using display name, username, and password without email. The teacher can reset passwords and disable accounts, revoking existing sessions.
- Moved learning commands and role checks to the server. Student data excludes other students and teacher notes. Practice persists between browsers; only the teacher can assess mastery and unlock chapters.
- Preserved the acoustic-guitar design and added a login-only public entry page. Direct SPA paths load the app and redirect signed-out visitors to sign-in.
- Verified local TypeScript, lint, build, 25 unit/integration tests, four browser tests, and a production-dependency audit with zero reported vulnerabilities.
- Verified the hosted public Site with a fresh browser: anonymous `/api/state` returns 401; a username/password student signed in without a ChatGPT account or email; practice remained after reload. Hosted API checks also confirmed teacher-note isolation and a 403 for a cross-student mutation.
- Disabled the temporary release-check student account after verification. Its previous session and new login both return 401. The disabled account remains visible to the teacher as a release record.

## Operational limits

This release has one teacher account, no student self-registration, and no email recovery. Practice time is self-reported; the teacher decides mastery. Sites must not be used to target students below age 13 or the local age of digital consent.

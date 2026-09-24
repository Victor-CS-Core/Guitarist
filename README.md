# Guitarist

Guitarist is a teacher-guided guitar practice SPA for students ages 13+. The public entry page is sign-in only. A teacher creates student accounts with a display name, username, and password; email is not required. Student practice, assignments, assessments, and progress are stored in a server-side D1 database.

The authenticated app is live at [guitarist-practice.ktr0nn.chatgpt.site](https://guitarist-practice.ktr0nn.chatgpt.site). See the approved [design](docs/superpowers/specs/2026-09-23-production-accounts-design.md), [implementation plan](docs/superpowers/plans/2026-09-23-production-accounts.md), and [release progress](docs/production-progress.md).

## Local development

Use Node.js 22+ and npm. Install with `npm ci`, then apply the database migration:

```sh
npx wrangler d1 migrations apply guitarist-local --local --config wrangler.jsonc
```

Copy `.env.example` to `.dev.vars` and set a local-only `ADMIN_BOOTSTRAP_PASSWORD`. The first server request creates the teacher account `Ktr0nn`; the secret is not needed after that account exists. Run `npm run dev` and open `http://localhost:5173`. Never commit `.dev.vars` or a real password.

Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`. For browser tests, start the dev server and run `npm run test:e2e`. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if Chromium is installed outside Playwright's default location; set `E2E_ADMIN_PASSWORD` if your local bootstrap password differs from the test default.

## Architecture

The React SPA is in `src/`. `server/` hosts authenticated API routes, server-side authorization, password hashing, and session handling. `drizzle/` contains the D1 migration. The Sites build outputs `dist/server/index.js`, `dist/client/`, and `dist/.openai/`, including the hosting manifest and migration.

Student actions record practice but cannot award mastery or unlock chapters. Teacher assessments and explicit unlock actions control advancement. Private teacher notes are omitted from student responses. Passwords are salted and hashed; sessions use secure, HttpOnly cookies. The hosted initial admin password belongs only in a Sites secret.

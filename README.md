# Guitarist

The production account conversion is in progress on `codex/product-accounts`; the published `main` version remains the demo until the authenticated release passes verification. The approved [design](docs/superpowers/specs/2026-09-23-production-accounts-design.md) and [implementation plan](docs/superpowers/plans/2026-09-23-production-accounts.md) define the cutover.

This branch builds a Cloudflare-compatible Worker plus SPA assets for OpenAI Sites. `wrangler.jsonc` configures a local D1 binding; `.openai/hosting.json` declares the hosted binding. Migration source lives in `drizzle/` and is copied to `dist/.openai/drizzle/` at build time. `ADMIN_BOOTSTRAP_PASSWORD` is an initial, server-only Sites secret and must never be committed.

Run `npm ci`, `npm run dev`, and apply the local D1 migration with `npx wrangler d1 migrations apply guitarist-local --local`. Run `npm run build` to produce `dist/server/index.js`, `dist/client/`, and `dist/.openai/`.

A React single-page prototype for teacher-guided guitar practice. Maple and cream styling with deep denim blue, muted copper, and teacher-earned pick badges. Hosted privately on OpenAI Sites.

## Run

Use Node.js 22+ and npm. Run `npm ci`, then `npm run dev`. Vite prints the preview URL.

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run test:e2e` (start the dev server on port 5173 first; install a Playwright Chromium browser or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`)

## Try the loop

Choose Noah in the demo selector. Practice an assignment and finish it. Switch to Jamie (Teacher), open Noah, and inspect Activity. Under Assess, mark skills after a fictional demonstration. When all Level 1 skills are mastered, explicitly unlock Level 2 under Overview. Switch back to Noah.

For targeted reinforcement, open Emma as teacher, choose Assess, A minor, and Shape memory. Assign reinforcement; it appears in Emma's practice. Rhythm and transition exercises require their corresponding chapter to be unlocked first.

## Prototype boundary

Emma, Noah and Jamie are fictional. All records, including notes, are stored on this browser/device in `guitarist.demo.v1`. Demo role switching is not authentication. Notes are omitted from student UI but are present in browser storage and are not confidential. Do not enter real student information. Reset uses the top-bar reset control and affects only Guitarist demo state. Private Sites access does not provide student/teacher authorization inside the app.

Level 1 and Em/Am practice are interactive. All eight chapters have structured content, while complete Levels 2–6 instruction, student creation/deletion, real accounts, durable shared persistence and server authorization belong to the subsequent MVP milestone. Timers record voluntary practice time, never mastery. Early finish leaves unfinished activities assigned.

## Architecture

Curriculum is in `src/curriculum`, immutable validated commands in `src/domain`, the replaceable demo adapter in `src/demo`, and route-level views in student/practice/teacher folders. Student digital actions cannot master skills or unlock levels. Teacher override reasons are recorded in progress history.

React Router handles deep links and browser history. Static production output is `dist`; `.openai/hosting.json` declares it. OpenAI Sites must serve the entry document for SPA paths. No custom 404.html is emitted, allowing static SPA fallback. Future APIs should use the Sites-compatible Workers runtime, with server-side tenant boundaries and a child-appropriate identity design.

Optional WebMCP tools are feature-detected: read the current learner's practice summary or navigate to practice. They accept no learner ID and never grant mastery, start timers, or complete work. Unsupported browsers use the normal UI. Real supported-context WebMCP validation was unavailable; input and state-boundary logic has unit coverage.

## Environment

No application secrets or environment variables are required. Deployment credentials are ephemeral, supplied through protected stdin, and never committed. External Google Fonts load for typography with local sans-serif fallbacks.

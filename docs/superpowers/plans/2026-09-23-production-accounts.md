# Guitarist Production Accounts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace Guitarist's fictional, device-local demo with a hosted SPA whose teacher can create username/password student accounts and whose learning records persist across devices.

**Architecture:** The Vite SPA calls a same-origin Worker API backed by Sites-managed D1. The Worker owns authentication, authorization, and domain mutations; the browser holds only an HttpOnly session cookie. The existing course UI becomes role-aware and loads real records.

**Tech Stack:** React 19, TypeScript, Vite 8, OpenAI Sites Vite plugin, Cloudflare Worker APIs, D1, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-23-production-accounts-design.md`

## Global Constraints

- Keep the existing Sites project ID and GitHub repository; never create a replacement Site.
- The deployed Site is for ages 13+ (or the local age of digital consent).
- Public visitors can view only sign-in; app records require a server-validated session.
- Students have display name, username, and password only; no email field or self-registration.
- The initial teacher password is a hosted secret; never place it in source, build output, logs, tests, or docs.
- The student cannot assess mastery, unlock chapters, view notes, or view another student.
- Teacher workflows and the acoustic visual language remain intact.

## Review Focus

- A disabled or password-reset account with an old cookie must get HTTP 401: pin in Task 2's session tests.
- Case variants of an existing username must be rejected: pin in Task 3's create-student tests.
- A student changing `studentId` in a command must get HTTP 403: pin in Task 3's isolation tests.
- Two tabs editing the same student revision must yield a conflict and reload path: pin in Task 3's concurrency tests.
- A deep link opened before auth loading finishes must not flash protected data: pin in Task 4's browser test.

---

### Task 1: Sites Worker and durable schema

**Files:**
- Modify: `package.json`, `package-lock.json`, `vite.config.ts`, `.openai/hosting.json`, `README.md`
- Create: `server/index.ts`, `server/db.ts`, `migrations/0001_accounts.sql`, `server/db.test.ts`, `.env.example`

**Interfaces:** `server/db.ts` exports `getAccountByUsername(db, normalizedUsername)`, `getStudentRecord(db, studentId)`, `saveStudentRecord(db, studentId, expectedRevision, state)`, and `createEmptyStudentState(studentId, name)`; later tasks use these. `server/index.ts` exports a Worker-compatible `fetch(request, env, ctx)` and routes `/api/*` separately from static SPA assets. `env.DB` is the `DB` D1 binding.

- [x] **Step 1: Write failing persistence tests.** Use a D1 test adapter or Miniflare-backed test database to assert that a newly created student record survives a fresh repository instance and that a stale revision is rejected. The essential assertion is:

```ts
const first = await saveStudentRecord(db, id, 0, nextState);
expect(first).toBe(true);
expect(await saveStudentRecord(db, id, 0, anotherState)).toBe(false);
expect((await getStudentRecord(db, id))?.state).toEqual(nextState);
```

- [x] **Step 2: Run `npm test -- server/db.test.ts` and confirm the persistence tests fail.**
- [x] **Step 3: Add the D1 schema and Worker build.** Define `accounts(id,username,username_key,role,password_salt,password_hash,password_iterations,display_name,disabled_at,created_at)`, `student_records(student_id,state_json,revision,created_at,updated_at)`, `auth_sessions(token_hash,account_id,expires_at,created_at)`, and `login_attempts(username_key,ip_key,attempts,blocked_until,updated_at)` with unique indexes and foreign keys. Add `"d1":"DB"` to the existing hosting manifest. Upgrade to Vite 8 and use the official Sites plugin so the build includes `dist/server/index.js`, SPA assets, and migrations. Keep local secret values untracked.
- [x] **Step 4: Run `npm test -- server/db.test.ts`, `npm run typecheck`, and `npm run build`; inspect `dist/server/index.js`, `dist/.openai/hosting.json`, and migration packaging.**
- [x] **Step 5: Commit the schema, Worker shell, and build configuration.**

### Task 2: Authentication and session boundary

**Files:**
- Create: `server/password.ts`, `server/sessions.ts`, `server/auth.ts`, `server/auth.test.ts`
- Modify: `server/index.ts`, `README.md`

**Interfaces:** `hashPassword(password)` returns `{salt, hash, iterations}`; `verifyPassword(password, account)` returns a boolean. `requireSession(request, env)` resolves a non-disabled account or returns null. Routes: `POST /api/login`, `GET /api/me`, `POST /api/logout`. The first teacher login bootstraps `Ktr0nn` using `env.ADMIN_BOOTSTRAP_PASSWORD` only if no teacher row exists. No response includes credential material.

- [x] **Step 1: Write failing route tests for successful teacher bootstrap/login, generic failure for wrong credentials, durable rate limiting, cookie flags, logout revocation, invalid Origin, old cookies after account disable/reset, and no secret in JSON.** For example:

```ts
expect(login.status).toBe(200);
expect(login.headers.get("set-cookie")).toMatch(/HttpOnly.*Secure.*SameSite=Lax/i);
expect((await fetchAsStudent("/api/me")).status).toBe(200);
expect((await fetchWithRevokedCookie("/api/me")).status).toBe(401);
```

- [x] **Step 2: Run `npm test -- server/auth.test.ts` and confirm failure.**
- [x] **Step 3: Implement password hashing with WebCrypto PBKDF2-SHA-256, a random per-account salt, an explicit iteration count, and constant-time hash comparison. Issue 256-bit random session tokens and store only their SHA-256 digest. Use `Secure; HttpOnly; SameSite=Lax; Path=/` cookies with a finite lifetime. Require same-origin `Origin` and JSON content type on mutations; set `Cache-Control: no-store` on API responses. Apply persistent username/IP throttling and generic login errors.**
- [x] **Step 4: Run auth tests, typecheck, and lint; verify no password/token value is logged or returned.**
- [x] **Step 5: Commit the auth boundary.**

### Task 3: Teacher accounts and server-authorized learning API

**Files:**
- Create: `server/students.ts`, `server/commands.ts`, `server/students.test.ts`, `server/commands.test.ts`
- Modify: `server/index.ts`, `src/domain/commands.ts`, `src/domain/types.ts`

**Interfaces:** Routes: `GET /api/state`, `POST /api/students`, `PATCH /api/students/:id/credentials`, `PATCH /api/students/:id/status`, `POST /api/commands`. `GET /api/state` returns only the current student's public record for a student and all student records for the teacher, excluding password fields for both and teacher-private notes for students. Command requests carry a student revision; server derives actor from the session and stamps timestamp/IDs. A stale revision returns 409 and the client reloads.

- [x] **Step 1: Write failing API tests for create with no email, duplicate username ignoring case, invalid names/passwords, teacher-only create/reset/disable, session revocation, student practice success, cross-student command rejection, notes omission, stale revision conflict, and duplicate practice-session idempotency.** Key contract:

```ts
expect((await createStudent({displayName:"Alex",username:"alex",password:"test-secret"})).status).toBe(201);
expect((await createStudent({displayName:"Other",username:"ALEX",password:"test-secret"})).status).toBe(409);
expect((await studentCommand({studentId:someoneElse,type:"assess"})).status).toBe(403);
```

- [x] **Step 2: Run `npm test -- server/students.test.ts server/commands.test.ts` and confirm failure.**
- [x] **Step 3: Implement the account and learning routes. Reuse `applyCommand` for domain validation on the server, but create authoritative timestamps and IDs there. Derive the actor from the cookie; never honor a client role. Store the student state with revision-checked SQL, reloading on a conflict. Create new students at level 1 with all skills initially not introduced. Return only data permitted for that role. Invalidate sessions when credentials or status change.**
- [x] **Step 4: Run server tests, typecheck, and lint. Inspect every API response shape for hashes, tokens, notes, and other students.**
- [x] **Step 5: Commit the server learning API.**

### Task 4: Login-first SPA and real teacher/student flows

**Files:**
- Create: `src/auth/LoginPage.tsx`, `src/auth/api.ts`, `src/teacher/StudentAccountForm.tsx`
- Modify: `src/app/App.tsx`, `src/components/AppShell.tsx`, `src/demo/StoreProvider.tsx` (rename to `src/app/StoreProvider.tsx`), `src/teacher/Dashboard.tsx`, `src/teacher/StudentDetail.tsx`, `src/teacher/AssessmentForm.tsx`, `src/teacher/AssignmentForm.tsx`, `src/practice/PracticePage.tsx`, `src/student/LevelPage.tsx`, `src/student/Dashboard.tsx`, `src/student/ProgressPage.tsx`, `src/app/styles.css`, `src/app/visual-refinement.css`, existing imports and tests
- Delete: `src/demo/seed.ts`, `src/demo/storage.ts`, `src/demo/storage.test.ts`
- Create: `e2e/accounts.spec.ts`

**Interfaces:** `useStudio()` exposes `{status,actor,state,dispatch,createStudent,resetStudentPassword,setStudentDisabled,login,logout,refresh}`. `dispatch(command)` returns `Promise<Result<DemoState>>`. `status` is `loading | signed-out | ready | error`. The root route shows `LoginPage` when signed out and redirects authenticated users by role.

- [x] **Step 1: Write failing browser tests for root sign-in, direct protected deep link, no protected flash during loading, teacher create student without email, student login on a fresh browser context, practice persistence after reload, teacher seeing that session, and logout.**
- [x] **Step 2: Run `npm run test:e2e -- e2e/accounts.spec.ts` and confirm failure.**
- [x] **Step 3: Replace the demo provider with API-backed loading and mutation handling. Convert synchronous command handlers to await the server result. Put login at `/`; redirect authenticated roles to `/teacher` or `/student`. Handle 401, 409, network errors, and retry. Ensure teacher curriculum can render with zero students. Replace demo controls with current account and logout, and remove fictional copy. Add teacher create/reset/disable forms, visible pending/error states, keyboard labels, and tablet-friendly sizing. Preserve current guitar art and course components.**
- [x] **Step 4: Run the browser test, existing unit tests, typecheck, lint, and build. Update tests that intentionally depended on fictional state to use explicit fixtures, without retaining demo behavior in production.**
- [x] **Step 5: Commit the SPA conversion.**

### Task 5: Production cutover and audience verification

**Files:**
- Modify: `README.md`, `.env.example`, `docs/superpowers/plans/2026-09-23-production-accounts.md` (check completed steps)

**Interfaces:** Production URL remains `https://guitarist-practice.ktr0nn.chatgpt.site`; the existing Sites project ID remains unchanged. GitHub `main` and the Sites source repository point to the same validated commit.

- [x] **Step 1: Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, and `npm run build`; review the diff and scan source/dist for accidental secrets and fictional-demo references.**
- [x] **Step 2: Configure `ADMIN_BOOTSTRAP_PASSWORD` as a Sites secret using the requested value, push the exact committed source to the Sites source repository, package build output and migrations from that commit, and deploy privately.**
- [x] **Step 3: Verify teacher login and student creation on the live private Site. Verify anonymous `/api/state` returns 401, student-only `/api/state` excludes teacher notes and other students, and cross-student mutations return 403. Remove the bootstrap secret after its one-time use, redeploy the same saved source, and verify login still works.**
- [x] **Step 4: Change the Site audience to public as approved in the design. In a fresh anonymous browser, verify `/` is login-only and protected deep links/API are inaccessible. Log in as a test student without a ChatGPT account or email and verify persistence across a second device context.**
- [x] **Step 5: Push the validated commit to GitHub `main`, confirm the working tree is clean, and report the production URL and any remaining operational limits.**

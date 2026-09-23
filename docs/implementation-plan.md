# Guitarist Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Deliver a private OpenAI Sites prototype of Guitarist with a complete student practice and teacher assessment loop.

**Architecture:** React SPA with client-side routes and separate curriculum, domain rules, and demo persistence modules. A typed state adapter supports a future Sites-compatible API without changing the learning model. This milestone uses fictional data only.

**Tech Stack:** React, Vite, strict TypeScript, React Router, CSS, Vitest, React Testing Library, Playwright; static deployment on OpenAI Sites.

**Spec:** `docs/superpowers/specs/2026-09-23-guitar-mastery-design.md`

## Global Constraints

- The application is named **Guitarist**.
- OpenAI Sites is the required deployment target.
- Teachers alone approve physical mastery and unlock levels.
- Digital activity records practice and readiness, never proof of physical technique.
- All displayed people are fictional.
- Full Levels 2–6 instruction belongs to subsequent MVP work.
- The role/person selector is a demonstration control, not authentication or an authorization boundary.
- Local preview and the hosted Site have separate browser storage; the snapshot is not shared between devices or users.
- No microphone, analytics, public profiles, social rankings, payments, or external messaging.

## Review Focus

1. Corrupt or blocked browser storage must produce a usable in-memory demo and a visible explanation (Task 2).
2. Repeated completion clicks must not duplicate time, session records, or badges (Tasks 1 and 4).
3. Background tabs, pause/resume, and route changes must not overcount time or leave audio playing (Task 4).
4. Direct locked/unknown routes and browser history must preserve the learner boundary and show useful navigation (Tasks 3 and 6).
5. Teacher override and reinforcement inputs must reject empty reasons, invalid targets, and unknown records without partial state mutation (Tasks 1 and 5).

## File map

Create the application in `guitarist/`, an isolated Site checkout inside this workspace, preserving the approved documents. Paths below are relative to that directory.

- `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `eslint.config.js`, `index.html`: runtime and validation configuration.
- `src/main.tsx`, `src/app/App.tsx`, `src/app/styles.css`: entry, router, and shared visual tokens.
- `src/curriculum/types.ts`, `src/curriculum/foundations.ts`, `src/curriculum/chords.ts`: typed learning content and diagram data.
- `src/domain/types.ts`, `src/domain/commands.ts`, `src/domain/selectors.ts`: state, validated mutations, and derived progression.
- `src/demo/seed.ts`, `src/demo/storage.ts`, `src/demo/StoreProvider.tsx`: fictional records, versioned snapshots, React subscription.
- `src/components/AppShell.tsx`, `StatusBadge.tsx`, `ChordDiagram.tsx`, `Feedback.tsx`: reusable accessible UI.
- `src/student/Dashboard.tsx`, `LevelPage.tsx`, `ProgressPage.tsx`, `Exercises.tsx`: student surfaces.
- `src/practice/PracticePage.tsx`, `timer.ts`, `Metronome.tsx`: focused session and audio lifecycle.
- `src/teacher/Dashboard.tsx`, `StudentDetail.tsx`, `AssignmentForm.tsx`, `AssessmentForm.tsx`: teaching workflow.
- `src/integrations/webmcp.ts`: feature-detected access to real demo navigation/state.
- `src/**/*.test.ts`, `src/**/*.test.tsx`, `e2e/learning-loop.spec.ts`, `playwright.config.ts`: meaningful automated checks.
- `public/favicon.svg`, `.openai/hosting.json`, `README.md`, `.env.example`: branding, deployment metadata, operating instructions.

## Task 1: Curriculum and validated learning engine

**Interfaces:** Export `DemoState`, `Actor`, `Command`, `Result<T>` from domain types; `applyCommand(state: DemoState, actor: Actor, command: Command): Result<DemoState>` from commands; `canUnlock(state: DemoState, studentId: string, levelId: string): boolean` and `earnedBadgeIds(state: DemoState, studentId: string): string[]` from selectors. Use discriminated unions, never client role assertions as a claim of security.

- [ ] Create the Vite React TypeScript project using a sanitized SPA template through Sites' portable template setup. Install once using the Sites installer. Configure scripts `dev`, `build`, `lint`, `typecheck`, `test`, and `test:e2e`. TypeScript must set `strict: true`; Vitest runs with `vitest run`.
- [ ] Define the seven status literals and the course/level/skill/activity/mastery-check interfaces. Define commands `assess`, `assign`, `unlock`, `completePractice`, and `saveNote`, with explicit student IDs, stable IDs, and timestamps. Assessment accepts a status and optional reinforcement reason; unlocking accepts an optional override reason. Completion accepts a session ID, elapsed seconds, and completed assignment item IDs.
- [ ] Add engine tests before implementation, using fresh seed data per test:

```ts
expect(applyCommand(seed(), { role: 'student', studentId: 'noah' }, {
  type: 'assess', studentId: 'noah', skillId: 'string-numbers',
  status: 'MASTERED', at: '2026-09-23T12:00:00Z'
}).ok).toBe(false);
expect(canUnlock(seed(), 'noah', 'level-2')).toBe(false);
expect(earnedBadgeIds(seed(), 'noah')).not.toContain('guitar-explorer');
```

- [ ] Run `npm test -- src/domain/commands.test.ts` and verify failure before implementing. Add test fixtures for valid teacher assessment, optional-skill exclusion, explicit unlock after prerequisites, reason-required override, missing IDs, invalid assignment minutes/repetitions, and duplicate session completion. Assert rejected commands leave original state unchanged.
- [ ] Implement immutable command validation and selectors. Do not unlock on assessment or award physical mastery on completion. Validate finite nonnegative durations, positive assignment targets, known activity IDs, actor/student ownership in demo rules, and nonblank override reasons.
- [ ] Populate all eight levels with names, descriptions, skill IDs, mastery criteria, and badges. Fully author Level 1 and Em/Am shape, string-check, reconstruction, and transition activities. Store string numbering explicitly: 1 high E through 6 low E. Store Em and Am frets/fingers independently from UI.
- [ ] Run domain tests and `npm run typecheck`; commit the verified learning engine and configuration.

## Task 2: Seed state and resilient demo storage

**Interfaces:** `seed(): DemoState`; `loadDemo(storage: Storage): { state: DemoState; warning?: string }`; `saveDemo(storage: Storage, state: DemoState): { warning?: string }`; `useDemo(): { state: DemoState; actor: Actor; dispatch(command: Command): Result<DemoState>; selectActor(actor: Actor): void; reset(): void }`.

- [ ] Seed Emma at Level 3, Em mastered, Am practicing; seed Noah at Level 1 with introduced fundamentals. Provide realistic assignments, demo notes, and dated history without inventing real learner data.
- [ ] Write storage tests that pin malformed JSON, wrong version, unknown referenced records, and write exceptions:

```ts
storage.setItem('guitarist.demo.v1', '{broken');
const loaded = loadDemo(storage);
expect(loaded.state.students.map(s => s.id)).toEqual(['emma', 'noah']);
expect(loaded.warning).toBeTruthy();
```

- [ ] Run `npm test -- src/demo/storage.test.ts` and observe failure. Implement schema checks and safe fallback, preserving in-memory operation when storage throws. Reset affects only Guitarist's storage key.
- [ ] Implement provider dispatch through `applyCommand`; only accepted state persists. Announce storage errors accessibly. Add provider integration tests for switching between teacher and the student, state visibility, and reset.
- [ ] Run storage/provider tests and typecheck; commit the demo adapter.

## Task 3: Student learning surfaces and first preview

**Interfaces:** Student views consume `useDemo()` and structured curriculum; reusable `ChordDiagram({ chordId }: { chordId: string })` reads chord data and exposes each string's fret/finger text. `AppShell` renders the route outlet and role selector.

- [ ] Build shared ivory/ink/teal tokens, responsive navigation, demo label, Guitarist title/description, and custom favicon. Use semantic links, buttons, and labeled controls with visible focus and touch targets of at least 44 pixels.
- [ ] Build `/student` as the smallest coherent first preview: Emma's current level, practice cards, next demonstration goal, and working navigation to her practice. Start the development server and show this surface using the Sites portable preview workflow before broadening product edits.
- [ ] Add `/student/learn`, `/student/learn/:levelId`, and `/student/progress`. Build Level 1 guitar-part identification, finger-number challenge, string-number challenge, and first-note guidance. Interactive diagrams must have keyboard-operable choices and equivalent text. Digital answers produce supportive feedback without changing mastery.
- [ ] Build chord diagrams with explicit muted/open strings and numbered fingers; implement chord reconstruction against curriculum data. Include Em/Am lessons needed by Emma's assignment.
- [ ] Add component tests with MemoryRouter for locked and unknown routes:

```tsx
renderDemoAt('/student/learn/level-6', { studentId: 'noah' });
expect(screen.getByText(/your teacher will unlock/i)).toBeVisible();
expect(screen.queryByRole('button', { name: /start this lesson/i })).toBeNull();
```

- [ ] Verify all eight levels display with textual statuses, actual teacher-approved badge eligibility, and no invented percentage progression from quiz scores. Include assignment/history empty states and reduced-motion styling.
- [ ] Run student tests and typecheck; commit the connected learning surfaces.

## Task 4: Practice session, honest timer, and metronome

**Interfaces:** `elapsedSeconds(segments: Array<{ start: number; end: number }>, activeStart: number | null, now: number): number` uses monotonic milliseconds; PracticePage submits `completePractice` once with a stable session ID. Metronome owns its audio context and cleanup.

- [ ] Write timer and completion tests first:

```ts
expect(elapsedSeconds([{ start: 0, end: 2000 }], 8000, 11000)).toBe(5);
expect(elapsedSeconds([{ start: 0, end: 2000 }], null, 11000)).toBe(2);
```

- [ ] Run failing timer tests. Implement elapsed intervals using `performance.now()`, not interval tick counts; pause records a closed segment. Disable duplicate completion and verify domain idempotency. Finishing early saves elapsed time, never the target duration.
- [ ] Connect `/student/practice` to assignment steps with instructional content, chord diagrams, pause/resume, next-step controls, actual duration summary, and clear unfinished-session navigation handling. Stop timers and metronome on exit; do not save incomplete steps as completed.
- [ ] Add metronome BPM input for 40–80, large visual beat, start/stop, and optional count-in. Create audio only on gesture, schedule clicks against audio time, suspend safely when hidden, and show a visual-only explanation if audio cannot initialize.
- [ ] Test unmount cleanup, hidden-tab behavior, denied audio, invalid BPM, and double completion. Verify the teacher activity view receives one session and quiz completion never masters a skill.
- [ ] Run practice/domain tests and typecheck; commit guided practice.

## Task 5: Teacher assignments, assessment, and reinforcement

**Interfaces:** Forms issue the existing `assign`, `assess`, `unlock`, and `saveNote` commands. Reinforcement reason union: `placement | memory | clean-tone | rhythm | transition | other`; structured mappings return selectable activity IDs, with custom guidance required for `other`.

- [ ] Build `/teacher`, `/teacher/students/:studentId`, and assignment forms. Show current assignments, recent activity, assessment-ready skills, notes, and lesson goal in a scannable desktop/tablet layout.
- [ ] Write integration tests for assign → student visibility → practice completion → teacher review, and targeted Am reinforcement:

```tsx
await user.selectOptions(screen.getByLabelText('Reinforcement reason'), 'memory');
expect(screen.getByText(/rebuild Am from memory/i)).toBeVisible();
await user.click(screen.getByRole('button', { name: 'Assign reinforcement' }));
expect(readDemoState().assignments.at(-1)?.items[0].activityId)
  .toBe('am-reconstruction');
```

- [ ] Run the new tests to establish failures, then implement explicit assessment actions, reviewed reinforcement assignments, and teacher-confirmed unlocking. Present prerequisite recommendations; require a recorded reason for override. Student views never render notes, while clearly documenting that all demo state is client-readable.
- [ ] Validate blank notes/reasons, nonfinite or negative targets, deleted/unknown IDs, and invalid transitions. Preserve entered form content after validation errors and restore focus on dialog close.
- [ ] Run teacher integration/domain tests and typecheck; commit teacher workflow.

## Task 6: End-to-end verification and private Sites delivery

**Interfaces:** Build emits `dist`; `.openai/hosting.json` records the native Sites project ID and `static.directory: "dist"`. Feature-detected WebMCP tools consume the same store/router as the visible app; no alternate mutation path.

- [ ] Add a read-only `get_practice_summary` tool and a `navigate_to_practice` tool using the documented `document.modelContext` API, unknown-input validation, and AbortSignal cleanup. Test valid/invalid inputs in a supported permitted context; if unavailable, report that limitation without blocking hosting.
- [ ] Add Playwright E2E for Noah's full practice/teacher mastery/explicit Level 2 unlock and Emma's memory reinforcement. Assert no automatic unlock after practice. Add direct route reload and back/forward checks using the SPA fallback server:

```ts
await page.goto('/student/progress');
await page.reload();
await expect(page.getByRole('heading', { name: /your progress/i })).toBeVisible();
await page.getByRole('link', { name: 'Home', exact: true }).click();
await page.goBack();
await expect(page).toHaveURL(/\/student\/progress$/);
```

- [ ] Verify desktop and mobile layouts, keyboard order, status text, diagram labels, reduced motion, and no horizontal overflow. Fix failures in source and rerun affected checks.
- [ ] Write README covering setup, test commands, state reset, browser-local persistence, private-demo limitations, route fallback, and next backend milestone. `.env.example` explains that the prototype needs no secrets; never store Sites credentials in files.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, and `npm run build`. Record actual results and any environment limitations; do not describe skipped checks as passing.
- [ ] Register Guitarist through native Sites tools, preserving the private default audience. Use the Sites source workflow and build helper to package the verified output and publish it. Pass credentials only via the workflow's protected stdin. Verify the native deployment status reports success and provides a URL; do not invent a URL.
- [ ] Commit coherent verified source changes through the Sites workflow. Deliver the private URL, concise feature summary, verification results, and explicit prototype/authentication boundary. Keep planning documents synchronized with any implementation-driven architecture changes.

## Self-review

The six tasks cover the approved seven surfaces, structured curriculum, teacher authority, reinforcement, resilient demo state, accessibility, test requirements, and private Sites publication. Each review-focus item has an owning task and a concrete test condition. No production authentication or real student data is implied by this prototype. Native execution is recommended because the six tasks share a compact domain/store contract and sequential integration is straightforward.

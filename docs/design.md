# Guitarist — prototype design

Status: Approved by the user on 2026-09-23, including Guitarist branding, SPA architecture, and OpenAI Sites hosting.

## Product baseline

The application is named **Guitarist**, as specified by the user. Use Guitarist in application branding, page titles, and deployment metadata. Beginner Guitar Foundations remains the course name.

The supplied Beginner Guitar Mastery App specification v1.0 is the product baseline. This milestone implements its recommended first task (§43): a functional, responsive prototype demonstrating teach → assign → practice → demonstrate → assess → advance or reinforce.

Students learn at their own pace. Teachers alone approve physical mastery and unlock levels. Digital activity records practice and readiness, never proof of physical technique. Reinforcement distinguishes conceptual understanding from motor development. All displayed people are fictional.

## Repository findings

The workspace contains Git metadata and environment configuration directories, but no application, dependencies, documentation, or reusable components. No applicable AGENTS.md was found in the workspace or inspected ancestors. There is no functioning application to migrate.

## Architecture decision

Build a single-page application (SPA) using React, Vite, and strict TypeScript, with responsive CSS and a small accessible component layer. This follows the user's explicit SPA requirement. Keep curriculum, learning rules, demo state, and presentation in separate modules.

Use React Router for client-side student and teacher routes. Navigation updates the view without a full-page reload; browser back/forward and deep links must work. OpenAI Sites is the required deployment target, per the user's explicit direction. Vite produces static assets in `dist`; declare that public output directory in `.openai/hosting.json` using `static.directory`. Configure and verify SPA route fallback while preserving normal asset and API handling. Server rendering is not required.

Keep data access behind a typed adapter so the device-local prototype can later use an HTTP API hosted with the Site using a Cloudflare Workers-compatible runtime. That API will enforce authentication, authorization, input validation, and teacher-note privacy; frontend route guards are only navigation controls. Evaluate Sites-managed D1 persistence and Sites authentication during the persistence milestone, including whether the available sign-in flow fits younger students. Use HTTP-compatible integrations for any external services. The SPA and OpenAI Sites requirements supersede the baseline's suggested Next.js and hosting options.

Develop and preview the prototype locally, then publish it privately on OpenAI Sites using the Sites registration, build, and deployment workflow. Use in-memory state with a versioned, device-local demo snapshot to preserve fictional progress across refreshes, plus a reset-demo action. Show a persistent demo label. Local preview and the hosted Site have separate browser storage; the snapshot is not shared between devices or users. The role/person selector is a demonstration control, not authentication or an authorization boundary. Never enter real student information or claim that teacher notes are private in this client-only milestone.

## User experience

Use light maple and warm cream surfaces, walnut typography, and amber accents, with no green anywhere in the app (user refinement during implementation), large readable cards, and clear chord diagrams. Student navigation contains Home, Learn, Practice, and Progress. Teacher navigation centers on the student roster and individual lesson workspace. Mobile and tablet layouts keep practice controls and assessment actions easy to reach.

Build these connected surfaces:

1. Student dashboard: current level, assigned practice, next demonstration goal, and honest practice activity summaries.
2. Level 1 Guitar Explorer: guitar parts, numbered strings, numbered fingers, relaxed instrument posture, basic picking, and a first single-string musical exercise.
3. Practice session: assigned steps, chord diagrams when relevant, pause/resume timer, next step, optional metronome, and completion summary.
4. Progress: all eight named levels, skill statuses, locked-level explanations, and teacher-awarded level badges.
5. Teacher dashboard: Emma and Noah, recent practice, pending assessments, and next lesson goals.
6. Student detail: skill list, assignments, activity history, and demo teacher notes.
7. Assessment interaction: introduce a skill, continue practice, mark readiness, mark mastery, or choose a reinforcement reason and assign the corresponding activity. Level advancement always requires a teacher action.

Seed Emma at Level 3 with Em mastered and Am practicing. Seed Noah at Level 1 with introduced fundamentals. The demo selector lets a reviewer practice as either learner and inspect the resulting activity as teacher in the same browser.

## Structured content and domain model

Represent the course as typed Course, Level, Skill, Activity, and MasteryCheck records. Skill records reference activity IDs and explicit mastery criteria; content is not embedded in page components. Include all eight levels as structured curriculum, with Level 1 fully interactive and sufficient chord and reinforcement content for Emma's complete demonstration loop. Full Levels 2–6 instruction belongs to subsequent MVP work.

StudentSkill uses the seven baseline statuses: NOT_INTRODUCED, INTRODUCED, LEARNING, PRACTICING, READY_FOR_ASSESSMENT, MASTERED, NEEDS_REINFORCEMENT. Pure domain functions validate transitions and record actor and time. Student practice cannot set MASTERED or unlock a level. Teachers can assess and explicitly override an advancement recommendation, with a recorded reason.

Assignments contain student ID, activity references, minute/repetition targets, and completion state. Practice sessions record actual elapsed unpaused time and completed steps. Finishing early records actual time; timers are self-reported practice activity, not evidence of mastery. Repeated completion must not duplicate session records or badges.

Reinforcement maps placement, memory, clean tone, rhythm, and transition issues to distinct structured exercises. A teacher reviews the selected exercise and target before assigning it. Assessment, assignment changes, and practice completion update both student and teacher views.

Level badge eligibility depends on teacher-confirmed required skills. Unlock eligibility is a recommendation until confirmed by a teacher. Optional skills do not block advancement. A locked level cannot be accessed through direct navigation as an active student lesson.

## Interaction and accessibility

Use semantic buttons and inputs, visible keyboard focus, text status labels, accessible dialog focus handling, and reduced-motion support. Chord diagrams must expose text equivalents identifying each string, fret, and finger. The metronome starts sound only after a user gesture, provides a visual pulse and stop control, and stops on unmount. Timers stop when the session is ended; pause/resume must not count paused time.

Handle no assignments, no practice history, unavailable browser audio, invalid stored demo data, and unknown routes explicitly. Restore safe seed state when a snapshot cannot be read, with an explanatory message. Do not add microphones, analytics, public profiles, social rankings, payments, or external messaging.

## Verification and acceptance

Run lint, strict type checking, domain tests, integration tests, and a production build before declaring the prototype complete. Verify desktop and narrow-screen layouts in a browser and exercise keyboard navigation. Verify client-side navigation, back/forward behavior, and direct route loads and refreshes using a server configured with SPA fallback.

Test mastery restrictions, explicit level unlocking, assignment validation, targeted reinforcement selection, badge eligibility, timer accounting, and duplicate-completion protection. The primary demonstration is: teacher assigns Noah an introduced Level 1 activity → Noah completes practice → teacher sees activity → teacher assesses required skills → teacher explicitly unlocks Level 2. Separately verify Emma receives a memory-specific Am reconstruction assignment after reinforcement assessment.

Prototype role checks are domain tests, not proof of secure authorization. Real server authorization and tenant isolation tests are required in the persistence/authentication milestone.

## Delivery sequence

1. Scaffold the application and document runtime commands; add curriculum types and tested learning rules.
2. Build the student dashboard and learning surface with the final visual direction.
3. Connect practice, elapsed-time recording, chord diagrams, and the metronome.
4. Connect teacher assignments, assessment, reinforcement, notes, and explicit advancement.
5. Add progress, demo persistence/reset, responsive refinements, and error/empty states.
6. Verify the complete loop, publish privately on OpenAI Sites, confirm successful deployment, and document the prototype boundary and backend follow-up.

## Subsequent MVP milestone

Replace the demo adapter with a Sites-compatible HTTP API backed by a database and mature authentication integration, retaining the React SPA frontend and OpenAI Sites hosting. Enforce teacher/student ownership and tenant boundaries on the server, keep notes out of student responses, support student creation/deletion and access, complete Levels 1–6, and test authorization end to end. Confirm database and student identity requirements against Sites capabilities before implementing that milestone. The prototype is not ready for use with real children.

## Approved visual refinement

The user later requested the full visual-improvement set and a richer color scheme. Guitarist now pairs the maple/cream base with deep denim blue for primary actions and muted copper accents, retains large chord diagrams and learning previews, adds eight distinct teacher-earned pick badges on a connected progress path, and applies subtle maple grain only to the hero. No green is used.

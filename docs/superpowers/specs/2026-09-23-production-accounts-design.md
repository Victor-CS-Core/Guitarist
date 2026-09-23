# Guitarist production accounts and persistence

## Purpose and scope

Guitarist becomes a working, single-page teaching studio for students ages 13 and older. The root URL presents only sign-in. The teacher signs in as `Ktr0nn`, creates students using usernames and passwords without email addresses, and manages the existing assignment, assessment, level-unlock, and lesson-note workflows. A student signs in from any device and sees only their own learning path and practice history. The existing acoustic visual design remains.

This replaces fictional browser-local data; it does not import the demo students or claim they are real. The release must not show sample people or a demo role switcher.

## Hosting and audience

Keep the existing React/Vite SPA and existing OpenAI Sites project. Add a Cloudflare-compatible Worker API and Sites-managed D1 binding to the same deployment. Serve the SPA on application paths and route `/api/*` to the Worker. The Site's audience changes from owner-only to public after the authenticated release is verified, because student accounts have no email or ChatGPT identity to use with Sites invitations. The public entry point exposes sign-in only; application data requires an authenticated app session. The app is intended only for ages 13+ (or the local age of digital consent), consistent with Sites' current hosting limits.

## Accounts and authentication

One teacher account has username `Ktr0nn`. Its requested initial password is held only in a Sites secret and used once to create a salted password hash in D1. The password itself must never appear in Git, built assets, logs, responses, tests, or documentation. After successful bootstrap, remove the hosted bootstrap secret and redeploy without it. No open registration or public teacher creation exists.

The teacher creates a student with a display name, unique username, and password. Neither the form nor schema requires an email. The teacher can reset a student's password and disable the account; both actions invalidate that student's active sessions. Usernames are normalized for uniqueness while retaining the entered display casing. Passwords are hashed with a per-account random salt and a Worker-compatible adaptive KDF. A login failure gives a generic response and uses persistent rate limiting. Sessions use random opaque tokens stored only as hashes in D1; the browser receives the token through a Secure, HttpOnly, SameSite cookie with a finite expiration. Logout revokes the session. State-changing requests require an expected Origin and JSON content type.

## Data and authorization

D1 holds accounts, student records, login throttling, and sessions. Each student record contains the existing domain state: level and skill progress, assignments, practice sessions, events, and teacher notes. The Worker identifies the actor from the session cookie and performs the existing command checks on the server. It never accepts a client-supplied role. Only the teacher may create/manage students, assign, assess, unlock, or write notes. A student may record practice only for their own account. The student API response excludes teacher-private notes and every other student's data. Mutations use a revision check so simultaneous tabs cannot silently overwrite progress; duplicate practice-session IDs remain idempotent.

Store timestamps and IDs on the server for authoritative records. Validate lengths, ranges, allowed command types, account status, and student ownership before writes. Return clear form errors without exposing password hashes or session tokens. Avoid collection of email and other personal data beyond the display name, username, password verifier, and learning records necessary to run the studio.

## SPA experience

At `/`, show a focused, accessible Guitarist sign-in screen in the current visual language. Signed-in users go directly to `/teacher` or `/student`. All deep links wait for session validation and redirect signed-out visitors to `/`; wrong-role routes redirect to that user's own home. Remove reset-demo controls, fictional names, and localStorage-backed state. The teacher dashboard starts with an empty state and a prominent Add student action. The form collects display name, username, and password, and the teacher can reset a student's password or disable access from that student's detail page. The existing teaching and student flows remain interactive and persist through the API. Show actionable loading and error states. Preserve tablet usability and keyboard access.

## Release and verification

Add local Worker/D1 development configuration and migrations. Test password hashing and login, rate limits, cookie and Origin defenses, account creation without email, teacher/student authorization, cross-student isolation, persistence after reload, duplicate practice submissions, password reset/session revocation, and disabled accounts. Run typecheck, lint, unit/integration tests, build, and browser flows for both roles. Verify the deployed Site while it remains owner-only. Change its audience to public only after checking that signed-out requests cannot read or mutate records; then verify a fresh anonymous browser sees only sign-in and a test student can sign in without ChatGPT or email. Retain the existing URL and GitHub repository.

## Explicit limits

The first release has one teacher account, no student self-registration, no email recovery, and no demo-data import. Teacher assessment is still the source of mastery; student practice remains self-reported. Guitarist must not be used as a Site targeted at children below Sites' minimum age.

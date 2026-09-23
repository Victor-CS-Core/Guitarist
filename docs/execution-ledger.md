# SDD ledger — plan: docs/superpowers/plans/2026-09-23-guitarist-prototype.md
Ruling: Use the approved isolated guitarist/ Site checkout instead of a linked worktree: parent repository has no commits and no code. Keeps application isolated and allows Sites source preparation to own its repository. Cost if wrong: parent/application history is separate.
Pre-flight: Tasks 1–2 share immutable command/state interfaces; Tasks 3–5 consume useDemo; Task 6 consumes the same store. No interface conflicts.
Task 1: active. Project configured and registered privately. Domain tests written before implementation.
Task 1: complete — 6 domain tests pass. Task 2: complete — 2 storage tests pass; strict typecheck passes.
Task 3: student surfaces implemented; locked route test passes; first meaningful preview opened.
Task 4: timer, metronome, session UI implemented; elapsed/pause test passes.
Ruling: User replaced green/teal direction with light acoustic wood tones; all greens removed in favor of maple, walnut and amber. No scope cost.
Ruling: Sites installer cannot be accessed outside sandbox; direct npm installation used with approved network access. Cost: equivalent dependencies installed without helper metrics.
Task 5: complete — teacher assignment/assessment/reinforcement integration passes.
Final review: independent agent reported four P2 findings, all fixed with failing regression tests then green verification: unfinished SPA navigation, query-route state, early finish accounting, targeted rhythm/transition selection.
Task 6: validation complete locally — 14 unit/integration tests, 6 browser E2E tests, lint, strict typecheck, production build passed. WebMCP supported-browser validation unavailable, feature-detected and unit-tested.
Ruling: The Sites plugin filesystem bundle disappeared during session while native Sites connector remains available. Publish through native Sites save/deploy tools with independently validated static archive and a stdin-only Git credential helper. Cost: bundled workflow metrics unavailable; exact pushed source/build identity still verified.
Ruling: Approved Sites publication is the integration choice; preserve local codex/guitarist-prototype branch and push exact HEAD to Sites' returned main branch. No GitHub PR or unrelated merge.

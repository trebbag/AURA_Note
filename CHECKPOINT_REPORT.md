# CHECKPOINT_REPORT

## CP-1 — Standalone clinical workflow shell ready

**Status:** Complete and merged to `main`. PR #5 passed GitHub Actions before `WO-006` began.

## Completed work orders

- `WO-002` — Schedule Builder appointment-note lifecycle.
- `WO-003` — Draft/Finalized Notes and Documentation Workspace shell.
- `WO-004` — Timer, recording gate, transcription scaffold.
- `WO-005` — Suggestions, Visit Selections, Compliance, History Gap Review.

## Acceptance evidence

- Schedule Builder creates synthetic standalone appointments and one-to-one inactive note shells.
- Start Visit activates the note into Draft Notes and creates a visit-session scaffold.
- Draft Notes, Finalized Notes, read-only finalized note viewer, and Documentation Workspace routes build in Next.js.
- Documentation Workspace exposes the required top panel, controls, editor, Visit Selections, Suggestions, Transcript, Compliance, and History Gap regions.
- Timer controls lock/unlock the editor through Start, Pause, Resume, and Stop behavior.
- Recording exception approval unlocks documentation without marking normal recording active.
- Mock transcript segments are source-marked and retained indefinitely.
- Raw audio metadata is classified as one-week `audio_ephemeral`; the worker can identify purge-eligible metadata.
- Deterministic mock Suggestions are draft-only and human-review-required.
- Low-confidence diagnosis/ICD candidates below 75 percent require override metadata.
- Accepted suggestions and manual additions move into Visit Selections.
- History Gap questions can create MA-owned blocker tasks.
- Compliance hard blocks disable Finalize-facing controls when unresolved blocker tasks exist.

## Validation commands

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm lint:phi`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `node scripts/status.js`
- `git diff --check`
- GitHub Actions `AURA Note CI / build-test` passed on PR #2, PR #3, PR #4, and PR #5.
- Final `WO-005` local gate passed before PR #5 was merged.

## Open risks

- CP-1 remains synthetic and process-local. Production persistence, migrations, live transcription, live EHR integration, and external AI remain out of scope.
- UI fidelity is functional workflow scaffolding, not final Figma design.
- Some package-level e2e scripts remain explicit deferrals until their later work orders introduce real browser/API harnesses.
- GitHub Actions emits a non-failing Node 20 action-runtime deprecation annotation; the project runtime remains pinned for now.

## Unresolved SPEC_GAPs

None discovered during CP-1.

## Next recommended batch

Begin CP-2 with `WO-006` through `WO-008`: Finalization Wizard steps, MA follow-up blocker resolution, patient summary/final note approval, Billing & Attest draft claim preview, and export/PDF/copy/final note viewer behavior. Keep the same synthetic-data and human-review boundaries.

## CP-2 — Finalization and dispatch ready

**Status:** Complete and merged to `main`. PR #8 passed GitHub Actions before merge.

## Completed work orders

- `WO-006` — Finalization Wizard steps 1 through 4.
- `WO-007` — Billing & Attest, draft claim preview, Sign & Dispatch.
- `WO-008` — Export/PDF/copy/final note viewer.

## Acceptance evidence

- Finalization starts from a frozen synthetic snapshot and enforces ordered Code Review, Suggestion Review, Compose, Compare & Edit, Billing & Attest, and Sign & Dispatch steps.
- Step 1 selected items and Step 2 final-pass suggestions require human keep/remove decisions.
- Compose creates deterministic enhanced-note and patient-summary draft outputs and blocks patient summaries containing internal billing/revenue/coding/coaching details.
- Compare & Edit requires separate final note and patient summary approvals.
- Draft claim preview is internal, caveated, candidate-only, and has `submittedClaim = false`.
- Billing & Attest requires required statements, estimate caveat acknowledgement, draft claim preview, and no unresolved blocker tasks.
- Sign & Dispatch creates read-only final note and patient summary records, removes the note from Draft Notes, and makes it available in Finalized Notes.
- Export/copy/PDF actions are blocked before signing and generate signed-version-locked artifacts after signing.
- Patient summary export artifacts assert internal details are excluded.
- EHR writeback queue status handles not-configured, queued mock, unsupported, and failed scaffold states without marking writeback complete.
- Linked-staff final-note visibility and export permissions are tested.
- Finalized Notes and the finalized-note viewer are browser-testable with read-only tabs, artifact status, and writeback status controls.

## Validation commands

- `pnpm --filter @aura-note/domain test`
- `pnpm --filter @aura-note/contracts test`
- `pnpm --filter @aura-note/security test`
- `pnpm --filter @aura-note/worker test`
- `pnpm --filter @aura-note/api typecheck`
- `pnpm --filter @aura-note/web typecheck`
- `pnpm --filter @aura-note/api test`
- `pnpm --filter @aura-note/api test:e2e`

Full repository gate and browser verification are recorded in `RUN_LOG.md` for the `WO-008` PR tranche after completion.

## Open risks

- CP-2 remains synthetic and process-local. Production persistence, PDF rendering/storage, live EHR writeback, live claim submission, external AI, and PHI-bearing integrations remain out of scope.
- EHR writeback is configuration-gated and represented by queue/status scaffolding only.
- UI fidelity remains functional workflow scaffolding until design work.

## Unresolved SPEC_GAPs

None discovered during CP-2.

## Next recommended batch

Begin CP-3 with `WO-009` through `WO-011`: AI Gateway and PHI boundary, athenahealth-first EHR adapter scaffolding, and ClinicOS integration adapter. Keep raw PHI out of external AI, keep all EHR behavior behind adapters, and preserve human review for clinical, billing, and writeback actions.

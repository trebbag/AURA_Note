# Test Plan

Codex should add tests as implementation proceeds.

## Unit tests

- Domain invariants.
- Note state machine.
- Appointment-note one-to-one invariant.
- Timer/editor gating.
- Low-confidence diagnosis override.
- Task blocker logic.
- Finalization wizard step requirements.
- Signed-output artifact readiness.
- EHR writeback queue readiness states.
- Coaching own-report and aggregate dashboard privacy.
- Support status and audit export permission boundaries.
- RBAC/ABAC decisions.
- PHI scrubber.
- Structured log redaction.
- Feature flag defaults for external integrations.
- AI response validation.
- Raw audio retention job.
- Transcript indefinite retention job.
- Audit export metadata generation.

## Integration tests

- Create appointment creates note shell.
- Start Visit activates timer/editor/recording/transcription.
- Suggestions evaluation updates Suggestions panel and Visit Selections.
- History Gap question routes to MA task.
- Open blocker task blocks signing.
- Finalization steps complete in order.
- Billing review triggers transcript access for billing staff.
- Sign & Dispatch creates final note/patient summary/export artifacts.
- EHR writeback queue behaves correctly in mock mode.
- Export/copy/PDF actions are blocked before signing.
- Patient summary exports reject internal billing/revenue details.
- Coaching own report denies billing staff and keeps patient-facing exclusions.
- Coaching aggregate dashboard hides clinician identifiers unless full-admin mode is explicitly authorized.
- Support status denies ordinary clinicians and exposes feature flags/retention posture to support users.
- Audit export request is compliance/admin-only, redacted, metadata-only, and excludes PHI.

## Browser / Playwright journeys

1. Standalone appointment to final dispatch.
2. Recording exception path.
3. Low-confidence diagnosis override.
4. MA follow-up blocker prevents signing until adjudicated.
5. Billing review triggers transcript access for billing staff.
6. Final note viewer is read-only after dispatch.
7. Patient summary PDF download flow.
8. Copy/export/writeback failure states remain visible in Finalized Notes.
9. Admin template and dot phrase creation.
10. Coaching own-scorecard visibility.
11. ClinicOS mode mock context loads without changing core UX.
12. Support hardening status route shows feature flags, retention posture, audit export posture, and failure states.
13. CP-4 route sweep renders Schedule, Draft Notes, Workspace, Finalization, Finalized Notes, Coaching, and Support hardening routes with synthetic data.

## Security tests

- Cross-tenant access denied.
- Unlinked staff final-note access denied.
- Billing transcript access denied unless billing review triggered.
- External AI rejects raw PHI fields.
- Logs redact forbidden keys.
- Support status does not grant audit export.
- External integration feature flags default to disabled.

## CP-4 acceptance readiness

`WO-014` adds `pnpm acceptance:readiness`, backed by `scripts/acceptance-readiness.js`. The validator checks:

- all defined work orders are marked `done` in `repo_status.json`;
- there are no active `SPEC_GAP` entries;
- browser route files exist for the implemented clinical, finalization, coaching, and support shells;
- API e2e files cover standalone, ClinicOS mock, AI PHI boundary, EHR scaffold, coaching, support, and finalization/export journeys;
- package-level unit tests exist for domain, contracts, security, AI gateway, EHR adapter, ClinicOS adapter, worker, and fixtures;
- OpenAPI paths and audit/event names exist for CP-1 through CP-4 behaviors;
- `CHECKPOINT_REPORT.md`, `RUN_LOG.md`, and `docs/CP4_ACCEPTANCE_READINESS.md` contain the CP-4 evidence needed for review.

## Post-CP4 persistence foundation

`WO-015` adds schema/tooling checks for the first durable persistence foundation:

- `pnpm db:schema:validate` validates the PostgreSQL Prisma schema using a synthetic local `DATABASE_URL` value;
- `pnpm db:migration:diff` generates PostgreSQL SQL from the Prisma datamodel without connecting to a live database;
- `pnpm persistence:foundation` runs schema validation plus `scripts/validate-persistence-foundation.js`;
- runtime repository replacement and database-backed e2e tests are deferred to a later numbered work order.

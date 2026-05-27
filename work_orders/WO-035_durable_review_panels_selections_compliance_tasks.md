# WO-035 — Durable Review Panels, Selections, Compliance, And Task Persistence

## Objective

Persist Suggestions, Visit Selections, Compliance issues, History Gap questions, and blocker Tasks through Prisma/local PostgreSQL while preserving draft-only, human-review-required behavior.

## Why this work order exists

`WO-005` made review panels browser/API-testable, and `WO-034` moves visit capture state into the first broader durable runtime slice. Review-panel state still uses process-local synthetic state and must become durable before P7 can be claimed.

## Prerequisites

- `WO-034` complete.
- Review-panel Prisma schema relations from `WO-025`.
- Current low-confidence override, blocker task, and compliance hard-block domain tests passing.

## In scope

- Prisma-backed local adapters for `Suggestion`, `VisitSelection`, `ComplianceIssue`, `HistoryGapQuestion`, and `Task`.
- Durable evaluate, accept, remove, manual-add, override, compliance, history-gap, and blocker-task state.
- Transaction and error-path tests for accepted/removed selections, blocker updates, and low-confidence overrides.
- Tenant/site query filters for every persisted review-panel read/write.
- Cross-tenant and cross-site denial tests at repository and API-harness layers.
- RLS SQL artifact and local PostgreSQL evidence for review-panel tables.
- Readiness script `pnpm persistence:review-panel-adapter`.

## Out of scope

- Live AI suggestion generation.
- Autonomous diagnosis, coding, billing, medical-necessity, charge, or claim finalization.
- Production PHI persistence.
- Live EHR or ClinicOS task synchronization.
- Production code/rules catalog authoring.

## UX requirements

- Existing Suggestions, Visit Selections, Compliance, History Gap, task, blocked, permission-denied, and demo states must continue to pass browser tests.
- Reloaded durable state must preserve accepted, removed, manually added, blocked, and low-confidence override states visibly.

## Backend/API requirements

- Review actions must validate input, enforce tenant/site scope, enforce permissions, and emit audit/event evidence.
- Low-confidence diagnosis suggestions below 75 percent must remain blocked until complete override metadata is present.
- Blocker tasks must continue to prevent signing/finalization preparation.
- The broad API runtime may remain in-memory unless this work order deliberately switches only the review-panel slice through a testable adapter boundary.

## Data model/persistence requirements

- Persist `Suggestion`, `VisitSelection`, `ComplianceIssue`, `HistoryGapQuestion`, and `Task` rows through Prisma/local PostgreSQL.
- Preserve source evidence, confidence, status, blocker, linkage, and note/site/tenant references.
- Add query indexes or constraints needed for tenant/site, note, selection, and task lookup.

## Event/audit requirements

- Persist or emit audit-safe evidence for suggestion evaluation, selection accepted/removed/manual-added, low-confidence override recorded, compliance issue raised/resolved, history-gap question created, and task blocker changed.
- Event payloads must not include raw transcript text unless an existing contract explicitly permits safe synthetic/local content.

## RBAC/ABAC requirements

- Treating clinicians and authorized admins can manage clinical review selections where linked and permitted.
- MA follow-up task visibility must remain minimum necessary.
- Billing/coaching flags remain restricted.
- Cross-tenant and cross-site reads/writes are denied before DTO exposure.

## Standalone-mode behavior

Standalone mode owns review-panel and task records.

## ClinicOS-integrated behavior

Task records must remain mappable to M04 WorkOS through adapter boundaries. ClinicOS must not bypass AURA Note tenant/site/RBAC/ABAC checks.

## AI/PHI/security requirements

Suggestions remain draft/candidate-only and human-review-required. No raw PHI may be sent to external AI. Logs must be redacted and correlated.

## Testing requirements

- Unit tests for repository mapping and review action invariants.
- Local PostgreSQL integration tests for reload, low-confidence override, blocker task signing denial, and transaction/error paths.
- Cross-tenant and cross-site denial tests.
- RLS read, insert, and update denial tests.
- API-harness tests proving denied persisted records are not exposed as DTOs.
- Browser/e2e regression for current review-panel workflow.

## Required scripts/gates

- `pnpm persistence:review-panel-adapter`
- `pnpm persistence:tenant-isolation`
- `pnpm acceptance:readiness`
- `pnpm production:readiness`
- Full standard local gate from `docs/PRODUCTION_BUILD_PLAN.md`.

## Definition of Done

- Review-panel and blocker-task state is locally durable through Prisma/PostgreSQL.
- Tenant/site repository and API-harness denial tests pass.
- Review-panel RLS policy artifact and evidence tests pass.
- Existing review-panel UX remains browser-testable.
- Low-confidence override and blocker-task signing behavior remain correct.
- No autonomous diagnosis, coding, billing, medical-necessity, charge, claim, live AI, live EHR, live ClinicOS, or production PHI storage is introduced.
- `RUN_LOG.md`, `repo_status.json`, relevant docs, and readiness scripts are updated.
- CI passes before merge.

## Stop conditions

- Missing/unsafe policy for diagnosis, medical-necessity, or blocker-task behavior blocks implementation.
- RLS or tenant/site enforcement cannot be proven after three focused repair attempts.
- A schema/API conflict would require guessing clinical, privacy, billing, or compliance behavior.

## Risks and deferred decisions

- Production code/rules catalog authoring remains deferred.
- Live AI suggestion generation remains deferred.
- Production PHI database policy remains deferred.

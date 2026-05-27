# WO-038 — Standalone Patient, Chart Context, And Schedule Completion

## Objective

Complete standalone patient shell, chart context snapshot, and Schedule Builder production workflow coverage in browser/API-testable form.

## Why this exists

Standalone mode must not depend on ClinicOS for core v1 operation. P7 proved local durable runtime foundations; P7.5 must make standalone patient/chart/schedule workflows complete enough for daily primary-care use before production platform and integration hardening continue.

## Prerequisites

- P7 complete through `WO-037`.
- Durable schedule/note, visit capture, review panel, finalization/output, audit/event/support/config/coaching metadata evidence is merged.
- No active SPEC_GAP blocks safe patient identifier, linkage, or chart context snapshot behavior.

## In scope

- Standalone patient create/search/edit shell with safe synthetic identifiers.
- Patient linkage for appointment, note, chart context, tasks, and finalization surfaces.
- Chart context snapshot scaffold with source freshness warnings and synthetic/local source metadata.
- Schedule Builder day/week workflow coverage.
- Appointment create/edit/cancel/no-show/check-in states with durable persistence and visible browser/API behavior.
- Tenant/site scoped repository/API tests and browser coverage for the standalone patient/schedule path.

## Out of scope

- Live EHR patient merge, production MPI, patient portal, patient-facing self-scheduling, live insurance eligibility, real patient data, production PHI storage approval, and live ClinicOS synchronization.

## UX requirements

- Patient/search/schedule screens include empty, loading, ready, saving, blocked, failed, permission-denied, read-only, and demo/fixture states where applicable.
- Schedule day/week states must support scan-friendly appointment status, note linkage, and safe patient identifiers.
- Chart context must show source freshness warnings without implying live EHR completeness.
- No patient-facing screen may expose internal billing, revenue, coaching, confidence, audit, or support metadata.

## Backend/API requirements

- Patient and schedule CRUD APIs must include validation, tenant/site scope, permission checks, audit/event evidence, and idempotency where duplicate writes are plausible.
- Appointment lifecycle updates for edit/cancel/no-show/check-in must preserve one appointment-to-one note invariants.
- Chart context snapshot endpoints must return source-linked synthetic/local metadata only.
- Standalone behavior must remain adapter-friendly for later ClinicOS/EHR integration.

## Data model/persistence requirements

- Durable `Patient`, patient linkage, chart context snapshot, and appointment status updates must be represented through Prisma/local PostgreSQL where the current schema supports it.
- If a missing table is required for safe patient linkage or chart context snapshots, add it with migration readiness, RLS, and tests, or create a SPEC_GAP if product policy is missing.
- Tenant/site isolation and RLS evidence must cover new or newly-used persisted tenant-owned rows.

## Event/audit requirements

- Patient shell create/update, patient linkage changes, chart context snapshot reads/refreshes, and appointment lifecycle changes must emit audit/event evidence where state changes occur.
- Events must remain metadata-safe and synthetic.

## RBAC/ABAC requirements

- Scheduler/front desk equivalent roles, clinicians, clinic managers, and authorized admins may perform only the operations permitted by the RBAC/ABAC matrix.
- Billing-only users must not gain patient chart/context access through scheduling surfaces.
- Patient linkage must be enforced before chart context or note detail exposure.

## Standalone-mode behavior

- AURA Note owns patient shells, schedule records, appointment status transitions, patient linkage, and chart context snapshots in standalone mode.
- Standalone patient identifiers must be safe synthetic/local identifiers in this work order.

## ClinicOS-integrated behavior

- External schedule/patient context must remain behind adapter/mode mapping boundaries.
- ClinicOS-integrated mode must map or safely degrade without bypassing AURA Note tenant/site, purpose-of-use, or role restrictions.

## AI/PHI/security requirements

- No real patient data or production PHI may be used.
- Chart context snapshots must preserve PHI boundary language and source freshness metadata.
- AI packaging may reference chart context snapshot metadata only through existing AI gateway guardrails; no live AI is enabled.

## Testing requirements

- Unit/integration tests for patient shell create/search/edit, patient linkage, chart context source freshness, and appointment edit/cancel/no-show/check-in transitions.
- API tests for validation, idempotency, tenant/site denial, and role denial.
- Browser tests for patient/search/schedule day/week and status-state behavior.
- RLS or tenant-isolation tests for newly persisted patient/chart/schedule rows.

## Required scripts/gates

- Add `pnpm standalone:patient-schedule-readiness` or an equivalent named gate.
- Run the standard local gate:
  - `pnpm install --frozen-lockfile`
  - `pnpm db:client:generate`
  - `pnpm lint`
  - `pnpm lint:phi`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm test:e2e`
  - `pnpm test:browser`
  - `pnpm build`
  - all persistence/storage/retention/readiness scripts applicable after P7
  - `pnpm production:readiness`
  - `pnpm acceptance:readiness`
  - `node scripts/status.js`
  - `git diff --check`

## Definition of Done

- Standalone patient shell, chart context snapshot, and schedule day/week workflows are browser/API-testable with synthetic data.
- Patient linkage and appointment lifecycle transitions are tenant/site scoped, permission-checked, audited, and durable where specified.
- ClinicOS/EHR integration remains adapter-bound and disabled/mock-only.
- Local and GitHub gates pass.
- `RUN_LOG.md`, `repo_status.json`, relevant docs, scripts, and work-order status are updated.

## Stop conditions

- Missing safe patient identifier policy.
- Missing or contradictory patient linkage rules that would affect privacy, treatment relationship, or chart access.
- Any implementation path requiring real patient data, production PHI storage approval, live EHR merge, live ClinicOS sync, or patient-facing financial conclusions.

## Risks and deferred decisions

- Production patient matching, merge/unmerge, MPI strategy, live eligibility, and patient portal behavior remain deferred unless later specified.

# WO-037 — Durable Audit, Events, Support, Configuration, Coaching, And Broad RLS Completion

## Objective

Complete the P7 durable local runtime candidate by adding local PostgreSQL persistence evidence for the remaining tenant-owned runtime records and broad RLS coverage.

## Why this exists

`WO-034` through `WO-036` made visit capture, review panels, and finalization/output/writeback metadata locally durable. The remaining runtime foundation still needs durable audit/event evidence, support/configuration/coaching metadata, integration/mode mappings, and broad tenant-owned RLS coverage before P7 can close.

## Prerequisites

- `WO-036` complete and merged.
- `pnpm persistence:finalization-output-adapter` passes locally and in CI.
- No active SPEC_GAP blocks durable audit/event/config/coaching persistence.

## In scope

- Prisma-backed local adapters or focused harnesses for `AuditEvent`, `DomainEvent`, `SupportStatusSnapshot`, `FeatureFlag`, `Template`, `DotPhrase`, `CoachingReport`, `IntegrationConnection`, and `ModeMapping`.
- Tenant/site scoped query behavior and wrong-tenant/wrong-site denial tests for the remaining tenant-owned runtime tables.
- Broad RLS SQL artifacts for remaining tenant-owned tables not already covered by `WO-031`, `WO-034`, `WO-035`, or `WO-036`.
- Durable audit/event evidence for currently implemented state-changing workflow operations where a local event/audit record is already defined.
- P7 checkpoint report updates when `WO-037` is complete.

## Out of scope

- Production observability vendor sinks, SIEM/APM/log pipeline deployment, production launch approval, production PHI database approval, production backup/restore execution, live EHR/ClinicOS synchronization, live AI, live transcription, live claim submission, and clearinghouse/payer integration.
- Rewriting the broad API runtime to use Prisma for every service if a narrower adapter/harness proves the P7 persistence contract safely.

## UX requirements

- Existing support, coaching, settings/configuration, and integration status surfaces must continue to render their current synthetic/demo states.
- Any durable metadata surfaced to browser-testable areas must preserve empty, loading, ready, failed, permission-denied, and demo/fixture states where applicable.
- No patient-facing view may expose internal billing, revenue, coaching, confidence, audit, support, or integration metadata.

## Backend/API requirements

- Add focused repository/service boundaries for remaining durable runtime tables.
- Preserve tenant and optional site scope for all repository reads/writes.
- Keep state-changing operations permission-checked and audit/event-emitting where already implemented.
- Keep all external vendor paths disabled or mock-only.
- Do not enable production database roles, production PHI persistence, production observability sinks, or live outbound integration.

## Data model/persistence requirements

- Persist `AuditEvent`, `DomainEvent`, `SupportStatusSnapshot`, `FeatureFlag`, `Template`, `DotPhrase`, `CoachingReport`, `IntegrationConnection`, and `ModeMapping` records where existing synthetic runtime behavior needs durable metadata evidence.
- Any tenant-owned table still intentionally out of durable runtime scope must be explicitly documented with rationale.
- RLS coverage must use `app.current_tenant_id` and `WITH CHECK` write protection for tenant-owned rows.
- Preserve deterministic UUID primary keys and semantic DTO/source references where DTO identity must round-trip.

## Event/audit requirements

- Durable `AuditEvent` records must capture audit-safe metadata only, with request/trace identifiers when available.
- Durable `DomainEvent` records must capture event type, aggregate type/id, tenant/site scope, and audit-safe payloads.
- State-changing actions introduced or persisted in this work order must have corresponding audit/event evidence.
- Audit export behavior remains redacted unless a later approved work order explicitly changes it.

## RBAC/ABAC requirements

- Support/audit access remains restricted to support, compliance/privacy, or authorized admin roles as already defined.
- Coaching visibility remains role-limited and must not expose clinician-specific or patient-linked detail to unauthorized roles.
- Settings/configuration/admin visibility remains restricted by existing RBAC/ABAC matrix rules.
- ClinicOS-integrated mode must not bypass AURA Note permissions.

## Standalone-mode behavior

- AURA Note owns local audit, event, feature flag, template, dot phrase, coaching, support status, integration connection, and mode mapping records in standalone mode.
- Standalone durable records must remain tenant/site scoped and synthetic/local in this work order.

## ClinicOS-integrated behavior

- Mode mappings and integration connection records may represent ClinicOS-linked identifiers, but must remain local metadata records and must not perform live synchronization.
- ClinicOS delegation must not override AURA Note tenant/site, purpose-of-use, or role restrictions.

## AI/PHI/security requirements

- No raw PHI may be added to audit/event/support/config/coaching fixtures.
- Logs and persisted metadata must remain audit-safe and synthetic.
- AI governance events may be represented as durable metadata only; no live AI request path is enabled.
- Support/audit exports remain redacted by default and continue rejecting unauthorized PHI inclusion.

## Testing requirements

- Unit/integration tests for same-tenant success and wrong-tenant/wrong-site denial for the remaining durable table family.
- RLS tests for read denial, insert denial, update denial, and missing tenant-session denial.
- Role-denial tests for support/audit/coaching/admin metadata access.
- Durable audit/event query tests proving state-changing synthetic evidence can be written and reloaded.
- Regression tests proving no live vendor, PHI-bearing, autonomous coding/billing, live writeback, or claim submission path is introduced.

## Required scripts/gates

- Add `pnpm persistence:durable-runtime-readiness` or an equivalent named gate.
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
  - all persistence/storage/retention/readiness scripts applicable after `WO-036`
  - `pnpm production:readiness`
  - `pnpm acceptance:readiness`
  - `node scripts/status.js`
  - `git diff --check`

## Definition of Done

- Remaining P7 tenant-owned runtime metadata has durable local PostgreSQL evidence or a documented safe rationale for deferral.
- Broad RLS evidence covers all P7 persisted tenant-owned tables not already covered by earlier RLS artifacts.
- Wrong-tenant and wrong-site repository/API-harness denial is tested before DTO exposure.
- Durable audit/event records exist for implemented state-changing operations in scope.
- P7 checkpoint report is updated with completed `WO-034` through `WO-037` evidence, tests, risks, and next recommended batch.
- `repo_status.json`, `RUN_LOG.md`, docs, scripts, and CI are updated.
- Local and GitHub gates pass.

## Stop conditions

- RLS policy gaps that cannot be safely resolved after three focused repair attempts.
- Any ambiguity requiring production PHI retention, production database role, legal/compliance, or live vendor credential decisions.
- Any path that would enable live EHR writeback, live AI, live transcription, production storage deletion, charge finalization, medical-necessity determination, or claim submission without a later approved work order.

## Risks and deferred decisions

- Production database roles, operational backup/restore, production observability sinks, and launch approval remain P8/P10 work.
- Broad API runtime may still use in-memory services outside the P7 metadata proof until later work orders promote those surfaces.
- External audit warehouse/SIEM integration remains deferred.

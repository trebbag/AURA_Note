# Backend Build Specification

AURA Note must be built as a production-oriented backend even before external integrations are live.

## Recommended stack

- Next.js web app.
- NestJS API.
- Worker service for asynchronous jobs.
- PostgreSQL with row-level security where practical.
- Prisma or equivalent schema/migration tooling.
- S3-compatible object storage for audio, exports, and uploaded documents.
- OpenAPI contracts and generated typed clients.
- Zod or equivalent runtime validation.
- Event bus abstraction with in-memory/dev implementation and production-compatible queue implementation.
- Feature flags.
- OpenTelemetry-style structured logging/tracing.

`WO-018` defines the first local observability adapter boundary: structured log, metric, trace, and audit-export sink status are visible through support status with production sinks disabled until vendor, secret, retention, and security review decisions are made.

## Core bounded contexts

1. Platform / tenant / settings.
2. Identity / RBAC / ABAC.
3. Scheduling / appointments.
4. Patient context and chart parsing.
5. Notes and visit sessions.
6. Recording, audio storage, and transcription.
7. AI gateway and suggestions.
8. Visit Selections.
9. Compliance & Quality Review.
10. History Gap Review.
11. Finalization Wizard.
12. Tasks / MA follow-up.
13. Billing & Attest / draft claim preview.
14. Exports and EHR writeback.
15. Templates and dot phrases.
16. Coaching analytics.
17. ClinicOS integration adapter.
18. Observability, audit, retention, and support tools.

## Service rules

Every write operation must:

- validate input;
- enforce tenant/site scoping;
- enforce role/relationship/purpose permission;
- be idempotent when duplicate submission is plausible;
- write an audit event;
- emit a domain event if state changes;
- return a standard response envelope;
- avoid logging PHI.

## Chart context package

When an appointment is created or opened, the backend should parse available EHR/standalone chart context into structured packages for the app and AI gateway:

- patient demographics display object;
- visit metadata;
- problem list;
- medications;
- allergies;
- past medical history;
- vitals;
- labs;
- imaging/results;
- prior notes/summaries;
- quality gaps;
- risk/HCC evidence;
- care-management opportunities;
- prior billing/coding context if allowed;
- source freshness and confidence.

The app may display this context, but AI-bound context must pass through the AI gateway.

## AI gateway

The AI gateway owns:

- PHI scrubbing;
- prompt registry;
- model configuration;
- output schema validation;
- safety policy enforcement;
- source-link handling;
- confidence/rationale normalization;
- audit metadata;
- model governance event emission.

No UI or backend feature may call external AI directly.

## Retention

- Raw audio: retain one week, then delete/purge according to job policy.
- Transcript: retain indefinitely.
- Final notes, patient summaries, audit logs, coding evidence, and finalization decisions: retain according to tenant legal/operational policy; v1 defaults should be conservative.
- Export/PDF objects: retain according to tenant configuration and audit needs.

## EHR adapters

First target: athenahealth.

The generic EHR adapter interface must support:

- patient lookup;
- demographics;
- appointments;
- encounter context;
- medications;
- allergies;
- problems;
- labs/results;
- document references;
- note writeback if configured;
- task/writeback if configured;
- connection health;
- sync state;
- mapping errors.

Do not hard-code athenahealth into domain logic. Domain logic uses generic adapter contracts.

## ClinicOS adapter

The ClinicOS adapter maps AURA Note state to and from:

- M03 VisitGraph;
- M04 WorkOS/tasks;
- M17 NP Cockpit;
- M21 Charge Integrity;
- M23 Copilot Runtime;
- M24 AI Governance;
- M25 Integration Hub;
- M26 Data Cloud.

If ClinicOS is not enabled, standalone implementations must satisfy the same domain needs.

## Standard API response envelope

All API responses should use a consistent shape:

```ts
type ApiResponse<T> = {
  data: T;
  meta: {
    requestId: string;
    traceId?: string;
    mode: 'standalone' | 'clinicos_integrated';
    generatedAt: string;
  };
  warnings?: Array<{ code: string; message: string; severity: 'info' | 'warning' | 'error' }>;
};
```

## Background jobs

Workers must support:

- transcription processing;
- AI suggestion evaluation;
- finalization compose;
- PDF generation;
- EHR writeback queue;
- raw audio retention purge;
- audit export;
- coaching analysis;
- integration sync;
- event projection refresh.

`WO-013` implements the first hardening scaffold for these requirements:

- structured log entries are request/trace correlated and redacted before persistence or export;
- external AI, live EHR writeback, ClinicOS live sync, production analytics, and audit export download delivery are governed by default-off feature flags;
- worker retention status covers raw-audio one-week purge eligibility and transcript indefinite retention while keeping destructive purge disabled;
- audit export is compliance/admin-only, redacted, metadata-only, and retained as audit evidence;
- support status exposes safe degraded states without requiring live vendor credentials.

`WO-015` adds the first persistence migration foundation:

- PostgreSQL remains the durable database target.
- Prisma schema validation and SQL diff generation are available through root scripts.
- The schema foundation covers platform, identity, appointment, note, visit session, transcript, review panel, finalization, export, writeback, coaching, audit, event, integration, feature-flag, and support status records.
- Runtime repository replacement, row-level-security policy implementation, live database migration apply/rollback, production credentials, and PHI-bearing persistence are deferred to later numbered work orders.

`WO-020` adds the first runtime repository seam for schedule/note state and a migration SQL readiness verifier. It does not change the default runtime adapter from in-memory to PostgreSQL, does not apply migrations to a live database, and does not authorize PHI-bearing persistence.

`WO-021` adds a package-level persistence adapter scaffold and Prisma row projection tests. The scaffold is intentionally disabled for runtime database writes and exists to prepare a later local database adapter work order.

`WO-028` adds a local PostgreSQL compose contract and static readiness verifier. It does not start Docker in CI, apply migrations, use Prisma Client at runtime, replace in-memory repositories, enable row-level security, or authorize PHI-bearing persistence.

`WO-029` adds live local PostgreSQL schema apply/rollback evidence with generated Prisma SQL. It starts only the synthetic local compose database, tears down the synthetic volume after the evidence run, and still does not use Prisma Client at runtime, replace in-memory repositories, enable row-level security, or authorize PHI-bearing persistence.

`WO-030` adds the first Prisma Client-backed repository adapter slice for schedule appointment and note shell state. It is local synthetic PostgreSQL only and covers appointment/note persistence, reverse lookup, one-to-one remapping blocks, and durable idempotency replay records. The broad `ScheduleService` runtime remains on the in-memory adapter until the remaining workflow state can be moved without partial persistence loss.

`WO-031` adds live tenant/site enforcement evidence and core RLS for the same persisted schedule/note slice:

- Prisma schedule repository reads require tenant scope and optionally enforce site scope;
- a test-only API access-context harness reads through the Prisma adapter before DTO exposure, proving wrong-tenant and wrong-site contexts receive no persisted record;
- PostgreSQL RLS policies are committed for `Tenant`, `Site`, `User`, `Patient`, `Appointment`, `Note`, and `IdempotencyRecord`;
- policy checks use `app.current_tenant_id`, `FORCE ROW LEVEL SECURITY`, and `WITH CHECK` write protection in local evidence.

The broader API runtime remains in-memory for workflow state that is not yet safely durable. RLS expansion to remaining workflow tables is deferred until those tables have repository-level runtime tests.

`WO-032` adds the storage delivery boundary:

- final-note, patient-summary, copy, structured export, and audit export responses can include storage-backed delivery metadata when synthetic storage flags are enabled;
- signed downloads are represented as short-lived permission-checked tokens, not public URLs;
- audit exports remain compliance/privacy/admin-only and continue rejecting `includePhi`;
- raw-audio storage deletion is worker-owned and requires both destructive deletion enablement and approval evidence;
- transcript retention remains indefinite, with transcript purge count fixed at zero in readiness evidence.

Production Azure Blob use requires soft delete, versioning, private containers, managed identity or workload identity, database backup alignment, restore-readiness drills, and security/privacy review before any PHI-bearing payload or production credential is allowed.

`WO-033` re-establishes the production build rails after `WO-032`. Backend implementation resumes with `WO-034` through `WO-037` for durable workflow persistence and RLS expansion, `WO-041` through `WO-043` for production identity/config/storage/observability controls, `WO-044` through `WO-046` for EHR/ClinicOS/AI hardening, and `WO-049` through `WO-050` for deployment, operational, beta, and launch readiness. `acceptance:readiness` remains a synthetic/post-CP4 readiness gate; production-build readiness is checked separately with `pnpm production:readiness`.

`WO-034` adds the Prisma-backed visit capture adapter for local synthetic PostgreSQL. It persists `VisitSession`, `RecordingAsset`, `Transcript`, and `TranscriptSegment` rows, covers start/pause/resume/stop, approved recording exceptions, raw-audio one-week metadata, transcript indefinite retention, mock transcript append/reload, tenant/site denial, transaction error paths, and visit-capture RLS evidence through `pnpm persistence:visit-capture-adapter`. The broad API runtime still is not fully durable; review panels, finalization/output/writeback, audit/event/support/config/coaching, live transcription, browser recording transport, production PHI storage, live EHR/ClinicOS, live AI, and claim submission remain deferred.

`WO-040` adds the P8.5 synthetic audio/transcription backend candidate. The documentation workspace API supports microphone permission recording, metadata-only recording chunk append with idempotency evidence, raw-audio retention metadata retrieval, mock transcription provider status, deterministic mock transcription job processing, and transcript segment correction. The worker has deterministic mock transcription from metadata-only chunks. All live transcription providers, raw PHI audio payload storage, external AI transcript processing, production object storage execution, destructive production deletion, and claim/billing finalization paths remain disabled.

`WO-035` adds the Prisma-backed review-panel adapter for local synthetic PostgreSQL. It persists `Suggestion`, `VisitSelection`, `ComplianceIssue`, `HistoryGapQuestion`, and `Task` rows, covers accepted/removed suggestions, manual Visit Selections, low-confidence override evidence, compliance hard blocks, History Gap routing, blocker-task adjudication, tenant/site denial, transaction error paths, and review-panel RLS evidence through `pnpm persistence:review-panel-adapter`. The broad API runtime still is not fully durable; finalization/output/writeback lands in `WO-036`, and durable audit/event/support/config/coaching, production PHI storage, live AI suggestion generation, live EHR/ClinicOS task synchronization, production rules catalogs, medical-necessity determination, charge finalization, and claim submission remain deferred.

`WO-036` adds the Prisma-backed finalization/output/writeback adapter for local synthetic PostgreSQL. It persists `FinalizationRun`, `WizardStepDecision`, `EnhancedNoteVersion`, `PatientSummaryVersion`, `BillingAttestation`, `DraftClaimPreview`, `ExportArtifact`, and `EhrWritebackJob` rows, covers wizard decisions, compose output, immutable signed final note/patient summary records, billing attestation, draft claim preview with `submittedClaim=false`, storage-backed export metadata, disabled/failure writeback queue metadata, tenant/site denial, transaction error paths, and finalization/output RLS evidence through `pnpm persistence:finalization-output-adapter`. The broad API runtime still is not fully durable; durable audit/event/support/config/coaching, broad RLS completion, live writeback, clearinghouse/payer integration, medical-necessity determination, charge finalization, and claim submission remain deferred.

`WO-037` adds the Prisma-backed durable runtime metadata adapter for local synthetic PostgreSQL. It persists `AuditEvent`, `DomainEvent`, `SupportStatusSnapshot`, `FeatureFlag`, `Template`, `DotPhrase`, `CoachingReport`, `IntegrationConnection`, and `ModeMapping` rows, covers audit/event reload, support status snapshots, disabled feature flags, template/dot phrase metadata, own-clinician coaching reports, disabled/mock integration connections, ClinicOS mode mappings, tenant/site denial, role-denial harnesses, and broad RLS evidence through `pnpm persistence:durable-runtime-readiness`. P7 is complete as synthetic/local durable runtime evidence only.

`WO-061` adds the CR-1 runtime persistence switchover foundation. `ScheduleService` now uses injected repository/storage ports instead of direct in-memory construction, and `resolveScheduleRuntimePersistencePlan` makes demo/test memory modes explicit while validating `AURA_NOTE_RUNTIME_PERSISTENCE=prisma_local` as local PostgreSQL only. `createPrismaCoreWorkflowRuntimeRepository` composes the existing Prisma schedule, visit-capture, review-panel, finalization/output, and runtime-metadata adapters so `pnpm runtime:persistence-readiness` can persist and reload a complete synthetic core workflow through fresh repository instances with cross-tenant and cross-site denial evidence. This is still synthetic/local readiness evidence and does not approve production PHI persistence, live database credentials, live migrations, live vendors, claim submission, or launch behavior.

`WO-062` adds the CR-1 API runtime request boundary. `configureAuraApi` is now the shared Nest bootstrap for `main.ts` and API e2e tests, so implemented public endpoints consistently receive request/trace IDs, local CORS posture, security headers, body-size guardrails, local rate-limit headers, global request validation, PHI-safe API error envelopes, and redacted structured runtime logs. The request validation layer rejects invalid JSON body shapes, forbidden PHI-like fields/text for ordinary endpoint payloads, raw transcript/raw audio fields, and production credential fields before service mutation. Governed AI Gateway invocation bodies remain routed to the AI Gateway's existing reject/redact policy so AI PHI-boundary audit/domain event evidence remains authoritative. `ApiErrorEnvelope` is seeded in contracts/OpenAPI for validation, permission-denied, blocked, read-only, oversized, throttled, and failed states. This is synthetic/local request-boundary hardening only; production WAF/CDN, live SIEM/APM, production auth, live vendor calls, production PHI storage, claim submission, and launch behavior remain disabled.

`WO-038` adds standalone patient shell, chart-context snapshot, and schedule completion APIs in the synthetic/local runtime. Patient shell operations, appointment edit/status transitions, and chart-context reads are tenant/site scoped, permission checked, audit/event emitting, and covered by API/browser readiness evidence through `pnpm standalone:patient-schedule-readiness`. Core schedule RLS evidence now includes `PatientLinkage` and `ChartContextSnapshot`. Production identity, production database approval, live vendor integrations, live AI, charge finalization, and claim submission remain deferred.

`WO-039` adds a synthetic/local standalone operations API module for daily product surfaces that do not depend on ClinicOS: task inbox, MA follow-up worklist, billing review queue, settings/admin/integrations, templates/dot phrases, estimate configuration, and rules catalog. State-changing routes validate input, enforce tenant/site scope through the local identity boundary, enforce RBAC/ABAC permissions, emit audit/domain events, and keep all behavior synthetic-only. Billing staff transcript access is granted only when billing review is triggered and linked to the visit. Estimate configuration rejects patient-facing financial conclusions. Rules catalog publication requires human-review attestation and does not enable autonomous coding, charge finalization, medical-necessity determination, or claim submission.

`WO-016` adds the first tenant identity and access foundation:

- API request contexts use a shared local synthetic session parser from `packages/security`.
- Tenant ID, site ID, actor user ID, session ID, role, purpose-of-use, and identity-provider mode are represented in the access context.
- Cross-tenant and cross-site requests are denied before implemented API services perform route behavior.
- `clinicos_delegate` and `oidc_delegate` modes are reserved adapter boundaries and are denied until provider configuration is specified.
- Production SSO, MFA, account administration, persistent identity/session storage, and real ClinicOS identity delegation are deferred to later numbered work orders.

`WO-041` adds the P8 production-shaped identity/config governance boundary:

- `PlatformService` exposes synthetic admin, session evaluation, workforce user status, config validation, and high-risk feature-flag operations under `/api/v1/platform`.
- Session evaluation fails closed for disabled users, expired sessions, missing purpose-of-use, tenant/site spoofing, and unsupported OIDC/SAML/ClinicOS delegated identity.
- Admin operations are tenant/site scoped, permission checked, reason validated, audit logged, and event emitting.
- Secret-source checks return metadata only with `secretValuesReturned=false`; production-shaped config validation fails closed when required sources are missing.
- High-risk feature flags for live transcription, external AI, EHR writeback, production storage, retention deletion, patient-facing estimates, and claim submission default disabled and require approval evidence before metadata-only enablement.

This is not production SSO or live feature execution. Real IdP credentials, production secret stores, live ClinicOS delegation, live vendor execution, PHI-bearing storage, medical-necessity determination, charge finalization, and claim submission remain deferred.

## WO-042 secure storage, retention deletion, and restore controls

`WO-042` hardens the production-shaped storage boundary without enabling live Azure credentials or production PHI payloads:

- Final-note, patient-summary, structured export, and audit-export storage delivery uses the `ObjectStorageAdapter` boundary and deterministic in-memory execution in tests. Azure Blob remains the production-oriented adapter shape.
- Secure downloads are server mediated. Tokens are short lived, tenant scoped, site scoped, requester scoped, permission scoped, and never represented as public URLs.
- Final-note downloads require `final_note:export`; patient-summary downloads require `patient_summary:export` and preserve internal-detail exclusion evidence; audit-export downloads require `audit:export`.
- Raw-audio deletion requires destructive deletion enabled, approval token, approval ID, and an open recovery-window timestamp. Transcript purge count remains zero.
- Backup/restore readiness is metadata-only. Azure Blob soft-delete/versioning, database backup configuration, restore-drill evidence, and evidence retention are checked, but production restore execution remains disabled pending review.

This is not live Azure storage, production deletion execution, production restore execution, or approval to store PHI-bearing objects.
## WO-043 production observability/support operations backend status

`WO-043` completes the P8 production platform candidate as synthetic backend evidence. The support API now reports P8 operational status with local redacted structured logs, metrics, and trace probes; disabled SIEM/APM production placeholders; server-mediated storage/download posture; retention/restore posture; and safe degraded-mode metadata. `GET /support/operations/readiness` returns audit-safe P8 readiness with `productionLaunchReady=false` and `vendorSinksConfigured=false`. `POST /support/operations/evidence` records audit-safe incident runbook view, degraded-mode acknowledgement, and access-review evidence. These actions are tenant/site scoped through the local synthetic request context, permission checked by `support_operations:record`, audit logged, and event emitting.

No live SIEM/APM exporter, production observability credential, PHI-bearing log payload, production launch approval, live EHR/ClinicOS synchronization, live AI, medical-necessity determination, charge finalization, or claim submission is enabled by this work.

## WO-044 EHR sandbox integration and writeback queue backend status

`WO-044` starts P9 integration hardening with an athenahealth-first, vendor-neutral EHR boundary that remains sandbox/mock safe by default. The EHR integration API now exposes metadata-only writeback queue inspection and lifecycle actions for approval, retry, dead-letter, and reconciliation. Each state-changing action is permission checked, tenant/site scoped through the local synthetic request context, PHI-evidence scanned, idempotency-aware, audit logged, and domain-event emitting.

The writeback queue records `liveProductionWritebackEnabled=false`, `payloadStored=false`, and `liveDeliveryEnabled=false`. Support users receive operational metadata only and cannot see external job identifiers or writeback payloads. The athenahealth adapter refuses unapproved writeback attempts even in configured sandbox mode.

No live production EHR credential, raw EHR payload persistence, production patient data, live writeback delivery, autonomous note submission, medical-necessity determination, charge finalization, or claim submission is enabled by this work. Production credentialing, writeback scope, vendor error taxonomy, reconciliation ownership, rollback support, and live launch approval remain deferred.

## WO-045 ClinicOS integration hardening backend status

`WO-045` hardens the ClinicOS-integrated mode boundary without enabling live ClinicOS sync. The ClinicOS integration API now exposes metadata-only module boundaries for M03 VisitGraph, M04 WorkOS/tasks, M17 NP Cockpit, M21 Charge Integrity, M23 Copilot Runtime, M24 AI Governance, M25 Integration Hub, and M26 Data Cloud. Mapping and publication operations remain tenant/site scoped through the local synthetic request context, permission checked by AURA Note RBAC/ABAC, audit logged, event emitting, and synthetic-only.

The ClinicOS status and action responses record `rawPayloadsStored=false`, `liveClinicOsSyncEnabled=false`, and `permissionsStillEnforcedByAuraNote=true`. Service accounts can write metadata only inside the tenant/site boundary; ordinary clinicians cannot write mappings; support users can view operational metadata only. Stale/degraded mapping review and failed/degraded publication evidence are represented as audit-safe metadata.

No live ClinicOS credential, production event bus, raw ClinicOS payload persistence, production patient data, live EHR/writeback delivery through ClinicOS, autonomous clinical/coding/billing behavior, medical-necessity determination, charge finalization, or claim submission is enabled by this work. Live ClinicOS module contracts, delegated identity, event-bus delivery semantics, replay/reconciliation ownership, and operational ownership remain deferred.

## WO-046 AI Gateway governance backend status

`WO-046` hardens the AI Gateway with synthetic/local production-review governance evidence while keeping live external AI disabled. The API now exposes prompt registry metadata, model configuration records, deterministic evaluation cases, evaluation-run execution, and output validation/rejection under `/api/v1/ai-gateway`.

Evaluation and validation actions are tenant/site scoped through the local synthetic request context, permission checked by `ai_governance:view`, audit logged, event emitting, and idempotency-aware when a caller supplies an idempotency key. Output validation rejects unsafe shapes that attempt autonomous diagnosis, code or charge finalization, claim submission, order placement, medical-necessity determination, patient-facing financial conclusions, or raw PHI. Governance metadata records `liveModelCalled=false`, `liveModelCredentialPresent=false`, `rawPhiToExternalAiAllowed=false`, and `humanReviewRequiredForAllOutputs=true`.

No live model credential, production prompt store, raw external model prompt, raw model response, production PHI sample, live AI invocation, autonomous clinical/coding/billing behavior, medical-necessity determination, charge finalization, or claim submission is enabled by this work. Private/BAA model selection, live credential source, evaluation thresholds, drift response, and monitoring ownership remain deferred.

## WO-047 security/privacy/compliance review

`WO-047` does not add live backend product behavior. It adds the `pnpm security:review-readiness` gate, updates the P9 security/privacy/compliance package, and records a threat model for standalone and ClinicOS-integrated modes. The backend review found no new P9 blocker in the synthetic/local scope. Existing API and worker boundaries continue to fail closed for missing credentials, missing purpose-of-use, disabled users, cross-tenant access, wrong role, stale/degraded integration mappings, unsafe AI output, and unsupported live-vendor execution.

## WO-048 frontend runtime integration backend status

`WO-048` adds the first P10 Frontend Runtime Integration Gate evidence without adding new clinical, billing, EHR, ClinicOS, AI, or claim behavior. The web app now has a typed API client validated against `packages/contracts` and an API-backed `/aura-note/runtime-integration` route that reads schedule and finalized-note state from the local Nest API. Playwright starts the API and web runtime together, drives a synthetic appointment through visit start, finalization, sign/dispatch, final-note PDF export, finalized-note refetch, and browser reload evidence.

Existing production-intended scaffold routes are inventoried in `docs/FRONTEND_RUNTIME_INTEGRATION.md` as API-backed runtime or documented mocks. Later P10 work must either convert those documented mocks to typed API runtime behavior or explicitly defer/disable them before launch-candidate review. No production PHI storage, live vendor execution, autonomous clinical/coding/billing behavior, medical-necessity determination, charge finalization, claim submission, or production launch approval is introduced.

## WO-049 launch operations readiness

`WO-049` adds synthetic/local backend operational readiness evidence. `pnpm launch:ops-readiness` combines the deterministic performance baseline, browser support-status drill assertions, and a static verifier for environment promotion, smoke checks, rollback rehearsal, incident response, access review, and support escalation evidence.

No new production runtime service is enabled. Existing support/platform boundaries remain the operational evidence surface; live vendors, production credentials, production deployment, PHI-bearing logs, external AI, live EHR/ClinicOS delivery, charge finalization, medical-necessity determination, autonomous clinical/coding/billing behavior, and claim submission remain disabled or out of scope.

## WO-050 beta pilot and limited launch gate

`WO-050` adds pilot launch readiness evidence as metadata-only governance. `pnpm pilot:readiness` runs a deterministic smoke harness, reruns frontend runtime integration evidence, and validates the P10 decision package. It does not create live tenants, deploy production, provision production credentials, call live vendors, store production PHI, finalize charges, determine medical necessity, or submit claims. Future launch evidence recording must remain tenant/site scoped, permission checked, audit-safe, and metadata-only until explicit approval.

## WO-051 claim/payer decision gate

`WO-051` adds no live payer backend behavior. It records the P11 claim/payer decision package through docs, support-status UI evidence, and `pnpm claim-decision:readiness`. Current backend posture remains draft claim preview and billing review only with `submittedClaim=false`. No clearinghouse API, payer API, denial automation, payment posting, charge finalization, medical-necessity determination, or patient-facing financial conclusion is implemented.

Any future claim submission backend must be a separate approved work order with tenant/site scoping, RBAC/ABAC, human billing approval, clinician/final-note prerequisites where applicable, durable audit/event records, idempotency, claim status reconciliation, void/reversal controls, PHI-safe logging, credential-source governance, and test-payer evidence before live execution.

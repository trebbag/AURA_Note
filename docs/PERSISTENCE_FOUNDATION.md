# Persistence foundation

## Status

`WO-015` establishes the first durable persistence foundation. It is schema and migration tooling only. It does not replace the current process-local repositories and does not connect the API, worker, or web app to a live database.

## Database choice

The backend source of truth recommends PostgreSQL with row-level security where practical and Prisma or equivalent migration tooling. `WO-015` uses:

- PostgreSQL as the durable database target;
- Prisma schema validation and migration SQL diff tooling;
- synthetic local defaults in `.env.example`;
- no committed `.env`, secrets, credentials, production connection strings, or PHI-bearing seed data.

## Commands

- `pnpm db:schema:validate` validates `packages/contracts/prisma/schema.prisma` using the synthetic local `DATABASE_URL` shape.
- `pnpm db:migration:diff` generates SQL from an empty database to the current Prisma datamodel. It does not connect to a live database.
- `pnpm persistence:foundation` runs schema validation and the repository-specific persistence foundation verifier.
- `pnpm persistence:local-db-readiness` validates the local PostgreSQL compose contract without starting Docker, applying migrations, or touching a live database.
- `pnpm persistence:local-db:migrate-evidence` applies generated Prisma SQL to the local synthetic PostgreSQL container, verifies no drift, rolls back to empty, verifies no drift against empty, and tears down the synthetic volume.

## Schema coverage

The Prisma schema includes foundational records for:

- platform: `Tenant`, `Site`, `User`, `RoleAssignment`, `FeatureFlag`;
- access and patient context: `Patient`, `PatientLinkage`;
- schedule and notes: `Appointment`, `Note`, `VisitSession`;
- recording and transcript: `RecordingAsset`, `Transcript`, `TranscriptSegment`;
- chart context: `ChartContextSnapshot`;
- review panels: `Suggestion`, `VisitSelection`, `ComplianceIssue`, `HistoryGapQuestion`, `Task`;
- finalization: `FinalizationRun`, `WizardStepDecision`, `EnhancedNoteVersion`, `PatientSummaryVersion`, `BillingAttestation`, `DraftClaimPreview`;
- outputs and writeback: `ExportArtifact`, `EhrWritebackJob`;
- configuration: `Template`, `DotPhrase`;
- analytics: `CoachingReport`;
- audit and integration: `AuditEvent`, `DomainEvent`, `IntegrationConnection`, `ModeMapping`, `SupportStatusSnapshot`.

## Invariants represented

- `Note.appointmentId` is unique to preserve one appointment to one note shell at the persistence layer.
- raw audio uses `RetentionClass.audio_ephemeral`;
- transcript metadata defaults to indefinite retention;
- draft claim previews default to `submittedClaim = false`;
- coaching reports default to patient-facing exclusion;
- external integration connections default to disabled.

Runtime enforcement still belongs to the domain, security, API, and repository layers. The schema is a persistence foundation, not a substitute for domain checks.

## Out of scope

- applying migrations to a production or shared database;
- replacing in-memory repositories with Prisma-backed adapters;
- enabling row-level security policies;
- storing real PHI or production clinical data;
- enabling live AI, EHR, ClinicOS, analytics, audit export delivery, storage deletion, or claim submission;
- changing user-facing clinical workflow behavior.

## Next persistence tranche

A later work order should introduce repository adapters that run the existing appointment-note, workspace, finalization, export, coaching, audit, and support tests against a local database. That work should add migration apply/rollback evidence and tenant-scoped query tests before production persistence is claimed.

## WO-020 runtime readiness update

`WO-020` begins that follow-on in a bounded way:

- schedule/note process-local state now sits behind an explicit repository port;
- the enabled runtime adapter remains in-memory and synthetic;
- repository tests cover one appointment to one note shell and idempotency-key remapping protection;
- `pnpm persistence:runtime-readiness` validates the Prisma schema and generates forward plus rollback SQL from the datamodel without touching a live database.

This is still not production persistence. It does not apply migrations, connect API routes to PostgreSQL, enable row-level security, store PHI, or replace every process-local repository with Prisma-backed adapters.

## WO-021 Prisma adapter scaffold update

`WO-021` adds `@aura-note/persistence` as a disabled adapter scaffold:

- `in_memory` remains the only enabled runtime adapter;
- future `prisma` mode is represented as disabled until a later work order adds database integration evidence;
- appointment and note DTOs can be mapped into deterministic synthetic Prisma row projections;
- projection rejects mismatched appointment-note identity and forbidden PHI key material before persistence mapping.

This package does not use Prisma Client, connect to PostgreSQL, apply migrations, enable row-level security, or store production PHI.

## WO-022 UUID projection readiness update

`WO-022` hardens the disabled projection so row IDs and schema reference fields are database-shape-safe before a later adapter can attempt local writes:

- synthetic semantic IDs remain natural keys and safe references rather than direct `@db.Uuid` values;
- tenant, site, clinician user, patient, appointment, and note row IDs are deterministic UUID-shaped projections;
- appointment rows reference projected patient and clinician UUIDs;
- note rows reference projected appointment, patient, and clinician UUIDs;
- the projection emits a synthetic clinician `User` row because the Prisma schema stores appointment and note clinician references as UUIDs.

Runtime database writes remain disabled. This still does not use Prisma Client, connect to PostgreSQL, apply migrations, enable row-level security, or store production PHI.

## WO-023 core relationship readiness update

`WO-023` adds Prisma relation fields for the core schedule and note graph:

- `Tenant` relates to `Site`, `User`, `Patient`, `Appointment`, and `Note`;
- `Site` relates to its tenant and core schedule/note records;
- `User` relates to tenant and clinician-owned appointment/note records;
- `Patient` relates to tenant, site, appointments, and notes;
- `Appointment` relates to tenant, site, patient, clinician user, and optional note;
- `Note` relates to tenant, site, appointment, patient, and clinician user.

`pnpm persistence:runtime-readiness` now verifies generated forward SQL includes the core foreign-key constraints for those relationships. This is still SQL-generation evidence only: migrations are not applied, Prisma Client is not used at runtime, row-level security is not enabled, and production PHI is not stored.

## WO-024 visit, recording, and transcript relationship readiness update

`WO-024` extends Prisma relation fields into the visit documentation capture graph:

- `VisitSession` relates to `Tenant`, `Site`, and `Note`;
- `RecordingAsset` relates to `Tenant`, `Site`, `Note`, and `VisitSession`;
- `Transcript` relates to `Tenant`, `Site`, `Note`, `VisitSession`, and its `TranscriptSegment` rows;
- `TranscriptSegment` relates to `Tenant`, `Site`, `Transcript`, and `Note`;
- `Tenant`, `Site`, and `Note` expose inverse relation arrays for the visit, recording, transcript, and transcript-segment records.

`pnpm persistence:runtime-readiness` now verifies generated forward SQL includes the visit-session, recording-asset, transcript, and transcript-segment foreign-key constraints. This remains SQL-generation evidence only: migrations are not applied, Prisma Client is not used at runtime, row-level security is not enabled, and production PHI is not stored.

## WO-025 review panel relationship readiness update

`WO-025` extends Prisma relation fields into the review-panel graph:

- `Suggestion` relates to `Tenant`, `Site`, `Note`, and source-linked `VisitSelection` rows;
- `VisitSelection` relates to `Tenant`, `Site`, `Note`, and optional source `Suggestion`;
- `ComplianceIssue` relates to `Tenant`, `Site`, and `Note`;
- `HistoryGapQuestion` relates to `Tenant`, `Site`, `Note`, and optional linked blocker `Task`;
- `Task` relates to `Tenant`, `Site`, optional `Note`, optional `Patient`, optional owner `User`, and linked History Gap questions.

`pnpm persistence:runtime-readiness` now verifies generated forward SQL includes those review-panel foreign-key constraints. This remains SQL-generation evidence only: migrations are not applied, Prisma Client is not used at runtime, row-level security is not enabled, and production PHI is not stored.

## WO-026 finalization relationship readiness update

`WO-026` extends Prisma relation fields into the finalization wizard graph:

- `FinalizationRun` relates to `Tenant`, `Site`, `Note`, wizard decisions, enhanced note versions, patient summary versions, billing attestations, and draft claim previews;
- `WizardStepDecision` relates to `Tenant`, `Site`, `FinalizationRun`, `Note`, and optional actor `User`;
- `EnhancedNoteVersion` relates to `Tenant`, `Site`, `Note`, `FinalizationRun`, and optional approving `User`;
- `PatientSummaryVersion` relates to `Tenant`, `Site`, `Note`, `FinalizationRun`, and optional approving `User`;
- `BillingAttestation` relates to `Tenant`, `Site`, `Note`, `FinalizationRun`, and optional attesting `User`;
- `DraftClaimPreview` relates to `Tenant`, `Site`, `Note`, `FinalizationRun`, and optional generating `User`.

`pnpm persistence:runtime-readiness` now verifies generated forward SQL includes those finalization foreign-key constraints. This remains SQL-generation evidence only: migrations are not applied, Prisma Client is not used at runtime, row-level security is not enabled, production PHI is not stored, and claim submission remains prohibited.

## WO-027 output and writeback relationship readiness update

`WO-027` extends Prisma relation fields into the signed-output and writeback graph:

- `ExportArtifact` relates to `Tenant`, `Site`, `Note`, and optional generating `User`;
- `EhrWritebackJob` relates to `Tenant`, `Site`, and `Note`;
- `Tenant`, `Site`, and `Note` expose inverse relation arrays for export artifacts and writeback jobs;
- `User` exposes an inverse relation array for generated export artifacts.

`pnpm persistence:runtime-readiness` now verifies generated forward SQL includes those output and writeback foreign-key constraints. This remains SQL-generation evidence only: migrations are not applied, Prisma Client is not used at runtime, row-level security is not enabled, production PHI is not stored, production storage delivery is not enabled, and live EHR writeback remains disabled.

## WO-028 local database orchestration readiness update

`WO-028` adds a local PostgreSQL orchestration contract for future migration apply/rollback and repository-adapter tests:

- `docker-compose.yml` defines a local PostgreSQL 16 service with the existing synthetic database name, user, password, port, named volume, and healthcheck;
- `.env.example` remains the local synthetic `DATABASE_URL` source;
- `pnpm persistence:local-db-readiness` statically validates the compose contract, package script, `.env.example`, and Prisma PostgreSQL provider;
- CI runs the verifier without requiring Docker to start.

This is orchestration readiness only. It does not apply migrations, connect Prisma Client, replace the in-memory runtime adapter, enable row-level security, run tenant-scoped live query tests, store production PHI, or authorize production database use.

## WO-029 local PostgreSQL migration evidence update

`WO-029` adds live local schema apply/rollback evidence:

- `pnpm persistence:local-db:migrate-evidence` starts the local synthetic PostgreSQL service from `docker-compose.yml`;
- the verifier generates forward SQL from empty to the Prisma datamodel and executes it against the local database;
- it verifies no schema drift remains after forward apply;
- it generates rollback SQL from the Prisma datamodel to empty and executes it against the same local database;
- it verifies the rolled-back local database matches empty state and removes the synthetic volume.

This is local schema evidence only. It does not connect Prisma Client at runtime, replace the in-memory repository adapter, enable row-level security, run tenant-scoped live query tests, store production PHI, or authorize production database use.

## WO-030 Prisma schedule runtime adapter update

`WO-030` adds the first Prisma-backed runtime adapter slice:

- `apps/api/src/schedule/prisma-schedule.repository.ts` implements an async schedule repository adapter for appointment and note shell persistence;
- `pnpm persistence:prisma-schedule-adapter` generates Prisma Client, starts the synthetic local PostgreSQL service, applies the current Prisma schema, and runs adapter integration tests;
- the adapter persists `Tenant`, `Site`, `User`, `Patient`, `Appointment`, `Note`, and `IdempotencyRecord` rows with deterministic UUID primary keys;
- `Appointment.sourceRef` and `Note.sourceRef` preserve the semantic synthetic IDs exposed by the existing API DTOs;
- `IdempotencyRecord` stores tenant-scoped replay keys for appointment creation safety.

This is the first local Prisma adapter slice only. The broad API runtime still defaults to in-memory state because visit sessions, transcript state, suggestions, selections, compliance, finalization, exports, writeback, coaching, and support state are not yet moved as one durable workflow. Row-level security, production database use, production PHI persistence, and live vendor integrations remain out of scope.

## WO-031 tenant isolation and core RLS update

`WO-031` adds live tenant/site enforcement evidence for the current Prisma schedule adapter and adopts core RLS for the persisted schedule/note slice only:

- `PrismaScheduleStateRepository` now accepts an optional `siteId` scope in addition to `tenantId`;
- list and point lookups filter by tenant and, when provided, site;
- save operations reject entries whose appointment or note tenant/site does not match the scoped repository;
- idempotency replay remains tenant-scoped and does not expose records across tenants;
- `pnpm persistence:tenant-isolation` starts the local synthetic PostgreSQL service, applies generated Prisma SQL, seeds two synthetic tenants, verifies same semantic appointment/note/idempotency keys can exist across tenants, verifies cross-tenant and cross-site denial through repository/API harness paths, applies `packages/contracts/prisma/rls-core-schedule.sql`, and verifies RLS read/write denial behavior;
- `rls-core-schedule.sql` enables and forces RLS on `Tenant`, `Site`, `User`, `Patient`, `Appointment`, `Note`, `IdempotencyRecord`, `PatientLinkage`, and `ChartContextSnapshot` using the `app.current_tenant_id` session setting plus `WITH CHECK` write policies.

RLS expansion is intentionally limited to the tables currently exercised by the Prisma schedule adapter. Suggestions, finalization, export artifacts, writeback jobs, coaching, support status, audit/event rows, and production PHI persistence remain deferred until their runtime repository slices are moved safely.

## WO-034 durable visit capture runtime update

`WO-034` adds the first durable workflow runtime slice beyond schedule/note:

- `PrismaVisitCaptureRepository` persists and reloads `VisitSession`, `RecordingAsset`, `Transcript`, and `TranscriptSegment` records against the synthetic local PostgreSQL database;
- persisted start, pause, resume, stop, approved recording exception, raw-audio retention metadata, and mock transcript segment state is covered by `pnpm persistence:visit-capture-adapter`;
- tenant and optional site scope are enforced on repository reads/writes, and a persisted-record API harness denies wrong-tenant and wrong-site access before DTO exposure;
- transaction/error-path coverage blocks transcript segment sequence remapping;
- `packages/contracts/prisma/rls-visit-capture.sql` enables and forces RLS on `VisitSession`, `RecordingAsset`, `Transcript`, and `TranscriptSegment` with `app.current_tenant_id` policies and `WITH CHECK` write protection.

This does not switch the full application runtime to Prisma. Review panels, finalization, exports, writeback, coaching, support, audit/event rows, production PHI persistence, live transcription, browser recording transport, live EHR/ClinicOS, live AI, and claim submission remain deferred to later work orders.

## WO-035 durable review-panel runtime update

`WO-035` adds the next durable workflow runtime slice:

- `PrismaReviewPanelRepository` persists and reloads `Suggestion`, `VisitSelection`, `ComplianceIssue`, `HistoryGapQuestion`, and `Task` records against the synthetic local PostgreSQL database;
- persisted review-panel state preserves accepted and removed suggestions, manually added Visit Selections, low-confidence diagnosis override evidence, compliance hard blocks, History Gap routing, MA-owned blocker tasks, and blocker adjudication status;
- `Suggestion`, `VisitSelection`, `ComplianceIssue`, `HistoryGapQuestion`, and `Task` now preserve semantic synthetic DTO identifiers in `sourceRef` fields while keeping deterministic UUID primary keys for database relations;
- `Suggestion.rationale`, `VisitSelection.overrideReason`, `HistoryGapQuestion.supportsItem`, and `HistoryGapQuestion.confidenceImpact` were added so the DTOs can round-trip through durable persistence without losing review evidence;
- tenant and optional site scope are enforced on repository reads/writes, and a persisted-record API harness denies wrong-tenant and wrong-site access before DTO exposure;
- transaction/error-path coverage blocks accepted low-confidence diagnosis suggestions when persisted override evidence is missing;
- `packages/contracts/prisma/rls-review-panel.sql` enables and forces RLS on `Suggestion`, `VisitSelection`, `ComplianceIssue`, `HistoryGapQuestion`, and `Task` with `app.current_tenant_id` policies and `WITH CHECK` write protection.

This remains local synthetic persistence. It does not introduce live AI suggestion generation, production PHI persistence, production code/rules catalogs, live EHR/ClinicOS task synchronization, autonomous diagnosis/coding/billing/medical-necessity behavior, charge finalization, or claim submission. Durable finalization/output/writeback evidence lands in `WO-036`; durable audit/event repositories, support/config/coaching state, and broad RLS completion remain deferred to `WO-037`.

## WO-036 durable finalization/output runtime update

`WO-036` adds the next durable workflow runtime slice:

- `PrismaFinalizationOutputRepository` persists and reloads `FinalizationRun`, `WizardStepDecision`, `EnhancedNoteVersion`, `PatientSummaryVersion`, `BillingAttestation`, `DraftClaimPreview`, `ExportArtifact`, and `EhrWritebackJob` records against the synthetic local PostgreSQL database;
- persisted finalization/output state preserves wizard step status, frozen snapshots, selection/suggestion decisions, compose output metadata, signed final-note text, patient summary text, billing attestation statements, draft claim preview payloads, storage-backed export metadata, and EHR writeback queue/failure metadata;
- finalization/output tables now preserve semantic synthetic DTO identifiers in `sourceRef` fields while keeping deterministic UUID primary keys for database relations;
- signed final notes, patient summaries, and signed export artifacts are treated as immutable by the adapter after approval/signature evidence exists;
- draft claim preview persistence rejects any `submittedClaim: true` payload and keeps claim submission out of runtime behavior;
- tenant and optional site scope are enforced on repository reads/writes, and a persisted-record API harness denies wrong-tenant and wrong-site access before DTO exposure;
- `packages/contracts/prisma/rls-finalization-output.sql` enables and forces RLS on finalization/output/writeback tables with `app.current_tenant_id` policies and `WITH CHECK` write protection.

This remains local synthetic persistence. It does not introduce live EHR writeback, live claim submission, clearinghouse/payer integration, charge finalization, medical-necessity determination, production PHI persistence, or production object-storage execution. Durable audit/event repositories, support/config/coaching state, and broad RLS completion remain deferred to `WO-037`.

## WO-037 durable runtime metadata and broad RLS update

`WO-037` closes the P7 durable runtime candidate with the remaining tenant-owned runtime metadata slice:

- `PrismaRuntimeMetadataRepository` persists and reloads `AuditEvent`, `DomainEvent`, `SupportStatusSnapshot`, `FeatureFlag`, `Template`, `DotPhrase`, `CoachingReport`, `IntegrationConnection`, and `ModeMapping` records against the synthetic local PostgreSQL database;
- persisted metadata preserves audit-safe event records, support status snapshots, disabled feature flags, template/dot phrase metadata, own-clinician coaching report payloads, disabled/mock integration connections, and ClinicOS mode mappings;
- tenant and site scope are enforced on repository reads/writes, and a persisted-record API harness denies wrong-role, wrong-tenant, and wrong-site access before DTO exposure;
- `packages/contracts/prisma/rls-runtime-metadata.sql` enables and forces RLS on the remaining tenant-owned P7 metadata tables with `app.current_tenant_id` policies and `WITH CHECK` write protection;
- `pnpm persistence:durable-runtime-readiness` is the broad P7 evidence gate.

This remains local synthetic persistence. It does not introduce production observability sinks, production database role approval, production PHI persistence, live EHR/ClinicOS synchronization, live AI, live transcription, production analytics, medical-necessity determination, charge finalization, or claim submission. P7.5 begins standalone patient/chart/schedule product completion.

## WO-038 standalone patient/chart/schedule persistence update

`WO-038` extends the existing schedule/note persistence evidence for the standalone patient and chart-context slice:

- the in-memory schedule repository now carries patient shell, patient linkage, and chart-context snapshot metadata alongside the appointment/note lifecycle used by the broad API runtime;
- the Prisma schedule adapter persists the current `Patient`, `Appointment`, `Note`, and `ChartContextSnapshot` slice for local PostgreSQL evidence while preserving the semantic synthetic source identifiers;
- appointment edit, check-in, cancel, and no-show transitions continue to preserve the one appointment to one note invariant;
- `packages/contracts/prisma/rls-core-schedule.sql` now includes `PatientLinkage` and `ChartContextSnapshot` policies with `app.current_tenant_id` and `WITH CHECK` enforcement;
- `apps/api/src/schedule/prisma-schedule.tenant-isolation.integration.test.ts` adds chart-context RLS read/write evidence;
- `pnpm standalone:patient-schedule-readiness` validates the WO-038 contracts, permissions, routes, browser shell, RLS artifact, and tests are in place.

This remains synthetic/local readiness evidence. It is not production PHI database approval and does not implement production patient matching, MPI merge/unmerge, patient portal, live EHR chart merge, live ClinicOS synchronization, medical-necessity determination, charge finalization, or claim submission.

## WO-039 standalone operations persistence update

`WO-039` extends the broad in-memory API runtime for standalone operations while reusing the P7 durable metadata model shape:

- task inbox and MA follow-up items carry safe patient IDs, note/appointment linkage, owner role, due metadata, blocker status, adjudication status, and source metadata;
- billing review queue items carry draft claim preview metadata and preserve `submittedClaim=false`;
- settings/admin/integration state carries tenant/site/user/role, feature flags, disabled/mock integration status, disabled-user state, and safe-degraded ClinicOS mappings;
- templates and dot phrases carry safe variables and synthetic-only flags;
- estimate configuration remains internal-only and caveated;
- rules catalog entries carry source evidence, human-review-required, autonomous-finalization-disabled, and medical-necessity-determination-disabled metadata;
- `pnpm standalone:operations-readiness` validates the WO-039 contracts, events, permissions, routes, browser shell, tests, and P7.5 checkpoint evidence.

`WO-039` does not add new Prisma schema tables because P7 already established durable evidence for `Task`, `Template`, `DotPhrase`, `FeatureFlag`, `IntegrationConnection`, and mode/config metadata. This remains synthetic/local readiness evidence. It is not production PHI database approval and does not implement production payer/pricing catalogs, certified coding rules, live ClinicOS task synchronization, medical-necessity determination, charge finalization, or claim submission.

## WO-032 storage delivery and retention deletion update

`WO-032` adds production-oriented storage boundaries without enabling real production storage:

- `@aura-note/storage` defines `ObjectStorageAdapter`, `AzureBlobObjectStorageAdapter`, and `InMemoryObjectStorageAdapter`;
- Azure Blob configuration is represented through `AZURE_STORAGE_ACCOUNT_NAME`, `AZURE_STORAGE_CONTAINER_NAME`, and `AZURE_STORAGE_CREDENTIAL_SOURCE`;
- final-note PDF, patient-summary PDF, copy, structured export, and audit export DTOs can now carry storage provider, storage key, checksum, content length, delivery mode, signed download token, and expiry metadata;
- signed download evidence uses short-lived permission-checked metadata tokens and explicitly returns no public URL;
- raw-audio retention deletion can delete storage objects only when destructive deletion is enabled and approval evidence is present;

## WO-040 audio/transcription persistence posture

`WO-040` adds browser/API/worker-testable audio and transcription candidate behavior without broadening production persistence. Recording chunks are metadata-only synthetic records attached to the existing schedule/workspace runtime, transcript segments carry mock provider/source/confidence metadata, and correction history is represented as audit-safe metadata.

The durable local visit-capture adapter from `WO-034` remains the persistence evidence for visit session, recording asset, transcript, and transcript segment state. `WO-040` does not enable raw PHI audio payload storage, live transcription-provider persistence, production object storage execution, or destructive production deletion. Broader production storage, backup/restore, and deletion controls remain in `WO-042`.
- transcript purge count remains zero because transcript retention is indefinite.

Production backup/restore execution remains blocked pending security/privacy review. Required production posture is Azure Blob soft delete plus versioning for recovery, database point-in-time backup for metadata, immutable audit evidence retention for deletion approvals, and restore drills before PHI-bearing production use.

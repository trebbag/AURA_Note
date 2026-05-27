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

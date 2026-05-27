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

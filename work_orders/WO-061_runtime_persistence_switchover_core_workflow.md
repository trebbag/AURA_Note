# WO-061 — Runtime Persistence Switchover For Core Workflow

## Objective

Move core runtime behavior away from direct in-memory state and toward repository interfaces with local Prisma/PostgreSQL as the production-shaped local runtime adapter.

## Why This Work Order Exists

P7 added durable local persistence evidence in bounded slices, but key API services still use in-memory/synthetic state in runtime paths. Commercial readiness requires repository ports, explicit demo/test adapters, durable local runtime behavior, and process-restart evidence.

## Prerequisites

- `WO-060` complete and merged.
- CR-0 checkpoint recorded.
- Existing Prisma schema and local PostgreSQL evidence.
- Existing persistence adapters and RLS evidence from `WO-030` through `WO-037`.

## In Scope

- Dependency-injected repository interfaces for schedule, appointment, note, visit session, transcript, Visit Selections, suggestions, compliance issues, History Gap questions, tasks, finalization, exports, writeback queue, templates, dot phrases, rules catalog, settings, coaching, audit events, and domain events.
- Explicit in-memory `demo` and `test` adapters only.
- Local Prisma/PostgreSQL runtime when `AURA_NOTE_RUNTIME_PERSISTENCE=prisma_local`.
- Update main runtime services so production-intended paths do not directly instantiate in-memory repositories.
- Process-restart or service-recreation persistence evidence for appointment, visit, Visit Selection, finalization, export, and audit/domain events.
- Cross-tenant and cross-site persisted denial tests.

## Out Of Scope

- Production PHI persistence approval.
- Production database credentials or hosts.
- Live migrations against production.
- Live EHR, ClinicOS, AI, transcription, storage, or claim behavior.
- Schema redesign beyond missing methods required by the work order.

## UX Requirements

- Existing routes must continue to show coherent loading, empty, ready, saving, blocked, failed, permission-denied, read-only, disabled/degraded, and demo states.
- Browser/API evidence must prove relevant state survives reload or API/service recreation.

## Backend/API Requirements

- Services use repository ports and dependency injection.
- State-changing persisted operations are tenant/site scoped, permission checked, idempotent where repeated submissions are plausible, audit/event emitting, and redacted.
- Persistence mode is resolved explicitly from configuration.

## Data Model/Persistence Requirements

- Local Prisma/PostgreSQL becomes the production-shaped local runtime adapter for core workflow state.
- In-memory adapters remain available only for explicit demo/test mode.
- Persisted UUIDs and semantic fixture IDs remain tenant-scoped.
- Any newly durable tenant-owned table must have tenant/site query evidence and RLS or documented equivalent controls.

## Event/Audit Requirements

- Appointment, visit, transcript, selection, task, finalization, export, writeback, template/config, coaching, audit, and domain state changes write durable audit/event evidence when applicable.

## RBAC/ABAC Requirements

- Repository access must not happen before tenant/site/role/purpose/relationship checks.
- Cross-tenant and cross-site reads/writes are denied.
- Support and billing transcript/final-note/coaching access follows existing matrix.

## Standalone-Mode Behavior

Standalone owns the durable local records and remains usable without ClinicOS.

## ClinicOS-Integrated Behavior

ClinicOS identifiers map through adapters. ClinicOS context cannot bypass AURA Note tenant/site, RBAC/ABAC, audit, or human-review rules.

## AI/PHI/Security Requirements

- Synthetic/local data only.
- No production PHI persistence is approved.
- No raw PHI to external AI.
- No autonomous diagnosis, coding, charge, medical-necessity, or claim behavior.

## Testing Requirements

- Unit tests for repository selection and adapter boundaries.
- Integration tests for local Prisma persistence and service recreation.
- Negative tests for cross-tenant and cross-site persisted access.
- Browser/API E2E for persisted workflow survival.
- RLS or equivalent tenant-isolation evidence for new persisted tables.

## Required Scripts/Gates

- Add `pnpm runtime:persistence-readiness`.
- Run default local gate and `pnpm commercial:readiness-plan`.

## Definition Of Done

- Main runtime services use repository ports rather than direct in-memory construction.
- Local Prisma/PostgreSQL persists core workflow state across service recreation/restart.
- In-memory is explicit demo/test only.
- Tenant/site/RBAC/audit/idempotency evidence passes.
- `repo_status.json`, `RUN_LOG.md`, docs, contracts, and tests are updated.

## Stop Conditions

- Production PHI storage, production database credentials, migration approval, or live vendor access is required.
- A persistence policy ambiguity would require inventing clinical, privacy, billing, or legal behavior.
- Three focused repair attempts fail.

## Risks And Deferred Decisions

- Production database host, credential source, backup/restore, migration approvals, support database access, and live PHI policy remain deferred.

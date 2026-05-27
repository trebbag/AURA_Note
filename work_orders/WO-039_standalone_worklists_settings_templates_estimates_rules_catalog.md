# WO-039 — Standalone Worklists, Settings, Templates, Estimates, And Rules Catalog

## Objective

Complete the remaining standalone operational areas needed for daily v1 use without depending on ClinicOS: task inbox, MA follow-up worklist, billing review queue, settings/admin/integrations center, templates and dot phrases, estimate configuration, and code/rules catalog.

## Why this exists

`WO-038` makes standalone patient/chart/schedule workflows usable. P7.5 is not complete until the surrounding standalone operating surfaces also exist in browser/API-testable form so clinicians, MAs, billing staff, clinic managers, and authorized admins can operate the synthetic v1 workflow without ClinicOS.

## Prerequisites

- `WO-038` is complete and merged.
- P7 durable runtime evidence remains intact.
- No active `SPEC_GAP` blocks task queue ownership, estimate caveat display, template variables, dot phrase substitution, or rules-catalog scope.

## In scope

- Task inbox and MA follow-up worklist with blocker/non-blocker status, owner role, due metadata, and note/patient linkage.
- Billing review queue for draft claim preview and transcript access only when review is triggered.
- Settings/Admin/Integrations center shell with tenant/site/user/role administration scaffolding, integration disabled/mock status, and feature flag visibility.
- Template and dot phrase management with safe synthetic variables and smart phrase placeholders.
- Estimate configuration with internal-only caveats and no patient-facing financial conclusions unless explicitly configured.
- Code/rules catalog seeds for CPT, HCPCS, ICD-10, HCC, E/M, quality measures, visit-type rules, confidence thresholds, and source evidence metadata.
- Browser/API tests for core standalone operational paths and role-denial states.

## Out of scope

- Live payer eligibility, live pricing, patient-facing revenue/financial output, production fee schedules, production rule engine certification, live EHR/ClinicOS synchronization, autonomous coding, charge finalization, medical-necessity determination, claim submission, and production analytics.

## UX requirements

- Add browser-testable routes or panels for task inbox, MA follow-up worklist, billing review queue, admin/settings/integrations, templates/dot phrases, estimate configuration, and rules catalog.
- Each surface must expose relevant empty, loading, ready, saving, blocked, failed, permission-denied, read-only, and demo/fixture states.
- Billing review must visibly indicate that transcript access is limited to the triggered review context.
- Patient-facing or summary-facing views must not expose internal billing, revenue, coaching, confidence, audit, support, or rules-engine details.

## Backend/API requirements

- Add or harden APIs for task inbox/worklist, billing review queue, settings/admin shell, templates, dot phrases, estimate config, and rules catalog.
- Every state-changing endpoint must validate input, enforce tenant/site scope, enforce permissions, emit audit/event evidence, and be idempotent where duplicate submissions are plausible.
- Any operation that remains a safe stub must be explicitly labeled as synthetic/local scaffold behavior in the DTO/response.
- ClinicOS and external integrations must remain disabled/mock/adapter-bound.

## Data model/persistence requirements

- Use existing Prisma schema tables where available for `Task`, `Template`, `DotPhrase`, `FeatureFlag`, `IntegrationConnection`, and related rules/config metadata.
- Add local synthetic persistence evidence only where the current schema safely supports it.
- Tenant-owned persisted rows must have tenant/site enforcement and RLS evidence or a documented safe fallback.
- Do not introduce production PHI storage approval or production payer/pricing catalogs in this work order.

## Event/audit requirements

- Emit audit/domain evidence for task ownership/adjudication, billing review queue status changes, template/dot phrase creation/update, estimate config update, rules-catalog publication/activation, and settings/integration config changes.
- Events must remain audit-safe metadata and synthetic-only.

## RBAC/ABAC requirements

- Clinicians can see linked task/worklist items and their own documentation-related settings where allowed.
- MAs can manage assigned follow-up tasks and blocker status within allowed scopes.
- Billing staff can access billing review queue items and transcripts only when billing review is triggered.
- Clinic managers/admins/authorized admins can access settings/admin surfaces according to existing RBAC.
- Support users must not gain chart, transcript, billing, coaching, or final note access through operational surfaces.

## Standalone-mode behavior

- Standalone owns task/worklist records, template/dot phrase metadata, estimate configuration, rules catalog records, and disabled/mock integration settings.
- All behavior must work without ClinicOS.

## ClinicOS-integrated behavior

- ClinicOS mode remains adapter-bound and must not bypass AURA Note permissions.
- Task, settings, template, rules, and billing-review mapping to ClinicOS/M04/M17/M21/M23/M24/M25/M26 remains safe-degraded unless a later integration work order explicitly implements synchronization.

## AI/PHI/security requirements

- Use synthetic fixtures only.
- No raw PHI is sent to external AI.
- Rules-catalog and template behavior must not autonomously diagnose, finalize codes, determine medical necessity, finalize charges, or submit claims.
- Estimate configuration must preserve caveats and internal-only status unless a later approved work order enables patient-facing estimates with source evidence.

## Testing requirements

- Unit tests for task/blocker worklist states, billing-review transcript access decisions, template/dot phrase validation, estimate caveat enforcement, and rules-catalog safety labels.
- API tests for role denial, tenant/site denial, validation, idempotency where applicable, and audit/event evidence.
- Browser tests for task inbox, MA follow-up worklist, billing review queue, settings/admin/integrations, templates/dot phrases, estimate configuration, and rules catalog states.
- PHI/security tests proving forbidden keys remain rejected/redacted.

## Required scripts/gates

- Add `pnpm standalone:operations-readiness` or equivalent.
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
  - all applicable persistence/storage/retention/readiness scripts
  - `pnpm standalone:patient-schedule-readiness`
  - `pnpm standalone:operations-readiness`
  - `pnpm production:readiness`
  - `pnpm acceptance:readiness`
  - `node scripts/status.js`
  - `git diff --check`

## Definition of Done

- Standalone worklists, settings/admin/integrations, templates/dot phrases, estimate configuration, and rules catalog are browser/API-testable with synthetic data.
- Role denial and billing-review transcript restrictions are covered.
- State changes are tenant/site scoped, permission checked, audited, and backed by local synthetic persistence where required.
- P7.5 checkpoint report is updated with `WO-038` and `WO-039` evidence.
- `RUN_LOG.md`, `repo_status.json`, relevant docs, scripts, and work-order status are updated.

## Stop conditions

- Missing or contradictory policy for task ownership, billing-review transcript access, estimate display, rules-catalog source evidence, or template variable behavior.
- Any implementation path requiring production payer data, production PHI storage approval, live ClinicOS sync, live EHR writeback, autonomous coding/billing/medical-necessity decisions, charge finalization, claim submission, or patient-facing financial conclusions.

## Risks and deferred decisions

- Production payer/rules licensing, full revenue-estimate configuration, certified coding rules, ClinicOS task synchronization, and patient-facing financial workflows remain deferred.

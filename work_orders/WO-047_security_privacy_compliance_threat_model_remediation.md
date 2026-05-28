# WO-047 — Security, Privacy, Compliance, And Threat-Model Remediation

## Objective

Convert P8/P8.5/P9 implementation evidence into security, privacy, compliance, and threat-model review artifacts, then remediate any blocking findings that can be safely fixed without live credentials or external legal/security approvals.

## Why this exists

P9 cannot be checkpointed credibly by implementation tests alone. AURA Note needs an explicit review package covering identity, tenant isolation, RLS, storage, retention, observability, EHR, ClinicOS, AI governance, PHI boundaries, RBAC/ABAC, audit events, and prohibited autonomous behavior before moving toward launch-candidate UX hardening.

## Prerequisites

- `WO-044` EHR sandbox/writeback hardening is complete.
- `WO-045` ClinicOS integration hardening is complete.
- `WO-046` AI Gateway production governance and evaluation harness is complete.
- Current readiness gates pass locally and in GitHub Actions.

## In Scope

- Create or update a security/privacy/compliance review package for P9.
- Create a threat model covering standalone and ClinicOS-integrated modes.
- Reconcile implemented RBAC/ABAC checks against `docs/RBAC_ABAC_MATRIX.md`.
- Review tenant isolation, RLS, persistence, retention, storage/download, observability, EHR, ClinicOS, AI, audit, and support surfaces.
- Add targeted security regression tests or verifier checks for any high-priority remediation found during the review.
- Update `CHECKPOINT_REPORT.md` for P9 if the remediation scope is complete and no blocking gaps remain.

## Out of Scope

- Legal certification claims, HIPAA compliance claims, SOC 2 claims, or production launch approval.
- Live IdP, EHR, ClinicOS, AI, SIEM/APM, storage, transcription, clearinghouse, or payer credentials.
- Production PHI samples, secrets, private keys, `.env` files, production URLs, or real patient data.
- Autonomous diagnosis, code finalization, charge finalization, medical-necessity determination, claim submission, denial automation, or patient-facing financial conclusions.

## UX Requirements

- Any compliance-required warning, permission, blocked, failed, read-only, or disabled state discovered during review must be added to the relevant browser-testable route.
- Support and compliance views must remain metadata-only and must not expose transcripts, final notes, billing details, coaching outputs, raw prompts, raw ClinicOS messages, raw EHR payloads, or PHI-bearing logs.

## Backend/API Requirements

- Remediate security findings in APIs, workers, adapters, DTO validation, idempotency, audit/event emission, and disabled live-vendor boundaries when the fix is clearly specified by existing docs.
- Do not add live vendor execution as a remediation.
- Fail closed for missing credentials, missing purpose-of-use, disabled users, cross-tenant access, wrong role, stale/degraded integration mappings, and unsafe AI output.

## Data Model/Persistence Requirements

- Review tenant-owned persisted tables for tenant/site scope and RLS evidence.
- Review audit/event persistence readiness and evidence retention posture.
- Document any table families that remain out of RLS or durable persistence scope as deferred production decisions unless they block the current checkpoint.

## Event/Audit Requirements

- Review state-changing actions for audit/event coverage.
- Add missing audit-safe events only when they are traceable to existing contracts/specs.
- Event payloads must remain metadata-only and must not contain raw note text, raw transcript text, raw prompts, raw EHR/ClinicOS payloads, production chart data, or patient identifiers.

## RBAC/ABAC Requirements

- Reconcile implemented permissions against `docs/RBAC_ABAC_MATRIX.md`.
- Add regression tests for any role-denial gap discovered in high-risk areas.
- ClinicOS-integrated mode must not bypass AURA Note permissions.

## Standalone-Mode Behavior

- Standalone mode remains fully usable through local/synthetic governance and disabled live-vendor boundaries.
- Security review must cover standalone-owned tenant, site, user, patient shell, schedule, note, finalization, export, task, coaching, and support records.

## ClinicOS-Integrated Behavior

- ClinicOS-integrated mode remains adapter-bound and metadata-only for live integration.
- Missing or degraded ClinicOS delegation, event-bus, or module mapping fails closed.
- ClinicOS permissions cannot override AURA Note RBAC/ABAC, PHI, audit, or human-review gates.

## AI/PHI/Security Requirements

- Confirm no raw PHI is sent to external AI, ClinicOS, EHR, SIEM/APM, storage vendors, transcription vendors, or support exports.
- Confirm all AI output remains draft/candidate/suggestion-only and human-review-required.
- Confirm unsafe AI outputs are rejected and prohibited autonomous behavior remains impossible by default.
- Preserve external AI disabled posture until private/BAA model governance is explicitly approved in a later work order.

## Testing Requirements

- Add `pnpm security:review-readiness` or equivalent named verifier.
- Run targeted regression tests for any remediation.
- Run the standard local gate and all current readiness scripts.
- GitHub Actions must pass before `WO-047` is marked done.

## Required Scripts/Gates

- `pnpm security:review-readiness`
- `pnpm install --frozen-lockfile`
- `pnpm db:client:generate`
- `pnpm lint`
- `pnpm lint:phi`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm test:browser`
- `pnpm build`
- all persistence/storage/retention/identity/config/observability/EHR/ClinicOS/AI/readiness scripts
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

## Definition of Done

- Security/privacy/compliance review package and threat model are present and traceable to current implementation.
- Any safe, clearly specified high-priority remediation found during review is implemented and tested.
- Active `SPEC_GAP`s are either absent or explicitly documented as blockers.
- P9 checkpoint evidence is updated when `WO-044` through `WO-047` are complete.
- No production launch, compliance certification, live vendor readiness, or autonomous clinical/coding/billing readiness is claimed without evidence.

## Stop Conditions

- A compliance-critical or safety-critical finding requires founder, legal, privacy, security, vendor, or clinical decision.
- A remediation would require guessing policy not present in the repo.
- Live credentials, production PHI, production logs, vendor portals, or external review artifacts are required.
- Three focused repair attempts fail to resolve a build, test, migration, or runtime blocker.

## Risks And Deferred Decisions

- External counsel, HIPAA/security reviewer, BAA/vendor review, incident-response ownership, production access-review cadence, launch approval, and formal compliance attestations remain deferred until founder/security/privacy review.

# WO-066 — Standalone Workflow Completion

## Objective

Make standalone AURA Note usable end to end for the core v1 daily workflow without depending on ClinicOS.

## Why This Work Order Exists

`WO-064` made primary routes API-backed and `WO-065` created the Figma-ready product inventory. The remaining CR-2 work is to prove the standalone route sequence itself: patient/schedule to visit workspace, documentation, suggestions/selections, blockers, finalization, finalized artifacts, task/billing worklists, and disabled-safe export/writeback surfaces. AURA Note must be built once and support ClinicOS integration later through adapters, but standalone mode must not require ClinicOS for core v1 operation.

## Prerequisites

- `WO-064` primary UI runtime API conversion complete.
- `WO-065` Figma-ready screen inventory complete.
- CR-1 runtime foundation complete.
- Current `docs/UX_BUILD_SPEC.md`, `docs/BACKEND_BUILD_SPEC.md`, `docs/FRONTEND_RUNTIME_INTEGRATION.md`, `docs/STANDALONE_AND_CLINICOS_MODES.md`, `docs/API_EVENT_CONTRACTS.md`, `docs/DATA_MODEL.md`, and `docs/RBAC_ABAC_MATRIX.md`.

## In Scope

- Prove the standalone clinician workflow with seeded backend-backed state from patient/schedule through finalization/export.
- Strengthen browser/API tests for standalone patient shell search/edit, chart-context freshness, day/week schedule, appointment create/edit/cancel/no-show/check-in, note shell, Start Visit, timer/editor gate, approved recording exception, metadata-only transcript, Suggestions, Visit Selections, Compliance Review, History Gap Review, MA blocker, Finalization Wizard steps 1-6, finalized note viewer, patient summary, copy/PDF/export metadata, task inbox, MA worklist, billing review queue, templates, dot phrases, estimates, rules catalog, coaching scaffold, settings/admin/integrations, and support status.
- Add or refine route state handling only where the existing API-backed screens do not yet represent a required standalone workflow state.
- Add a named readiness script such as `pnpm standalone:workflow-readiness`.
- Update docs, status, and run-log evidence.

## Out Of Scope

- Final Figma visual fidelity or brand system approval.
- Live ClinicOS, live EHR writeback, live transcription provider, live external AI, live Azure PHI object delivery, production identity, production PHI storage, claim submission, charge finalization, medical-necessity determination, autonomous diagnosis/coding/billing, or production launch approval.
- Building a separate ClinicOS app.

## UX Requirements

- Standalone users can complete the daily workflow from `/aura-note` and `/aura-note/schedule` without ClinicOS.
- Required states remain visible: empty, loading, ready, saving, blocked, failed, permission-denied, read-only, degraded, disabled, finalized, and demo fixture.
- Finalized artifacts are read-only and cannot reopen the editor.
- Patient-facing copy excludes internal billing, revenue, coaching, confidence, audit, support, disabled-live vendor, and claim-boundary details.
- Critical controls have accessible names and keyboard-reachable semantics.
- Responsive behavior remains verified for the core standalone route sequence.

## Backend/API Requirements

- Every user-facing standalone workflow action has typed API support or an explicitly documented disabled-safe mock.
- State-changing backend actions remain tenant-scoped, permission-checked, validation-protected, and audit/event-emitting where required.
- Idempotency remains in place for repeated appointment creation and duplicate-prone workflow steps.
- Disabled live integrations return safe metadata/degraded/disabled states rather than pretending production connectivity exists.

## Data Model/Persistence Requirements

- Use the existing local Prisma/PostgreSQL runtime-backed slice where already established and repository interfaces where persistence remains staged.
- Do not add production PHI database requirements or production credentials.
- Preserve tenant/site isolation and RLS evidence for persisted tenant-owned data.
- Document any remaining standalone workflow state that is still synthetic/local or adapter-scaffolded for later CR work.

## Event/Audit Requirements

- State-changing standalone actions must reference the existing event/audit catalog or add safe event stubs where a specified action lacks one.
- Finalization, blocker, export, writeback queue, and support-sensitive actions must remain audit-visible.
- Disabled live integration attempts must produce metadata-only evidence and no raw vendor payloads.

## RBAC/ABAC Requirements

- Role-denial states must be visible and API-backed for clinician, MA, billing staff, admin, authorized admin, compliance/privacy lead, support, and service-account/integration contexts where applicable.
- Billing staff transcript access remains limited to triggered billing-review context.
- Support users do not receive PHI, raw transcript, final note bodies, billing details, coaching outputs, raw prompts, or raw vendor payloads by default.
- ClinicOS-integrated mode cannot bypass AURA Note tenant/site, purpose-of-use, RBAC, or ABAC.

## Standalone-Mode Behavior

- Standalone mode owns the schedule, patient shell, appointment, note shell, visit session, transcript metadata, suggestions, selections, compliance, history gap, tasks, finalization, exports, templates, settings, rules, billing review, and coaching scaffolds for the tested workflow.
- The route sequence must not require ClinicOS context to function.

## ClinicOS-Integrated Behavior

- ClinicOS-integrated behavior remains adapter-bound and safely degraded where live ClinicOS is not configured.
- This work order may verify that standalone workflow controls do not assume ClinicOS, but it must not implement live ClinicOS synchronization or a second app.

## AI/PHI/Security Requirements

- AI output remains draft/candidate/suggestion-only and human-review-required.
- No raw PHI is sent to external AI.
- No real patient data, credentials, private keys, `.env` files, raw tokens, production URLs, live vendor payloads, or PHI-bearing samples are committed.
- No autonomous diagnosis, code finalization, charge finalization, medical-necessity determination, claim submission, denial automation, payment posting, or patient-facing financial conclusion is introduced.

## Testing Requirements

- Add or extend Playwright coverage for a seeded backend-backed standalone workflow from appointment creation through finalization/export and supporting worklists.
- Add or extend API/unit/contract tests only where route behavior needs additional backend evidence.
- Verify route states, permission-denied paths, read-only finalized artifacts, blocker behavior, billing review boundaries, disabled live integrations, and responsive behavior.
- Preserve `pnpm figma:handoff-readiness`, `pnpm frontend:primary-runtime-readiness`, and `pnpm frontend:runtime-integration-readiness`.

## Required Scripts/Gates

- `pnpm standalone:workflow-readiness`
- `pnpm figma:handoff-readiness`
- `pnpm frontend:primary-runtime-readiness`
- `pnpm frontend:runtime-integration-readiness`
- Default local gate applicable to touched files.
- `pnpm production:readiness`
- `node scripts/status.js`

## Definition Of Done

- Standalone AURA Note can be tested end to end through the core v1 browser/API workflow without ClinicOS.
- Required standalone surfaces, states, permission boundaries, disabled live-integration boundaries, and human-review gates are browser-testable.
- A deterministic readiness script passes and is wired into CI if appropriate.
- `RUN_LOG.md`, `repo_status.json`, `work_orders/README.md`, and relevant docs are updated.
- No live vendor, production PHI, production credential, autonomous clinical/coding/billing behavior, claim submission, charge finalization, medical-necessity determination, or production launch claim is introduced.

## Stop Conditions

- A workflow step requires unspecified clinical, billing, privacy, patient-facing financial, support, launch, or live-vendor policy.
- A required standalone action lacks backend/API semantics and cannot be safely represented as a disabled/documented mock.
- Live credentials, production PHI, production launch approval, or external vendor access would be required.
- Three focused repair attempts fail.

## Risks And Deferred Decisions

- Final visual design and exact Figma component implementation remain deferred.
- Live vendor integrations remain disabled or mock/sandbox-governed until later approved work orders.
- `WO-066` may expose remaining synthetic-to-runtime gaps that should be documented rather than guessed.

# WO-064 — Primary UI Runtime API Conversion

## Objective

Convert primary production-intended AURA Note screens from authoritative local React fixture state to typed API-backed runtime state.

## Why This Work Order Exists

The Frontend Runtime Integration Gate currently has one API-backed evidence route, but many primary routes still use local fixture state as their practical source of truth. Commercial readiness requires production-intended screens to load and mutate state through typed clients and backend-backed records, with synthetic local React state limited to Storybook/demo-only presentation paths.

## Prerequisites

- CR-1 complete.
- `WO-061` runtime persistence switchover complete.
- `WO-062` API runtime request boundary complete.
- `WO-063` identity runtime boundary complete.
- Typed API client support in `apps/web/lib`.
- Persisted backend runtime state for core appointment, visit, review, finalization, export, support, identity/config, EHR, ClinicOS, AI governance, coaching, and operations flows.
- Current Frontend Runtime Integration Gate and Playwright coverage.

## In Scope

- Convert these production-intended routes to typed API-backed loaders/actions where route state is not already API-backed:
  - `/aura-note`
  - `/aura-note/schedule`
  - `/aura-note/drafts`
  - `/aura-note/workspace/[appointmentId]`
  - `/aura-note/finalization/[noteId]`
  - `/aura-note/finalized`
  - `/aura-note/finalized/[noteId]`
  - `/aura-note/operations`
  - `/aura-note/platform`
  - `/aura-note/integrations/ehr`
  - `/aura-note/integrations/clinicos`
  - `/aura-note/ai-governance`
  - `/aura-note/coaching`
  - `/aura-note/support/status`
- Add or extend typed client methods for route data, route actions, denial states, and documented mock/disabled adapter responses.
- Keep local React fixture data only where explicitly labeled as demo, Storybook, loading fallback, or disabled-vendor mock presentation state.
- Update `docs/FRONTEND_RUNTIME_INTEGRATION.md` with route-by-route data sources, backend operations, allowed mocks, and remaining UI runtime risks.
- Add Playwright coverage that seeds through API and verifies primary route data survives reload.

## Out Of Scope

- Final Figma styling.
- Pixel-perfect visual redesign.
- Live EHR, ClinicOS, AI, transcription, storage, payer, clearinghouse, or identity vendors.
- Production PHI.
- Browser-held storage credentials.
- Client-side auth trust.
- Claim submission, charge finalization, autonomous coding, medical-necessity determination, or patient-facing financial conclusions.

## UX Requirements

- Every affected route must expose loading, empty, ready, saving, failed, permission-denied, and read-only states backed by API responses or documented mocks.
- Routes must expose blocked, degraded, disabled, finalized, and demo states where relevant to the screen.
- Saving and state-changing actions must show visible progress and result states without depending on local-only mutation as the source of truth.
- Permission-denied states must be driven by API denial responses, not hidden controls alone.
- Read-only/finalized states must be visible and must not expose editable controls that imply unsupported mutation.
- No patient-facing route may expose internal billing/revenue/coaching/confidence details.
- Controls must remain keyboard accessible and have accessible names for critical actions.

## Backend/API Requirements

- Missing screen data/actions must get typed API support or explicitly documented disabled/mock adapter responses.
- API responses must include enough state to render the required route states without local fixture inference.
- Every state-changing route action must be tenant-scoped, permission-checked, idempotent where duplicate submission is plausible, and audit/event emitting where required.
- API errors must use PHI-safe error envelopes and support request/trace correlation.
- Public operation names must not imply live vendors, production PHI, autonomous finalization, claim submission, or production launch behavior beyond implemented scope.

## Data Model/Persistence Requirements

- Production-intended route state reads and mutates persisted backend records unless the route uses a documented disabled-vendor mock.
- Persisted tenant-owned records remain tenant/site scoped and covered by the current RLS or tenant-isolation evidence posture.
- Do not add production PHI storage, production credentials, or real vendor payload storage.
- Fixture data that remains for demo or Storybook paths must be separated from production route data sources and documented as non-authoritative.

## Event/Audit Requirements

- State-changing UI actions must call backend operations that emit the expected domain/audit evidence.
- Events/audit metadata must include request ID, trace ID, tenant/site context, actor role/user/session where available, operation name, outcome, and safe failure reason.
- No raw transcripts, raw audio payloads, production credentials, token payloads, PHI-bearing vendor payloads, or unsupported billing/claim artifacts may be logged.

## RBAC/ABAC Requirements

- Route-level permission-denial states must be backed by API denial paths.
- Transcript, final-note, billing, coaching, support, audit export, platform/admin, AI governance, EHR, ClinicOS, storage/download, and claim-boundary surfaces must preserve existing role restrictions.
- ClinicOS-integrated mode cannot bypass AURA Note permissions through delegated context.
- Billing staff transcript access remains limited to triggered billing review.
- Support users remain metadata-only and cannot request audit exports or PHI-bearing outputs.

## Standalone-Mode Behavior

Standalone mode must support the core browser workflow without ClinicOS dependency: schedule and patient context, documentation workspace, finalization/export, operations worklists, billing review scaffolding, platform status, AI governance, coaching, and support status must load through AURA Note API-backed state or documented disabled mocks.

## ClinicOS-Integrated Behavior

ClinicOS routes must load through adapter-backed state or degraded/disabled mock states. Integrated mode must preserve AURA Note tenant/site/RBAC/ABAC enforcement and must never treat ClinicOS context as permission bypass.

## AI/PHI/Security Requirements

- No raw PHI is sent to external AI.
- AI output remains draft/candidate/suggestion-only and human-review-required.
- No production identity, storage, transcription, EHR, ClinicOS, AI, payer, or clearinghouse credential is required or committed.
- Client code must not hold production secrets, storage credentials, raw token payloads, or live vendor credentials.
- No autonomous diagnosis, code finalization, charge finalization, medical-necessity determination, claim submission, denial automation, payment posting, or patient-facing financial conclusion is introduced.

## Testing Requirements

- Playwright seeds at least one workflow through API and verifies route data survives reload.
- Primary route tests cover loading, empty, ready, saving, failed, permission-denied, and read-only states where applicable.
- API/contract tests cover any new DTOs, endpoints, denial paths, and documented mock/disabled responses.
- RBAC/ABAC negative tests cover sensitive route surfaces.
- PHI lint continues to prove forbidden PHI keys and production credentials are not introduced.
- Browser tests keep the existing backend-backed appointment creation through finalization/export evidence.

## Required Scripts/Gates

- Add `pnpm frontend:primary-runtime-readiness`.
- Keep `pnpm frontend:runtime-integration-readiness`.
- Run the default local gate.
- Run `pnpm commercial:readiness-plan`.
- Run `pnpm production:readiness`.
- Run `node scripts/status.js`.

## Definition Of Done

- Primary screens no longer use local fixture arrays as authoritative product data.
- Typed API client methods back production-intended route data and actions.
- Demo/Storybook-only local state is clearly separated and documented.
- Route states are backed by API responses or documented mocks.
- State-changing UI actions use backend operations with tenant scope, permission checks, and audit/event evidence.
- Playwright verifies at least one API-seeded backend-backed workflow survives reload across appointment creation, finalization, and export.
- `docs/FRONTEND_RUNTIME_INTEGRATION.md`, route docs/specs, tests, scripts, `RUN_LOG.md`, `CHECKPOINT_REPORT.md` when applicable, and `repo_status.json` are updated.
- `repo_status.json` marks `WO-064` done only after the implementation and gates pass.
- No live vendor, production PHI, production credential, autonomous clinical/coding/billing behavior, claim submission, or production launch claim is introduced.

## Stop Conditions

- Backend support is missing for a high-risk route and cannot be safely stubbed behind a documented disabled/mock mode.
- A route needs product policy that is not specified for billing, clinical, privacy, patient-facing financial, or support access behavior.
- Implementing the route would require live vendor credentials, production PHI, or production launch approval.
- Three focused repair attempts fail.

## Risks And Deferred Decisions

- Visual design remains deferred to Figma.
- Live vendors remain gated behind later approval and credential work.
- Some screens may retain documented disabled/mock adapter responses until their production vendor pathways are approved.
- Route-by-route conversion may expose missing backend actions; those gaps must be documented and either safely stubbed or escalated as `SPEC_GAP`s.

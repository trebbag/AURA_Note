# Frontend Runtime Integration Gate Inventory

Status as of `WO-048`: synthetic/local P10 runtime-integration evidence. This document does not claim production launch readiness, formal accessibility certification, HIPAA certification, live PHI processing, live EHR sync, live AI execution, live object storage, claim submission, or autonomous clinical/coding/billing behavior.

The gate requires production-intended browser routes to use typed API clients and persisted backend state. Synthetic local React state is allowed only for transient UI state, Storybook/demo behavior, documented mocks, or route states that are explicitly deferred to later P10 work.

## Required State Vocabulary

Every production-intended route must expose or document these states before launch-candidate readiness is claimed:

- `loading`
- `empty`
- `ready`
- `saving`
- `failed`
- `permission-denied`
- `read-only`

Additional safe states remain allowed where already specified: `blocked`, `warning`, `degraded`, `disabled`, and `demo fixture`.

## Runtime Inventory

| Route | Current runtime classification | Backend/API source | Required state posture | WO-048 disposition |
| --- | --- | --- | --- | --- |
| `/aura-note/runtime-integration` | API-backed runtime evidence | Typed client in `apps/web/lib/aura-note-api-client.ts`; `GET /schedule/appointments`; `GET /notes/finalized`; workflow test uses appointment, finalization, and export endpoints | loading/ready/failed/read-only backed by API responses; reload proves backend refetch | Added in `WO-048`; launch-blocking gate evidence route |
| `/aura-note/schedule` | documented mock with matching backend support | Existing schedule APIs support create/list/update/status/start visit, but current route still uses local synthetic state for UI controls | ready/saving/failed/permission-denied/read-only/demo fixture visible; full production API binding remains required before launch claim | Must be converted to typed API runtime in later P10 launch evidence before final launch-candidate claim |
| `/aura-note/drafts` | documented mock/static read shell | `GET /notes/drafts` exists | empty/ready/read-only/demo fixture visible; loading/failed/permission-denied documented | Deferred API binding |
| `/aura-note/workspace/[appointmentId]` | documented mock with broad backend support | Workspace, visit session, transcript, suggestions, selections, compliance, and history-gap APIs exist | loading/ready/saving/blocked/failed/permission-denied/read-only/demo fixture visible | Deferred API binding; high priority for final P10 gate closure |
| `/aura-note/finalization/[noteId]` | documented mock with backend support | Finalization wizard APIs exist through sign/dispatch | ready/saving/blocked/failed/permission-denied/read-only/demo fixture visible | Deferred API binding; high priority for final P10 gate closure |
| `/aura-note/finalized` | documented mock/static read shell | `GET /notes/finalized` exists | empty/ready/read-only/permission-denied documented | Deferred API binding |
| `/aura-note/finalized/[noteId]` | documented mock with backend support | Finalized detail and export APIs exist | ready/saving/failed/permission-denied/read-only visible | Deferred API binding |
| `/aura-note/operations` | documented mock with backend support | Standalone operations APIs exist | empty/loading/ready/saving/blocked/failed/permission-denied/read-only/demo fixture visible | Deferred API binding |
| `/aura-note/platform` | documented mock with backend support | Platform admin, session, config, and feature flag APIs exist | ready/saving/failed/permission-denied/disabled/read-only/demo fixture visible | Deferred API binding |
| `/aura-note/integrations/ehr` | documented mock with backend support | EHR status, chart context, writeback queue/action APIs exist | ready/retrying/dead-letter/failed/permission-denied/disabled/read-only/demo fixture visible | Deferred API binding; live EHR remains disabled |
| `/aura-note/integrations/clinicos` | documented mock with backend support | ClinicOS status, map-visit, mapping, event publication APIs exist | ready/degraded/failed/permission-denied/read-only/disabled/demo fixture visible | Deferred API binding; ClinicOS cannot bypass AURA Note permissions |
| `/aura-note/ai-governance` | documented mock with backend support | AI gateway status, mock invocation, eval, and output validation APIs exist | ready/failed/permission-denied/read-only/disabled/demo fixture visible | Deferred API binding; live external AI remains disabled |
| `/aura-note/coaching` | documented mock with backend support | Coaching own/dashboard APIs exist | ready/permission-denied/read-only/demo fixture visible | Deferred API binding; patient-facing and unauthorized details excluded |
| `/aura-note/support/status` | documented mock with backend support | Support status, audit export, backup/restore, operations readiness APIs exist | ready/failed/permission-denied/read-only/degraded/demo fixture visible | Deferred API binding; support role limits preserved |
| `/status` | foundation status page | static status | ready/read-only | Not clinical workflow runtime |

## Playwright Evidence

`apps/web/e2e/aura-note-routes.spec.ts` now includes a Frontend Runtime Integration Gate test that:

1. Starts the local Nest API and Next web app under Playwright.
2. Uses the typed API client to create a synthetic standalone appointment.
3. Starts the visit.
4. Adds a candidate visit selection.
5. Runs finalization through code review, suggestion review, compose, compare/edit approvals, billing attest, sign/dispatch.
6. Generates a final note PDF export.
7. Refetches the finalized note through the API and verifies it is read-only.
8. Opens `/aura-note/runtime-integration` and verifies the finalized note and appointment are visible from API-backed state.
9. Reloads the page and verifies the same backend-created record remains visible.

This is synthetic/local evidence only. The current route inventory still records deferred API binding for existing production-intended scaffold routes, so P10 launch-candidate readiness remains blocked until later P10 work converts those screens or keeps them explicitly documented as disabled/deferred.

## Guardrail

`pnpm frontend:runtime-integration-readiness` fails if the typed API client, runtime route, Playwright workflow, route inventory, CI wiring, or `WO-048` status evidence is missing. It also fails if launch/certification claims are introduced without the later P10 approval evidence.

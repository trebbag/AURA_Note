# Frontend Runtime Integration Gate Inventory

Status as of `WO-064`: synthetic/local CR-2 primary UI runtime evidence. This document does not claim production launch readiness, formal accessibility certification, HIPAA certification, live PHI processing, live EHR sync, live AI execution, live object storage, claim submission, or autonomous clinical/coding/billing behavior.

The gate requires production-intended browser routes to use typed API clients and persisted backend state. Synthetic local React state is limited to transient control state, Storybook/demo behavior, documented mocks, or route states that are explicitly disabled/deferred. After `WO-064`, the primary AURA Note routes are API-backed primary runtime surfaces; live-vendor behavior remains disabled or represented by documented adapter mocks.

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

| Route | Current runtime classification | Backend/API source | Required state posture | WO-064 disposition |
| --- | --- | --- | --- | --- |
| `/aura-note/runtime-integration` | API-backed runtime evidence | Typed client in `apps/web/lib/aura-note-api-client.ts`; `GET /schedule/appointments`; `GET /notes/finalized`; workflow test uses appointment, finalization, and export endpoints | loading/ready/failed/read-only backed by API responses; reload proves backend refetch | Added in `WO-048`; launch-blocking gate evidence route |
| `/aura-note` | API-backed primary runtime | Typed client loads schedule, drafts/finalized notes, operations, platform, support, EHR, ClinicOS, AI, and coaching status summaries | loading/ready/failed/read-only backed by API or documented disabled adapter responses | Added in `WO-064` |
| `/aura-note/schedule` | API-backed primary runtime | Schedule, standalone patient search/create/update, appointment create/update, and Start Visit APIs | empty/loading/ready/saving/failed/permission-denied/read-only/demo fixture visible; patient/schedule state refetched after mutation | Converted in `WO-064` |
| `/aura-note/drafts` | API-backed primary runtime | `GET /notes/drafts` | empty/loading/ready/failed/permission-denied/read-only/demo fixture visible | Converted in `WO-064` |
| `/aura-note/workspace/[appointmentId]` | API-backed primary runtime | Workspace, visit session, recording metadata, transcript, suggestions, selections, compliance, and history-gap APIs | loading/ready/saving/blocked/failed/permission-denied/read-only/demo fixture visible; transient form text only local | Converted in `WO-064` |
| `/aura-note/finalization/[noteId]` | API-backed primary runtime | Finalization wizard APIs through sign/dispatch | loading/ready/saving/blocked/failed/permission-denied/read-only/demo fixture visible | Converted in `WO-064` |
| `/aura-note/finalized` | API-backed primary runtime | `GET /notes/finalized` | empty/loading/ready/failed/permission-denied/read-only/demo fixture visible | Converted in `WO-064` |
| `/aura-note/finalized/[noteId]` | API-backed primary runtime | Finalized detail, copy/export/PDF/download/writeback APIs | loading/ready/saving/failed/permission-denied/read-only visible | Converted in `WO-064` |
| `/aura-note/operations` | API-backed primary runtime | Standalone operations task, billing review, settings, template, estimate, and rules catalog APIs | empty/loading/ready/saving/blocked/failed/permission-denied/read-only/demo fixture visible | Converted in `WO-064` |
| `/aura-note/platform` | API-backed primary runtime | Platform admin, session, config validation, and feature flag APIs | loading/ready/saving/failed/permission-denied/disabled/read-only/demo fixture visible; production config and high-risk flags fail closed | Converted in `WO-064` |
| `/aura-note/integrations/ehr` | API-backed primary runtime with disabled live adapter mock | EHR status, chart context, writeback queue/action APIs | loading/ready/retrying/dead-letter/failed/permission-denied/disabled/read-only/demo fixture visible | Converted in `WO-064`; live EHR remains disabled |
| `/aura-note/integrations/clinicos` | API-backed primary runtime with disabled/degraded adapter mocks | ClinicOS status, map-visit, mapping, event publication APIs plus ClinicOS mode headers | loading/ready/degraded/failed/permission-denied/read-only/disabled/demo fixture visible | Converted in `WO-064`; ClinicOS cannot bypass AURA Note permissions |
| `/aura-note/ai-governance` | API-backed primary runtime with disabled live AI mock | AI gateway status, mock invocation, eval, and output validation APIs | loading/ready/failed/permission-denied/read-only/disabled/demo fixture visible | Converted in `WO-064`; live external AI remains disabled |
| `/aura-note/coaching` | API-backed primary runtime | Coaching own/dashboard APIs | loading/ready/failed/permission-denied/read-only/demo fixture visible | Converted in `WO-064`; patient-facing and unauthorized details excluded |
| `/aura-note/support/status` | API-backed primary runtime with documented review-state copy | Support status, audit export, backup/restore, operations readiness, and support denial APIs | loading/ready/failed/permission-denied/read-only/degraded/demo fixture visible | Converted in `WO-064`; support role limits preserved |
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

`WO-064` extends the same Playwright suite so primary routes seed through API, mutate through typed client actions, surface permission-denied/read-only/failed states from API responses or documented disabled adapter mocks, and verify backend-created records survive reload. This is synthetic/local evidence only. CR-2 remains incomplete until `WO-065` and `WO-066` finish, P10 launch-candidate readiness remains blocked, and production launch remains blocked until later commercial-readiness approval.

## Guardrail

`pnpm frontend:runtime-integration-readiness` fails if the original typed API client, runtime route, Playwright workflow, route inventory, CI wiring, or `WO-048` status evidence is missing. `pnpm frontend:primary-runtime-readiness` fails if the `WO-064` primary-route conversion, typed API client expansion, Playwright workflow, route inventory, status/run-log evidence, or `WO-065` next-work-order rails are missing. Both fail if launch/certification claims are introduced without later commercial readiness approval evidence.

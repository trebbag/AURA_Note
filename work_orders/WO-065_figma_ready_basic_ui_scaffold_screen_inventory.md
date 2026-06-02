# WO-065 — Figma-Ready Basic UI Scaffold And Screen Inventory

## Objective

Ensure the basic AURA Note UI contains every product surface, workflow, state, panel, modal, drawer, table, form, action, and artifact that the later Figma design pass must cover.

## Why This Work Order Exists

`WO-064` moves primary production-intended routes onto typed API-backed runtime state, but commercial design handoff still needs a complete product map. Figma should receive a full screen, state, permission, data-source, and action inventory rather than a polished subset that forces designers or future engineers to guess missing workflow surfaces.

## Prerequisites

- `WO-064` complete.
- Current `docs/UX_BUILD_SPEC.md`.
- Current `docs/FRONTEND_RUNTIME_INTEGRATION.md`.
- Current backend/API, RBAC/ABAC, event, data model, and mode-boundary docs.

## In Scope

- Add or update Figma handoff inventory docs:
  - `docs/FIGMA_SCREEN_INVENTORY.md`
  - `docs/FIGMA_COMPONENT_INVENTORY.md`
  - `docs/FIGMA_STATE_MATRIX.md`
  - `docs/FIGMA_WORKFLOW_MAP.md`
  - `docs/FIGMA_ROLE_AND_PERMISSION_VIEWS.md`
  - `docs/FIGMA_DATA_AND_API_MAP.md`
  - `docs/FIGMA_CONTENT_COPY_GUIDE.md`
  - `docs/FIGMA_HANDOFF_CHECKLIST.md`
- Add a browser-testable `/aura-note/figma-handoff` route if it does not already exist.
- Represent all required product surfaces in a simple, accessible scaffold: standalone home, schedule, patients, chart context, draft notes, workspace panels, audio/transcription, suggestions, Visit Selections, compliance, History Gap Review, finalization, finalized notes, exports, writeback, task inbox, MA worklist, billing review, settings/admin/integrations, templates, dot phrases, estimates, rules catalog, EHR, ClinicOS, AI governance, coaching, support status, and launch/commercial readiness surfaces.
- Inventory empty, loading, ready, saving, blocked, failed, permission-denied, read-only, degraded, disabled, finalized, and demo/fixture states.
- Document which surfaces are API-backed runtime, disabled-vendor mocks, or Storybook/demo-only.

## Out Of Scope

- Final Figma visual fidelity.
- Brand system finalization.
- Production design approval.
- New clinical, billing, AI, EHR, ClinicOS, payer, claim, or launch behavior beyond visible placeholders and inventories.
- Live vendors, live PHI, production credentials, production object storage, production identity, claim submission, or production launch approval.

## UX Requirements

- Use simple, accessible layouts that are easy to inspect before high-fidelity design.
- Include clear sections, tables, panels, drawers, tabs, modals, banners, role views, disabled-feature placeholders, and state examples.
- Critical controls must have accessible names and keyboard-reachable semantics.
- Responsive behavior notes must be visible in the inventory.
- Copy must preserve draft/candidate/human-review language and avoid patient-facing internal billing, revenue, coaching, confidence, or support-only detail leakage.

## Backend/API Requirements

- Document the typed API source, disabled adapter response, or documented mock for every listed screen/action.
- Do not add backend behavior unless a missing read-only handoff route requires a safe metadata endpoint.
- Any state-changing action represented in the inventory must point to an existing backend operation, documented disabled mock, or an explicit future work order.

## Data Model/Persistence Requirements

- Inventory visible data objects and persistence source for each screen.
- Label API-backed persisted state separately from transient UI control state and Storybook/demo-only fixtures.
- Do not add schema changes unless required to represent an already specified screen inventory contract.

## Event/Audit Requirements

- Inventory high-risk and state-changing actions with their required audit/domain event names.
- Document disabled/live-gated actions as disabled and human-review-required where applicable.
- Do not claim production audit readiness beyond existing synthetic/local evidence.

## RBAC/ABAC Requirements

- Include role-specific views for clinician, MA, billing staff, admin, authorized admin, compliance/privacy lead, support, and service-account/integration contexts where relevant.
- Include permission-denied and read-only states for transcript, final note, billing, coaching, support, audit export, platform/admin, AI governance, EHR, ClinicOS, storage/download, and claim-boundary surfaces.
- ClinicOS-integrated mode must not bypass AURA Note tenant/site, purpose-of-use, RBAC, or ABAC boundaries.

## Standalone-Mode Behavior

- The handoff must include standalone entry points and daily-use workflows without assuming ClinicOS is present.
- Standalone patient shell, schedule, documentation, finalization/export, tasks, billing review, settings/admin, templates/dot phrases, estimates, and rules catalog surfaces must be represented.

## ClinicOS-Integrated Behavior

- The handoff must include embedded, degraded, unavailable, stale mapping, failed publication, read-only delegated, and permission-denied adapter states.
- Mapping to ClinicOS modules must remain adapter-boundary documentation only and must not create a second app.

## AI/PHI/Security Requirements

- AI output remains draft/candidate/suggestion-only and human-review-required.
- No raw PHI is sent to external AI.
- No production credential, raw token, storage secret, live vendor payload, or real patient data appears in the handoff.
- No autonomous diagnosis, coding finalization, charge finalization, medical-necessity determination, claim submission, denial automation, payment posting, or patient-facing financial conclusion is introduced.

## Testing Requirements

- Add `pnpm figma:handoff-readiness`.
- Add a deterministic inventory verifier for required docs, screens, states, roles, API/data-source mappings, and safety claims.
- Add or extend Playwright coverage for `/aura-note/figma-handoff`.
- Preserve existing frontend runtime and primary runtime gates.

## Required Scripts/Gates

- `pnpm figma:handoff-readiness`
- `pnpm frontend:primary-runtime-readiness`
- `pnpm frontend:runtime-integration-readiness`
- Default local gate applicable to the touched files.
- `pnpm production:readiness`
- `node scripts/status.js`

## Definition Of Done

- Figma can design the complete AURA Note application without guessing screens, states, actions, permissions, data sources, mode behavior, or safety copy.
- The `/aura-note/figma-handoff` route is browser-testable with synthetic/demo data and documented mocks only.
- Inventory docs cover required screens, states, roles, workflows, data/API mappings, and event/audit expectations.
- `pnpm figma:handoff-readiness` passes.
- `RUN_LOG.md`, `repo_status.json`, `work_orders/README.md`, and relevant docs are updated.
- No live vendor, production PHI, production credential, autonomous clinical/coding/billing behavior, claim submission, or production launch claim is introduced.

## Stop Conditions

- A screen or action requires unspecified product policy for clinical, billing, privacy, patient-facing financial, support, or launch behavior.
- A needed handoff surface cannot be represented without inventing unsupported product behavior.
- Implementation would require live credentials, production PHI, production launch approval, or external vendor access.
- Three focused repair attempts fail.

## Risks And Deferred Decisions

- Final visual design, exact component library, brand polish, interaction motion, and Figma token system remain deferred.
- The handoff may expose future backend gaps; those must be documented as future work rather than implemented by guesswork.
- Live vendor workflows remain disabled or mock/documentation-only until later approved work orders.

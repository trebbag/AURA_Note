# AURA Note Figma Handoff Pack

Status: designer intake pack for AURA Note front-end visual design. This pack consolidates the existing `WO-065` Figma inventory into a practical set of materials that a product designer or Figma Make session can use to create the first front-end design system, screen set, and clickable prototype.

This is design handoff material only. It does not authorize live PHI, live vendors, production credentials, autonomous diagnosis, coding finalization, charge finalization, medical-necessity determination, claim submission, destructive production deletion, or launch approval.

## How To Use This Pack

1. Start with `01_PRODUCT_AND_SAFETY_BRIEF.md` to understand the product, tone, roles, and non-negotiable safety boundaries.
2. Use `02_INFORMATION_ARCHITECTURE_AND_ROUTE_MAP.md` to create Figma pages, sections, and navigation frames.
3. Use `03_FRAME_BLUEPRINTS.md` for frame-by-frame screen requirements and responsive variants.
4. Use `04_COMPONENT_LIBRARY_REQUEST.md` to build the initial Figma component library and variants.
5. Use `05_WORKFLOW_PROTOTYPE_SCRIPT.md` to wire the prototype through the most important clinical workflow.
6. Use `06_RESPONSIVE_ACCESSIBILITY_NOTES.md` to preserve keyboard, screen-reader, responsive, and route-state requirements.
7. Use `07_FIGMA_MAKE_PROMPT.md` as a compact prompt if generating a first-pass Figma file with an AI design assistant.
8. Use `figma_frame_manifest.csv` as the structured frame checklist for design planning and QA.

## Canonical Source Documents

The designer should treat these repo files as source-of-truth references:

- `AGENTS.md`
- `docs/specs/AURA_NOTE_V1_CANONICAL_BUILD_SPEC.md`
- `docs/UX_BUILD_SPEC.md`
- `docs/FRONTEND_RUNTIME_INTEGRATION.md`
- `docs/DESIGN_SYSTEM_FOUNDATION.md`
- `docs/FIGMA_HANDOFF_PLAN.md`
- `docs/FIGMA_SCREEN_INVENTORY.md`
- `docs/FIGMA_COMPONENT_INVENTORY.md`
- `docs/FIGMA_STATE_MATRIX.md`
- `docs/FIGMA_WORKFLOW_MAP.md`
- `docs/FIGMA_ROLE_AND_PERMISSION_VIEWS.md`
- `docs/FIGMA_DATA_AND_API_MAP.md`
- `docs/FIGMA_CONTENT_COPY_GUIDE.md`
- `docs/FIGMA_HANDOFF_CHECKLIST.md`
- `docs/RBAC_ABAC_MATRIX.md`
- `docs/API_EVENT_CONTRACTS.md`

## Design Intent

AURA Note should feel like a dense, calm, clinical command workspace. It is not a marketing site, hero page, note-taking toy, or decorative dashboard. The visual language should support repeated clinical use: fast scanning, clear status, low-friction routing, visible evidence, and explicit human-review gates.

The first Figma pass should prioritize:

- a reusable app shell and navigation system;
- a polished Documentation Workspace with timer, editor, panels, drawers, and gate states;
- Schedule Builder to workspace flow;
- Draft Notes and Finalized Notes lists;
- the six-step Finalization Wizard;
- export/PDF/writeback status surfaces;
- operations worklists for MA follow-up, tasks, billing review, settings, templates, estimates, and rules;
- platform/integration/governance/support surfaces;
- responsive layout and accessible interaction states.

## What Figma Should Not Do

- Do not create patient-facing revenue, coaching, confidence, billing, audit, support, or disabled-live-vendor details.
- Do not make AI suggestions look final, ordered, diagnosed, coded, billed, or medically necessary.
- Do not hide disabled/gated behaviors that need visible review.
- Do not make ClinicOS-integrated mode bypass AURA Note role, tenant, purpose-of-use, audit, or human-review controls.
- Do not imply external AI, live EHR, live transcription, production storage, claim submission, or launch approval is active.

## Verification

Run this after edits to the handoff pack:

```bash
pnpm figma:handoff-pack-readiness
pnpm figma:handoff-readiness
```

The pack is complete only when the script confirms all required docs, routes, states, roles, safety boundaries, runtime distinctions, and prototype requirements remain present.

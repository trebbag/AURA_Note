# Figma Handoff Plan

## Purpose

Figma design should happen after the product map is complete enough to design the real application, not while core workflows are still implicit. `WO-065` creates the detailed handoff inventory and basic UI scaffold; this file defines the path to that handoff.

## Required handoff artifacts

`WO-065` must create or update:

- `docs/FIGMA_SCREEN_INVENTORY.md`
- `docs/FIGMA_COMPONENT_INVENTORY.md`
- `docs/FIGMA_STATE_MATRIX.md`
- `docs/FIGMA_WORKFLOW_MAP.md`
- `docs/FIGMA_ROLE_AND_PERMISSION_VIEWS.md`
- `docs/FIGMA_DATA_AND_API_MAP.md`
- `docs/FIGMA_CONTENT_COPY_GUIDE.md`
- `docs/FIGMA_HANDOFF_CHECKLIST.md`
- `/aura-note/figma-handoff`

## Screen inventory requirements

Each screen entry must include:

- route and screen name;
- primary and secondary actors;
- entry and exit points;
- primary user goals;
- critical UI regions;
- visible data objects;
- backend API source or documented mock;
- core actions;
- destructive or high-risk actions;
- modals, drawers, toasts, banners, and confirmations;
- empty, loading, ready, saving, blocked, failed, permission-denied, read-only, disabled/degraded, and demo states where applicable;
- mobile/responsive notes;
- accessibility notes;
- open Figma questions.

## Design surface categories

The Figma handoff must cover global navigation, Schedule Builder, patient shell/context, Draft Notes, active Documentation Workspace, timer/recording/transcription controls, transcript/correction history, note editor, Visit Selections, Suggestions, Compliance & Quality Review, History Gap Review, MA blocker tasks, all Finalization Wizard steps, Patient Opportunity Analysis, Billing & Attest, draft claim preview, Sign & Dispatch, Finalized Notes, final note viewer, patient summary viewer, export/PDF/copy/writeback status, task inbox, MA Follow-Up, Billing Review, Settings/Admin, users/roles, templates, dot phrases, visit-type templates, Rules Catalog, Estimate Configuration, EHR integration, ClinicOS integration, AI Governance, coaching, premium/admin dashboards, Support Status, audit/retention/observability, and commercial readiness/review status.

## Visual design posture

Before Figma, UI should be semantic, accessible, and structurally complete. It should not try to be final visual design. Use clear sections, tables, panels, drawers, tabs, modals, banners, and state messages so design can replace styling without changing product intent.

## Safety posture

Figma work must preserve existing safety boundaries. No design may imply autonomous diagnosis, code finalization, charge finalization, claim submission, medical-necessity determination, live PHI movement, live external AI, or production launch approval. Disabled/gated behavior must be visible where relevant rather than hidden.

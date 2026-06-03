# Frame Blueprints

Use these as the minimum Figma frames for the first front-end design pass. Each P0 frame should have desktop and mobile variants. P1 frames should have at least desktop plus responsive notes. P2 frames can be lower-fidelity unless a later design review promotes them.

## P0 Core Frames

### 1. App Home / Workflow Overview

- Route: `/aura-note`
- Actors: clinician, admin, support by permission.
- Primary regions: route status band, today summary, draft/finalized counts, operational blockers, disabled live-vendor banner, navigation tiles.
- States: loading, ready, failed, permission-denied, read-only, degraded, demo fixture.
- Design notes: this is an operational home, not a landing page.

### 2. Schedule Builder With Patient Context

- Route: `/aura-note/schedule`
- Actors: clinician, MA, admin.
- Primary regions: day/week selector, appointment list, create/edit appointment panel, patient shell, chart freshness, note-shell linkage, Start Visit action.
- States: empty, loading, ready, saving, failed, permission-denied, read-only, degraded, demo fixture.
- Design notes: show one appointment -> one note shell. Patient identifiers must be safe/synthetic in design examples.

### 3. Documentation Workspace

- Route: `/aura-note/workspace/[appointmentId]`
- Actors: clinician, MA in limited panel contexts, billing staff only when routed.
- Primary regions: visit context header, timer/recording controls, editor, Visit Selections panel, Suggestions panel, transcript drawer, Compliance drawer, History Gap drawer.
- States: loading, ready, saving, blocked, failed, permission-denied, read-only, degraded, disabled, finalized, demo fixture.
- Design notes: use a cockpit layout. The editor must visibly lock unless the timer is running or an approved recording exception is active.

### 4. Suggestions And Visit Selections Detail

- Location: workspace panels.
- Actors: clinician, billing in triggered review context.
- Primary regions: category filters, suggestion cards, confidence/evidence, missing evidence, low-confidence override, selected item cards, remove/accept actions.
- States: empty, loading, ready, saving, blocked, failed, permission-denied, read-only, demo fixture.
- Design notes: diagnosis suggestions under 75 percent confidence require override metadata before acceptance. Suggestions stay draft/candidate-only.

### 5. Compliance And History Gap Drawers

- Location: workspace drawers.
- Actors: clinician, MA, compliance/privacy lead.
- Primary regions: hard/soft issue list, blocker ownership, History Gap questions, MA follow-up task creation, task status.
- States: empty, loading, ready, saving, blocked, failed, permission-denied, read-only, demo fixture.
- Design notes: blockers should disable finalize-facing controls. Show owner and next safe action.

### 6. Finalization Wizard

- Route: `/aura-note/finalization/[noteId]`
- Actors: clinician, billing staff by routed context, admin by permission.
- Primary regions: six-step wizard rail, frozen snapshot, code review, suggestion review, compose, compare/edit, Patient Opportunity Analysis, Billing & Attest, draft claim preview, Sign & Dispatch.
- States: loading, ready, saving, blocked, failed, permission-denied, read-only, finalized, demo fixture.
- Design notes: every step requires human review. Draft claim preview must show `submittedClaim=false`.

### 7. Finalized Note Viewer And Export

- Routes: `/aura-note/finalized`, `/aura-note/finalized/[noteId]`
- Actors: clinician, authorized admin, compliance/privacy lead, billing when routed.
- Primary regions: finalized note list, final note tab, patient summary tab, transcript if allowed, billing if allowed, audit/history, export/PDF/copy cards, writeback status.
- States: empty, loading, ready, saving for artifact actions, failed, permission-denied, read-only, finalized, degraded, disabled.
- Design notes: finalized content is read-only. Patient summary excludes internal billing, revenue, coaching, confidence, audit, support, and disabled-live-vendor details.

### 8. Operations Worklists

- Route: `/aura-note/operations`
- Actors: MA, clinician, billing staff, admin.
- Primary regions: task inbox, MA follow-up worklist, billing review queue, settings/admin/integrations summary, templates, dot phrases, estimates, rules catalog.
- States: empty, loading, ready, saving, blocked, failed, permission-denied, read-only, degraded, disabled, demo fixture.
- Design notes: make owner, due state, blocker flag, and route-back-to-workspace actions easy to scan.

## P1 Platform And Governance Frames

### 9. Platform Admin

- Route: `/aura-note/platform`
- Primary regions: tenant/site/user role summary, session/identity posture, feature flags, config validation, high-risk disabled flags.
- Design notes: risk labels and fail-closed posture should be visible. Do not show secrets.

### 10. EHR Integration

- Route: `/aura-note/integrations/ehr`
- Primary regions: sandbox status, writeback queue, retry/dead-letter/reconciliation, disabled production credential state.
- Design notes: athenahealth-first sandbox can be visible, but vendor-neutral adapter boundaries should remain clear.

### 11. ClinicOS Integration

- Route: `/aura-note/integrations/clinicos`
- Primary regions: standalone/integrated mode, mapping status, stale/degraded/unavailable states, event publication metadata.
- Design notes: integrated mode is adapter-bound. Permissions still come through AURA Note checks.

### 12. AI Governance

- Route: `/aura-note/ai-governance`
- Primary regions: prompt registry, model config, evaluation cases, unsafe-output rejection, PHI scrub status, human-review routing.
- Design notes: no raw PHI to external AI. AI output remains draft/candidate/suggestion-only.

### 13. Support And Commercial Readiness

- Route: `/aura-note/support/status`
- Primary regions: support health, observability status, audit export metadata, backup/restore evidence, launch gate, disabled vendors.
- Design notes: support users do not receive PHI by default. Launch gate should stay visually blocked until formal approval exists.

## P2 Supporting Frames

### 14. Coaching

- Route: `/aura-note/coaching`
- Design notes: own-report and admin longitudinal views must have permission-denied states. Patient-facing views must never expose coaching details.

### 15. Figma Handoff Inventory

- Route: `/aura-note/figma-handoff`
- Design notes: make this a designer/reviewer utility surface, not an app feature.

## Responsive Variants

P0 frames should include:

- desktop 1440 px;
- tablet 1024 px;
- mobile 390 px;
- one keyboard focus state per critical action group;
- one permission-denied or blocked state variant per sensitive screen.

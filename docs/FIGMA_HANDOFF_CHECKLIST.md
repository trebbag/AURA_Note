# Figma Handoff Checklist

Status as of `WO-065`: checklist for handing the AURA Note basic UI scaffold to Figma. This is not design approval and not production launch approval.

## Required Artifacts

- `docs/figma_handoff/README.md`
- `docs/figma_handoff/01_PRODUCT_AND_SAFETY_BRIEF.md`
- `docs/figma_handoff/02_INFORMATION_ARCHITECTURE_AND_ROUTE_MAP.md`
- `docs/figma_handoff/03_FRAME_BLUEPRINTS.md`
- `docs/figma_handoff/04_COMPONENT_LIBRARY_REQUEST.md`
- `docs/figma_handoff/05_WORKFLOW_PROTOTYPE_SCRIPT.md`
- `docs/figma_handoff/06_RESPONSIVE_ACCESSIBILITY_NOTES.md`
- `docs/figma_handoff/07_FIGMA_MAKE_PROMPT.md`
- `docs/figma_handoff/figma_frame_manifest.csv`
- `docs/FIGMA_SCREEN_INVENTORY.md`
- `docs/FIGMA_COMPONENT_INVENTORY.md`
- `docs/FIGMA_STATE_MATRIX.md`
- `docs/FIGMA_WORKFLOW_MAP.md`
- `docs/FIGMA_ROLE_AND_PERMISSION_VIEWS.md`
- `docs/FIGMA_DATA_AND_API_MAP.md`
- `docs/FIGMA_CONTENT_COPY_GUIDE.md`
- `/aura-note/figma-handoff`

## Coverage Checklist

- Standalone home, schedule, patient shell, chart context, Draft Notes, Documentation Workspace, Finalization Wizard, Finalized Notes, operations, platform, integrations, AI governance, coaching, support, and Figma handoff surfaces are represented.
- Workspace panels include timer/recording/transcription, note editor, Visit Selections, Suggestions, Compliance Review, History Gap Review, transcript drawer, and blocker task states.
- Standalone product areas include task inbox, MA worklist, billing review queue, settings/admin/integrations, templates, dot phrases, estimate configuration, and rules catalog.
- Integration areas include EHR sandbox/writeback queue, ClinicOS integrated/degraded/unavailable states, AI Gateway governance, storage/download/export, audit export, backup/restore, observability, and support status.
- Required states include empty, loading, ready, saving, blocked, failed, permission-denied, read-only, degraded, disabled, finalized, and demo fixture.
- Role views include clinician, MA, billing staff, admin, authorized admin, compliance/privacy lead, support, and service account/integration.
- Data sources distinguish typed API clients, persisted backend state, documented disabled adapter mocks, transient UI state, and Storybook/demo-only fixtures.
- Event/audit expectations are listed for high-risk or state-changing actions.
- Standalone mode works without ClinicOS for core v1 operation.
- ClinicOS-integrated mode remains adapter-bound and cannot bypass AURA Note permissions.
- Copy preserves draft/candidate/human-review-required language.
- Patient-facing surfaces exclude internal billing, revenue, coaching, confidence, audit, support, disabled-live vendor, and claim-boundary details.
- Production launch remains blocked until founder/clinical/compliance/security approval.
- The Figma Handoff Pack gives designers a practical intake sequence, frame manifest, component request, prototype script, and prompt without changing product behavior.

## Verification

Run:

```bash
pnpm figma:handoff-pack-readiness
pnpm figma:handoff-readiness
pnpm frontend:primary-runtime-readiness
pnpm frontend:runtime-integration-readiness
pnpm production:readiness
node scripts/status.js
```

The handoff is ready only when the verifier, route smoke test, docs/status evidence, and no-launch safety posture all pass.

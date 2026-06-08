# Figma Visual Baseline And Signoff

Status: post-CR4 Figma Make visual/runtime refinement. This document defines the repeatable screenshot baseline and signoff process for the supplied Figma Make designs.

This is not production launch approval, live PHI approval, live vendor approval, claim submission approval, autonomous clinical/coding/billing approval, or HIPAA/certification evidence.

## Source References

The founder/operator supplied local Figma Make ZIP exports:

- `/Users/gregorygabbert/Downloads/AI-Powered Clinical Note Editor.zip`
- `/Users/gregorygabbert/Downloads/Step by Step Workflow Wizard.zip`

Those ZIPs are extracted locally under `.figma-make-reference/`, which is ignored by Git. They are reference material only because the generated Make source includes prototype-local state, alternate backend assumptions, hardcoded demo literals, and non-AURA product labels that must not become production runtime state.

## Baseline Types

| Baseline | Location | Committed | Purpose |
| --- | --- | --- | --- |
| AURA route visual regression screenshots | `apps/web/visual/*-snapshots/` | Yes | Prevent backend-backed AURA routes from visually regressing after founder/designer approval. |
| Figma Make reference screenshots | `artifacts/figma-visual-comparison/latest/reference/` | No | Local comparison evidence from the ignored Make source exports. |
| Live AURA comparison screenshots | `artifacts/figma-visual-comparison/latest/aura/` | No | Local route captures compared to the Make references. |
| Pixel diff screenshots | `artifacts/figma-visual-comparison/latest/diff/` | No | Pixel-delta artifact for review and tightening. |
| Comparison report | `artifacts/figma-visual-comparison/latest/report.md` and `report.json` | No | Route-by-route delta summary and signoff input. |

## Commands

Create or update committed AURA app visual baselines:

```bash
pnpm frontend:visual-regression:update
```

Run committed AURA visual regression checks:

```bash
pnpm frontend:visual-regression
```

Capture ignored local Figma Make reference screenshots, AURA screenshots, and pixel-diff artifacts:

```bash
pnpm figma:visual-comparison -- --install-references
```

Run the visual-readiness metadata gate:

```bash
pnpm figma:visual-readiness
```

Run strict comparison mode after founder/designer thresholds are approved:

```bash
AURA_NOTE_STRICT_VISUAL_COMPARE=1 pnpm figma:visual-comparison
```

If the ignored local Figma reference dependencies are not installed for the
fresh artifact directory, use:

```bash
AURA_NOTE_STRICT_VISUAL_COMPARE=1 pnpm figma:visual-comparison -- --install-references
```

## Latest Automated Comparison Evidence

Latest local strict comparison run:

- Generated: `2026-06-08T20:40:30.552Z`
- Artifact path: `artifacts/figma-visual-comparison/latest/`
- Viewport: `1440x900`
- Mode: strict comparison against tightened per-route thresholds
- Result: all mapped scenarios were `within_threshold`

| Scenario | Diff ratio | Threshold | Status |
| --- | ---: | ---: | --- |
| Dashboard | `0.031018` | `0.06` | `within_threshold` |
| Schedule | `0.028572` | `0.06` | `within_threshold` |
| Draft Notes | `0.049336` | `0.08` | `within_threshold` |
| Documentation Workspace | `0.065705` | `0.10` | `within_threshold` |
| Operations / Analytics | `0.179850` | `0.22` | `within_threshold` |
| Platform Settings | `0.041479` | `0.08` | `within_threshold` |
| Finalization Wizard | `0.046742` | `0.08` | `within_threshold` |

These automated thresholds are regression evidence, not founder/designer approval. They intentionally preserve AURA-safe substitutions, typed API-backed state, disabled live-vendor states, and no-claim-submission posture where the Figma Make references used unsafe prototype assumptions.

## Route Coverage

Committed AURA visual regression currently covers first-viewport desktop screenshots at 1440x900 for:

- `/aura-note`
- `/aura-note/schedule`
- `/aura-note/drafts`
- `/aura-note/workspace/appt-demo-001`
- `/aura-note/finalization/note-demo-001`
- `/aura-note/finalized`
- `/aura-note/finalized/note-demo-finalized-001`
- `/aura-note/operations`
- `/aura-note/platform`
- `/aura-note/integrations/ehr`
- `/aura-note/integrations/clinicos`
- `/aura-note/ai-governance`
- `/aura-note/coaching`
- `/aura-note/support/status`
- `/aura-note/figma-handoff`

The Figma comparison script maps the supplied Make references to these production route groups:

- Design 1 dashboard to `/aura-note`
- Design 1 schedule to `/aura-note/schedule`
- Design 1 drafts to `/aura-note/drafts`
- Design 1 editor/workspace to `/aura-note/workspace/appt-demo-001`
- Design 1 analytics/settings to `/aura-note/operations` and `/aura-note/platform`
- Design 2 finalization wizard to `/aura-note/finalization/note-demo-001`

## Accepted Differences Before Signoff

The following visual differences are expected and should not be treated as bugs:

- AURA Note branding replaces prototype `RevenuePilot` labels.
- Safe synthetic patient IDs replace Figma prototype patient names, phone numbers, emails, MRNs, encounter IDs, and dates.
- AURA backend state replaces prototype local arrays.
- Disabled live vendor, live patient portal, live EHR, live AI, public URL, and claim-submission states are visible where the prototype implied live execution.
- Clinical, coding, billing, AI, export, and writeback actions remain human-review-gated and API-backed.

## Founder/designer signoff

Founder/designer signoff is required before the repo can claim exact Figma visual parity. Codex cannot self-grant this approval.

Signoff checklist:

- [ ] Review `artifacts/figma-visual-comparison/latest/report.md`.
- [ ] Review the generated `reference/`, `aura/`, and `diff/` screenshots.
- [ ] Confirm expected AURA-safe substitutions are acceptable.
- [ ] Confirm dashboard first viewport is approved.
- [ ] Confirm schedule/drafts/finalized note surfaces are approved.
- [ ] Confirm documentation workspace first viewport is approved.
- [ ] Confirm finalization wizard first viewport is approved.
- [ ] Confirm operations/settings/governance surfaces are approved.
- [ ] Confirm mobile/responsive behavior remains acceptable through existing Playwright coverage.
- [ ] Confirm this approval is visual frontend signoff only, not production launch approval.

Approval record:

| Field | Value |
| --- | --- |
| Approval status | Pending founder/designer review |
| Approved by | Pending |
| Approval date | Pending |
| Approved artifact path | `artifacts/figma-visual-comparison/latest/` |
| Production launch approved | No |

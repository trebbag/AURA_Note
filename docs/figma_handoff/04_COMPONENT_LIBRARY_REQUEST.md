# Component Library Request

Build the first AURA Note Figma component library around workflow components, not marketing components. Components should be stable across desktop, tablet, and mobile and should support visible state variants.

## Foundations

Create variables for:

- color: canvas, surface, text primary, text muted, border, border strong, action, success, warning, danger, disabled;
- spacing: 4, 8, 12, 16, 24, 32;
- radius: 4 and 8 px;
- typography: route title, section heading, body, metadata, table cell, badge text, button label;
- elevation: none, subtle panel, drawer/modal;
- state accents: ready, blocked, failed, permission-denied, read-only, degraded, disabled, demo fixture.

Avoid over-rounded or decorative components. Cards should be 8 px radius or less unless the design system later decides otherwise.

## App And Layout Components

| Component | Variants | Notes |
| --- | --- | --- |
| App shell | desktop, tablet, mobile, standalone, ClinicOS-integrated | Persistent route context and mode label |
| Primary navigation | expanded, collapsed, mobile drawer | Use clear route names; no patient content in nav |
| Route status band | ready, blocked, failed, degraded, disabled, launch-blocked | Metadata-only; no PHI in support status |
| Section header | normal, read-only, permission-denied, finalized | Include action slots |
| Split workspace layout | editor-centered, right-panel-open, drawer-open, mobile stacked | Must not shift unpredictably |
| Drawer shell | transcript, compliance, history gap, audit | Includes close, state label, owner/evidence area |
| Modal shell | warning, approval, failed, permission-denied | Keyboard focus trap expected in implementation |

## Workflow Components

| Component | Required variants | Notes |
| --- | --- | --- |
| Safe patient chip | fresh, stale, missing, permission-denied | Use synthetic identifiers only |
| Appointment card | scheduled, checked-in, started, paused, stopped, canceled, no-show | Include note-shell linkage |
| Visit controls bar | stopped, running, paused, exception-approved, read-only, failed | Timer controls unlock/lock editor |
| Editor surface | locked, editable, saving, failed, read-only, finalized | Large stable writing area |
| Transcript segment | speaker, confidence, source, corrected, read-only, permission-denied | Billing visibility only when routed |
| Suggestion card | CPT, HCPCS, ICD-10, HCC, E/M, quality, differential, task, plan | Draft/candidate label required |
| Confidence indicator | high, medium, low, override-required | Low diagnosis confidence under 75 percent needs override |
| Visit Selection card | accepted, manual, removed, review-required, read-only | No autonomous finalization styling |
| Compliance issue card | hard block, soft warning, resolved, routed, read-only | Hard block disables finalize-facing actions |
| History Gap question | unanswered, assigned, blocker, resolved, read-only | MA handoff visible |
| Task row | open, blocker, in-progress, routed, resolved, overdue, denied | Owner and next action visible |

## Finalization And Output Components

| Component | Required variants | Notes |
| --- | --- | --- |
| Six-step wizard rail | step 1 through 6, blocked, complete, read-only | Steps: Code Review, Suggestion Review, Compose, Compare/Edit, Billing & Attest, Sign & Dispatch |
| Finalization action footer | disabled, ready, saving, blocked, failed | Duplicate submit protection |
| Patient Opportunity card | clinical-first, revenue-hidden, configured internal estimate | Do not expose revenue in patient summary |
| Draft claim preview panel | candidate, routed, blocked, read-only | Must show `submittedClaim=false` |
| Final artifact tabs | final note, patient summary, transcript, billing, audit | Role-limited tabs |
| Export artifact card | queued, ready, expired, denied, failed, read-only | Signed download is metadata only in design examples |
| Writeback queue card | disabled, queued, retrying, dead-letter, reconciled, failed | Human approval before writeback |

## Platform Components

| Component | Required variants | Notes |
| --- | --- | --- |
| Feature flag row | disabled, enabled-local, approval-required, high-risk | High-risk production flags fail closed |
| Identity/session card | local-demo, delegated, expired, disabled-user, denied | Synthetic headers only in explicit local/demo mode |
| Adapter status card | sandbox, disabled, degraded, failed, unavailable | EHR, ClinicOS, transcription, AI, storage |
| Governance evidence card | prompt, model, eval, unsafe-output-rejected, PHI-scrubbed | No raw PHI to external AI |
| Support status card | healthy, degraded, failed, permission-denied, no-PHI | Support defaults to metadata |

## State Variants Required Across Components

Every production-intended component family should include at least these variants where relevant:

- empty;
- loading;
- ready;
- saving;
- blocked;
- failed;
- permission-denied;
- read-only;
- degraded;
- disabled;
- finalized;
- demo fixture.

Synthetic local React state may be represented only as Storybook/demo-only fixture examples or transient UI controls. Production-intended state should be designed as typed API-backed or documented disabled-mock driven.

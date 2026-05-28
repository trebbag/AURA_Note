# UX Build Specification

Visual polish will come later through Figma. Codex should implement the workflow, states, gates, accessibility, and information architecture.

## WO-017 Browser E2E and accessibility coverage

`WO-017` adds committed Playwright route checks for the current synthetic web shell. The suite verifies main landmarks, expected H1 headings, shared section navigation, accessible labels and button names, timer-gated editor disabled states, read-only finalized-note tabs, coaching permission states, and support degraded-mode states. It is not a visual-regression suite and does not claim final Figma fidelity.

## WO-019 Design system and copy-review foundation

`WO-019` adds initial design tokens in `packages/ui`, adopts those tokens in the current web shell CSS, adds a mobile overflow browser check for core shells, and records UX copy boundaries in `docs/UX_COPY_REVIEW.md`. It prepares the product surface for human review but does not claim final visual design, Figma fidelity, or compliance certification.

## Post-WO-032 production build rails

`WO-033` re-establishes the remaining build sequence. Future UX work is sequenced in `docs/PRODUCTION_BUILD_PLAN.md`: standalone patient/chart/schedule completion in `WO-038`, standalone worklists/settings/templates/rules catalog in `WO-039`, browser audio/transcription UX in `WO-040`, support/status UX in `WO-043`, final accessibility/responsive/visual regression hardening in `WO-048`, and launch/pilot UX evidence in `WO-050`. These future work orders are not production-complete until implemented, tested, and marked done.

## Navigation areas

AURA Note v1 should include these core areas:

1. Schedule Builder.
2. Draft Notes.
3. Finalized Notes.
4. Documentation Workspace.
5. Finalization Wizard.
6. Tasks / Follow-up Questions.
7. Coaching.
8. Settings.
9. Admin / Integrations / Configuration.
10. Status / Developer Drawer in non-production.

## Schedule Builder

Users must be able to:

- view a day/week schedule;
- create a new appointment;
- edit appointment metadata;
- link or create a patient shell;
- choose visit type;
- assign clinician;
- set start/end time;
- see appointment status;
- see whether a note shell exists;
- open Start Visit when permissions allow.

Creating an appointment must create a one-to-one note shell.

### WO-002 implementation status

The browser-testable Schedule Builder shell lives at `/aura-note/schedule`. Through `WO-038` it supports synthetic standalone patient shell search/edit visibility, safe patient identifiers, chart-context source freshness warnings, day/week schedule views, linked note shell display, disabled EHR/ClinicOS scheduling indicators, and appointment check-in/cancel/no-show/Start Visit state feedback. This route is workflow-scaffold fidelity, not final Figma visual design.

`WO-038` adds explicit screen states for ready, saving, blocked, failed, permission-denied, read-only, and demo fixture states on the standalone patient/schedule surface. It remains synthetic/local only and must not display internal billing, revenue, coaching, confidence, audit, support, production PHI, or live EHR completeness on a patient-facing surface.

## Standalone Operations Center

`WO-039` adds the browser-testable standalone operations route at `/aura-note/operations`. It covers task inbox, MA follow-up worklist, billing review queue, settings/admin/integrations, templates/dot phrases, estimate configuration, and rules catalog states without depending on ClinicOS.

The route exposes empty, loading, ready, saving, blocked, failed, permission-denied, read-only, and demo fixture state labels. Billing review visibly restricts transcript access to a triggered review context; estimates are internal-only with caveats; and the rules catalog displays human-review-required and autonomous-finalization-disabled states. No patient-facing view exposes internal billing, revenue, coaching, confidence, audit, support, rules-engine internals, or claim-submission behavior.

Start Visit in `WO-002` activates the note shell and demonstrates Draft Notes visibility. Full timer, recording, transcription, editor unlock depth, and exception workflow behavior remain scoped to `WO-004`.

### WO-003 implementation status

The first CP-1 notes shell adds browser-testable routes for `/aura-note/drafts`, `/aura-note/finalized`, `/aura-note/finalized/[noteId]`, and `/aura-note/workspace/[appointmentId]`. These routes are workflow scaffolds: Draft Notes shows active demo documentation work, Finalized Notes is read-only, and the Documentation Workspace exposes all required regions with explicit empty/blocked/ready states. Timer, recording, transcript depth, Suggestions, Visit Selections behavior, Compliance logic, and History Gap task routing remain scoped to `WO-004` and `WO-005`.

### WO-004 implementation status

The Documentation Workspace now includes browser-testable Start Visit, Pause, Resume, Stop, approved recording exception, and mock transcript append controls. These controls are synthetic CP-1 scaffolds and do not connect to microphones, audio storage, external transcription, or external AI. The backend mirrors the same lifecycle with visit-session control endpoints, raw-audio retention metadata, and indefinitely retained mock transcript segments.

`WO-040` extends the same workspace with a P8.5 audio capture candidate area. Users can request browser microphone permission, see denied/unsupported/demo states, append metadata-only recording chunks while normal recording is active, process deterministic mock transcription, view confidence/source/speaker-label/correction metadata, and record a transcript correction. The UI must keep raw audio payload storage, live transcription, external AI transcript use, and production deletion visibly disabled unless later governance enables them.

### WO-005 implementation status

The Documentation Workspace now includes deterministic mock Suggestions, Visit Selections, Compliance & Quality Review, and History Gap Review controls. Suggestion cards are draft-only and human-review-required. Diagnosis candidates below 75 percent require override metadata before acceptance. History Gap questions can create MA follow-up blocker tasks, and those blockers disable Finalize-facing controls in the CP-1 shell.

## Draft Notes

Draft Notes should show notes that are active or have entered the note workflow. Draft statuses should reflect note workflow state, such as:

- note shell created;
- visit opened;
- timer running;
- timer paused;
- transcription in progress;
- documentation in progress;
- ready to finalize;
- finalization in progress;
- blocked by compliance;
- blocked by MA follow-up;
- blocked by billing review;
- dispatch failed.

## Finalized Notes

Finalized Notes should live in the same general area as Draft Notes. Clicking a finalized note opens a read-only final note viewer, not the editor.

Finalized note viewer must support:

- final note tab;
- patient summary tab;
- transcript tab if role allows;
- billing detail tab if role allows;
- audit/history panel if role allows;
- copy final note;
- download final note PDF;
- download patient summary PDF;
- export/writeback status.

## Documentation Workspace

Documentation Workspace is fully active only after the clinician opens a visit from Schedule Builder or Draft Notes and the visit timer is active.

### Required regions

1. Top patient/visit panel.
2. Visit controls bar.
3. Note editor.
4. Visit Selections panel.
5. Suggestions panel.
6. Transcript drawer.
7. Compliance & Quality Review drawer.
8. History Gap Review drawer.

### Top patient/visit panel

Must show:

- patient name/display identifier;
- DOB/age if role permits;
- visit type;
- appointment time;
- clinician;
- visit state;
- risk flags;
- EHR/ClinicOS connection state;
- source freshness warnings.

### Visit controls bar

Must show:

- Start Visit / Pause Visit / Resume Visit / Stop Visit behavior;
- timer;
- recording status;
- transcription status;
- exception path if recording is disabled;
- autosave status;
- Finalize Note button.

Finalize Note is active only when required gates are clear.

### Note editor

The note editor is inactive until timer is running or an approved exception is active. It should support:

- structured sections;
- formatting;
- templates;
- dot phrases;
- variables and smart phrases;
- autosave;
- undo/redo if practical;
- clear locked/read-only state.

### Visit Selections panel

Visit Selections holds selected codes/items. It must support:

- CPT;
- HCPCS;
- ICD-10;
- HCC;
- E/M;
- quality measures;
- differentials;
- diagnoses;
- services;
- procedures;
- appointments needing scheduled;
- plan items;
- staff tasks.

Cards must be filterable by category and visually distinct by type. Manual additions must be allowed and re-evaluated by AI on the next meaningful analysis run.

### Suggestions panel

Suggestions should populate as meaningful changes occur in:

- chart context;
- transcript;
- note text;
- Visit Selections;
- visit type;
- compliance state.

Suggestion cards must show:

- category;
- confidence;
- rationale;
- supporting evidence;
- missing evidence;
- source links where available;
- action buttons.

### Low-confidence diagnosis flow

When adding a diagnosis under 75 percent confidence:

- show warning modal;
- explain why confidence is low;
- show supporting evidence;
- show non-supporting/missing evidence;
- allow add as differential;
- allow cancel;
- allow override as diagnosis only with reason;
- flag billing review and coaching.

## Compliance & Quality Review

The drawer shows issues that may block finalization or require review. Examples include:

- selected code lacks documented support;
- selected diagnosis lacks evidence;
- low-confidence diagnosis override exists;
- required attestation missing;
- medical necessity evidence unclear;
- quality measure closure lacks structured evidence;
- required consent missing;
- required recording exception not approved;
- transcript unavailable without exception;
- open MA follow-up blocker;
- billing review required;
- EHR writeback failure;
- template required field missing;
- note has unsupported copied-forward content;
- patient summary not approved;
- final note not approved.

## History Gap Review

History Gap Review shows questions that could improve documentation confidence. Each question must show:

- question text;
- what item it supports;
- category;
- confidence impact;
- answer directly;
- add answer to note;
- send to MA follow-up;
- close as not needed;
- mark blocker/non-blocker if permitted.

## Finalization Wizard

All six steps are required.

### Step 1 — Code Review

- Original note visible and editable.
- Selected items carousel/list visible.
- Each item requires Keep or Remove.
- Removed items go to audit/unused list.
- Why suggested highlights related evidence.
- History Gap drawer remains available.
- Open blocker questions prevent progress.

### Step 2 — Suggestion Review

- User must review unselected suggestions and final-pass suggestions over 50 percent confidence.
- Each item requires Keep or Remove.
- Transcript is not shown directly in this step.
- Kept items join selected items.
- Removed items go to audit/unused list.
- User cannot skip this step.

### Step 3 — Compose

- Show progress phases: Analyzing Content, Enhancing Structure, Beautifying Language, Final Review.
- Compose creates enhanced note and patient summary.
- Selected codes are written into a payer-readable justification section.
- Services/tasks are written into the plan.
- No facts may be invented.
- Backend validates output before continuing.

### Step 4 — Compare & Edit

- Left side: original note, editable.
- Right side: enhanced note, editable if approved workflow allows.
- Header info panel includes overview, transcript if permitted, selected codes, unused items.
- Re-beautify uses updated original-side content and replaces the enhanced version.
- Patient summary tab must be reviewed.
- Clinician must approve final note and patient summary.
- AI Planning Assistant may add accepted plan items to the plan.
- Patient Opportunity Analysis shows clinical opportunities first and hides revenue from patient-facing outputs by default.

`WO-006` implements a browser-testable `/aura-note/finalization/[noteId]` shell for Steps 1-4. It enforces visible progression: Code Review decisions must be made for every selected item, Suggestion Review cannot be skipped and only shows final-pass candidates above 50 percent confidence, Compose shows deterministic mock phases, and Compare & Edit requires Re-beautify after source edits plus separate final note and patient summary approvals. Billing & Attest and Sign & Dispatch remain disabled/downstream until `WO-007`.

### Step 5 — Billing & Attest

Must support:

- final selected codes/items summary;
- documentation support status;
- claim-readiness score;
- draft claim preview;
- payer caveats;
- missing evidence;
- diagnosis/coding/quality/risk capture triggers;
- patient estimate only when configured data exists;
- unavailable/caveat state when data is missing;
- billing review routing;
- clinician attestation;

`WO-007` extends `/aura-note/finalization/[noteId]` with browser-testable Step 5 and Step 6 shell states. Step 5 shows a draft-only claim preview, estimate-unavailable caveat, billing review routing toggle, and required attestation completion. Step 6 creates read-only final note and patient summary records in the synthetic flow. It explicitly keeps claim submission, charge finalization, export/PDF/copy, and EHR writeback out of scope.
- no autonomous billing finalization.

### Step 6 — Sign & Dispatch

- All blockers resolved.
- Final note approved.
- Patient summary approved.
- Billing/attest requirements resolved or routed.
- Dispatch creates finalized note and patient summary records.
- Draft moves to finalized/read-only state.
- Export/PDF/copy/writeback actions become available according to configuration.

`WO-008` completes the CP-2 browser shell by adding a read-only finalized-note viewer with Final Note and Patient Summary tabs, copy buttons, PDF buttons, structured export, and EHR writeback status controls. The viewer shows signed/read-only state, makes export artifact states visible, and keeps EHR writeback configuration-gated with not-configured, queued, and failed scaffold states. The finalization screen now links to the finalized viewer only after Sign & Dispatch; before signing, copy/export/PDF/writeback actions remain visibly disabled.

## Coaching and analytics

`WO-012` adds `/aura-note/coaching` as a browser-testable synthetic shell for premium coaching:

- treating-clinician own report state with signal categories, scores, and improvement prompts;
- authorized-admin premium dashboard state with aggregate-only defaults;
- explicit permission states for billing staff denial, patient exclusion, and recording-exception transcript-metric unavailability;
- non-patient-facing ROI labels for time saved, internal revenue capture, denials reduced, and training improvement.

The page is functional scaffolding for review and does not implement live AI coaching, production analytics warehousing, punitive productivity monitoring, or patient-facing coaching output.

## Support hardening status

`WO-013` adds `/aura-note/support/status` as a browser-testable support and operations shell:

- overall CP-4 hardening status;
- default-off external integration feature flags;
- raw-audio, transcript, and audit retention policy states;
- redacted metadata-only audit export state;
- safe degraded failure states for external AI, EHR writeback, structured logs, and audit export.

The route is operational scaffold fidelity, not a production support console. It does not expose PHI, enable live integrations, deliver audit files, or perform destructive retention actions.

## Production platform controls

`WO-041` adds `/aura-note/platform` as a browser-testable synthetic shell for production-shaped platform governance:

- identity adapter states for local dev, OIDC, SAML, and ClinicOS delegated identity;
- disabled-user, expired-session, missing-purpose, permission-denied, unsafe-config, blocked, failed, saving, ready, empty, and demo fixture states;
- config and secret-source posture showing metadata-only validation and `secretValuesReturned=false`;
- high-risk feature flags for live transcription, external AI, EHR writeback, production storage, retention deletion, patient-facing estimates, and claim submission defaulting disabled;
- visible approval-required and `metadata_only_no_live_execution` states.

The route is security-review evidence, not a production admin console. It does not enable production SSO, return secrets or raw tokens, enable live ClinicOS delegation, execute live vendor behavior, expose PHI, or perform destructive production actions.

## EHR integration sandbox

`WO-044` adds `/aura-note/integrations/ehr` as a browser-testable synthetic shell for EHR sandbox integration and writeback queue hardening:

- adapter status and chart-context boundaries for disabled/mock/sandbox-safe behavior;
- writeback queue lifecycle states for disabled, pending approval, approved, retrying, failed, dead-lettered, and reconciled items;
- visible controls for recording human approval, scheduling retry, dead-lettering, and reconciliation metadata;
- permission-denied, payload-excluded, degraded, failed, empty, loading, ready, saving, read-only, and demo fixture states;
- explicit messaging that `payloadStored=false`, `liveDeliveryEnabled=false`, and production EHR writeback remains disabled.

The route is integration-review evidence, not a live EHR console. It does not expose PHI-bearing writeback payloads, call live production EHRs, store production credentials, submit notes autonomously, finalize charges, determine medical necessity, or submit claims.

## ClinicOS integration hardening

`WO-045` adds `/aura-note/integrations/clinicos` as a browser-testable synthetic shell for ClinicOS integration hardening:

- module-boundary states for M03 VisitGraph, M04 WorkOS/tasks, M17 NP Cockpit, M21 Charge Integrity, M23 Copilot Runtime, M24 AI Governance, M25 Integration Hub, and M26 Data Cloud;
- mapping review states for active, stale, degraded, unavailable, and failed mappings;
- publication metadata states for queued, skipped-disabled, degraded, and failed-unavailable events;
- visible disabled, degraded, failed, empty, loading, ready, saving, permission-denied, stale mapping, read-only, and demo fixture states;
- explicit messaging that `payloadStored=false`, `liveClinicOsSyncEnabled=false`, and AURA Note permissions remain authoritative.

The route is integration-review evidence, not a live ClinicOS console. It does not build ClinicOS modules, expose raw ClinicOS payloads, deliver event-bus messages, enable delegated identity, bypass AURA Note permissions, finalize charges, determine medical necessity, or submit claims.

## AI governance readiness

`WO-046` adds `/aura-note/ai-governance` as a browser-testable synthetic shell for AI Gateway governance hardening:

- prompt registry states for suggestions, note drafting, patient summaries, billing-preview candidates, and coaching feedback;
- model configuration states for mock, private-BAA placeholder, and external-disabled modes;
- deterministic evaluation harness states for passed and evaluation-failed synthetic cases;
- output validation states for accepted metadata and unsafe-output-rejected behavior;
- visible empty, loading, ready, saving, failed, permission-denied, disabled, read-only, evaluation-failed, unsafe-output-rejected, and demo fixture states;
- explicit messaging that external AI is disabled, live model credentials are absent, raw PHI is not allowed to external AI, and human review is required for all outputs.

The route is AI governance-review evidence, not a live AI operations console. It does not expose raw prompts, raw transcripts, raw final notes, billing details, coaching output, production model payloads, production PHI, live model credentials, or patient identifiers. It does not authorize autonomous diagnosis, code finalization, charge finalization, medical-necessity determination, order placement, claim submission, or patient-facing financial conclusions.

## P9 security/privacy/compliance UX review

`WO-047` does not add new production UX behavior. It reviews the current browser-testable surfaces and records that sensitive views must preserve metadata-only, disabled, permission-denied, read-only, failed, and degraded states through P10:

- support/compliance views must not expose transcripts, final notes, billing details, coaching outputs, raw prompts, raw EHR/ClinicOS messages, or PHI-bearing logs;
- AI governance views must remain review evidence only and cannot imply live model operation or approval;
- EHR and ClinicOS integration views must keep live delivery/sync disabled until later approval;
- storage and retention states must keep production delivery/deletion blocked without approval, recovery, backup/restore, and audit evidence;
- patient-facing views must not expose internal billing, revenue, confidence, coaching, or payer-optimization details.

`WO-048` adds the first Frontend Runtime Integration Gate evidence route and inventory. `/aura-note/runtime-integration` is API-backed through the typed web client and shows schedule/finalized-note state from backend responses. Existing production-intended scaffold routes remain documented mocks until later P10 work converts them to typed API runtime behavior or explicitly defers them before launch-candidate review. This is not final Figma fidelity, a formal accessibility audit, or production launch approval.

`WO-049` extends `/aura-note/support/status` with synthetic launch operations readiness states for Launch Ops Drills, rollback rehearsal, vendor outage drill, access review drill, synthetic performance baseline, and no-production-traffic evidence. These states are browser-testable operational rehearsal evidence only; they do not imply production launch approval, live vendor execution, production PHI, charge finalization, medical-necessity determination, or claim submission.

`WO-050` extends `/aura-note/support/status` with Pilot Launch Gate, Go/No-Go Approvals, Pilot Smoke Evidence, and Limited Launch Boundary states. The UI must keep `productionLaunchApproved=false`, `submittedClaim=false`, live vendor disabled, approval-required, permission-denied, read-only, and documented-mock language visible for pilot decision review.

`WO-051` extends `/aura-note/support/status` with Claim/Payer Decision Gate and Future Claim Approval Criteria states. The UI must keep Draft Claim Boundary, No Live Clearinghouse, No Payer API, No Denial Automation, No Payment Posting, `submittedClaim=false`, and `claimSubmissionEnabled=false` visible. Patient-facing views must continue excluding internal billing, revenue, payer strategy, denial/payment details, confidence, coaching, and draft claim details unless a later approved work order changes that policy.

## Required accessibility and UX states

Every screen must have empty, loading, ready, saving, blocked, failed, permission-denied, and read-only states.

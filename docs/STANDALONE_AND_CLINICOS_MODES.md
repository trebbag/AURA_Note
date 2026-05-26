# Standalone and ClinicOS-Integrated Modes

AURA Note v1 must be built once and deployed in two modes. Codex must not create two separate applications.

## Mode A: Standalone mode

Standalone mode is the default first-release posture. AURA Note owns the minimum data and workflows needed to function without AURA ClinicOS.

### Standalone-owned capabilities

- Tenant/site/user setup.
- Basic staff and clinician roles.
- Basic patient shell.
- Schedule Builder.
- Appointment creation and editing.
- One appointment-to-one note shell creation.
- Draft Notes and Finalized Notes sections.
- Visit timer.
- Recording/transcription workflow.
- Note editor.
- Suggestions and Visit Selections.
- Compliance & Quality Review.
- History Gap Review.
- MA follow-up tasks.
- Finalization Wizard.
- Final note and patient summary exports.
- Draft claim preview.
- Settings, templates, dot phrases, estimate configuration.
- Coaching and premium analytics scaffolding.
- Audit, retention, and role permission enforcement.

### Standalone external services

- EHR adapter, first target athenahealth.
- External AI only through AI gateway and governance controls.
- Object storage for audio/export files.
- Optional clearinghouse/payment/analytics integrations behind feature flags.

## Mode B: ClinicOS-integrated mode

ClinicOS-integrated mode lets AURA Note run as a module inside or alongside the larger AURA ClinicOS environment.

### ClinicOS-provided context

When enabled, ClinicOS may provide:

- identity and tenant/site context;
- schedule and appointment context;
- patient and visit identifiers;
- M03 VisitGraph state;
- M04 workflow/tasks;
- M17 NP Cockpit context;
- M21 Charge Integrity candidates;
- M23 Copilot Runtime;
- M24 AI Governance;
- M25 Integration Hub/EHR adapters;
- M26 Data Cloud analytics hooks.

### Integration rules

- AURA Note keeps its own domain model but maps local IDs to ClinicOS IDs.
- ClinicOS state never bypasses AURA Note permission checks.
- AURA Note events must be publishable to ClinicOS.
- AURA Note must be able to operate with ClinicOS disabled.
- ClinicOS services are accessed through adapter interfaces, never hard-coded imports.

## Required adapter pattern

Implement an application-level `ModeResolver` and adapters:

- `ScheduleSourceAdapter`
- `PatientContextAdapter`
- `VisitGraphAdapter`
- `TaskAdapter`
- `AuditAdapter`
- `AIGovernanceAdapter`
- `ChargeIntegrityAdapter`
- `EhrAdapter`
- `ExportAdapter`
- `IdentityAdapter`

Each adapter must have at least:

- standalone implementation;
- ClinicOS implementation scaffold;
- mock/demo implementation for tests.

## Shared domain invariants

These invariants apply in both modes:

- One appointment has one note.
- Editing requires active visit session timer unless an approved exception is active.
- Recording starts/stops with timer unless approved exception path is active.
- Raw audio retention is one week.
- Transcripts are retained indefinitely.
- AI never finalizes clinical/coding/billing decisions.
- Finalization requires all six wizard steps.
- Open blocker questions/tasks prevent signing.
- Final note and patient summary require clinician approval.
- Role-based visibility is enforced before retrieval and before display.

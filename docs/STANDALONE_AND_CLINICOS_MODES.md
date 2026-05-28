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

## Post-WO-032 production mode rails

`WO-033` keeps the one-product/two-host-mode rule in force for the production build. Future work must not fork AURA Note into separate standalone and ClinicOS applications.

- `WO-038` through `WO-039` complete standalone patient, chart, schedule, worklist, settings, template, estimate, and rules-catalog behavior so AURA Note can operate without ClinicOS.
- `WO-045` hardens ClinicOS-integrated mode through M03 VisitGraph, M04 WorkOS/tasks, M17 NP Cockpit, M21 Charge Integrity, M23 Copilot Runtime, M24 AI Governance, M25 Integration Hub, and M26 Data Cloud adapter boundaries.
- In every future work order, ClinicOS-provided identity, schedule, task, AI governance, integration, or analytics context must still pass AURA Note permission checks before data is returned or state is changed.

`WO-041` adds production-shaped identity/config governance for both modes:

- standalone mode owns synthetic tenant/site/user/session/config/feature-flag administration through AURA Note APIs and `/aura-note/platform`;
- ClinicOS-integrated identity is represented as a delegated adapter state, but remains disabled until configured and cannot bypass AURA Note tenant/site/role/purpose checks;
- OIDC and SAML are adapter boundaries only, with no real credentials, no raw token return, and no live SSO claim;
- high-risk feature flags default disabled in both modes and require approval evidence before metadata-only enablement.

`WO-042` adds production-shaped storage/download/retention/restore controls for both modes:

- standalone mode uses AURA Note tenant storage configuration and deterministic in-memory object storage for tests;
- ClinicOS-integrated mode may map storage object metadata and retention evidence through adapter boundaries later, but AURA Note remains authoritative for token issue, token validation, download delivery, deletion approval, and restore-readiness permission checks;
- missing ClinicOS storage delegation fails closed and cannot expose a public URL or bypass AURA Note RBAC/ABAC;
- raw-audio deletion remains approval/recovery-window gated and transcript retention remains indefinite in both modes.
## WO-043 observability and support operations mode behavior

In standalone mode, AURA Note owns the local observability/support operations metadata: redacted logs, metric probes, trace probes, operational readiness, degraded-mode acknowledgement, access-review evidence, and incident runbook evidence.

In ClinicOS-integrated mode, future operational status may be mapped to ClinicOS/Integration Hub, but `WO-043` keeps AURA Note authoritative for support access, redaction, PHI boundaries, audit evidence, and permission checks. Missing ClinicOS operational delegation fails closed and does not reduce AURA Note RBAC/ABAC enforcement.

`WO-043` does not enable live SIEM/APM exporters, production observability credentials, PHI-bearing logs, production launch approval, live EHR/ClinicOS sync, live AI, charge finalization, medical-necessity determination, or claim submission.

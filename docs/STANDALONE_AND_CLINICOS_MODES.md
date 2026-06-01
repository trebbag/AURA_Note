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

## WO-044 EHR sandbox/writeback mode behavior

In standalone mode, AURA Note owns EHR adapter status, chart-context packaging, and metadata-only writeback queue approval/retry/dead-letter/reconciliation behavior. EHR can remain disabled without blocking the standalone documentation workflow.

In ClinicOS-integrated mode, future EHR routing may pass through M25 Integration Hub, but `WO-044` keeps AURA Note authoritative for writeback approval, idempotency, retry/dead-letter/reconciliation metadata, audit evidence, and permission checks. Missing ClinicOS/EHR delegation fails closed and cannot enable live writeback or expose writeback payloads.

`WO-044` does not enable production EHR credentials, raw EHR payload storage, live writeback delivery, autonomous note submission, charge finalization, medical-necessity determination, or claim submission.

## WO-045 ClinicOS integration mode behavior

In standalone mode, AURA Note remains authoritative for tenant/site context, schedule, patient shell, note lifecycle, tasks, finalization, exports, writeback approval metadata, audit, AI/PHI controls, and coaching evidence. ClinicOS disabled or unavailable state produces safe degraded metadata and does not block standalone documentation workflows.

In ClinicOS-integrated mode, AURA Note maps metadata to M03 VisitGraph, M04 WorkOS/tasks, M17 NP Cockpit, M21 Charge Integrity, M23 Copilot Runtime, M24 AI Governance, M25 Integration Hub, and M26 Data Cloud through adapter boundaries only. `WO-045` adds visible module boundaries, stale/degraded mapping review, failed/degraded event publication metadata, and service-account/cross-tenant denial evidence. ClinicOS context cannot bypass AURA Note permissions, human-review gates, PHI boundaries, writeback approval, or finalization blockers.

`WO-045` does not enable live ClinicOS credentials, production event-bus delivery, raw ClinicOS payload storage, live delegated identity, live EHR/writeback through ClinicOS, charge finalization, medical-necessity determination, or claim submission.

## WO-046 AI governance mode behavior

In standalone mode, AURA Note owns the local AI governance metadata: prompt registry, model configuration records, deterministic evaluation cases, source-linked validation evidence, unsafe-output rejection, PHI rejection/redaction, and human-review-required gates. External AI remains disabled and standalone workflows continue to use deterministic mock evidence.

In ClinicOS-integrated mode, future AI request/governance metadata may map to M23 Copilot Runtime and M24 AI Governance through adapter boundaries only. `WO-046` keeps AURA Note authoritative for PHI scrubbing, purpose-of-use, source freshness, role checks, output validation, and human-review gates. Missing or degraded ClinicOS AI governance delegation fails closed and cannot enable live external AI calls or bypass AURA Note permissions.

`WO-046` does not enable live external AI, production model credentials, production prompt stores, raw PHI model payloads, autonomous diagnosis, final code or charge behavior, medical-necessity determination, order placement, claim submission, or patient-facing financial conclusions.

## WO-047 P9 mode-review posture

`WO-047` reviews standalone and ClinicOS-integrated mode threats. No new P9 blocker was found in the current synthetic/local scope. Standalone remains fully usable through local governance and disabled live-vendor boundaries. ClinicOS-integrated mode remains adapter-bound and metadata-only for live integration; missing or degraded ClinicOS delegation, event-bus delivery, module mapping, or AI governance delegation fails closed and cannot override AURA Note RBAC/ABAC, PHI, audit, or human-review gates.

## WO-062 API runtime-boundary mode behavior

In standalone mode, the API request boundary accepts explicit local/demo role context and synthetic tenant/site headers only through the shared Nest runtime bootstrap. Missing role context, invalid role context, invalid purpose-of-use context, cross-tenant context, and PHI-like ordinary payloads fail closed before DTO data is exposed.

In ClinicOS-integrated mode, the same request boundary applies before any adapter delegation. ClinicOS headers, service-account metadata, future event-bus context, or delegated identity claims cannot bypass AURA Note validation, tenant/site scope, PHI boundary, RBAC/ABAC checks, error redaction, request correlation, or audit-safe logging.

## WO-063 identity runtime-boundary mode behavior

In standalone mode, `AURA_NOTE_AUTH_MODE=local_demo` labels and normalizes synthetic identity headers for local browser/demo evidence, and `AURA_NOTE_AUTH_MODE=local_synthetic` requires explicit role, user, session, and purpose headers. Missing identity context, disabled users, expired sessions, wrong tenant/site, wrong purpose, and delegated identity providers fail closed before controller execution. This remains a local synthetic scaffold, not production SSO.

In ClinicOS-integrated mode, `AURA_NOTE_AUTH_MODE=clinicos_delegate` is represented as a disabled adapter posture. It fails closed until a later approved ClinicOS identity contract, credential source, event/audit policy, and tenant/user mapping are implemented. ClinicOS cannot pass synthetic headers to bypass AURA Note RBAC/ABAC, purpose-of-use, tenant/site, transcript, final-note, billing, coaching, AI, writeback, storage, or claim boundaries.

## WO-067 ModeResolver runtime boundary

`WO-067` promotes the required application-level `ModeResolver` into API runtime code. `resolveAuraRuntimeModeFromHeaders` now converts ClinicOS mode headers into a typed mode context, shared API mode, ClinicOS module boundaries, and ten explicit adapter seams: schedule source, patient context, VisitGraph, tasks, audit, AI governance, Charge Integrity, EHR, export, and identity.

Standalone mode remains the default and authoritative. Missing or invalid ClinicOS mode headers resolve to standalone; AURA Note schedule, patient, task, audit, export, identity, transcript, final-note, billing, coaching, AI, writeback, storage, and claim-boundary permissions still apply before DTO data is returned or state changes.

ClinicOS-integrated mode is still mock/degraded metadata only. The ClinicOS status and action responses now expose `modeAdapterBoundaries` with `permissionBoundary='aura_note_authoritative'`, `liveDelegationEnabled=false`, `rawPayloadStorageEnabled=false`, and `humanReviewRequired=true`. Degraded or unavailable ClinicOS mode marks adapter writes fail-closed. `pnpm mode:adapter-readiness` verifies the resolver, service tests, e2e evidence, docs, status, and no-live/no-launch posture.

`WO-067` does not enable live ClinicOS credentials, live event bus delivery, raw ClinicOS payload storage, delegated identity, live EHR/writeback routing, live AI, live transcription, production PHI, charge finalization, medical-necessity determination, claim submission, or production launch behavior.

## WO-068 transcription runtime boundary

In standalone mode, transcription now runs through a server-side provider adapter boundary. The deterministic mock provider processes metadata-only recording chunks, returns confidence/source/speaker-label placeholder metadata, records retry/dead-letter posture, preserves raw-audio one-week retention metadata, and keeps transcript retention indefinite. The disabled live provider path fails closed with metadata only and `liveProviderCallsEnabled=false`.

In ClinicOS-integrated mode, ClinicOS may supply visit context metadata through adapter boundaries, but ClinicOS cannot bypass AURA Note recording, transcript, correction, retention, role, or human-review permissions. Missing or degraded ClinicOS delegation does not block standalone transcription workflow and does not enable live provider calls.

`WO-068` does not enable live transcription credentials, raw PHI audio transport, live vendor calls, production audio storage, production PHI, charge finalization, medical-necessity determination, claim submission, or production launch behavior.

## WO-069 EHR sandbox runtime boundary

In standalone mode, EHR remains optional and safely disabled. AURA Note can surface athenahealth-first sandbox metadata, synthetic patient lookup, synthetic appointment import evidence, synthetic encounter context, and writeback lifecycle metadata without requiring live EHR credentials or blocking the documentation/finalization/export workflow.

In ClinicOS-integrated mode, future M25 Integration Hub routing remains adapter-bound. ClinicOS may provide mapping or context metadata in later work, but it cannot bypass AURA Note writeback approval, role checks, tenant/site scope, purpose-of-use, audit, reconciliation, no-raw-payload, or no-live-delivery boundaries.

`WO-069` does not enable production EHR credentials, raw EHR payload storage, live EHR API calls, live writeback delivery, autonomous finalization, charge finalization, medical-necessity determination, claim submission, or production launch behavior.

## WO-070 AI Gateway runtime governance boundary

In standalone mode, AURA Note owns AI Gateway policy, prompt/model metadata, deterministic evaluation evidence, PHI rejection/redaction, source-freshness checks, output validation, human-review gates, and runtime-boundary state. Disabled live model state does not block non-AI documentation, finalization, export, or draft claim preview workflows.

In ClinicOS-integrated mode, future M23 Copilot Runtime and M24 AI Governance delegation remains adapter-bound. ClinicOS may provide context metadata only through approved adapter seams, and it cannot bypass AURA Note purpose-of-use checks, source-freshness checks, PHI scrubber, tenant/site scope, role checks, output validation, human-review gates, audit/event evidence, or disabled live-model posture.

`WO-070` does not enable live external AI, production model credentials, private/BAA model approval, production prompt stores, raw PHI model payloads, autonomous diagnosis, final code or charge behavior, medical-necessity determination, order placement, claim submission, patient-facing financial conclusions, or production launch behavior.

## WO-049 launch operations readiness mode behavior

In standalone mode, `WO-049` launch operations readiness proves AURA Note can rehearse build, smoke, rollback, disabled-vendor, performance, incident, access-review, and support-escalation controls without ClinicOS.

In ClinicOS-integrated mode, ClinicOS dependencies are treated as disabled or degraded adapter states during rehearsal. Missing ClinicOS delegation, event publication, mapping, or operational status services fail closed and cannot bypass AURA Note permissions or support metadata-only boundaries. Production launch approval, live vendor traffic, production PHI, charge finalization, medical-necessity determination, and claim submission remain out of scope.

## WO-050 beta pilot launch gate

Standalone beta pilot setup remains possible without ClinicOS. Tenant onboarding, role training, support escalation, first-week monitoring, rollback, and go/no-go evidence use standalone AURA Note controls first. ClinicOS-integrated pilot setup remains optional and adapter-bound; missing delegated identity, mapping, operational status, or event-bus delivery must fail closed and cannot block standalone pilot operation or bypass AURA Note permissions.

## WO-051 claim/payer decision gate

In standalone mode, AURA Note keeps claim activity at draft claim preview and human billing review only. Live clearinghouse submission, payer API calls, denial automation, payment posting, charge finalization, medical-necessity determination, and patient financial conclusions remain disabled.

In ClinicOS-integrated mode, any future ClinicOS/M21 Charge Integrity or clearinghouse handoff must remain adapter-scoped and cannot bypass AURA Note permissions, human approval, audit, tenant/site scope, or `submittedClaim=false` default behavior. `WO-051` does not implement live ClinicOS charge submission, payer connectivity, claim submission, denial automation, or payment workflows.

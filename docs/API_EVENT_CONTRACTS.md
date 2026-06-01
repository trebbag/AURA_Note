# API and Event Contracts

The OpenAPI seed lives at `packages/contracts/openapi/aura-note.v1.yaml`. This file describes the required contract families.

## API families

1. Health/status.
2. Tenant/site/settings.
3. Users and permissions.
4. Schedule and appointments.
5. Patient and chart context.
6. Notes and visit sessions.
7. Recording/transcription.
8. Suggestions and AI evaluation.
9. Visit Selections.
10. Compliance & Quality Review.
11. History Gap Review.
12. Tasks and blockers.
13. Finalization Wizard.
14. Billing & Attest / draft claim preview.
15. Exports/PDF/copy.
16. EHR writeback.
17. Templates and dot phrases.
18. Coaching.
19. ClinicOS adapter.
20. Audit and events.

## Standard event envelope

```ts
type AuraNoteEvent<TPayload> = {
  eventId: string;
  eventType: string;
  schemaVersion: 'v1';
  tenantId: string;
  siteId: string;
  patientIdHash?: string;
  appointmentId?: string;
  noteId?: string;
  visitSessionId?: string;
  producer: string;
  eventTime: string;
  traceId: string;
  idempotencyKey: string;
  sensitivity: 'non_phi' | 'phi_reference' | 'restricted';
  retentionClass: 'standard' | 'audit' | 'transcript' | 'audio_ephemeral';
  payload: TPayload;
};
```

## Required domain events

- `appointment.created.v1`
- `note.shell_created.v1`
- `visit.started.v1`
- `visit.paused.v1`
- `visit.resumed.v1`
- `visit.stopped.v1`
- `recording.started.v1`
- `recording.exception_approved.v1`
- `recording.stopped.v1`
- `transcript.segment_added.v1`
- `transcript.finalized.v1`
- `suggestions.evaluated.v1`
- `visit_selection.added.v1`
- `visit_selection.removed.v1`
- `low_confidence_diagnosis.override_recorded.v1`
- `compliance.issue_created.v1`
- `compliance.issue_resolved.v1`
- `history_gap.question_created.v1`
- `history_gap.question_routed_to_ma.v1`
- `task.created.v1`
- `task.blocker_changed.v1`
- `task.adjudicated.v1`
- `finalization.started.v1`
- `finalization.step_completed.v1`
- `finalization.compose_requested.v1`
- `finalization.compose_completed.v1`
- `final_note.approved.v1`
- `patient_summary.approved.v1`
- `billing_review.triggered.v1`
- `draft_claim_preview.generated.v1`
- `note.signed.v1`
- `note.dispatched.v1`
- `export.generated.v1`
- `ehr_writeback.queued.v1`
- `ehr_writeback.completed.v1`
- `ehr_writeback.failed.v1`
- `coaching.report_generated.v1`
- `retention.scan_completed.v1`
- `audit.export_requested.v1`
- `audit.event_recorded.v1`

## API implementation rule

Every state-changing API must emit an audit event. Domain-significant state changes must emit a domain event as well.

## Implementation status

The CP-0 tranche implemented typed contract seeds. `WO-002` adds the first implemented Schedule Builder lifecycle endpoints:

- `GET /api/v1/schedule/appointments`
- `POST /api/v1/schedule/appointments`
- `POST /api/v1/schedule/appointments/{appointmentId}/start-visit`

The remaining OpenAPI operation IDs are retained as contract seeds for later work orders and must not be described as runtime-complete until their owning work order adds handlers, permission checks, audit emission, and tests.

CP-0 adds TypeScript DTOs and tests for:

- `AppointmentDto`
- `NoteDto`
- `VisitSessionDto`
- `TaskDto`
- `WizardStepDecisionDto`
- `AuditEventDto`
- `AuraNoteEvent<TPayload>`

The CP-0 event scaffold covers the first state-transition families needed by `WO-001`: appointment creation, note shell creation, visit start/pause/resume/stop, recording start/stop/exception, task blocker changes, low-confidence override recording, finalization start/step completion, and audit recording.

`WO-002` emits `appointment.created.v1`, `note.shell_created.v1`, and `visit.started.v1` from the in-memory standalone API implementation. The deeper timer, recording, and transcription lifecycle remains scoped to `WO-004`.

`WO-003` implements read-only/query CP-1 shells for Draft Notes, Finalized Notes, and Documentation Workspace. These endpoints do not introduce new state-changing operations, so no additional domain events are required for `WO-003`. Future state-changing editor updates remain contract seeds until timer/editing behavior is implemented in `WO-004`.

`WO-004` implements timer, recording-gate, raw-audio retention metadata, and mock transcript state changes. The CP-1 API emits `visit.paused.v1`, `visit.resumed.v1`, `visit.stopped.v1`, `recording.started.v1`, `recording.exception_approved.v1`, `recording.stopped.v1`, `raw_audio.retention_scheduled.v1`, and `transcript.segment_appended.v1` from the synthetic standalone implementation. These events are audit-safe metadata events and do not represent live audio capture or external transcription.

`WO-040` extends the audio/transcription event surface for the P8.5 synthetic candidate. The API now emits `microphone.permission_recorded.v1`, `recording.chunk_received.v1`, `transcription.provider_status_checked.v1`, `transcription.job_queued.v1`, `transcription.job_processed.v1`, and `transcript.segment_corrected.v1` for browser permission, metadata-only recording chunk, mock provider status, deterministic mock transcription, and correction-history actions. These events remain audit-safe metadata; they do not carry raw audio payloads, invoke live transcription providers, send transcript content to external AI, or authorize production deletion.

`WO-005` implements deterministic mock review-panel state changes. The CP-1 API emits `suggestions.evaluated.v1`, `suggestion.accepted.v1`, `suggestion.removed.v1`, `visit_selection.added.v1`, `compliance.evaluated.v1`, `history_gap.task_created.v1`, and `task.blocker_changed.v1`. These events represent draft/candidate workflow state only; they do not autonomously diagnose, code, bill, determine medical necessity, finalize charges, or submit claims.

`WO-006` implements the first four Finalization Wizard steps over a frozen synthetic snapshot. The CP-2 API adds implemented endpoints for starting finalization, recording Step 1 selected-item decisions, completing Code Review, recording Step 2 final-pass suggestion decisions, completing Suggestion Review, running deterministic mock Compose, updating the Compare & Edit source note, Re-beautify, approving the final note, and approving the patient summary. It emits `finalization.started.v1`, `finalization.selection_decided.v1`, `finalization.suggestion_decided.v1`, `finalization.compose_requested.v1`, `finalization.compose_completed.v1`, `finalization.compare_edit_updated.v1`, `finalization.compose_rebeautified.v1`, `final_note.approved.v1`, `patient_summary.approved.v1`, and `finalization.step_completed.v1`. These events represent human-reviewed wizard state only; Billing & Attest, signing, dispatch, final records, export/PDF/copy, and EHR writeback remain contract seeds until `WO-007` and `WO-008`.

`WO-007` implements Billing & Attest, draft claim preview, and Sign & Dispatch over the synthetic finalization session. The API emits `draft_claim_preview.generated.v1`, `billing_review.triggered.v1`, `billing_attestation.completed.v1`, `note.signed.v1`, `final_note.created.v1`, `patient_summary.finalized.v1`, `note.dispatched.v1`, and `finalization.step_completed.v1`. Draft claim preview events are internal candidate/readiness events only: they do not submit claims, finalize charges, finalize coding, or determine medical necessity. Export/PDF/copy and EHR writeback remain scoped to `WO-008`.

`WO-008` implements signed-output artifact actions and finalized-note detail state. The API emits `export.generated.v1` for final-note PDF, patient-summary PDF, final-note copy, patient-summary copy, and structured export artifact creation. It emits `ehr_writeback.queued.v1` only for the explicit mock-queue scaffold path and `ehr_writeback.failed.v1` for not-configured, unsupported, or simulated-failure writeback states. These events are audit-safe workflow metadata only: they do not perform live EHR writeback, submit claims, finalize charges, or connect to production storage.

`WO-009` implements the AI Gateway PHI boundary in mock-only mode. The API emits `ai.phi_rejected.v1` when forbidden PHI keys or obvious PHI-like free-text patterns are rejected before model invocation. It emits `ai.context_scrubbed.v1` when explicit redaction mode removes forbidden PHI values, `ai.request_prepared.v1` when a typed context package is accepted, and `ai.response_recorded.v1` when the mock provider returns a draft/candidate/suggestion-only response. These events contain governance metadata, prompt/model versions, source evidence IDs, and context package IDs; they do not contain raw note text, raw transcript text, production chart data, or live model output. External AI remains disabled by default.

`WO-046` adds production-review AI governance contracts without enabling live AI. `GET /ai-gateway/status` includes prompt registry metadata, model configuration records, deterministic evaluation cases, `externalAiEnabled=false`, `liveModelCredentialPresent=false`, `rawPhiToExternalAiAllowed=false`, and `humanReviewRequiredForAllOutputs=true`. `POST /ai-gateway/evaluations/run` runs deterministic synthetic evaluation cases and emits `ai.evaluation_run_completed.v1` or `ai.evaluation_run_failed.v1`. `POST /ai-gateway/outputs/validate` validates synthetic output shapes and emits `ai.output_rejected.v1` when prohibited autonomous behavior or raw PHI is detected. Prompt/model configuration change events are reserved as `ai.prompt_config_changed.v1` and `ai.model_config_changed.v1`; live config changes remain disabled until later governance approval. All WO-046 event payloads are metadata-only and trace-correlated.

`WO-047` reviews event/audit coverage across P8/P8.5/P9 and adds `pnpm security:review-readiness` as a review gate. No new state-changing runtime operation is introduced by this work order. Existing state-changing EHR, ClinicOS, AI governance, storage/download, retention, support, finalization, and workflow actions remain required to emit audit-safe metadata-only events without raw PHI, raw prompts, raw transcripts, raw EHR/ClinicOS payloads, production chart data, secrets, or live endpoint URLs.

`WO-010` implements the EHR adapter scaffold with an athenahealth-first path. The API emits `ehr.adapter_status_checked.v1` when adapter status is checked and `ehr.chart_context_loaded.v1` when source-linked synthetic chart context is loaded through the adapter boundary. Events include vendor, mode, health, chart context package ID, requested slice names, slice counts, stale slice count, and validation warnings. They do not contain raw EHR payloads, production patient identifiers, live athenahealth responses, or writeback content. Live EHR credentials and production writeback remain disabled.

`WO-011` implements the ClinicOS integration adapter scaffold. The API emits `clinicos.mode_resolved.v1` for standalone/ClinicOS mode checks, `clinicos.mapping_recorded.v1` when mock VisitGraph/M17 mappings are recorded, `clinicos.event_published.v1` when AURA Note events are queued or safely skipped for ClinicOS module targets, and `clinicos.unavailable.v1` when ClinicOS mock mode is configured but unavailable. These events preserve AURA Note as the owner of the note lifecycle and explicitly record that AURA Note permissions remain enforced; they do not grant ClinicOS context a permission bypass.

`WO-012` implements coaching and premium analytics scaffolding. The API emits `coaching.report_generated.v1` when a treating clinician views their own synthetic coaching report and `coaching.dashboard_viewed.v1` when an authorized admin views the premium dashboard scaffold. `coaching.signal_created.v1` is added as the event contract seed for future asynchronous signal generation. Coaching events are restricted audit metadata only; they are not patient-facing, do not expose revenue details to patients, and do not grant billing staff access to coaching outputs.

`WO-013` implements production-hardening scaffolding for support status, structured logging posture, feature flags, retention scans, and redacted audit export metadata. The worker emits `retention.scan_completed.v1` when the synthetic retention job evaluates raw-audio and transcript policies. The API emits `audit.export_requested.v1` when an authorized compliance/privacy lead or authorized admin requests a redacted JSONL metadata export. These events are audit-safe metadata only; they do not perform destructive storage purge, deliver downloadable audit files, expose PHI, enable external AI, connect to live EHRs, or sync production analytics.

`WO-033` does not add runtime API operations or domain events. It re-establishes the production build rails so future API/event implementation is sequenced safely:

- `WO-034` through `WO-037` must add durable audit/event evidence for persisted workflow state changes;
- `WO-038` through `WO-039` must add or harden standalone patient, chart, schedule, task, billing review, settings, template, estimate, and rules-catalog APIs;
- `WO-040` adds recording transport and transcription adapter API/event evidence as synthetic P8.5 readiness;
- `WO-041` through `WO-043` must harden identity/config/storage/retention/observability/support APIs;
- `WO-044` through `WO-047` must harden EHR, ClinicOS, AI governance, and security/privacy/compliance review evidence;
- `WO-051` remains a claim/payer decision gate and must not add live claim submission by default.

Every future state-changing API remains subject to validation, tenant/site scoping, permission checks, audit events, idempotency where applicable, PHI-safe logging, and standalone/ClinicOS mode boundaries.

## WO-034 durable visit capture event evidence

`WO-034` does not add new public clinical behavior beyond the existing CP-1 timer/recording/transcript API surface. It adds durable local persistence evidence for the existing visit capture event family:

- `visit.started.v1`, `visit.paused.v1`, `visit.resumed.v1`, and `visit.stopped.v1`;
- `recording.started.v1`, `recording.exception_approved.v1`, and `recording.stopped.v1`;
- `raw_audio.retention_scheduled.v1`;
- `transcript.segment_appended.v1`.

The new `pnpm persistence:visit-capture-adapter` evidence proves the backing `VisitSession`, `RecordingAsset`, `Transcript`, and `TranscriptSegment` state can be persisted and reloaded locally with tenant/site denial and RLS checks. Event payloads remain audit-safe metadata in this work order; live audio capture and external transcription remain deferred.

## WO-035 durable review-panel event evidence

`WO-035` does not add new public clinical behavior beyond the existing CP-1 review-panel API surface. It adds durable local persistence evidence for the existing review-panel event family:

- `suggestions.evaluated.v1`;
- `suggestion.accepted.v1`;
- `suggestion.removed.v1`;
- `visit_selection.added.v1`;
- `compliance.evaluated.v1`;
- `history_gap.task_created.v1`;
- `task.blocker_changed.v1`.

The new `pnpm persistence:review-panel-adapter` evidence proves the backing `Suggestion`, `VisitSelection`, `ComplianceIssue`, `HistoryGapQuestion`, and `Task` state can be persisted and reloaded locally with tenant/site denial and RLS checks. Low-confidence diagnosis suggestions remain draft/candidate-only and cannot be persisted as accepted without override evidence. Event payloads remain audit-safe workflow metadata in this work order; live AI suggestion generation, autonomous coding/billing, medical-necessity determination, charge finalization, claim submission, and live EHR/ClinicOS task sync remain deferred.

## WO-036 durable finalization/output event evidence

`WO-036` does not add new public finalization behavior beyond the existing CP-2 finalization, export, and writeback scaffold API surface. It adds durable local persistence evidence for the existing finalization/output event family:

- `finalization.started.v1`;
- `finalization.step_completed.v1`;
- `final_note.approved.v1`;
- `patient_summary.approved.v1`;
- `billing.attested.v1`;
- `final_note.signed.v1`;
- `export.generated.v1`;
- `ehr.writeback_queued.v1`;
- `ehr.writeback_failed.v1`.

The new `pnpm persistence:finalization-output-adapter` evidence proves the backing `FinalizationRun`, `WizardStepDecision`, `EnhancedNoteVersion`, `PatientSummaryVersion`, `BillingAttestation`, `DraftClaimPreview`, `ExportArtifact`, and `EhrWritebackJob` state can be persisted and reloaded locally with tenant/site denial and RLS checks. Draft claim preview persistence explicitly enforces `submittedClaim=false`; signed final note, patient summary, and export artifact records are immutable after approval/signature evidence. Event payloads remain audit-safe workflow metadata in this work order; live EHR writeback, clearinghouse/payer integration, medical-necessity determination, charge finalization, and claim submission remain deferred.

## WO-037 durable audit/event metadata evidence

`WO-037` does not add new public clinical behavior. It adds durable local persistence evidence for the existing audit/support/coaching/config/integration event metadata family:

- `audit.event_recorded.v1`;
- `audit.export_requested.v1`;
- current support status audit events;
- current coaching report audit events;
- current ClinicOS mode-mapping metadata events;
- current disabled/mock integration status metadata.

The new `pnpm persistence:durable-runtime-readiness` evidence proves the backing `AuditEvent`, `DomainEvent`, `SupportStatusSnapshot`, `FeatureFlag`, `Template`, `DotPhrase`, `CoachingReport`, `IntegrationConnection`, and `ModeMapping` state can be persisted and reloaded locally with tenant/site denial, role-denial harnesses, and broad RLS checks. Event payloads remain audit-safe synthetic metadata; production observability sinks, live vendor sync, production analytics, live AI, charge finalization, medical-necessity determination, and claim submission remain deferred.

## WO-038 standalone patient, chart context, and schedule event evidence

`WO-038` adds implemented synthetic/local API behavior for the standalone patient and Schedule Builder tranche:

- `GET /api/v1/standalone/patients`
- `POST /api/v1/standalone/patients`
- `PATCH /api/v1/standalone/patients/{safePatientId}`
- `PATCH /api/v1/schedule/appointments/{appointmentId}`
- `POST /api/v1/schedule/appointments/{appointmentId}/status`
- `GET /api/v1/schedule/appointments/{appointmentId}/chart-context`

The implemented event family now includes `patient.shell_created.v1`, `patient.updated.v1`, `patient.linkage_recorded.v1`, `appointment.updated.v1`, `appointment.checked_in.v1`, `appointment.cancelled.v1`, `appointment.no_show_marked.v1`, `chart_context.snapshot_created.v1`, and `chart_context.snapshot_viewed.v1`.

These events are synthetic/local, metadata-safe evidence for standalone patient shell, patient linkage, chart freshness, and appointment lifecycle behavior. Chart context uses safe patient identifiers and source freshness warnings only; it does not represent live EHR completeness, production patient matching, production PHI storage approval, live ClinicOS synchronization, claim submission, charge finalization, or autonomous clinical/coding/billing behavior.

## WO-039 standalone operations event evidence

`WO-039` adds implemented synthetic/local API behavior for standalone daily operations:

- `GET /api/v1/standalone/operations/tasks`
- `PATCH /api/v1/standalone/operations/tasks/{taskId}`
- `GET /api/v1/standalone/operations/billing-review`
- `PATCH /api/v1/standalone/operations/billing-review/{billingReviewId}`
- `GET /api/v1/standalone/operations/settings`
- `PATCH /api/v1/standalone/operations/settings/integrations/{integrationId}`
- `GET /api/v1/standalone/operations/templates`
- `POST /api/v1/standalone/operations/templates`
- `PATCH /api/v1/standalone/operations/dot-phrases/{dotPhraseId}`
- `GET /api/v1/standalone/operations/estimate-config`
- `PATCH /api/v1/standalone/operations/estimate-config`
- `GET /api/v1/standalone/operations/rules-catalog`
- `POST /api/v1/standalone/operations/rules-catalog/publish`

The implemented event family now includes `task.adjudicated.v1`, `task.blocker_changed.v1`, `billing_review.status_changed.v1`, `settings.integration_updated.v1`, `template.created.v1`, `dot_phrase.updated.v1`, `estimate_config.updated.v1`, and `rules_catalog.published.v1`.

These events are audit-safe metadata for synthetic standalone operations. Billing review transcript access is limited to billing staff in a triggered review context; draft claim preview state keeps `submittedClaim=false`; estimate configuration remains internal-only; and rules catalog entries remain source-linked, human-review-required, and prohibited from autonomous finalization or medical-necessity determination.

## WO-041 production identity/config event evidence

`WO-041` adds implemented synthetic/local API behavior for production-shaped platform controls:

- `GET /api/v1/platform/admin`
- `POST /api/v1/platform/identity/session-evaluations`
- `PATCH /api/v1/platform/identity/users/{userId}`
- `POST /api/v1/platform/config/validate`
- `PATCH /api/v1/platform/feature-flags/{key}`

The implemented event family now includes `identity.adapter_status_checked.v1`, `identity.session_evaluated.v1`, `identity.user_updated.v1`, `config.validation_completed.v1`, and `feature_flag.updated.v1`.

These events are audit-safe metadata for identity adapter status, fail-closed session evaluation, workforce user active/disabled status, production-shaped config validation, secret-source metadata checks, and high-risk feature-flag changes. They do not contain secrets, raw tokens, production URLs, raw PHI, transcript content, billing details, coaching output, or final-note payloads. OIDC, SAML, ClinicOS delegated identity, external AI, production storage, retention deletion, EHR writeback, patient-facing estimates, and claim submission remain disabled unless later work orders add governed live execution evidence.

## WO-042 secure storage and restore event evidence

`WO-042` adds implemented synthetic/local API behavior for storage-backed delivery and restore posture:

- `POST /api/v1/notes/{noteId}/exports/{exportArtifactId}/download`
- `POST /api/v1/support/audit-exports/{auditExportId}/download`
- `GET /api/v1/support/backup-restore/readiness`

The event family now includes `storage.download_requested.v1`, `storage.download_denied.v1`, `storage.object_delivered.v1`, `storage.object_missing.v1`, `backup.posture_checked.v1`, and `restore.readiness_checked.v1`.

`storage.object_delivered.v1` is emitted only after token, tenant, site, requester, role, and object checks pass. The payload is audit-safe metadata: storage key, content length, permission, server-mediated status, and `publicUrl: null`. Raw object contents, transcript text, billing details, coaching output, secrets, and production URLs are not event payloads. Raw-audio deletion remains represented through `retention.scan_completed.v1` with deletion evidence and `transcriptPurgeCount: 0`.
## WO-043 observability and support operations contracts

`WO-043` adds the P8 operational support API/event surface:

- `GET /support/operations/readiness` returns synthetic P8 readiness evidence for local observability, support operations, incident runbooks, access-review evidence, and explicit non-launch posture.
- `POST /support/operations/evidence` records audit-safe support operational evidence for incident runbook views, degraded-mode acknowledgements, and access-review records.
- `GET /support/status` now includes P8 domain-event evidence for support status and observability status checks.

New event types are `support.status_checked.v1`, `observability.status_checked.v1`, `operational.readiness_checked.v1`, `incident.runbook_viewed.v1`, `degraded_mode.acknowledged.v1`, and `access_review.evidence_recorded.v1`. Payloads are metadata-only and must not include PHI-bearing logs, secrets, production URLs, final notes, transcripts, billing details, coaching outputs, or writeback payloads.

## WO-044 EHR sandbox writeback queue contracts

`WO-044` adds the P9 EHR sandbox/writeback queue API/event surface:

- `GET /integrations/ehr/writeback-queue` returns metadata-only writeback queue state for disabled, pending approval, approved, retrying, failed, dead-lettered, and reconciled items.
- `POST /integrations/ehr/writeback-queue/{writebackJobId}/actions` records approval, retry, dead-letter, or reconciliation actions with idempotency, role checks, PHI evidence rejection, and audit/domain events.
- Existing EHR status and chart-context contracts remain intact and continue to use disabled/mock/sandbox-safe adapter behavior by default.

New event types are `ehr.writeback_approval_recorded.v1`, `ehr.writeback_retry_scheduled.v1`, `ehr.writeback_dead_lettered.v1`, `ehr.writeback_reconciliation_checked.v1`, and `ehr.writeback_disabled.v1`. Payloads are metadata-only and must not include raw EHR payloads, production patient identifiers, final-note text, transcript text, billing details, credentials, production URLs, charge finalization, medical-necessity determinations, or claim submission evidence.

## WO-045 ClinicOS integration hardening contracts

`WO-045` hardens the P9 ClinicOS integration API/event surface:

- `GET /integrations/clinicos/status` now returns module boundaries for M03, M04, M17, M21, M23, M24, M25, and M26, metadata-only mapping/publication state, explicit screen states, `rawPayloadsStored=false`, `liveClinicOsSyncEnabled=false`, and `permissionsStillEnforcedByAuraNote=true`.
- `POST /integrations/clinicos/mappings` records metadata-only module mapping review evidence, including active, stale, degraded, unavailable, and failed mapping states.
- `POST /integrations/clinicos/events/publish` records metadata-only event publication status, including queued, skipped-disabled, degraded, and failed-unavailable states.

New event types are `clinicos.event_publication_failed.v1`, `clinicos.mapping_stale_detected.v1`, and `clinicos.permission_denied.v1` alongside the existing ClinicOS mode, mapping, publication, and unavailable events. Payloads are audit-safe metadata only and must not include raw ClinicOS payloads, transcripts, final notes, billing details, coaching output, credentials, production URLs, live event-bus payloads, charge finalization, medical-necessity determinations, or claim submission evidence.

## WO-049 launch operations readiness event evidence

`WO-049` does not add new state-changing production endpoints. It documents launch-operations event stubs for future durable operational evidence and validates synthetic/local readiness through scripts and support-status UI.

Event stubs for launch review are `deployment.smoke_checked.v1`, `deployment.rollback_rehearsed.v1`, `performance.baseline_measured.v1`, `reliability.drill_recorded.v1`, `incident.response_rehearsed.v1`, and `access_review.launch_checked.v1`.

Payloads must be audit-safe metadata only: environment label, synthetic tenant/site, actor role, trace ID, release ID, drill name, expected degraded state, actual result, rollback decision, and follow-up owner. Payloads must not include PHI-bearing logs, transcripts, final notes, billing details, coaching outputs, raw AI prompts, raw EHR/ClinicOS payloads, storage object payloads, production URLs, credentials, charge finalization, medical-necessity determinations, or claim submission evidence.

## WO-050 beta pilot launch gate event evidence

`WO-050` adds beta-pilot launch gate event stubs for future audited launch evidence: `launch.onboarding_checklist_recorded.v1`, `launch.role_training_recorded.v1`, `launch.disabled_feature_inventory_reviewed.v1`, `launch.first_week_monitoring_planned.v1`, `launch.rollback_criteria_reviewed.v1`, `launch.signoff_placeholder_recorded.v1`, and `launch.go_no_go_reviewed.v1`.

Current `WO-050` evidence is docs/script/UI metadata only; these event stubs do not represent live launch approval, production deployment, production PHI, live vendor traffic, charge finalization, medical-necessity determination, or claim submission.

## WO-051 claim/payer decision gate event evidence

`WO-051` records P11 as a claim/payer decision gate and does not add live claim submission APIs. Future event stubs that must exist before any later approved live submission work are `claim.strategy_decision_recorded.v1`, `claim.submission_approval_recorded.v1`, `claim.submission_requested.v1`, `claim.submission_blocked.v1`, `payer.acknowledgement_received.v1`, `payer.denial_recorded.v1`, `claim.void_or_reversal_requested.v1`, and `payment.reconciliation_recorded.v1`.

Current behavior remains draft claim preview and billing review only. Event payloads must be audit-safe metadata and must not include raw payer payloads, production payer credentials, patient financial conclusions, medical-necessity determinations, autonomous charge finalization, denial automation, payment posting, or claim submission evidence. Any future live event implementation requires a new approved work order.

## WO-062 API runtime boundary contracts

`WO-062` adds no new clinical state-changing endpoints. It standardizes the request-boundary contract for implemented public endpoints:

- `ApiErrorEnvelope` is the standard PHI-safe error shape for validation, permission-denied, blocked, read-only, oversized, throttled, and failed states.
- Every request receives `x-aura-request-id` and `x-aura-trace-id` response headers, and those values are made available to controllers, logs, audit metadata, and tests.
- Missing local/demo role context fails closed outside `/health`; invalid role or purpose-of-use headers fail before controller execution.
- Ordinary endpoint request bodies reject forbidden PHI-like fields/text, raw transcript/raw audio fields, and production credential fields before service mutation.
- Governed AI Gateway invocation bodies remain under the AI Gateway PHI policy so `ai.phi_rejected.v1`, `ai.context_scrubbed.v1`, `ai.request_prepared.v1`, and `ai.response_recorded.v1` evidence stays source-linked and human-review gated.

The runtime boundary records local redacted structured log evidence only. It does not add a durable `api.request_denied.v1` event yet; durable denied-request event persistence is deferred until the observability/audit runtime work explicitly promotes request-boundary logs into tenant-owned audit/event storage.

## WO-063 identity runtime boundary contracts

`WO-063` adds no new clinical state-changing endpoints. It standardizes the auth-posture boundary for implemented public endpoints:

- Non-health API requests require explicit `AURA_NOTE_AUTH_MODE`.
- `local_demo` and `local_synthetic` are the only modes that accept synthetic AURA Note identity headers, and response headers label the posture through `x-aura-auth-mode` and `x-aura-identity-source`.
- Strict local synthetic mode requires role, user, session, and purpose headers before controller execution.
- `preview_oidc`, `production_oidc`, `production_saml`, and `clinicos_delegate` deny before controller execution while live adapters are unconfigured.
- `IdentityRuntimeBoundaryDecision` is seeded in contracts/OpenAPI as audit-safe metadata. It includes auth mode, identity source, failure reason, `liveCredentialPresent=false`, `delegatedIdentityConfigured=false`, `rawTokenReturned=false`, and synthetic-header acceptance state.
- Identity accepted/denied decisions are recorded in local redacted structured runtime logs as `identity.accepted` and `identity.denied`.

The identity boundary does not emit durable tenant-owned identity events yet. Durable `identity.runtime_accepted.v1` or `identity.runtime_denied.v1` event persistence is deferred until a later observability/audit runtime work order promotes request-boundary logs into durable audit/event storage. No raw tokens, secrets, SAML assertions, OIDC claims payloads, production IdP responses, ClinicOS delegated identity payloads, or PHI are logged or returned.

## WO-067 ModeResolver and adapter-boundary event evidence

`WO-067` extends the existing ClinicOS status, mapping, and publication contracts with `AuraModeAdapterBoundary` / `modeAdapterBoundaries` response metadata. The boundary metadata covers schedule source, patient context, VisitGraph, tasks, audit, AI governance, Charge Integrity, EHR, export, and identity seams and records `permissionBoundary='aura_note_authoritative'`, `liveDelegationEnabled=false`, `rawPayloadStorageEnabled=false`, and `humanReviewRequired=true`.

The existing event family remains the source of runtime evidence: `clinicos.mode_resolved.v1`, `clinicos.mapping_recorded.v1`, `clinicos.mapping_stale_detected.v1`, `clinicos.event_published.v1`, `clinicos.event_publication_failed.v1`, `clinicos.permission_denied.v1`, and `clinicos.unavailable.v1`. `WO-067` payloads add audit-safe fields such as `modeAdapterBoundaryCount`, `liveDelegationEnabled=false`, and `rawPayloadStorageEnabled=false`. They must not include raw ClinicOS payloads, event-bus messages, transcripts, final-note text, billing details, coaching output, identity tokens, credentials, production URLs, charge finalization, medical-necessity determinations, or claim submission evidence.

## WO-068 transcription runtime boundary contracts

`WO-068` extends the transcription API/event surface while keeping live provider calls disabled:

- `GET /documentation-workspace/appointments/{appointmentId}/transcription/provider-status` returns server-side adapter status, retry/dead-letter metadata, raw-audio one-week retention posture, indefinite transcript retention posture, and documented runtime states.
- `POST /documentation-workspace/appointments/{appointmentId}/transcription/jobs/mock` processes deterministic mock transcription from metadata-only chunks.
- `POST /documentation-workspace/appointments/{appointmentId}/transcription/jobs/disabled-live-provider` records a fail-closed live-provider request with `liveProviderCalled=false`.

New event stubs are `recording.chunk_authorized.v1`, `recording.chunk_denied.v1`, `transcription.job_requested.v1`, `transcription.job_denied.v1`, `transcription.provider_disabled.v1`, `transcription.provider_unavailable.v1`, `transcription.segment_received.v1`, and `transcription.correction_recorded.v1`. Existing runtime events remain `microphone.permission_recorded.v1`, `recording.chunk_received.v1`, `raw_audio.retention_scheduled.v1`, `transcription.provider_status_checked.v1`, `transcription.job_queued.v1`, `transcription.job_processed.v1`, `transcription.job_failed.v1`, `transcript.segment_appended.v1`, and `transcript.segment_corrected.v1`.

Payloads are audit-safe metadata only. They must not include raw audio, transcript text except through existing transcript DTO access policy, credentials, live provider payloads, production URLs, autonomous diagnosis/coding/billing evidence, charge finalization, medical-necessity determinations, or claim submission evidence.

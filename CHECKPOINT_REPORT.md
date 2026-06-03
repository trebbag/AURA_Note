# CHECKPOINT_REPORT

## CP-1 — Standalone clinical workflow shell ready

**Status:** Complete and merged to `main`. PR #5 passed GitHub Actions before `WO-006` began.

## Completed work orders

- `WO-002` — Schedule Builder appointment-note lifecycle.
- `WO-003` — Draft/Finalized Notes and Documentation Workspace shell.
- `WO-004` — Timer, recording gate, transcription scaffold.
- `WO-005` — Suggestions, Visit Selections, Compliance, History Gap Review.

## Acceptance evidence

- Schedule Builder creates synthetic standalone appointments and one-to-one inactive note shells.
- Start Visit activates the note into Draft Notes and creates a visit-session scaffold.
- Draft Notes, Finalized Notes, read-only finalized note viewer, and Documentation Workspace routes build in Next.js.
- Documentation Workspace exposes the required top panel, controls, editor, Visit Selections, Suggestions, Transcript, Compliance, and History Gap regions.
- Timer controls lock/unlock the editor through Start, Pause, Resume, and Stop behavior.
- Recording exception approval unlocks documentation without marking normal recording active.
- Mock transcript segments are source-marked and retained indefinitely.
- Raw audio metadata is classified as one-week `audio_ephemeral`; the worker can identify purge-eligible metadata.
- Deterministic mock Suggestions are draft-only and human-review-required.
- Low-confidence diagnosis/ICD candidates below 75 percent require override metadata.
- Accepted suggestions and manual additions move into Visit Selections.
- History Gap questions can create MA-owned blocker tasks.
- Compliance hard blocks disable Finalize-facing controls when unresolved blocker tasks exist.

## Validation commands

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm lint:phi`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `node scripts/status.js`
- `git diff --check`
- GitHub Actions `AURA Note CI / build-test` passed on PR #2, PR #3, PR #4, and PR #5.
- Final `WO-005` local gate passed before PR #5 was merged.

## Open risks

- CP-1 remains synthetic and process-local. Production persistence, migrations, live transcription, live EHR integration, and external AI remain out of scope.
- UI fidelity is functional workflow scaffolding, not final Figma design.
- Some package-level e2e scripts remain explicit deferrals until their later work orders introduce real browser/API harnesses.
- GitHub Actions emits a non-failing Node 20 action-runtime deprecation annotation; the project runtime remains pinned for now.

## Unresolved SPEC_GAPs

None discovered during CP-1.

## Next recommended batch

Begin CP-2 with `WO-006` through `WO-008`: Finalization Wizard steps, MA follow-up blocker resolution, patient summary/final note approval, Billing & Attest draft claim preview, and export/PDF/copy/final note viewer behavior. Keep the same synthetic-data and human-review boundaries.

## CP-2 — Finalization and dispatch ready

**Status:** Complete and merged to `main`. PR #8 passed GitHub Actions before merge.

## Completed work orders

- `WO-006` — Finalization Wizard steps 1 through 4.
- `WO-007` — Billing & Attest, draft claim preview, Sign & Dispatch.
- `WO-008` — Export/PDF/copy/final note viewer.

## Acceptance evidence

- Finalization starts from a frozen synthetic snapshot and enforces ordered Code Review, Suggestion Review, Compose, Compare & Edit, Billing & Attest, and Sign & Dispatch steps.
- Step 1 selected items and Step 2 final-pass suggestions require human keep/remove decisions.
- Compose creates deterministic enhanced-note and patient-summary draft outputs and blocks patient summaries containing internal billing/revenue/coding/coaching details.
- Compare & Edit requires separate final note and patient summary approvals.
- Draft claim preview is internal, caveated, candidate-only, and has `submittedClaim = false`.
- Billing & Attest requires required statements, estimate caveat acknowledgement, draft claim preview, and no unresolved blocker tasks.
- Sign & Dispatch creates read-only final note and patient summary records, removes the note from Draft Notes, and makes it available in Finalized Notes.
- Export/copy/PDF actions are blocked before signing and generate signed-version-locked artifacts after signing.
- Patient summary export artifacts assert internal details are excluded.
- EHR writeback queue status handles not-configured, queued mock, unsupported, and failed scaffold states without marking writeback complete.
- Linked-staff final-note visibility and export permissions are tested.
- Finalized Notes and the finalized-note viewer are browser-testable with read-only tabs, artifact status, and writeback status controls.

## Validation commands

- `pnpm --filter @aura-note/domain test`
- `pnpm --filter @aura-note/contracts test`
- `pnpm --filter @aura-note/security test`
- `pnpm --filter @aura-note/worker test`
- `pnpm --filter @aura-note/api typecheck`
- `pnpm --filter @aura-note/web typecheck`
- `pnpm --filter @aura-note/api test`
- `pnpm --filter @aura-note/api test:e2e`

Full repository gate and browser verification are recorded in `RUN_LOG.md` for the `WO-008` PR tranche after completion.

## Open risks

- CP-2 remains synthetic and process-local. Production persistence, PDF rendering/storage, live EHR writeback, live claim submission, external AI, and PHI-bearing integrations remain out of scope.
- EHR writeback is configuration-gated and represented by queue/status scaffolding only.
- UI fidelity remains functional workflow scaffolding until design work.

## Unresolved SPEC_GAPs

None discovered during CP-2.

## Next recommended batch

Begin CP-3 with `WO-009` through `WO-011`: AI Gateway and PHI boundary, athenahealth-first EHR adapter scaffolding, and ClinicOS integration adapter. Keep raw PHI out of external AI, keep all EHR behavior behind adapters, and preserve human review for clinical, billing, and writeback actions.

## CP-3 — AI, PHI, and EHR integration shell ready

**Status:** Complete and merged to `main`. PR #9, PR #10, and PR #11 passed GitHub Actions before merge.

## Completed work orders

- `WO-009` — AI Gateway and PHI boundary.
- `WO-010` — EHR adapters with athenahealth-first path.
- `WO-011` — ClinicOS integration adapter.

## Acceptance evidence

- AI Gateway status and mock invocation endpoints exist with external AI disabled by default.
- AI context packaging is source-linked, purpose-limited, draft/candidate-only, and human-review-required.
- Obvious forbidden PHI keys are rejected by default; explicit redaction mode produces scrubbed context before mock invocation.
- Model-governance/audit events are represented for AI request preparation, context scrubbing, PHI rejection, response recording, and unsafe output rejection.
- Vendor-neutral EHR adapter interfaces exist with disabled, mock, and athenahealth sandbox-safe scaffold implementations.
- EHR status and synthetic chart-context endpoints are tenant-scoped through the adapter boundary and do not require live credentials.
- EHR writeback remains configuration-gated scaffold state; the CP-2 writeback queue is not converted into live writeback.
- ClinicOS host-mode resolution supports standalone and ClinicOS mock contexts without replacing AURA Note permission checks.
- ClinicOS mapping records connect AURA Note visit context to M03 VisitGraph, M04 tasks, M17 NP Cockpit, M21 Charge Integrity, M23 AI, M24 governance, M25 integration, and M26 data concepts where relevant.
- ClinicOS unavailable or disabled mode degrades safely by returning no external mappings and recording an unavailable event instead of blocking standalone workflows.
- Worker scaffolds can normalize AI invocation status, EHR adapter health, and ClinicOS outbox events without external services.

## Validation commands

- `pnpm --filter @aura-note/ai-gateway test`
- `pnpm --filter @aura-note/ehr-adapters test`
- `pnpm --filter @aura-note/clinicos-adapter test`
- `pnpm --filter @aura-note/contracts test`
- `pnpm --filter @aura-note/security test`
- `pnpm --filter @aura-note/api test`
- `pnpm --filter @aura-note/api test:e2e`
- `pnpm --filter @aura-note/worker test`
- `pnpm --filter @aura-note/testing test`
- `pnpm --filter @aura-note/api typecheck`
- `pnpm --filter @aura-note/clinicos-adapter typecheck`
- Full repository gate passed before opening the `WO-011` PR: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm lint:phi`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm build`, `node scripts/status.js`, and `git diff --check`.
- GitHub Actions `AURA Note CI / build-test` passed on PR #9, PR #10, and PR #11.

## Open risks

- CP-3 remains synthetic and process-local. Production persistence, production de-identification, live AI providers, live athenahealth connectivity, live ClinicOS services, production identity delegation, and production data-cloud writes remain out of scope.
- PHI detection is an obvious-pattern scaffold for CP-3 and is not a production de-identification engine.
- EHR chart context and ClinicOS mappings are synthetic fixtures; they are not evidence of live vendor integration.
- External writeback, claim submission, diagnosis finalization, coding finalization, medical-necessity determination, and autonomous billing remain prohibited and unimplemented.

## Unresolved SPEC_GAPs

None discovered during CP-3.

## Next recommended batch

Begin CP-4 with `WO-012` through `WO-014`: coaching and analytics scaffolding, production hardening/observability/retention/audit, and end-to-end acceptance/readiness reporting. Keep coaching role-limited, non-punitive, and separated from patient-facing outputs unless the governing spec authorizes a specific view.

## CP-4 — Commercial readiness candidate

**Status:** Complete for the defined synthetic/local-first work-order package. The CP-4 branch must pass GitHub Actions before merge.

## Completed work orders

- `WO-012` — Coaching and analytics scaffolding.
- `WO-013` — Production hardening, observability, retention, audit.
- `WO-014` — End-to-end acceptance and readiness report.

## Acceptance evidence

- Coaching own-report and premium dashboard scaffolds are deterministic, role-limited, and non-punitive.
- Billing staff are denied coaching output; patient-facing outputs exclude coaching and internal revenue/coding details.
- Recording-exception visits mark transcript-dependent coaching unavailable instead of inferring normal recording.
- Structured logging helpers redact forbidden PHI keys and obvious PHI-like text.
- External AI, EHR writeback, ClinicOS sync, production analytics, and audit export download feature flags default to disabled.
- Support status exposes operational metadata only to support, service-account, clinic-manager, compliance/privacy, and authorized-admin contexts.
- Audit export requests are compliance/privacy/admin-only, require `includePhi = false`, emit `audit.export_requested.v1`, and remain metadata-only.
- Retention job scaffolding records one-week raw-audio purge eligibility and indefinite transcript retention without destructive purge.
- Standalone and ClinicOS mock modes are covered by integration tests while preserving AURA Note permission checks.
- The CP-4 readiness validator checks repo status, active `SPEC_GAPS.md`, browser route files, e2e test files, package tests, OpenAPI paths/events, run log evidence, and checkpoint evidence.

## Validation commands

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm lint:phi`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

## Open risks

- CP-4 remains synthetic and local-first. Production database persistence, vendor integrations, external AI providers, production analytics, production audit file delivery, and live storage deletion remain out of scope.
- PHI detection/log redaction is CP-4 scaffold coverage, not certified production de-identification.
- Browser verification is route-level and manual automation evidence; a committed Playwright suite is recommended for the next production-readiness batch.
- Final commercial launch still requires founder/product review, clinical review, compliance/privacy review, security review, deployment architecture, and design-system work.

## Unresolved SPEC_GAPs

None discovered during CP-4.

## Next recommended batch

Define the post-CP-4 productionization backlog: durable persistence and migrations, authenticated tenant/identity integration, design-system/Figma implementation, committed browser E2E suite, production observability sinks, deployment runbooks, and formal compliance/security review. Keep all live AI, EHR, writeback, analytics, and audit-file delivery disabled until production credentials, privacy controls, governance, and human approval gates are specified and tested.

## P6.5 — Build rails re-established

**Status:** Complete locally for `WO-033`; GitHub Actions must pass on the PR before merge.

## Completed work orders

- `WO-033` — Production build rails and readiness controls.

## Acceptance evidence

- `docs/PRODUCTION_BUILD_PLAN.md` now defines future work orders `WO-033` through `WO-051` with explicit objectives, scope, mode behavior, data/API/event/RBAC/AI/PHI/security requirements, testing requirements, stop conditions, and definitions of done.
- `AGENTS.md` now includes post-`WO-032` checkpoint gates P6.5, P7, P7.5, P8, P8.5, P9, P10, and P11.
- `work_orders/README.md` lists future work orders and explains how planned/todo work orders should be interpreted.
- `repo_status.json` preserves `WO-000` through `WO-032` as done, marks `WO-033` done, sets `WO-034` as the next work order, and keeps later work orders planned.
- `SPEC_GAPS.md` explicitly states there are no active gaps as of the post-`WO-032` re-rail review and lists deferred production decisions.
- `scripts/acceptance-readiness.js` continues to prove synthetic/post-CP4 readiness without falsely requiring future planned production work to be complete.
- `scripts/production-build-readiness.js` adds production-build control checks for future status semantics, plan coverage, active work-order file presence, and done-work-order evidence.

## Validation commands

- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm ehr:integration-readiness`
- `node scripts/status.js`
- `git diff --check`
- Full local gate recorded in `RUN_LOG.md` for `WO-033`.

## Open risks

- P6.5 is a control/checkpoint package, not product runtime implementation.
- `WO-034` through `WO-036` now provide local synthetic durable runtime evidence for visit capture, review panels, and finalization/output/writeback metadata; `WO-037` through `WO-051` remain unimplemented until promoted and completed sequentially.
- AURA Note remains not production-ready; production identity, broad durable persistence, live audio/transcription, live storage, live EHR, live AI, production PHI storage, production deletion, and claim submission remain deferred.

## Active SPEC_GAPs

None as of the post-`WO-032` / production-build re-rail review.

## Deferred production decisions

Deferred decisions are tracked in `SPEC_GAPS.md` for production identity, production PHI persistence/database operations, Azure Blob storage/deletion, live transcription provider, external AI/provider governance, EHR writeback, ClinicOS live integration, revenue estimates, and claim/payer strategy.

## Next recommended batch

Continue P7 with `WO-037` durable audit/event/support/config/coaching persistence and broad RLS completion. Keep all production PHI, live vendor, autonomous clinical/coding/billing, live writeback, and claim-submission paths disabled unless later work orders and governance explicitly authorize them.

---

# P7 — Durable Runtime Candidate

## Completed work orders

- `WO-034` — Durable visit capture runtime persistence for `VisitSession`, `RecordingAsset`, `Transcript`, and `TranscriptSegment`.
- `WO-035` — Durable review panel persistence for `Suggestion`, `VisitSelection`, `ComplianceIssue`, `HistoryGapQuestion`, and `Task`.
- `WO-036` — Durable finalization/output/writeback persistence for `FinalizationRun`, `WizardStepDecision`, `EnhancedNoteVersion`, `PatientSummaryVersion`, `BillingAttestation`, `DraftClaimPreview`, `ExportArtifact`, and `EhrWritebackJob`.
- `WO-037` — Durable audit/event/support/config/coaching/mode metadata persistence and broad remaining tenant-owned RLS coverage.

## Acceptance evidence

- `pnpm persistence:visit-capture-adapter` passed with live local PostgreSQL adapter and RLS evidence.
- `pnpm persistence:review-panel-adapter` passed with live local PostgreSQL adapter and RLS evidence.
- `pnpm persistence:finalization-output-adapter` passed with live local PostgreSQL adapter and RLS evidence.
- `pnpm persistence:durable-runtime-readiness` passed with live local PostgreSQL adapter and broad RLS evidence for `AuditEvent`, `DomainEvent`, `SupportStatusSnapshot`, `FeatureFlag`, `Template`, `DotPhrase`, `CoachingReport`, `IntegrationConnection`, and `ModeMapping`.

## Tests and gates

- Narrow P7 gate passed through `pnpm persistence:durable-runtime-readiness`.
- Full local gate passed and is recorded in `RUN_LOG.md` before the `WO-037` PR.
- GitHub Actions must pass before merge.

## Open risks

- P7 is local synthetic durable runtime evidence, not production database approval.
- Production identity, production PHI storage, production backup/restore, production object storage execution, live transcription, live EHR/ClinicOS synchronization, live AI, medical-necessity determination, charge finalization, and claim submission remain future work.
- Standalone patient/search/schedule completeness is still P7.5 work.

## Active SPEC_GAPs

None discovered for the P7 durable runtime scope.

## Deferred production decisions

Deferred production decisions remain tracked in `SPEC_GAPS.md`, including production identity, production PHI database posture, Azure backup/restore execution, live transcription provider, external AI governance, live EHR writeback, ClinicOS live integration, revenue estimate policy, and claim/payer strategy.

## Next recommended batch

Begin P7.5 with `WO-038` standalone patient, chart context, and schedule completion. Keep standalone-first and ClinicOS-embeddable behavior in one app through adapter boundaries.

---

# P7.5 — Standalone Product Completion Candidate

## Completed work orders

- `WO-038` — Standalone patient, chart context, and schedule completion.
- `WO-039` — Standalone worklists, settings, templates, estimates, and rules catalog.

## Acceptance evidence

- `WO-038` added synthetic/local standalone patient shell create/search/edit behavior, appointment edit/check-in/cancel/no-show transitions, patient linkage evidence, chart-context snapshot metadata, source freshness warnings, browser day/week schedule coverage, OpenAPI/DTO/event updates, core `PatientLinkage` and `ChartContextSnapshot` RLS evidence, and `pnpm standalone:patient-schedule-readiness`.
- `WO-039` added synthetic/local task inbox, MA follow-up worklist, billing review queue, settings/admin/integrations center, templates and dot phrases, internal-only estimate configuration, rules catalog seeds, browser operations route coverage, OpenAPI/DTO/event updates, and `pnpm standalone:operations-readiness`.
- Billing review transcript access is limited to billing staff in a triggered review context.
- Draft claim preview state remains `submittedClaim=false`.
- Estimate configuration remains internal-only and caveated; patient-facing financial conclusions are disabled.
- Rules catalog entries are source-linked, human-review-required, and prohibit autonomous finalization and medical-necessity determination.
- Standalone mode can now operate the synthetic v1 patient, chart, schedule, worklist, billing-review, settings, template, estimate, and rules-catalog surfaces without ClinicOS dependency.
- ClinicOS-integrated behavior remains adapter-bound and safe-degraded; ClinicOS does not bypass AURA Note permissions.

## Tests and gates

- `pnpm standalone:patient-schedule-readiness`
- `pnpm standalone:operations-readiness`
- `pnpm --filter @aura-note/api test`
- `pnpm --filter @aura-note/api test:e2e`
- `pnpm --filter @aura-note/contracts test`
- `pnpm --filter @aura-note/domain test`
- `pnpm --filter @aura-note/security test`
- `pnpm --filter @aura-note/web typecheck`
- Full local gate is recorded in `RUN_LOG.md` for `WO-039`.
- GitHub Actions must pass before merge.

## Open risks

- P7.5 is browser/API-testable synthetic/local product evidence, not commercial production readiness.
- Production identity, live payer data, certified rules catalogs, live ClinicOS synchronization, live EHR writeback, production PHI storage, production object storage execution, live AI, medical-necessity determination, charge finalization, claim submission, and production launch approval remain future work.
- Browser audio capture, recording transport, transcription adapter behavior, correction history, and live transcription-provider governance are not part of P7.5 and begin in `WO-040`.

## Active SPEC_GAPs

None active as of the post-`WO-039` P7.5 review.

## Deferred production decisions

Deferred production decisions remain tracked in `SPEC_GAPS.md`, including production identity, production PHI database posture, Azure backup/restore execution, live transcription provider, external AI governance, live EHR writeback, ClinicOS live integration, revenue estimate policy, production rules licensing/certification, and claim/payer strategy.

## Next recommended batch

Begin P8.5 with `WO-040` browser audio capture and transcription candidate. Keep browser microphone, recording transport, transcription providers, raw-audio retention, transcript retention, correction history, and live-provider governance behind synthetic/mock or explicit configuration boundaries.

---

# P8.5 — Audio And Transcription Candidate

## Completed work orders

- `WO-040` — Browser audio capture and transcription candidate.

## Acceptance evidence

- `WO-040` added explicit browser microphone permission states, permission-denied/unsupported handling, metadata-only recording chunk append behavior, deterministic mock transcription job processing, transcript confidence/source/speaker-label metadata, transcript correction history, one-week raw-audio retention metadata, and indefinite transcript retention.
- API endpoints now cover microphone permission recording, metadata-only recording chunk append, recording retention retrieval, mock transcription provider status, mock transcription job processing, and transcript segment correction.
- Worker coverage now includes deterministic mock transcription from metadata-only chunks with `liveProviderCalled = false`.
- Security coverage now includes explicit recording/transcription/correction permissions and PHI-like transcript correction rejection.
- The browser workspace exposes audio candidate controls and status evidence without implying live provider calls, raw PHI audio storage, external AI use, or production deletion.

## Tests and gates

- `pnpm --filter @aura-note/contracts test`
- `pnpm --filter @aura-note/domain test`
- `pnpm --filter @aura-note/security test`
- `pnpm --filter @aura-note/api typecheck`
- `pnpm --filter @aura-note/api test`
- `pnpm --filter @aura-note/api test:e2e`
- `pnpm --filter @aura-note/worker test`
- `pnpm --filter @aura-note/worker typecheck`
- `pnpm --filter @aura-note/web typecheck`
- `pnpm --filter @aura-note/web test:e2e`
- `pnpm audio:transcription-readiness`
- Full local gate is recorded in `RUN_LOG.md` for `WO-040`.
- GitHub Actions must pass before merge.

## Open risks

- P8.5 is synthetic/browser/API/worker-testable audio and transcription candidate evidence, not production audio capture approval.
- Live transcription-provider selection, BAA/private pathway, production PHI audio storage, production object storage execution, production deletion, production backup/restore execution, production identity, live EHR/ClinicOS synchronization, live AI, medical-necessity determination, charge finalization, claim submission, and production launch approval remain future work.

## Active SPEC_GAPs

None active as of the post-`WO-040` P8.5 review.

## Deferred production decisions

Deferred production decisions remain tracked in `SPEC_GAPS.md`, including production identity, production PHI database posture, Azure backup/restore execution, live transcription provider and PHI-bearing audio transport, external AI governance, live EHR writeback, ClinicOS live integration, revenue estimate policy, production rules licensing/certification, and claim/payer strategy.

## Next recommended batch

Begin P8 with `WO-041` production identity, tenant administration, secrets, configuration, and feature flags. Keep production IdP credentials, production account recovery, live PHI storage, live transcription, live EHR/ClinicOS synchronization, live AI, autonomous clinical/coding/billing behavior, and claim submission disabled unless later review explicitly authorizes them.

---

# P8 — Production Platform Candidate

## Completed work orders

- `WO-041` — Production identity, tenant administration, secrets, configuration, and feature flags.
- `WO-042` — Azure storage, secure downloads, retention deletion, backup, and restore controls.
- `WO-043` — Production observability, support operations, and status views.

## Acceptance evidence

- `WO-041` added production-shaped local identity/config governance: OIDC/SAML/ClinicOS delegated modes fail closed until configured, disabled/expired/missing-purpose/spoofed sessions are denied, high-risk feature flags require approval evidence, and secret validation returns metadata only.
- `WO-042` added Azure Blob-oriented storage boundaries, server-mediated secure downloads, tenant/site/requester/permission/expiry token checks, redacted audit export delivery metadata, raw-audio deletion approval/recovery-window controls, transcript non-deletion, and backup/restore readiness metadata.
- `WO-043` added P8 support status, local redacted logs/metrics/traces, disabled SIEM/APM placeholders, operational readiness with `productionLaunchReady=false`, support operational evidence for incident runbook views, degraded-mode acknowledgements, and access-review records, and browser-visible support/status states.
- Support users remain limited to operational metadata and cannot access audit export downloads, transcripts, final notes, billing details, coaching outputs, writeback payloads, or PHI-bearing artifacts.
- Standalone mode remains authoritative for operational status metadata. ClinicOS-integrated operational delegation is a future adapter-bound path and cannot bypass AURA Note permissions.

## Tests and gates

- `pnpm identity:production-readiness`
- `pnpm config:production-readiness`
- `pnpm storage:azure-adapter-readiness`
- `pnpm storage:secure-download-readiness`
- `pnpm retention:storage-deletion-readiness`
- `pnpm retention:production-readiness`
- `pnpm observability:production-readiness`
- `pnpm --filter @aura-note/security test`
- `pnpm --filter @aura-note/contracts test`
- `pnpm --filter @aura-note/api test`
- `pnpm --filter @aura-note/api test:e2e`
- `pnpm --filter @aura-note/web test:e2e`
- Full local gate is recorded in `RUN_LOG.md` for `WO-043`.
- GitHub Actions must pass before merge.

## Open risks

- P8 is synthetic/browser/API-testable production platform control evidence, not production launch readiness.
- Production IdP selection, secret manager selection, live ClinicOS delegation, Azure account/container policy, customer-managed keys, legal hold, real backup schedules, production restore drills, SIEM/APM vendor selection, production exporter credentials, log retention windows, alert thresholds, on-call ownership, support break-glass, live EHR/ClinicOS synchronization, live AI, charge finalization, medical-necessity determination, claim submission, and production launch approval remain future work.

## Active SPEC_GAPs

None active as of the post-`WO-043` P8 review.

## Deferred production decisions

Deferred production decisions remain tracked in `SPEC_GAPS.md`, including production identity, production PHI database posture, production Azure storage/deletion/restore, production SIEM/APM vendor and monitoring posture, live transcription provider and PHI-bearing audio transport, external AI governance, live EHR writeback, ClinicOS live integration, revenue estimate policy, production rules licensing/certification, and claim/payer strategy.

## Next recommended batch

Begin P9 with `WO-044` EHR sandbox integration and writeback queue hardening. Keep live production EHR credentials, production patient records, autonomous note/writeback submission, charge finalization, medical-necessity determination, claim submission, and production launch approval disabled unless later review explicitly authorizes them.

---

# P9 — Integration And AI Candidate

## Completed work orders

- `WO-044` — EHR sandbox integration and writeback queue hardening.
- `WO-045` — ClinicOS integration hardening.
- `WO-046` — AI Gateway production governance and evaluation harness.
- `WO-047` — Security, privacy, compliance, and threat-model remediation.

## Acceptance evidence

- `WO-044` added an athenahealth-first, vendor-neutral EHR adapter path plus a metadata-only writeback queue with human approval, idempotency, retry scheduling, dead-letter, reconciliation, role-denial, PHI rejection, and audit/domain event evidence. Live production EHR writeback remains disabled.
- `WO-045` added ClinicOS module-boundary evidence for M03, M04, M17, M21, M23, M24, M25, and M26; metadata-only mappings/publications; stale/degraded review states; service-account/cross-tenant denial; and proof that ClinicOS cannot bypass AURA Note permissions.
- `WO-046` added AI Gateway prompt/model metadata, deterministic evaluation cases, output validation/rejection, source-linked evidence, human-review-required labels, role denial, cross-tenant denial, no-live-model posture, and no-raw-PHI-to-external-AI evidence.
- `WO-047` added the P9 security/privacy/compliance review package, threat model, RBAC/ABAC reconciliation, AI/PHI review note, `pnpm security:review-readiness`, and next `WO-048` work order.
- No P9 active `SPEC_GAP` was found for the synthetic/local scope.

## Tests and gates

- `pnpm ehr:integration-readiness`
- `pnpm clinicos:integration-readiness`
- `pnpm ai:governance-readiness`
- `pnpm security:review-readiness`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- Full local gates are recorded in `RUN_LOG.md` for `WO-044`, `WO-045`, `WO-046`, and `WO-047`.
- GitHub Actions must pass on the `WO-047` PR before merge.

## Open risks

- P9 is synthetic/browser/API/local review evidence, not production launch readiness.
- External counsel, formal HIPAA/security/privacy review, BAA/vendor review, production EHR credentialing, live ClinicOS contracts, private/BAA model approval, live transcription provider approval, production storage policy, SIEM/APM vendor selection, incident-response ownership, access-review cadence, founder/clinical/compliance/security signoff, and launch approval remain future work.
- The Frontend Runtime Integration Gate is launch-blocking for P10: production-intended screens must use typed API clients and persisted backend state, and Playwright must prove a seeded backend-backed appointment-through-finalization/export workflow before launch-candidate readiness can be claimed.

## Active SPEC_GAPs

None active as of the post-`WO-047` P9 review.

## Deferred production decisions

Deferred production decisions remain tracked in `SPEC_GAPS.md`, including production SIEM/APM, production identity/account lifecycle, production PHI persistence/database operations, Azure Blob/deletion/restore controls, live transcription provider, external AI governance, production EHR credentialing/writeback, ClinicOS live integration, revenue estimates/patient-facing financial content, and claim/payer strategy.

## Next recommended batch

Begin P10 with `WO-048` UX, accessibility, responsive, visual-regression, and Frontend Runtime Integration Gate hardening. Keep production launch, live vendor use, production PHI, autonomous clinical/coding/billing behavior, medical-necessity determination, charge finalization, and claim submission disabled unless later review explicitly authorizes them.

---

# P10 — Launch Candidate

## Completed work orders

- `WO-048` — UX, accessibility, responsive, visual-regression, and Frontend Runtime Integration Gate hardening.
- `WO-049` — Deployment, environment promotion, performance, reliability, and operational drills.
- `WO-050` — Beta pilot and limited production launch gate.

## Acceptance evidence

- `WO-048` added a typed web API client, an API-backed `/aura-note/runtime-integration` route, route inventory evidence, and Playwright coverage that drives a backend-backed appointment through finalization/export with reload/refetch proof.
- `WO-049` added launch operations readiness docs/runbook coverage, support-status launch drill states, deterministic synthetic performance baseline evidence, and `pnpm launch:ops-readiness`.
- `WO-050` added `docs/PILOT_LAUNCH_READINESS.md`, `docs/runbooks/WO-050_BETA_PILOT_RUNBOOK.md`, support-status pilot gate states, deterministic pilot smoke evidence, `pnpm pilot:readiness`, and `pnpm launch:readiness`.
- The P10 evidence package keeps `productionLaunchApproved=false`, `productionLaunchReady=false`, `submittedClaim=false`, live vendors disabled, production credentials absent, production PHI absent, and patient-facing internal billing/revenue/coaching/confidence/payer-strategy details excluded.
- P10 is complete as a limited-launch decision package only. It does not approve production deployment or general availability.

## Tests and gates

- `pnpm frontend:runtime-integration-readiness`
- `pnpm performance:launch-baseline`
- `pnpm launch:ops-readiness`
- `pnpm pilot:readiness`
- `pnpm launch:readiness`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- Full local gate is recorded in `RUN_LOG.md` for `WO-050`.
- GitHub Actions must pass on the `WO-050` PR before merge.

## Open risks

- P10 is synthetic/local decision-package evidence, not live production launch approval.
- Real tenant scope, named launch owners, production hosting target, staging URL, secret manager, SIEM/APM vendor, SLO/SLA targets, support/on-call owners, formal accessibility review, formal privacy/security/legal review, and actual founder/clinical/compliance/security signoff remain deferred.
- Production PHI, live EHR/ClinicOS synchronization, live external AI, live transcription, production object storage delivery, destructive production deletion, production restore execution, charge finalization, medical-necessity determination, claim submission, clearinghouse integration, payer integration, denial automation, and payment workflows remain disabled or out of scope.

## Active SPEC_GAPs

None active as of the post-`WO-050` P10 review.

## Deferred production decisions

Deferred decisions remain tracked in `SPEC_GAPS.md`, including production launch approval, production identity/account lifecycle, production PHI persistence and database operations, production Azure storage/deletion/restore controls, production SIEM/APM and monitoring posture, live transcription provider, external AI governance, production EHR credentialing/writeback, ClinicOS live integration, revenue estimate policy, production rules licensing/certification, and claim/payer strategy.

## Next recommended batch

Begin P11 with `WO-051` claim submission and payer integration decision gate. Keep v1 default behavior at draft claim preview only with `submittedClaim=false`; do not implement live claim submission, autonomous charge finalization, payer integration, denial automation, payment posting, or medical-necessity determination without explicit founder, billing, compliance, privacy, security, and legal approval.

---

# P11 — Claim/Payer Decision Gate

## Completed work orders

- `WO-051` — Claim submission and payer integration decision gate.

## Acceptance evidence

- `WO-051` added `docs/CLAIM_PAYER_DECISION_GATE.md` and `docs/runbooks/WO-051_CLAIM_PAYER_DECISION_RUNBOOK.md`.
- `/aura-note/support/status` now exposes Claim/Payer Decision Gate and Future Claim Approval Criteria states for Draft Claim Boundary, No Live Clearinghouse, No Payer API, No Denial Automation, No Payment Posting, `submittedClaim=false`, and `claimSubmissionEnabled=false`.
- `pnpm claim-decision:readiness` verifies P11 docs, runbook, support UI/browser assertions, status/run-log/checkpoint evidence, existing draft-claim tests, OpenAPI no-live-submit posture, and prohibited-claim behavior checks.
- Current default remains draft claim preview and human billing review only.

## Tests and gates

- `pnpm claim-decision:readiness`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- Full local gate is recorded in `RUN_LOG.md` for `WO-051`.
- GitHub Actions passed on PR #54 before merge.

## Open risks

- P11 is a decision package only, not approval to implement or operate live claim submission.
- Clearinghouse selection, payer scope, claim status reconciliation, denial workflow design, payment posting, void/reversal behavior, patient-facing financial language, medical-necessity governance, billing compliance ownership, production credentials, and vendor/legal approvals remain deferred.

## Active SPEC_GAPs

None active as of the post-`WO-051` P11 review.

## Deferred production decisions

Deferred decisions remain tracked in `SPEC_GAPS.md`, including production launch approval, production identity/account lifecycle, production PHI persistence and database operations, production Azure storage/deletion/restore controls, production SIEM/APM and monitoring posture, live transcription provider, external AI governance, production EHR credentialing/writeback, ClinicOS live integration, revenue estimate policy, production rules licensing/certification, and future claim/payer implementation strategy.

## Next recommended batch

Stop at P11. No further numbered work order is active until the founder approves a new tranche. Any future claim/payer implementation must begin with a new work order that names the approved clearinghouse/payer or ClinicOS/M21 handoff strategy and preserves human approval, audit, idempotency, RBAC/ABAC, PHI/security, and no-autonomy boundaries.

---

# Post-P11 Continuation Rails

## Completed work orders

- `WO-052` — Post-P11 continuation rails and tranche intake.

## Acceptance evidence

- `WO-052` added `docs/POST_P11_CONTINUATION_PLAN.md` with candidate future tranche families and activation criteria.
- `WO-052` added `work_orders/WO-052_post_p11_continuation_rails.md` so the continuation work is reviewable and bounded.
- `pnpm post-p11:readiness` verifies that post-P11 state remains planning-only, `next_work_order` is still `null`, and no live production, vendor, claim, PHI, or launch behavior is authorized.
- `repo_status.json` records `WO-052: done` while preserving the P11 checkpoint and no active next work order.

## Tests and gates

- `pnpm post-p11:readiness`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

## Open risks

- `WO-052` is a planning/control tranche only. It does not approve production launch, live vendor integration, production PHI storage, live claim/payer behavior, or legal/compliance/security readiness.
- Future implementation still requires a named work order and explicit decisions for the relevant identity, PHI persistence, Azure storage, transcription, AI, EHR, ClinicOS, claim/payer, launch, and operational-governance areas.

## Active SPEC_GAPs

None active as of the post-`WO-052` continuation rails review.

## Deferred production decisions

Deferred decisions remain tracked in `SPEC_GAPS.md`, including production launch approval, production identity/account lifecycle, production PHI persistence and database operations, production Azure storage/deletion/restore controls, production SIEM/APM and monitoring posture, live transcription provider, external AI governance, production EHR credentialing/writeback, ClinicOS live integration, revenue estimate policy, production rules licensing/certification, and future claim/payer implementation strategy.

## Next recommended batch

No implementation work order is active. The next safe batch is to select one candidate family from `docs/POST_P11_CONTINUATION_PLAN.md` and promote it into a specific `WO-053` work order with approval evidence and stop conditions before implementation begins.

---

# Post-P11 Production Identity Review Intake

## Completed work orders

- `WO-053` — Production identity and account lifecycle review intake.

## Acceptance evidence

- `WO-053` added `docs/PRODUCTION_IDENTITY_ACCOUNT_LIFECYCLE_REVIEW.md` with required future identity decisions, acceptance criteria, event/audit inventory, standalone behavior, and ClinicOS delegated identity boundaries.
- `WO-053` added `work_orders/WO-053_production_identity_account_lifecycle_review_intake.md` so the intake is reviewable and bounded.
- `pnpm identity:live-review-readiness` verifies that the tranche remains planning/control only and does not enable live identity, production credentials, production PHI, ClinicOS delegation, or launch behavior.
- `repo_status.json` records `WO-053: done` while preserving the P11 checkpoint and no active next work order.

## Tests and gates

- `pnpm identity:live-review-readiness`
- `pnpm post-p11:readiness`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

## Open risks

- Production IdP, OIDC/SAML posture, MFA, account recovery, disabled-user source of truth, session policy, break-glass, support access, access-review cadence, tenant administration ownership, and ClinicOS delegation remain deferred decisions.
- `WO-053` is a planning/control tranche only. It does not approve live identity integration, production credentials, production PHI access, ClinicOS live delegation, or production launch.

## Active SPEC_GAPs

None active as of the post-`WO-053` production identity/account lifecycle review intake.

## Deferred production decisions

Deferred decisions remain tracked in `SPEC_GAPS.md`, including production identity/account lifecycle, production PHI persistence and database operations, production Azure storage/deletion/restore controls, production SIEM/APM and monitoring posture, live transcription provider, external AI governance, production EHR credentialing/writeback, ClinicOS live integration, revenue estimate policy, production rules licensing/certification, future claim/payer implementation strategy, and production launch approval.

## Next recommended batch

No implementation work order is active. The next safest planning/control candidate is production PHI persistence and database operations review, but it should not be promoted without explicit selection.

---

# Post-P11 Production PHI Database Operations Review Intake

## Completed work orders

- `WO-054` — Production PHI persistence and database operations review intake.

## Acceptance evidence

- `WO-054` added `docs/PRODUCTION_PHI_PERSISTENCE_DATABASE_OPERATIONS_REVIEW.md` with required future database decisions, acceptance criteria, event/audit inventory, standalone behavior, and ClinicOS data-boundary requirements.
- `WO-054` added `work_orders/WO-054_production_phi_persistence_database_ops_review_intake.md` so the intake is reviewable and bounded.
- `pnpm persistence:phi-db-review-readiness` verifies that the tranche remains planning/control only and does not enable production PHI storage, production database credentials, live migrations, runtime repository changes, support database access, backup/restore execution, or launch behavior.
- `repo_status.json` records `WO-054: done` while preserving the P11 checkpoint and no active next work order.

## Tests and gates

- `pnpm persistence:phi-db-review-readiness`
- `pnpm post-p11:readiness`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

## Open risks

- Production database host, encryption/KMS, database role model, migration approvals, backup cadence, restore drills, RLS expansion, tenant/site isolation evidence, support database access, data export/offboarding, retention policy, and incident response remain deferred decisions.
- `WO-054` is a planning/control tranche only. It does not approve production PHI storage, production credentials, live migrations, production database operations, support database access, backup/restore execution, or production launch.

## Active SPEC_GAPs

None active as of the post-`WO-054` production PHI persistence/database operations review intake.

## Deferred production decisions

Deferred decisions remain tracked in `SPEC_GAPS.md`, including production PHI persistence and database operations, production Azure storage/deletion/restore controls, production SIEM/APM and monitoring posture, live transcription provider, external AI governance, production EHR credentialing/writeback, ClinicOS live integration, revenue estimate policy, production rules licensing/certification, future claim/payer implementation strategy, and production launch approval.

## Next recommended batch

No implementation work order is active. The next safest planning/control candidate is production Azure storage, deletion, and restore review, but it should not be promoted without explicit selection.

---

# Post-P11 Production Azure Storage Deletion Restore Review Intake

## Completed work orders

- `WO-055` — Production Azure storage, deletion, and restore review intake.

## Acceptance evidence

- `WO-055` added `docs/PRODUCTION_AZURE_STORAGE_DELETION_RESTORE_REVIEW.md` with required future Azure storage decisions, acceptance criteria, event/audit inventory, standalone behavior, and ClinicOS storage-boundary requirements.
- `WO-055` added `work_orders/WO-055_production_azure_storage_deletion_restore_review_intake.md` so the intake is reviewable and bounded.
- `pnpm storage:live-review-readiness` now verifies both the original `WO-055` planning/control boundary and the later post-CR4 no-PHI Azure infrastructure evidence, while confirming that production runtime credentials, PHI-bearing object delivery, public URLs, destructive production deletion, production restore execution, PHI-bearing audit exports, runtime storage behavior, and launch behavior remain disabled.
- `repo_status.json` records `WO-055: done` while preserving the P11 checkpoint and no active next work order.

## Tests and gates

- `pnpm storage:live-review-readiness`
- `pnpm post-p11:readiness`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

## Open risks

- Azure account/container topology, private networking, credential source, customer-managed keys, tenant key isolation, signed download TTLs, token revocation, legal hold, immutability, backup/restore cadence, deletion approval authority, recovery window, evidence retention, support access, and incident response remain deferred decisions.
- `WO-055` is a planning/control tranche only. It does not approve live Azure credentials, PHI-bearing object delivery, public URLs, destructive production deletion, production restore execution, PHI-bearing audit exports, runtime storage behavior, or production launch.

## Active SPEC_GAPs

None active as of the post-`WO-055` production Azure storage/deletion/restore review intake.

## Deferred production decisions

Deferred decisions remain tracked in `SPEC_GAPS.md`, including production Azure storage/deletion/restore controls, live transcription provider, external AI governance, production EHR credentialing/writeback, ClinicOS live integration, revenue estimate policy, production rules licensing/certification, future claim/payer implementation strategy, and production launch approval.

## Next recommended batch

No implementation work order is active. The next safest planning/control candidate is live transcription provider review, but it should not be promoted without explicit selection.

---

# Post-P11 Live Transcription Provider Review Intake

## Completed work orders

- `WO-056` — Live transcription provider review intake.

## Acceptance evidence

- `WO-056` added `docs/PRODUCTION_TRANSCRIPTION_PROVIDER_REVIEW.md` with required future transcription provider decisions, acceptance criteria, event/audit inventory, standalone behavior, and ClinicOS transcription-boundary requirements.
- `WO-056` added `work_orders/WO-056_live_transcription_provider_review_intake.md` so the intake is reviewable and bounded.
- `pnpm transcription:live-review-readiness` verifies that the tranche remains planning/control only and does not enable live transcription credentials, PHI-bearing audio transport, live provider calls, production raw-audio storage, PHI-bearing support transcript access, runtime transcription behavior, or launch behavior.
- `repo_status.json` records `WO-056: done` while preserving the P11 checkpoint and no active next work order.

## Tests and gates

- `pnpm transcription:live-review-readiness`
- `pnpm post-p11:readiness`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

## Open risks

- Provider selection, BAA/private deployment path, region, credential source, consent/notice policy, audio transport design, raw-audio retention execution, transcript correction/version retention, diarization reliability, retry/dead-letter policy, support visibility, incident response, and operational ownership remain deferred decisions.
- `WO-056` is a planning/control tranche only. It does not approve live transcription credentials, PHI-bearing audio transport, live provider calls, production raw-audio storage, PHI-bearing support transcript access, runtime transcription behavior, or production launch.

## Active SPEC_GAPs

None active as of the post-`WO-056` live transcription provider review intake.

## Deferred production decisions

Deferred decisions remain tracked in `SPEC_GAPS.md`, including live transcription provider, external AI governance, production EHR credentialing/writeback, ClinicOS live integration, revenue estimate policy, production rules licensing/certification, future claim/payer implementation strategy, and production launch approval.

## Next recommended batch

No implementation work order is active. The next safest planning/control candidate is external AI private/BAA pathway review, but it should not be promoted without explicit selection.

---

# Post-P11 External AI Private BAA Pathway Review Intake

## Completed work orders

- `WO-057` — External AI private/BAA pathway review intake.

## Acceptance evidence

- `WO-057` added `docs/PRODUCTION_AI_PRIVATE_BAA_PATHWAY_REVIEW.md` with required future AI provider/private/BAA decisions, acceptance criteria, event/audit inventory, standalone behavior, and ClinicOS AI-governance boundary requirements.
- `WO-057` added `work_orders/WO-057_external_ai_private_baa_pathway_review_intake.md` so the intake is reviewable and bounded.
- `pnpm ai:live-review-readiness` verifies that the tranche remains planning/control only and does not enable live AI credentials, raw-PHI-to-external-AI paths, live model calls, production prompt stores, support AI PHI content access, autonomous finalization, runtime AI behavior, or launch behavior.
- `repo_status.json` records `WO-057: done` while preserving the P11 checkpoint and no active next work order.

## Tests and gates

- `pnpm ai:live-review-readiness`
- `pnpm post-p11:readiness`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

## Open risks

- Provider selection, private/BAA deployment path, region, credential source, prompt registry ownership, model configuration approval, PHI scrub/de-identification policy, source freshness rules, evaluation thresholds, monitoring, drift response, incident response, support visibility, and operational ownership remain deferred decisions.
- `WO-057` is a planning/control tranche only. It does not approve live AI credentials, raw PHI transfer to external AI, live model calls, production prompt stores, support AI PHI content access, autonomous finalization, runtime AI behavior, or production launch.

## Active SPEC_GAPs

None active as of the post-`WO-057` external AI private/BAA pathway review intake.

## Deferred production decisions

Deferred decisions remain tracked in `SPEC_GAPS.md`, including external AI governance, production EHR credentialing/writeback, ClinicOS live integration, revenue estimate policy, production rules licensing/certification, future claim/payer implementation strategy, and production launch approval.

## Next recommended batch

No implementation work order is active. The next safest planning/control candidate is production EHR writeback credentialing review, but it should not be promoted without explicit selection.

---

# Post-P11 Production EHR Writeback Credentialing Review Intake

## Completed work orders

- `WO-058` — Production EHR writeback credentialing review intake.

## Acceptance evidence

- `WO-058` added `docs/PRODUCTION_EHR_WRITEBACK_CREDENTIALING_REVIEW.md` with required future EHR credentialing, vendor-neutral adapter, writeback payload, human approval, idempotency, retry/dead-letter, reconciliation, support, and audit decisions.
- `WO-058` added `work_orders/WO-058_production_ehr_writeback_credentialing_review_intake.md` so the intake is reviewable and bounded.
- `pnpm ehr:live-review-readiness` verifies that the tranche remains planning/control only and does not enable production EHR credentials, raw EHR payload storage, live writeback delivery, writeback without human approval, runtime EHR behavior, autonomous finalization, claim submission, or launch behavior.
- `repo_status.json` records `WO-058: done` while preserving the P11 checkpoint and no active next work order.

## Tests and gates

- `pnpm install --frozen-lockfile`
- `pnpm ehr:live-review-readiness`
- `pnpm post-p11:readiness`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

## Open risks

- Production athenahealth credentialing, credential source, vendor-neutral adapter scope, approved writeback object types, raw payload retention policy, human approval role, idempotency strategy, retry/dead-letter policy, reconciliation ownership, vendor acknowledgement handling, attachment/task semantics, support visibility, incident response, and operational ownership remain deferred decisions.
- `WO-058` is a planning/control tranche only. It does not approve production EHR credentials, raw EHR payload storage, live writeback delivery, writeback without human approval, runtime EHR behavior, autonomous finalization, claim submission, or production launch.

## Active SPEC_GAPs

None active as of the post-`WO-058` production EHR writeback credentialing review intake.

## Deferred production decisions

Deferred decisions remain tracked in `SPEC_GAPS.md`, including production EHR credentialing/writeback, ClinicOS live integration, revenue estimate policy, production rules licensing/certification, future claim/payer implementation strategy, and production launch approval.

## Next recommended batch

No implementation work order is active. The next safest planning/control candidate is ClinicOS live integration review, but it should not be promoted without explicit selection.

---

# Post-P11 ClinicOS Live Integration Review Intake

## Completed work orders

- `WO-059` — ClinicOS live integration review intake.

## Acceptance evidence

- `WO-059` added `docs/PRODUCTION_CLINICOS_LIVE_INTEGRATION_REVIEW.md` with required future live ClinicOS module contracts, delegated identity, service-account governance, tenant/site/user/patient mapping, event-bus delivery, replay/reconciliation, degraded-mode, support, observability, and audit decisions.
- `WO-059` added `work_orders/WO-059_clinicos_live_integration_review_intake.md` so the intake is reviewable and bounded.
- `pnpm clinicos:live-review-readiness` verifies that the tranche remains planning/control only and does not enable live ClinicOS credentials, live event-bus delivery, delegated identity bypass, raw ClinicOS payload storage, live synchronization, runtime ClinicOS behavior, autonomous finalization, claim submission, or launch behavior.
- `repo_status.json` records `WO-059: done` while preserving the P11 checkpoint and no active next work order.

## Tests and gates

- `pnpm install --frozen-lockfile`
- `pnpm clinicos:live-review-readiness`
- `pnpm post-p11:readiness`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm clinicos:integration-readiness`
- `node scripts/status.js`
- `git diff --check`

## Open risks

- Live ClinicOS module contracts, delegated identity posture, service-account governance, tenant/site/user/patient mapping, event-bus delivery, replay/reconciliation ownership, degraded-mode policy, raw payload retention policy, Data Cloud analytics boundary, support visibility, incident response, and operational ownership remain deferred decisions.
- `WO-059` is a planning/control tranche only. It does not approve live ClinicOS credentials, live event-bus delivery, delegated identity bypass, raw ClinicOS payload storage, live synchronization, runtime ClinicOS behavior, autonomous finalization, claim submission, or production launch.

## Active SPEC_GAPs

None active as of the post-`WO-059` ClinicOS live integration review intake.

## Deferred production decisions

Deferred decisions remain tracked in `SPEC_GAPS.md`, including ClinicOS live integration, revenue estimate policy, production rules licensing/certification, future claim/payer implementation strategy, and production launch approval.

## Next recommended batch

No implementation work order is active. The next safest planning/control candidate is revenue estimate and patient-facing financial content review, but it should not be promoted without explicit selection.

---

# CR-0 Commercial Readiness Rails Reopened

## Completed work orders

- `WO-060` — Commercial readiness rebaseline and runtime implementation rails.

## Acceptance evidence

- `WO-060` added the CR-0 through CR-4 checkpoint sequence to `AGENTS.md` and `docs/PRODUCTION_BUILD_PLAN.md`.
- `WO-060` added `WO-060` through `WO-075` to `work_orders/README.md`, `docs/PRODUCTION_BUILD_PLAN.md`, and `repo_status.json`.
- `WO-060` added `docs/COMMERCIAL_READINESS_ROADMAP.md`, `docs/COMMERCIAL_READINESS_DEFINITION_OF_DONE.md`, `docs/REMAINING_SYNTHETIC_TO_RUNTIME_GAPS.md`, and `docs/FIGMA_HANDOFF_PLAN.md`.
- `WO-060` added `work_orders/WO-060_commercial_readiness_rebaseline_runtime_rails.md` and `work_orders/WO-061_runtime_persistence_switchover_core_workflow.md`.
- `repo_status.json` now records `current_checkpoint: CR-0`, `next_work_order: WO-061`, `WO-060: done`, `WO-061: todo`, and `WO-062` through `WO-075: planned`.
- `pnpm commercial:readiness-plan` validates plan/status/checkpoint/no-launch-claim posture.
- Future checkpoints are now documented as `CR-1` Runtime Foundation Candidate, `CR-2` Product UX Runtime Candidate, `CR-3` Integration and Governance Runtime Candidate, and `CR-4` Commercial Readiness Review Candidate.

## Tests and gates

- `pnpm commercial:readiness-plan`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `pnpm lint`
- `pnpm typecheck`
- `git diff --check`

## Open risks

- `WO-060` is planning/control rails only. It does not implement runtime persistence switchover, API hardening, auth fail-closed behavior, primary UI API conversion, Figma-ready screen inventory, standalone workflow completion, mode resolver, transcription/EHR/AI/ClinicOS runtime hardening, security/privacy review, operations runbooks, billing boundary completion, beta package, or final commercial-readiness review packet.
- AURA Note remains not production-launch-ready and not commercially production-ready.

## Active SPEC_GAPs

None active as of the post-`WO-060` commercial readiness rebaseline/runtime rails review.

## Deferred production decisions

Deferred decisions remain tracked in `SPEC_GAPS.md`, including commercial readiness implementation and launch approval, production identity, production PHI persistence, production Azure storage/deletion/restore, live transcription, external AI private/BAA pathway, production EHR writeback, ClinicOS live integration, revenue estimate policy, claim/payer strategy, and production launch approval.

## Next recommended batch

Proceed to `WO-061` — Runtime persistence switchover for core workflow. The next checkpoint is CR-1 after `WO-061` through `WO-063`.

---

# CR-1 Runtime Foundation Candidate

## Completed work orders

- `WO-061` — Runtime persistence switchover for core workflow.
- `WO-062` — API runtime hardening and request boundary.
- `WO-063` — Identity runtime boundary and production fail-closed auth scaffold.

## Acceptance evidence

- `WO-061` moved `ScheduleService` behind repository/storage ports and added a composed local Prisma core workflow repository for synthetic appointment, visit, review-panel, finalization/output, export, audit, and domain evidence.
- `WO-061` added `pnpm runtime:persistence-readiness` to prove service-recreation persistence and cross-tenant/cross-site denial against local synthetic PostgreSQL.
- `WO-062` added shared `configureAuraApi` bootstrap wiring, request/trace correlation, security headers, request body limits, local rate-limit headers, global validation, PHI-safe error envelopes, and redacted runtime logs.
- `WO-062` added `ApiErrorEnvelope` to contracts/OpenAPI and `pnpm api:runtime-hardening-readiness`.
- `WO-063` added explicit `AURA_NOTE_AUTH_MODE` handling before controller execution.
- `WO-063` accepts synthetic identity headers only in `local_demo` or strict `local_synthetic` mode, rejects synthetic headers in preview/production/delegated modes, and fails closed for missing identity, invalid identity, disabled user, expired session, wrong tenant/site, wrong purpose, and delegated-provider states.
- `WO-063` added response posture labels, audit-safe identity accepted/denied logs, `IdentityRuntimeBoundaryDecision` DTO/OpenAPI seeds, and `pnpm identity:runtime-boundary-readiness`.

## Tests and gates

- `pnpm --filter @aura-note/api typecheck`
- `pnpm --filter @aura-note/api test:identity-runtime`
- `pnpm identity:runtime-boundary-readiness`
- Full local gate passed: `pnpm install --frozen-lockfile`; `pnpm db:client:generate`; `pnpm lint`; `pnpm lint:phi`; `pnpm typecheck`; `pnpm test`; `pnpm test:e2e`; `pnpm test:browser`; `pnpm build`; all persistence/storage/retention/readiness scripts in the current CI-style chain; `pnpm production:readiness`; `pnpm acceptance:readiness`; `node scripts/status.js`; `git diff --check`.
- During verification, a stale generated `apps/web/.next` type artifact was cleared after the first lint run failed on duplicate generated identifiers, then `pnpm lint` passed.
- During verification, `pnpm commercial:readiness-plan` found `WO-064` promoted to `todo` without a discoverable work-order file; `work_orders/WO-064_primary_ui_runtime_api_conversion.md` was added from the already documented production plan scope, and the commercial readiness check passed.
- GitHub Actions remains required after the `WO-063` PR is opened.

## Open risks

- CR-1 remains synthetic/local runtime evidence. Production PHI database credentials, live migration execution, production IdP credentials, live OIDC/SAML, live ClinicOS delegated identity, production WAF/CDN, live SIEM/APM, live EHR, live transcription, live external AI, live Azure PHI storage, claim submission, autonomous clinical/coding/billing behavior, charge finalization, medical-necessity determination, and production launch remain disabled.
- `AURA_NOTE_AUTH_MODE=local_demo` is intentionally a development/browser/demo posture and must not be used as production authentication.
- Durable denied-request identity events are not yet tenant-owned persisted events; `WO-063` records audit-safe local structured log evidence only.

## Active SPEC_GAPs

None active as of the post-`WO-063` identity runtime boundary review.

## Deferred production decisions

Deferred decisions remain tracked in `SPEC_GAPS.md`, including production IdP selection, MFA, SCIM/directory sync, account recovery, access review, break-glass, ClinicOS delegated identity contract, production PHI persistence, live vendor credentials, support operations, and launch approval.

## Next recommended batch

Stop at the CR-1 checkpoint until review rules allow the next batch. The next implementation target is `WO-064` — Primary UI Runtime API Conversion, which opens CR-2 Product UX Runtime Candidate work.

---

# CR-2 Product UX Runtime Candidate

## Completed work orders

- `WO-064` — Primary UI runtime API conversion.
- `WO-065` — Figma-ready basic UI scaffold and screen inventory.
- `WO-066` — Standalone workflow completion.

## Acceptance evidence

- `WO-064` converted primary production-intended AURA Note routes to typed API-backed runtime state and added `pnpm frontend:primary-runtime-readiness`.
- `WO-065` added the Figma-ready screen, component, state, workflow, role/permission, data/API, content copy, and checklist inventory docs plus `/aura-note/figma-handoff` and `pnpm figma:handoff-readiness`.
- `WO-066` added standalone workflow completion evidence proving runtime home, schedule, finalized artifacts, export metadata, operations/billing review, and ClinicOS adapter-boundary states can be tested without ClinicOS dependency.
- `repo_status.json` now records `current_checkpoint: CR-3`, `next_work_order: WO-067`, `WO-064: done`, `WO-065: done`, `WO-066: done`, and `WO-067: todo`.
- No live vendors, production PHI, production credentials, autonomous clinical/coding/billing behavior, charge finalization, medical-necessity determination, claim submission, or production launch behavior were introduced.

## Tests and gates

- `pnpm figma:handoff-readiness`
- `pnpm frontend:runtime-integration-readiness`
- `pnpm frontend:primary-runtime-readiness`
- `pnpm standalone:workflow-readiness`
- `pnpm install --frozen-lockfile`
- `pnpm db:client:generate`
- `pnpm lint`
- `pnpm lint:phi`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm test:browser`
- `pnpm build`
- `pnpm production:readiness`
- `node scripts/status.js`
- `git diff --check`

## Open risks

- CR-2 remains synthetic/local product UX runtime evidence. Final Figma visual fidelity, live identity, live ClinicOS, live EHR, live transcription, live external AI, live Azure PHI storage, production PHI database use, production launch approval, and live vendor contracts remain out of scope.
- ClinicOS mode remains mock/degraded/disabled evidence only until `WO-067` and later CR-3 tranches harden runtime adapter boundaries.

## Active SPEC_GAPs

None active as of the post-`WO-066` standalone workflow completion / CR-2 review.

## Deferred production decisions

Deferred decisions remain tracked in `SPEC_GAPS.md`, including production launch approval, production identity/account lifecycle, production PHI persistence, production Azure storage/deletion/restore, live transcription, external AI private/BAA pathway, production EHR writeback, ClinicOS live integration, revenue estimate policy, claim/payer strategy, and commercial readiness approval.

## Next recommended batch

Proceed to `WO-067` — ModeResolver And Adapter Runtime Wiring. The next checkpoint is CR-3 after `WO-067` through `WO-070`.

---

# CR-3 Integration And Governance Runtime Candidate

## Completed work orders

- `WO-067` — ModeResolver and adapter runtime wiring.
- `WO-068` — Transcription runtime boundary and provider-ready interface.
- `WO-069` — Athenahealth sandbox and vendor-neutral EHR runtime boundary.
- `WO-070` — AI governance runtime boundary and evaluation harness expansion.

## Acceptance evidence

- `WO-067` added a shared API ModeResolver and explicit adapter-boundary evidence for standalone and ClinicOS-integrated contexts. ClinicOS remains unable to bypass AURA Note permissions.
- `WO-068` added server-side transcription provider adapters, deterministic mock transcription, disabled live-provider fail-closed evidence, one-week raw-audio retention metadata, indefinite transcript-retention metadata, and runtime-state browser/API coverage.
- `WO-069` added vendor-neutral EHR runtime boundary metadata, athenahealth-first sandbox posture, disabled credential evidence, sandbox patient lookup, appointment import, encounter context, and human-gated writeback lifecycle metadata.
- `WO-070` added server-side AI Gateway runtime boundary metadata, expanded deterministic prohibited-behavior evaluation cases, source-freshness/schema/confidence/blocked-behavior validation metadata, PHI rejection/redaction evidence, human-review-required events, regression-blocked events, and `/aura-note/ai-governance` browser evidence.
- `repo_status.json` records `current_checkpoint: CR-3`, `next_work_order: null`, `WO-067: done`, `WO-068: done`, `WO-069: done`, and `WO-070: done`. `WO-071` through `WO-075` remain planned for CR-4 and are not active until checkpoint review promotes the next batch.
- No live vendors, production PHI, production credentials, autonomous clinical/coding/billing behavior, charge finalization, medical-necessity determination, order placement, claim submission, raw PHI transfer to external AI, or production launch behavior were introduced.

## Tests and gates

- `pnpm mode:adapter-readiness`
- `pnpm transcription:runtime-boundary-readiness`
- `pnpm ehr:sandbox-runtime-readiness`
- `pnpm ai:runtime-governance-readiness`
- `pnpm ai:governance-readiness`
- `pnpm clinicos:integration-readiness`
- `pnpm ehr:integration-readiness`
- `pnpm audio:transcription-readiness`
- `pnpm frontend:runtime-integration-readiness`
- `pnpm frontend:primary-runtime-readiness`
- `pnpm standalone:workflow-readiness`
- `pnpm install --frozen-lockfile`
- `pnpm db:client:generate`
- `pnpm lint`
- `pnpm lint:phi`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm test:browser`
- `pnpm build`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

## Open risks

- CR-3 remains synthetic/local integration and governance runtime evidence. Live ClinicOS contracts, live event-bus delivery, production EHR credentialing, live EHR calls, live writeback delivery, live transcription provider calls, raw PHI audio transport, live external AI, private/BAA model approval, production prompt stores, drift-monitoring ownership, production PHI storage, live vendor monitoring, and production launch approval remain out of scope.
- Runtime AI, transcription, EHR, and ClinicOS paths are production-shaped but safely disabled, mock-backed, or sandbox-metadata-only until later security/privacy/founder-approved work orders provide credentials, vendor contracts, and live-use controls.
- CR-4 work orders `WO-071` through `WO-075` remain planned and must be promoted deliberately before implementation continues.

## Active SPEC_GAPs

None active as of the post-`WO-070` AI governance runtime boundary / CR-3 review.

## Deferred production decisions

Deferred decisions remain tracked in `SPEC_GAPS.md`, including production launch approval, live ClinicOS contracts, production EHR credentialing, live transcription provider selection, external AI private/BAA pathway, production prompt store, model evaluation thresholds, drift response ownership, production PHI persistence, production Azure storage/deletion/restore, revenue estimate policy, claim/payer strategy, and commercial readiness approval.

## Next recommended batch

CR-4 has now been completed. The next batch must be a later founder-approved post-CR-4 or launch-decision work order; no active next work order exists in `repo_status.json`.

---

# CR-4 Commercial Readiness Review Candidate

## Completed work orders

- `WO-071` — Security, privacy, compliance, and threat-model runtime hardening.
- `WO-072` — Observability, SRE, support, and incident operations.
- `WO-073` — Billing, revenue integrity, claim-decision, and compliance boundary completion.
- `WO-074` — Beta pilot commercial readiness package.
- `WO-075` — Commercial readiness decision gate.

## Acceptance evidence

- `WO-071` added `docs/SECURITY_PRIVACY_COMPLIANCE_THREAT_MODEL.md`, CR-4 security/privacy commercial readiness API metadata, support metadata-only denial evidence, audit-safe `security.privacy_review_checked.v1` and `threat_model.reviewed.v1` events, and no-certification/no-launch posture.
- `WO-072` added `docs/COMMERCIAL_OBSERVABILITY_SUPPORT_OPERATIONS.md`, incident severity taxonomy, commercial support/operations metadata, disabled SIEM/APM/on-call posture, audit-safe `support.incident_taxonomy_checked.v1`, and the `pnpm ops:commercial-readiness` gate.
- `WO-073` added `docs/BILLING_REVENUE_INTEGRITY_BOUNDARY.md`, billing/revenue integrity commercial readiness evidence, candidate-only and `submittedClaim=false` posture, patient-summary exclusion posture, triggered transcript access boundaries, and audit-safe `billing.revenue_integrity_checked.v1`.
- `WO-074` added `docs/BETA_PILOT_READINESS_PACKAGE.md`, beta onboarding/training/support/rollback/disabled-feature evidence, synthetic pilot smoke validation, and audit-safe `beta.pilot_package_checked.v1`.
- `WO-075` added `docs/COMMERCIAL_READINESS_REVIEW_PACKET.md`, `/support/commercial-readiness`, final readiness matrix, disabled-capability inventory, required final review roles, audit-safe `commercial.readiness_decision_checked.v1`, and `pnpm commercial:readiness`.
- `repo_status.json` records `current_checkpoint: CR-4`, `next_work_order: null`, and `WO-071` through `WO-075: done`.
- No live PHI, production credentials, live vendors, certification claim, claim submission, autonomous clinical/coding/billing behavior, charge finalization, medical-necessity determination, order placement, patient-facing financial conclusion, or production launch behavior was introduced.

## Tests and gates

- `pnpm security:commercial-readiness`
- `pnpm ops:commercial-readiness`
- `pnpm billing:revenue-integrity-readiness`
- `pnpm beta:pilot-package-readiness`
- `pnpm commercial:readiness`
- Default local gate passed: `pnpm install --frozen-lockfile`; `pnpm db:client:generate`; `pnpm lint`; `pnpm lint:phi`; `pnpm typecheck`; `pnpm test`; `pnpm test:e2e`; `pnpm test:browser`; `pnpm build`.
- Broader readiness gates passed, including persistence/runtime, identity, config, observability, EHR, ClinicOS, AI, security, frontend runtime integration, launch, storage, retention, claim decision, commercial plan, post-P11, production, and acceptance readiness.
- Final status and hygiene checks passed: `node scripts/status.js`; `git diff --check`.

## Open risks

- CR-4 is review-ready synthetic evidence only. Production launch still requires a later founder-approved work order, real launch approvals, live vendor credentialing, BAA/contract review where required, production identity/storage/database/telemetry setup, backup/restore drills, support ownership, incident response, access review, and deployment approval.
- Beta pilot package readiness does not equal real beta tenant onboarding or live PHI use.
- Commercial readiness review does not equal HIPAA certification, SOC 2 certification, legal approval, or production launch approval.

## Active SPEC_GAPs

None active as of the post-`WO-075` commercial readiness decision gate / CR-4 review.

## Deferred production decisions

Deferred decisions remain tracked in `SPEC_GAPS.md`, including production launch approval, live identity/account lifecycle, production PHI persistence, production Azure storage/deletion/restore, live transcription, external AI private/BAA pathway, production EHR writeback, ClinicOS live integration, revenue estimate policy, claim/payer strategy, support/on-call ownership, legal/compliance/privacy/security approval, and live vendor credentials.

## Next recommended batch

Stop at the CR-4 checkpoint. The next work must be a later founder-approved post-CR-4 or production-launch decision work order. `repo_status.json` intentionally has `next_work_order: null`.

---

# WO-076 Post-CR4 Launch Governance Intake

## Completed work order

- `WO-076` — Post-CR4 launch governance, branch/CI, and duplicate artifact intake.

## Acceptance evidence

- `docs/POST_CR4_LAUNCH_GOVERNANCE_INTAKE.md` records the post-CR4 launch-governance posture, GitHub branch/PR follow-up state, duplicate artifact inventory, cleanup decision rules, and launch decision intake.
- `work_orders/WO-076_post_cr4_launch_governance_branch_ci_duplicate_artifact_intake.md` defines the bounded governance work order with no production behavior changes.
- `.gitignore` now ignores nested generated build output via `**/.next/` and `**/dist/`, preventing generated app/package output from polluting source-control status.
- `pnpm post-cr4:launch-governance` verifies the work-order file, status, run-log/checkpoint evidence, duplicate artifact review posture, CI hook, and no-launch/no-live behavior markers.
- `repo_status.json` records `current_checkpoint: CR-4`, `next_work_order: null`, and `WO-076: done`.

## Tests and gates

- `pnpm post-cr4:launch-governance`
- `pnpm commercial:readiness-plan`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

## Open risks

- `WO-076` does not approve production launch, live PHI, live vendors, production credentials, claim submission, charge finalization, medical-necessity determination, certification claims, or autonomous clinical/coding/billing behavior.
- Non-identical duplicate source/doc/script files remain review-required artifacts; they were not deleted.
- GitHub Actions still requires branch push/PR execution and remote check inspection.

## Active SPEC_GAPs

None active as of the post-`WO-076` post-CR4 launch governance intake review.

## Deferred production decisions

Deferred decisions remain tracked in `SPEC_GAPS.md`, including duplicate artifact deletion approval, production launch approval, live identity/account lifecycle, production PHI persistence, production Azure storage/deletion/restore, live transcription, external AI private/BAA pathway, production EHR writeback, ClinicOS live integration, revenue estimate policy, claim/payer strategy, support/on-call ownership, legal/compliance/privacy/security approval, and live vendor credentials.

## Next recommended batch

Push the branch, open or update a draft PR into `main`, inspect GitHub Actions, and create a later founder-approved work order for either duplicate artifact cleanup, launch-governance execution, beta pilot execution, production credentialing, or another explicit post-CR4 production decision sequence.

---

# WO-077 Duplicate Artifact Cleanup And Next-Work-Order Rails

## Completed work order

- `WO-077` — Duplicate artifact cleanup and post-CR4 next-work-order rails.

## Acceptance evidence

- PR #67 was marked ready and merged to `main` with merge commit `015b03102abd4da8a3b0b95a393fa9380351a27b`.
- `docs/DUPLICATE_ARTIFACT_ADJUDICATION.md` records the duplicate cleanup decision, counts, unique-difference review, and safety boundary.
- 103 visible duplicate-pattern files were reviewed and removed: 40 byte-identical copies, 62 stale historical copies, and 1 unique but rejected weaker migration-readiness script variant.
- `docs/POST_CR4_NEXT_WORK_ORDER_SEQUENCE.md` records `WO-078` through `WO-089` as planned work only.
- `docs/POST_CR4_PRODUCTION_DECISION_INPUTS.md` records the exact founder/reviewer/vendor/operations inputs required before planned production decisions can be promoted.
- `repo_status.json` records `WO-077: done`, `WO-078` through `WO-089: planned`, `current_checkpoint: CR-4`, and `next_work_order: null`.
- `pnpm post-cr4:next-work-orders` verifies cleanup, status, planned sequence, docs, CI hook, and no-launch/no-live markers.

## Tests and gates

- `pnpm post-cr4:next-work-orders`
- `pnpm post-cr4:launch-governance`
- `pnpm commercial:readiness-plan`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

## Open risks

- `WO-078` through `WO-089` remain planned and input-gated. None are active implementation work.
- Production launch, live PHI, live vendors, production credentials, live EHR/writeback, live transcription, live external AI, live Azure PHI storage, live ClinicOS integration, claim submission, charge finalization, medical-necessity determination, certification claims, and autonomous clinical/coding/billing behavior remain disabled or deferred.

## Active SPEC_GAPs

None active as of the post-`WO-077` duplicate artifact cleanup and next-sequence rails review.

## Deferred production decisions

Deferred decisions remain tracked in `SPEC_GAPS.md` and are mapped to planned `WO-078` through `WO-089`. Duplicate artifact deletion approval is now resolved only for the reviewed accidental local duplicate-pattern artifacts.

## Next recommended batch

Do not promote a planned work order until the required inputs in `docs/POST_CR4_PRODUCTION_DECISION_INPUTS.md` are available. Recommended next candidate is `WO-078` if the founder is ready to assemble launch governance approvals; otherwise choose the planned work order matching the first available production decision package.

---

# Post-WO-077 Founder Production-Decision Input Capture

## Captured inputs

- The founder/operator is the launch owner and approval authority unless a later written decision delegates an approval lane.
- Identity and account lifecycle planning should reference the local Flow project at `/Users/gregorygabbert/Documents/GitHub/Flow`.
- The Flow reference pattern includes Azure/Microsoft Entra, the `clinicos1` tenant, Microsoft redirect login, backend JWT validation, Entra-linked provisioning, tenant-member account restriction, guest/B2B denial, disabled/deleted identity denial, and application-owned role/scope enforcement.
- Production PHI database planning should evaluate Flow's Azure PostgreSQL Flexible Server, RLS/encryption, migration/runtime role, append-only evidence, and backup/restore posture.
- Production Azure storage planning should evaluate Flow's Key Vault, Blob soft-delete/versioning, and recovery posture, while separately deciding AURA Note PHI artifact-storage controls.
- Azure CLI verified the AURA Note resource baseline: tenant `b9b1d566-d7ed-44a4-b3cc-cf8786d6a6ed`, subscription `Subscription Malady` (`91d0e7fe-e9c6-40a0-af0f-98a9dc07b218`), resource group `AURA_resource_group`, location `eastus`, provisioning state `Succeeded`.

## Remaining boundary

This input capture does not promote `WO-078` through `WO-081`, approve production launch, enable live PHI, configure production credentials, approve live vendors, create/approve a storage account or containers, approve PHI-bearing Azure object storage, or change any production launch flag. The remaining required inputs are listed in `docs/POST_CR4_PRODUCTION_DECISION_INPUTS.md`.

---

# Post-WO-077 Azure Storage Decision Capture

## Captured decisions

- The founder/operator confirmed `eastus` is acceptable for production Azure storage planning and authorized Codex to make the remaining non-secret storage/deletion/restore choices.
- `docs/PRODUCTION_AZURE_STORAGE_DECISION_RECORD.md` records candidate storage account `auranoteeastus91d0`; Azure reported the name available on 2026-06-02.
- The decision record selects `StorageV2`, `Standard ZRS`, managed identity, candidate managed identity `aura-note-storage-mi`, candidate Key Vault reference `aura-note-kv-91d0`, artifact-class containers, tenant/site object-key partitioning, private endpoint requirement, server-mediated download TTLs, raw-audio 7-day purge eligibility, transcript indefinite retention, 14-day Blob/container soft delete, versioning, legal-hold deletion blocking, quarterly synthetic restore-readiness, evidence retention, and monitoring requirements.

## Remaining boundary

This decision capture does not promote `WO-081`, provision Azure resources, create containers, create or bind managed identity, configure private endpoints, configure production credentials, enable PHI-bearing object storage, enable public URLs, approve destructive production deletion, execute restore drills, or approve production launch.

## Acceptance evidence

- `az storage account check-name --name auranoteeastus91d0` returned `nameAvailable: true` on 2026-06-02.
- `pnpm storage:live-review-readiness` now verifies that the decision record exists and contains the required non-secret decisions while prohibited live/launch markers remain absent.

---

# Post-WO-077 Azure Storage No-PHI Provisioning Evidence

## Captured evidence

- The founder/operator confirmed `eastus` is acceptable and authorized Codex to make the remaining non-secret Azure storage, deletion, and restore choices.
- Azure no-PHI infrastructure was provisioned in tenant `b9b1d566-d7ed-44a4-b3cc-cf8786d6a6ed`, subscription `Subscription Malady`, resource group `AURA_resource_group`, region `eastus`.
- `docs/PRODUCTION_AZURE_STORAGE_PROVISIONING_EVIDENCE.md` records storage account `auranoteeastus91d0`, private artifact containers, managed identity `aura-note-storage-mi`, storage-account-scoped `Storage Blob Data Contributor` RBAC, Key Vault boundary `aura-note-kv-91d0`, VNet `aura-note-vnet-eastus`, private endpoint subnet `aura-note-private-endpoints`, private DNS zone/link for `privatelink.blob.core.windows.net`, Blob private endpoint `aura-note-storage-blob-pe`, and private DNS record `auranoteeastus91d0.privatelink.blob.core.windows.net`.
- Azure CLI verification showed public network access disabled, firewall deny-by-default, shared-key access disabled, Blob public access disabled, HTTPS-only traffic, TLS 1.2 minimum, 14-day Blob soft delete, 14-day container soft delete, Blob versioning enabled, and Key Vault RBAC/soft-delete/purge-protection/public-network-disabled posture.

## Remaining boundary

This no-PHI infrastructure evidence does not promote `WO-081`, approve production launch, commit secrets, enable production runtime credentials, enable PHI-bearing object delivery, expose public object URLs, execute destructive deletion, execute production restore, enable PHI-bearing audit exports, submit claims, finalize charges, determine medical necessity, or authorize autonomous clinical/coding/billing behavior.

## Remaining WO-081 evidence

- Approved config/secret-store references and deployment environment names outside source control.
- App/API/worker runtime integration through the private network using the managed identity.
- Synthetic no-PHI object-level tests for upload, server-mediated download token, wrong-tenant denial, expired-token denial, deletion block, legal hold, and restore readiness.
- Monitoring/alert wiring for storage posture drift, Key Vault drift, private endpoint/DNS failure, deletion failure, restore-readiness failure, wrong-tenant access attempts, and high egress.
- Explicit founder/operator approval before PHI-bearing object delivery, destructive deletion, PHI restore execution, or launch flags change.

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
- `pnpm storage:live-review-readiness` verifies that the tranche remains planning/control only and does not enable live Azure credentials, PHI-bearing object delivery, public URLs, destructive production deletion, production restore execution, PHI-bearing audit exports, runtime storage behavior, or launch behavior.
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

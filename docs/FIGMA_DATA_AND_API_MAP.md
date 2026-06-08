# Figma Data And API Map

Status as of the post-CR4 Figma Make backend catch-up tranche: data/API source map for design handoff and implementation. It separates API-backed runtime, documented disabled adapter mocks, persisted backend state, transient UI state, and Storybook/demo-only fixtures.

The two Figma Make sources are mapped in `docs/FIGMA_MAKE_BACKEND_CATCH_UP_AUDIT.md`. The accepted strategy is adapt/rebuild: use Figma as visual and interaction intent while keeping AURA Note's Next.js/NestJS/Prisma/contracts runtime authoritative.

## Data Source Categories

| Category | Meaning | Allowed in production-intended route? | Examples |
| --- | --- | --- | --- |
| typed API client | route reads or mutates through `apps/web/lib/aura-note-api-client.ts` | yes | schedule, drafts, workspace, finalization, exports, operations, platform, integrations, AI governance, coaching, support |
| persisted backend state | local Prisma/PostgreSQL-backed state where the runtime has been switched | yes for implemented slices | schedule/note shell and durable workflow state from CR-1/P7 evidence |
| documented disabled adapter mock | route shows disabled/degraded live-vendor behavior backed by API/status response | yes if clearly labeled | EHR, ClinicOS, live AI, storage, transcription, production identity |
| transient UI state | local React state for tabs, filters, form inputs, in-flight button labels | yes | selected tab, search filter, textarea draft before submission |
| Storybook/demo-only fixture | design fixture not authoritative for production route state | no, except explicitly labeled demo/handoff route examples | component examples, Figma handoff state catalog |

## Route API Map

| Route/surface | API or documented mock | Mutations represented | Event/audit expectation |
| --- | --- | --- | --- |
| `/aura-note` | `GET /app-shell` through the typed client; includes role-scoped navigation, dashboard metrics, notifications, activity, disabled-feature posture, and layout preference metadata | none | `app_shell.view` audit event and `audit.event_recorded.v1` metadata event |
| `/aura-note/schedule` | schedule, patient shell, appointment, note shell APIs plus `workspace-validation` and `chart-intake-status` metadata endpoints | create/update appointment, status change, Start Visit, metadata-only chart-intake status update | appointment/note/visit/chart-intake events and audit |
| `/aura-note/drafts` | draft note summary API | none from list view | read-only summary |
| `/aura-note/workspace/[appointmentId]` | workspace, note content/autosave/version, visit session, transcript, transcript/live, suggestions, selections, compliance, history gap, task APIs | content autosave, version restore, start/pause/resume/stop, exception, segment/correction metadata, suggestion accept/remove/restore, selection accept/remove/category change, compliance issue action, blocker task | note content, note version, visit, transcript, selection, compliance, blocker, audit events |
| `/aura-note/finalization/[noteId]` | finalization APIs plus finalization runtime state (`EvidenceSpanDto`, `FinalizationStepItemStatusDto`, editor variants, patient questions, care-plan candidates, patient insight metadata, billing validation, dispatch metadata) | code review, suggestion review, compose, approve, billing attest, sign/dispatch | finalization, billing, sign/dispatch, audit events |
| `/aura-note/finalized/[noteId]` | finalized note, artifact, export, download, writeback APIs | copy/export/PDF/download/writeback metadata | export, download, writeback, audit events |
| `/aura-note/operations` | `GET /standalone/operations/runtime` plus tasks, billing, settings, templates, estimates, rules catalog APIs | task review, settings/template/estimate/rules metadata actions | operations runtime, task/settings/rules/audit events where implemented |
| `/aura-note/platform` | platform config, session, feature flag APIs | safe synthetic flag/config updates | configuration/audit events |
| `/aura-note/integrations/ehr` | EHR adapter status and writeback queue APIs | sandbox metadata, queue retry/dead-letter/reconcile | EHR writeback/audit events |
| `/aura-note/integrations/clinicos` | ClinicOS mode/mapping/event APIs | mapping review, disabled event publication | ClinicOS mapping/publication/audit events |
| `/aura-note/ai-governance` | AI gateway governance APIs | mock invocation/eval/output validation | AI governance events |
| `/aura-note/coaching` | coaching APIs | none in current primary route | coaching visibility audit where applicable |
| `/aura-note/support/status` | support/status, audit export, backup/restore, readiness APIs | audit export metadata, synthetic checks | support/audit/export events |
| `/aura-note/figma-handoff` | read-only handoff inventory and documented mocks | none | no state-changing behavior |

## Persistence And Tenant Isolation Notes

- Every state-changing backend action must remain tenant-scoped and permission-checked.
- Persisted tenant-owned data must retain RLS or tenant/site query evidence where in scope.
- Figma should label API-backed persisted state separately from disabled-vendor mocks and demo fixtures.
- No route may rely on production-intended local React state as the authoritative data source.
- Schedule route filters are transient controls, but filtered appointments, filter options, room/location metadata, virtual visit status, chart-intake status, workspace validation, and disabled live scheduling sources are returned by typed API responses.
- `POST /schedule/appointments/{appointmentId}/chart-intake-status` is metadata-only. It must not enable PHI-bearing file upload, patient portal delivery, public object URLs, or live EHR completeness claims.
- Workspace route review actions are API-backed: `GET /documentation-workspace/appointments/{appointmentId}/transcript/live`, `POST /notes/{noteId}/suggestions/{suggestionId}/restore`, `POST /notes/{noteId}/visit-selections/{visitSelectionId}/remove`, `POST /notes/{noteId}/visit-selections/{visitSelectionId}/category`, and `POST /notes/{noteId}/compliance/issues/{complianceIssueId}/actions` return typed state and audit/domain-event evidence.
- Suggestion education/evidence, selected-code disposition, compliance action state, transcript confidence, and speaker-label summaries must come from API responses or documented mocks, not local-only Figma prototype state.
- Finalization route Design 2 runtime state is API-backed through `GET /notes/{noteId}/finalization` and the existing action endpoints. Evidence highlighting uses stable `EvidenceSpanDto` identifiers and offsets, not display-label keys. Patient questions map to existing history-gap/task concepts; portal send remains disabled. Care-plan items are candidate/human-review-only. Dispatch metadata keeps `submittedClaim=false`. The Figma-derived progress rail, review metrics, dual-editor approval state, planning state, and read-only patient-summary compare pane all read from `FinalizationSessionDto`.
- Operations route Design 1 analytics/activity/settings surfaces are API-backed through `GET /standalone/operations/runtime`. `OperationsRuntimeViewDto` composes aggregate synthetic task, billing-review, settings, template, estimate, and rules data; `OperationsSettingsSummaryDto` returns masked-secret posture only; production analytics vendors, patient-facing revenue, live credentials, and claim submission remain disabled. The Figma-derived analytics series and settings/governance panels render API-backed `OperationsAnalyticsSnapshotDto` and `OperationsSettingsSummaryDto` data rather than local prototype configuration.
- The Figma Make source/node visual pass adds route-visible Design 1 and Design 2 structures while preserving those same data boundaries: `/aura-note` command dashboard reads `AppShellViewDto`; `/aura-note/workspace/[appointmentId]` editor command deck, selected-code rail, and suggestion intelligence rail read workspace/note/transcript/suggestion/selection DTOs; `/aura-note/finalization/[noteId]` evidence highlighter, patient-question popup, and billing/dispatch dock read `FinalizationSessionDto`; `/aura-note/operations` analytics tabs, KPI cards, chart stage, settings governance tabs, and settings control matrix read `OperationsRuntimeViewDto`.
- Figma Make prototype-only Supabase files, local-state workflow session APIs, `RevenuePilot` branding, and PHI-like fixture labels are rejected for production-intended routes.

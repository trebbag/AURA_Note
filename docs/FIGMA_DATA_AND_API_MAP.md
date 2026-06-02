# Figma Data And API Map

Status as of `WO-065`: data/API source map for design handoff. It separates API-backed runtime, documented disabled adapter mocks, persisted backend state, transient UI state, and Storybook/demo-only fixtures.

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
| `/aura-note` | schedule, notes, operations, support typed clients | none | read-only summary |
| `/aura-note/schedule` | schedule, patient shell, appointment, note shell APIs | create/update appointment, status change, Start Visit | appointment/note/visit events and audit |
| `/aura-note/drafts` | draft note summary API | none from list view | read-only summary |
| `/aura-note/workspace/[appointmentId]` | workspace, visit session, transcript, suggestions, selections, compliance, history gap, task APIs | start/pause/resume/stop, exception, segment/correction metadata, selection accept/remove, blocker task | visit, transcript, selection, compliance, blocker, audit events |
| `/aura-note/finalization/[noteId]` | finalization APIs | code review, suggestion review, compose, approve, billing attest, sign/dispatch | finalization, billing, sign/dispatch, audit events |
| `/aura-note/finalized/[noteId]` | finalized note, artifact, export, download, writeback APIs | copy/export/PDF/download/writeback metadata | export, download, writeback, audit events |
| `/aura-note/operations` | tasks, billing, settings, templates, estimates, rules catalog APIs | task review, settings/template/estimate/rules metadata actions | task/settings/rules/audit events where implemented |
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

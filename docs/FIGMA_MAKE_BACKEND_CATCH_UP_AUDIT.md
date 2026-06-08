# Figma Make Backend Catch-Up Audit

Status as of the post-CR4 Figma Make backend catch-up tranche: this document records how the two supplied Figma Make prototypes map into AURA Note without importing prototype-only backend behavior.

## Source Designs

| Source | Link | Accepted use |
| --- | --- | --- |
| Design 1 | [AI Powered Clinical Note Editor](https://www.figma.com/make/FCk3sMWzjg6daDx98MCH19/AI-Powered-Clinical-Note-Editor?t=aegtNl2JDW3z2Ad1-1) | Visual and interaction source for the app shell, dashboard, schedule, documentation workspace, selected-code bar, suggestions, drafts, analytics, activity, notifications, and settings. |
| Design 2 | [Step by Step Workflow Wizard](https://www.figma.com/make/4gAaXIgsxSvlNs83hTAce8/Step-by-Step-Workflow-Wizard?t=20vVtikQezirs3zb-1) | Visual and interaction source for the six-step finalization wizard, evidence review, patient questions, dual editor variants, AI compose progress, billing/attest, sign/dispatch, and export surfaces. |

## Implementation Strategy

AURA Note uses an adapt/rebuild strategy. The Figma Make designs are treated as product UI intent, not as an implementation architecture. Production-intended routes must continue to use:

- the existing Next.js web app;
- the NestJS `/api/v1` backend;
- typed DTOs and typed web client calls from `packages/contracts` and `apps/web/lib/aura-note-api-client.ts`;
- tenant/site-scoped backend state and permission guards;
- audit/domain events for state-changing actions;
- disabled or mock-gated live vendors unless a later approved work order enables them;
- synthetic data only.

Storybook/demo mode may still use local fixtures. Production-intended AURA Note routes may use local React state only for transient controls such as sidebar open/closed state, drawer visibility, selected tabs, and in-progress form text before a typed API mutation.

## Accepted, Adapted, And Rejected Features

| Figma Make feature | Disposition | Backend catch-up method |
| --- | --- | --- |
| Collapsible sidebar, header, user role context, badges, notifications | accepted/adapted | Added `AppShellViewDto`, `NotificationDto`, `ActivityFeedItemDto`, and `ClinicalWorkflowDashboardDto`; `GET /api/v1/app-shell` returns role-scoped navigation and counts. |
| `RevenuePilot` branding | rejected | All route copy remains `AURA Note`; `AppShellViewDto.revenuePilotBrandingAccepted` is `false`. |
| Demo patient/provider names, contact details, encounter IDs, and 2024 dates | rejected | Use existing synthetic safe identifiers such as `safePatientId`, appointment IDs, note IDs, and chart-context DTOs. No real PHI fixture is accepted. |
| Dashboard schedule, drafts, blockers, quality, and internal revenue cards | accepted/adapted | Dashboard metrics are server-composed. Internal revenue is `unavailable_caveated` unless later configured for internal-only display. |
| Schedule filters, rooms, virtual visits, chart upload affordances | partially implemented/adapted | Added query-backed schedule filters, location/room metadata, virtual visit status, and metadata-only chart-intake state. Live PHI file upload and patient portal delivery stay disabled until production PHI approval. |
| Patient/encounter validation and autocomplete | partially implemented/adapted | Keep appointment as the primary workflow key; added safe workspace validation responses for appointment, note, and chart-context linkage without returning PHI-like identifiers. |
| Rich text editing, autosave, undo/redo, templates, versions, conflicts | partially implemented/adapted | Added canonical `aura_markdown_v1` note content, autosave status, server sanitization, derived plain text/section offsets, version history, restore, and audit/domain events. Undo/redo remains a frontend transient control mapped to restore/version history until a later UI fidelity pass. |
| Live transcript preview, full transcript modal, pause/resume, speaker labels | partially implemented/adapted | Added `TranscriptLiveViewDto` and `GET /api/v1/documentation-workspace/appointments/{appointmentId}/transcript/live` for polling-friendly recent/full transcript state, confidence summary, speaker labels, timer state, provider status, and disabled live-stream/raw-audio posture. |
| Suggestion education, rationale, evidence for/against, tests to consider | partially implemented/adapted | Extended suggestion DTOs with education, evidence for/against, documentation requirements, recommended actions, tests-to-consider, authority source, and `humanReviewRequired: true` while preserving the AURA Note `<75%` low-confidence diagnosis override threshold. |
| Visit Selections accept/remove/restore/category-change behavior | partially implemented/adapted | Added API-backed suggestion restore, Visit Selection remove, return-to-suggestions, and category-change mutations with audit/domain events and finalization readiness recalculation. |
| Compliance alert dismiss/restore/assign/resolve | partially implemented/adapted | Added compliance issue action endpoints. Hard blocks cannot be dismissed; resolved hard blocks recalculate finalization readiness through backend state. |
| Design 2 finalization wizard interaction detail | partially implemented/adapted | Extended the existing `FinalizationSessionDto` with evidence spans, per-step item statuses, dual editor variants, patient questions, care-plan items, patient insight metadata, billing validation details, and dispatch metadata. No parallel `/workflow/sessions` backend is created. |
| Evidence highlighting keyed by display text | rejected/adapted | Add stable evidence spans keyed by source type, source ID, section ID, quote, and offsets; never key evidence by display labels. |
| Patient questions popup with portal send | adapted/gated | Map staff handoff to existing MA task flow. Portal send remains disabled until patient portal integration approval. |
| Care-plan/planning assistant items | partially implemented/adapted | Added clinician-reviewed care-plan candidate DTOs tied to finalization sessions. AI-generated or mock-derived items remain candidate-only and human-review-required. |
| Patient review panel with vitals, allergies, care team, predictive insights | partially implemented/adapted | Added `PatientInsightSnapshotDto` with source-freshness, stale warnings, metadata-only/unavailable status values, and `predictiveInsightsEnabled: false`. Do not fabricate clinical facts. |
| Notifications and activity log | accepted/adapted | Added server-generated notification and activity DTOs with metadata-only, role-scoped output. |
| Usage/coding/compliance/revenue analytics charts | partially implemented/adapted | Added a backend-composed `OperationsRuntimeViewDto` at `GET /api/v1/standalone/operations/runtime` with synthetic aggregate task, billing-review, settings, templates, and rules metrics. Production analytics vendors and patient-facing revenue remain disabled. |
| Settings API keys, EHR config, AI preferences, templates, rules | partially implemented/adapted | Added an operations settings runtime summary sourced from existing operations/platform metadata. It returns masked-secret posture only, never raw keys; AI preferences remain governed by AI Gateway policy. |
| Supabase files and `/workflow/sessions` endpoints | rejected | No Supabase dependency or second backend is introduced. The NestJS API, contracts, and Prisma persistence remain authoritative. |
| Direct browser AI calls, live patient portal delivery, live claim submission | rejected | These remain outside the approved v1 runtime. Draft/candidate/human-review gates remain mandatory. |

## Route Mapping

| Figma surface | AURA Note route/API target |
| --- | --- |
| Figma app shell and dashboard | `/aura-note`; `GET /api/v1/app-shell` |
| Schedule Builder | `/aura-note/schedule`; schedule/patient/chart-context APIs |
| Documentation workspace | `/aura-note/workspace/[appointmentId]`; workspace, note content/autosave/version, transcript, suggestion, selection, compliance, history-gap APIs |
| Draft notes | `/aura-note/drafts`; `GET /api/v1/notes/drafts` |
| Finalization wizard | `/aura-note/finalization/[noteId]`; existing `/api/v1/notes/{noteId}/finalization` family |
| Finalized note/export | `/aura-note/finalized/[noteId]`; export/download/writeback metadata APIs |
| Notifications/activity | app shell DTOs initially; later durable audit/domain-event feed |
| Settings/admin/integrations | `/aura-note/platform`, `/aura-note/operations`, `/aura-note/integrations/ehr`, `/aura-note/integrations/clinicos`; `GET /api/v1/standalone/operations/runtime` |
| Design examples only | `/aura-note/figma-handoff` or Storybook/demo mode |

## Current Tranche Evidence

- `AppShellViewDto`, `ClinicalWorkflowDashboardDto`, `NotificationDto`, and `ActivityFeedItemDto` are defined in `packages/contracts/src/index.ts`.
- `GET /api/v1/app-shell` returns role-scoped route state, dashboard metrics, notifications, activity feed, and disabled-feature posture.
- `/aura-note` consumes `createAuraNoteApiClient().getAppShell()` as the happy-path source of truth.
- The shell records `revenuePilotBrandingAccepted: false`, `supabaseBackendAccepted: false`, `patientFacingRevenueExposed: false`, `productionLaunchApproved: false`, `liveVendorActionsEnabled: false`, and `submittedClaim: false`.
- `GET /api/v1/notes/{noteId}/content`, `POST /api/v1/notes/{noteId}/content/autosave`, `GET /api/v1/notes/{noteId}/versions`, and `POST /api/v1/notes/{noteId}/versions/{versionId}/restore` provide the Figma editor's API-backed autosave/version foundation.
- `/aura-note/workspace/[appointmentId]` now loads and edits `aura_markdown_v1` note content through the typed client. Local React state is limited to in-progress editor text before autosave.
- `GET /api/v1/schedule/appointments` now accepts active date, view mode, provider, status, visit type, modality, and clinic-location filters and returns backend filter options plus `ScheduleAppointmentMetadataDto`.
- `GET /api/v1/schedule/appointments/{appointmentId}/workspace-validation` returns safe appointment/note/chart-context linkage validation before the workspace opens.
- `POST /api/v1/schedule/appointments/{appointmentId}/chart-intake-status` updates metadata-only chart-intake state and emits `chart_context.intake_status_updated.v1`; live PHI upload and patient portal delivery remain disabled.
- `/aura-note/schedule` now renders backend-backed schedule filters, room/location metadata, virtual visit status, chart-intake status, and workspace validation evidence through the typed client.
- `GET /api/v1/documentation-workspace/appointments/{appointmentId}/transcript/live` returns API-polling transcript live view metadata. It keeps `liveStreamingEnabled=false`, `rawPhiAudioStored=false`, and transcript retention `indefinite`.
- Suggestions now carry education, evidence for/against, documentation requirements, tests-to-consider, authority source, and `humanReviewRequired: true`; they remain draft/candidate-only until human action.
- `POST /api/v1/notes/{noteId}/suggestions/{suggestionId}/restore`, `POST /api/v1/notes/{noteId}/visit-selections/{visitSelectionId}/remove`, and `POST /api/v1/notes/{noteId}/visit-selections/{visitSelectionId}/category` back the Figma selected-code bar with persisted disposition metadata.
- `POST /api/v1/notes/{noteId}/compliance/issues/{complianceIssueId}/actions` records acknowledge/assign/resolve/restore/dismiss attempts. Hard-block dismissal fails closed; resolve requires a documented reason and recalculates blocker state.
- `/aura-note/workspace/[appointmentId]` now displays transcript live state, human-review-required suggestion metadata, selected-code disposition, and compliance issue action history from API responses.
- `GET /api/v1/notes/{noteId}/finalization` and the existing finalization action endpoints now return Design 2 finalization runtime state through the expanded `FinalizationSessionDto`: `EvidenceSpanDto`, `FinalizationStepItemStatusDto`, `FinalizationEditorVariantDto`, `PatientQuestionWorkflowDto`, `CarePlanItemDto`, `PatientInsightSnapshotDto`, `BillingValidationDetailDto`, and `FinalizationDispatchMetadataDto`.
- `/aura-note/finalization/[noteId]` displays API-backed evidence spans, selected-code/item statuses, dual editor variants, patient questions, care-plan candidates, patient insight metadata, billing validation, and dispatch metadata. The dispatch metadata explicitly keeps `submittedClaim: false` and patient portal delivery disabled.
- `/aura-note/finalization/[noteId]` now also renders a Figma-derived but API-backed workflow board with a six-step progress rail, selected/suggested item metrics, dual-editor approval state, patient-question state, planning candidates, and patient-insight warnings. The patient summary compare surface is read-only and sourced from `FinalizationSessionDto.composeOutput` or finalized records, not local Figma prototype text.
- Playwright now seeds a backend-backed appointment through finalization/export, opens the finalization route, verifies the Design 2 runtime panels, reloads, and verifies persisted/refetched `signed_dispatched` evidence.
- `GET /api/v1/standalone/operations/runtime` now returns a backend-composed `OperationsRuntimeViewDto` with `OperationsAnalyticsSnapshotDto`, notification/activity feed evidence, and `OperationsSettingsSummaryDto`.
- `/aura-note/operations` now renders Figma-style operations analytics, activity, notifications, and settings runtime summary from the typed client while keeping local React state limited to transient tab/form controls.
- `/aura-note/operations` now also renders backend-backed Design 1 analytics series and settings/governance affordances from `OperationsRuntimeViewDto`. These panels adapt the Figma analytics/settings tabs while preserving masked-secret, disabled live-vendor, patient-facing revenue disabled, and `submittedClaim=false` posture.
- Operations runtime evidence keeps `productionAnalyticsVendorEnabled=false`, `secretValuesReturned=false`, `claimSubmissionEnabled=false`, `submittedClaim=false`, and patient-facing revenue disabled.
- The Figma Make source/node visual pass adds a closer Design 1 shell hierarchy on `/aura-note`: grouped primary/resource sidebar navigation, AURA Note brand tile, current-user chip, quick-action band, command dashboard, dashboard side cards, and route-state summary. These values are still sourced from `AppShellViewDto`.
- `/aura-note/workspace/[appointmentId]` now includes the Design 1 editor command deck, mock audio waveform, API-backed rich-text preview, selected-code rail, and suggestion intelligence rail. These surfaces are sourced from workspace, note-content, transcript live-view, suggestion, and Visit Selection DTOs.
- `/aura-note/finalization/[noteId]` now includes the Design 2 evidence highlighter, patient-question popup, and billing/dispatch dock. Evidence spans use stable IDs and offsets; patient portal delivery and claim submission remain disabled.
- `/aura-note/operations` now includes polished Design 1 analytics tabs, KPI cards, CSS-rendered chart stage, settings governance tabs, settings control matrix, and feature-flag summary sourced from `OperationsRuntimeViewDto`.
- Playwright and `pnpm figma:backend-catch-up-readiness` now verify the Figma visual/node surfaces so they cannot silently regress to local-state-only prototype UI. Formal screenshot-baseline approval and founder/designer production visual signoff remain separate evidence.

## Guardrails

- No raw PHI, secrets, production URLs, private keys, production connection strings, or real patient data are introduced.
- No live EHR writeback, live transcription vendor, live external AI, patient portal send, public object URL, claim submission, charge finalization, medical-necessity determination, order placement, autonomous diagnosis, autonomous coding, or autonomous billing behavior is enabled.
- ClinicOS-integrated mode remains adapter-bound and cannot bypass AURA Note permissions.
- Future route replacement must pass the Frontend Runtime Integration Gate before production-intended route state can be considered backend-backed.

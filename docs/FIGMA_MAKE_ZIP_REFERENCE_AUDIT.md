# Figma Make ZIP Reference Audit

Status: post-CR4 frontend/runtime refinement reference. This document records the two local Figma Make export ZIPs supplied by the founder/operator and how Codex may use them while preserving AURA Note's existing production contract.

This document does not promote `WO-078+`, approve production launch, approve live PHI handling, or authorize direct import of prototype backend behavior.

## Local Reference Handling

The ZIPs were extracted into `.figma-make-reference/`, which is ignored by Git. The extracted files are local reference material only and must not be staged wholesale because they include prototype-local state, alternate backend examples, hardcoded demo literals, and implementation assumptions that do not belong in the AURA Note runtime.

| ZIP | Local reference directory | Use |
| --- | --- | --- |
| `/Users/gregorygabbert/Downloads/AI-Powered Clinical Note Editor.zip` | `.figma-make-reference/design-1-clinical-note-editor/` | Design 1 source reference for app shell, dashboard, schedule, drafts/finalized notes, documentation workspace, suggestions, Visit Selections, compliance, analytics, activity, notifications, and settings. |
| `/Users/gregorygabbert/Downloads/Step by Step Workflow Wizard.zip` | `.figma-make-reference/design-2-finalization-wizard/` | Design 2 source reference for finalization wizard visuals, progress state, evidence highlighting, patient questions, dual editor, compose progress, billing/attest, and sign/dispatch surfaces. |

## Design 1 Source Inventory

High-value files in the Design 1 export:

- `src/app/AURA_NOTE_FIGMA_HANDOFF.md`
- `src/app/CODEX_IMPLEMENTATION_CHECKLIST.md`
- `src/app/BACKEND_DATA_INTEGRATION_ANALYSIS.md`
- `src/app/components/NavigationSidebar.tsx`
- `src/app/components/Dashboard.tsx`
- `src/app/components/Schedule.tsx`
- `src/app/components/Drafts.tsx`
- `src/app/components/NoteEditor.tsx`
- `src/app/components/SuggestionPanel.tsx`
- `src/app/components/SelectedCodesBar.tsx`
- `src/app/components/ComplianceAlert.tsx`
- `src/app/components/ActivityLog.tsx`
- `src/app/components/Analytics.tsx`
- `src/app/components/Settings.tsx`
- `src/app/components/StyleGuide.tsx`
- `src/styles/globals.css`

Accepted Design 1 visual and interaction concepts:

- Collapsible navigation with grouped workflow/resource sections.
- Dashboard quick-action cards, route-state summary, operational cards, notification feed, and activity feed.
- Schedule filter panel, appointment cards, room/location/virtual metadata, and chart-intake status surfaces.
- Rich editor command deck, editor toolbar, timer/recording panel, transcript preview, Suggestions panel, Visit Selections rail, Compliance Review, and History Gap Review affordances.
- Draft/finalized note table/card surfaces with read-only/finalized status.
- Analytics tabs, KPI cards, chart-like visual stage, settings governance tabs, masked-secret controls, and feature-flag summary.

Rejected Design 1 prototype behavior:

- `RevenuePilot` product branding.
- Hardcoded patient/provider names, contact details, encounter identifiers, or 2024 fixture dates.
- Any local React array as the production source of truth.
- Direct browser AI, direct vendor calls, public object URLs, patient portal delivery, live claim submission, charge finalization, or autonomous clinical/coding/billing behavior.

## Design 2 Source Inventory

High-value files in the Design 2 export:

- `CODEX_IMPLEMENTATION_CHECKLIST.md`
- `src/app/docs/CODEX_HANDOFF.md`
- `src/app/docs/BACKEND_DATA_SPECIFICATION.md`
- `src/app/types/aura-backend.ts`
- `src/app/components/WorkflowWizard.tsx`
- `src/app/components/StepContent.tsx`
- `src/app/components/DualRichTextEditor.tsx`
- `src/app/components/PatientQuestionsPopup.tsx`
- `src/app/components/ProgressIndicator.tsx`
- `src/app/components/AuraWorkflowWizard.tsx`

Accepted Design 2 visual and interaction concepts:

- Six-step wizard board and progress rail.
- Selected/suggested review cards and item status counts.
- Evidence highlighting with visible source metadata.
- Compose progress phases.
- Dual editor variants for original note, enhanced note, and patient summary.
- Patient-question popup and planning assistant surfaces.
- Patient insight snapshot panel with stale/unavailable states.
- Billing validation and dispatch dock.

Rejected or adapted Design 2 prototype behavior:

- Supabase, Hono, or any second backend.
- Prototype `/workflow/sessions` API surface where an existing AURA Note finalization endpoint already exists.
- Figma checklist steps that imply a different product workflow than AURA Note's current backend/domain step IDs.
- Hardcoded `John Smith`, MRNs, encounter IDs, clinical values, allergies, care-team details, estimated charges, or SOAP notes.
- Direct live EHR sync, live portal send, live claim submission, charge finalization, or medical-necessity determination.

## Route Mapping

| Figma Make surface | Current AURA route | Runtime backing rule |
| --- | --- | --- |
| App shell and command dashboard | `/aura-note` | `AppShellViewDto` through typed API client. Local state may only collapse/expand the sidebar. |
| Schedule Builder | `/aura-note/schedule` | `ScheduleViewDto`, appointment actions, patient search, chart-intake metadata, and workspace validation through typed API client. |
| Draft Notes | `/aura-note/drafts` | Draft note summaries through typed API client; no local fixture rows. |
| Documentation Workspace | `/aura-note/workspace/[appointmentId]` | Workspace, note content/autosave/versions, transcript live view, suggestions, Visit Selections, compliance, and history gaps through typed API client. |
| Finalization Wizard | `/aura-note/finalization/[noteId]` | Existing AURA Note finalization APIs and `FinalizationSessionDto`; no parallel workflow backend. |
| Finalized Notes | `/aura-note/finalized` and `/aura-note/finalized/[noteId]` | Final note, patient summary, export, copy, PDF, and writeback metadata through typed API client. |
| Analytics/activity/notifications/settings | `/aura-note/operations` | `OperationsRuntimeViewDto` plus existing operations APIs. Local state may only select tabs or hold transient form input. |
| Static design inventory | `/aura-note/figma-handoff` | Read-only metadata/documentation route only. |

## Fidelity Status

The supplied ZIPs materially improve the visual implementation source because they provide component source, CSS, tokens, and handoff/checklist text. They do not provide exact inspectable Figma node coordinates or screenshot baselines. Therefore the repo can claim source-reference implementation evidence, typed-client runtime wiring, and browser regression coverage, but it must not claim final pixel-perfect Figma approval until direct Figma node screenshots or founder/designer screenshot-baseline signoff exists.

## Required Runtime Guardrails

- Production-intended routes must use typed API clients and backend state.
- Synthetic local React state is allowed only for transient UI state, form input before API mutation, Storybook/demo mode, or documented mocks where live vendors are disabled.
- Every visible clinical/coding/billing/AI output remains draft/candidate/human-review-required until the existing backend action records approval.
- All visible patient identifiers must be safe synthetic identifiers.
- Patient portal delivery, external AI, live transcription provider calls, live EHR writeback, production storage delivery, claim submission, charge finalization, and production launch remain disabled unless a later approved work order changes that posture.

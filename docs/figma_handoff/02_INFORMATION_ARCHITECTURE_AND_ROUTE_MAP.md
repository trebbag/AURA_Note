# Information Architecture And Route Map

## Figma Page Structure

Create the Figma file with these top-level pages:

1. `00 Cover And Safety Boundaries`
2. `01 Design Tokens And Components`
3. `02 App Shell And Navigation`
4. `03 Schedule And Patient Context`
5. `04 Documentation Workspace`
6. `05 Finalization And Outputs`
7. `06 Operations Worklists`
8. `07 Platform Admin And Integrations`
9. `08 AI Governance And Coaching`
10. `09 Support Commercial Readiness`
11. `10 Responsive And State Matrix`
12. `11 Prototype Flows`

## Product Route Groups

| Route or surface | Figma page | Primary role | Design priority | Runtime posture |
| --- | --- | --- | --- | --- |
| `/aura-note` | App Shell And Navigation | clinician, admin | P0 | typed API-backed summary |
| `/aura-note/schedule` | Schedule And Patient Context | clinician, MA | P0 | typed API-backed schedule/patient state |
| `/aura-note/drafts` | Finalization And Outputs | clinician | P1 | typed API-backed draft summaries |
| `/aura-note/workspace/[appointmentId]` | Documentation Workspace | clinician | P0 | typed API-backed workspace and documented disabled mocks |
| workspace transcript drawer | Documentation Workspace | clinician, limited billing | P0 | transcript/recording metadata APIs |
| workspace Suggestions panel | Documentation Workspace | clinician | P0 | suggestion APIs, draft/candidate-only |
| workspace Visit Selections panel | Documentation Workspace | clinician | P0 | selection APIs, human review required |
| workspace Compliance drawer | Documentation Workspace | clinician, compliance/privacy lead | P0 | compliance/blocker APIs |
| workspace History Gap drawer | Documentation Workspace | clinician, MA | P0 | history gap/task APIs |
| `/aura-note/finalization/[noteId]` | Finalization And Outputs | clinician | P0 | typed API-backed finalization flow |
| `/aura-note/finalized` | Finalization And Outputs | clinician, admin | P1 | typed API-backed finalized summaries |
| `/aura-note/finalized/[noteId]` | Finalization And Outputs | clinician, billing when routed | P0 | read-only finalized artifact APIs |
| export/PDF/copy/download | Finalization And Outputs | clinician, authorized admin | P0 | server-mediated storage/download metadata |
| writeback status | Finalization And Outputs | clinician, integration service account | P1 | disabled/sandbox writeback queue APIs |
| `/aura-note/operations` | Operations Worklists | MA, billing staff, admin | P0 | tasks, billing, settings, templates, rules APIs |
| `/aura-note/platform` | Platform Admin And Integrations | admin, authorized admin | P1 | identity/config/feature flag APIs |
| `/aura-note/integrations/ehr` | Platform Admin And Integrations | admin, integration service account | P1 | sandbox EHR adapter APIs |
| `/aura-note/integrations/clinicos` | Platform Admin And Integrations | admin, service account | P1 | ClinicOS mode/mapping adapter APIs |
| `/aura-note/ai-governance` | AI Governance And Coaching | admin, compliance/privacy lead | P1 | AI governance APIs, live AI disabled unless approved |
| `/aura-note/coaching` | AI Governance And Coaching | clinician, admin | P2 | coaching visibility APIs |
| `/aura-note/support/status` | Support Commercial Readiness | support, authorized admin | P1 | support/status and launch-gate APIs |
| `/aura-note/figma-handoff` | Support Commercial Readiness | designer, product reviewer | P2 | read-only handoff metadata |

## Navigation Model

Use one global app shell for all AURA Note routes:

- primary nav: Schedule, Drafts, Workspace, Finalized, Operations, Platform, Support;
- secondary nav by context: EHR, ClinicOS, AI Governance, Coaching, Figma Handoff;
- persistent route state banners for mode, permission, degraded integrations, and launch/vendor disablement;
- no patient content in global nav labels;
- route breadcrumbs should help a user understand appointment -> note -> workspace -> finalization -> finalized artifact.

## App Shell Requirements

The shell should support:

- desktop: left nav or compact rail plus top route context;
- tablet: collapsible navigation with persistent patient/visit context when in workspace;
- mobile: single-column navigation and route-specific action bars; no horizontal overflow;
- clear account/session state;
- visible standalone vs ClinicOS-integrated mode label;
- disabled live-vendor status when relevant;
- main landmark and accessible route heading on every screen.

## Information Scent

Every route should answer:

- What is happening now?
- What is blocked?
- Who owns the next action?
- What evidence supports this suggestion or state?
- What action is safe to take?
- What is intentionally disabled or unavailable?
- What has already been approved, signed, exported, or routed?

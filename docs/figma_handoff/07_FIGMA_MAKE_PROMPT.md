# Figma Make Prompt

Use this prompt only as a starting point. The source-of-truth materials remain the files in this handoff pack and the canonical repo docs.

```text
Design a polished, production-intended front-end concept for AURA Note, a standalone-first clinical documentation, transcription, coding-support, finalization, draft-claim-preview, export, writeback, task, and coaching application that can also run embedded in AURA ClinicOS through adapter boundaries. This is one app that supports both standalone and ClinicOS-integrated modes.

Create a dense, calm, clinical command workspace, not a marketing site. The design should feel operational, trustworthy, and built for repeated clinician use. Use clear hierarchy, compact typography, stable layout, accessible controls, and visible state banners. Avoid decorative hero pages, ornamental gradients, oversized cards, and patient-facing revenue/coaching/billing exposure.

Create Figma pages for: cover and safety boundaries, design tokens and components, app shell and navigation, schedule and patient context, documentation workspace, finalization and outputs, operations worklists, platform/admin/integrations, AI governance and coaching, support/commercial readiness, responsive/state matrix, and prototype flows.

Core screens and routes: /aura-note, /aura-note/schedule, /aura-note/drafts, /aura-note/workspace/[appointmentId], /aura-note/finalization/[noteId], /aura-note/finalized, /aura-note/finalized/[noteId], /aura-note/operations, /aura-note/platform, /aura-note/integrations/ehr, /aura-note/integrations/clinicos, /aura-note/ai-governance, /aura-note/coaching, /aura-note/support/status, and /aura-note/figma-handoff.

Prioritize the core workflow: home -> schedule -> start visit -> documentation workspace -> suggestions and Visit Selections -> compliance and History Gap blockers -> six-step finalization wizard -> finalized note viewer -> export/PDF/copy/writeback metadata -> operations worklists.

The Documentation Workspace must include a visit context header, timer and recording controls, editor, Visit Selections panel, Suggestions panel, transcript drawer, Compliance Review drawer, and History Gap Review drawer. The editor is locked until the timer is running or an approved recording exception is active.

The Finalization Wizard must show six human-reviewed steps: Code Review, Suggestion Review, Compose, Compare/Edit, Billing & Attest, and Sign & Dispatch. Draft claim preview must visibly show submittedClaim=false. All final artifacts are read-only after signing.

Build component variants for empty, loading, ready, saving, blocked, failed, permission-denied, read-only, degraded, disabled, finalized, and demo fixture states. Production-intended screens use typed API clients and persisted backend state; synthetic local React state is allowed only in Storybook/demo mode or transient UI controls.

Preserve safety boundaries: all AI outputs are draft/candidate/suggestion-only and human review required. Do not imply autonomous diagnosis, code finalization, charge finalization, claim submission, medical-necessity determination, order placement, raw PHI to external AI, live PHI processing, live EHR writeback, live transcription vendor, destructive production deletion, or launch approval. ClinicOS-integrated mode cannot bypass AURA Note permissions, tenant/site scope, purpose-of-use, or audit.

Use synthetic data only: Synthetic patient A, AN-APPT-1001, demo transcript segment, candidate suggestion, internal estimate unavailable, signed download token expired. No real PHI, credentials, production URLs, private keys, payer IDs, claim IDs, or patient identifiers.
```

## Prompt Guardrails

If an AI design assistant tries to make the product look like a consumer chatbot or landing page, reset it toward:

- clinician command workspace;
- dense schedule/worklist/editor layout;
- evidence and status first;
- human-review gates visible;
- disabled live-vendor and launch-blocked states visible.

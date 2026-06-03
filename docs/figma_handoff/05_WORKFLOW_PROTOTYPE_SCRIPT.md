# Workflow Prototype Script

The first clickable prototype should prove the core daily-use path and show the blocked/degraded safety paths that make AURA Note commercially credible.

## Primary Prototype Flow: Appointment To Final Artifact

1. Start on `/aura-note`.
   - Show today's scheduled work and blocked items.
   - Navigate to Schedule Builder.

2. Open `/aura-note/schedule`.
   - Create or select a synthetic appointment.
   - Show safe patient chip, chart freshness warning, appointment status, and one note shell.
   - Click Start Visit.

3. Enter `/aura-note/workspace/[appointmentId]`.
   - First show editor locked before timer starts.
   - Start timer and show editor unlocked.
   - Open transcript drawer with synthetic segment metadata.
   - Open Suggestions panel and accept a high-confidence candidate.
   - Attempt to accept a low-confidence diagnosis candidate and show override-required modal.
   - Add or resolve a History Gap blocker.
   - Show Compliance drawer blocking finalization until hard blocker is resolved or routed.

4. Continue to `/aura-note/finalization/[noteId]`.
   - Step 1: Code Review.
   - Step 2: Suggestion Review.
   - Step 3: Compose.
   - Step 4: Compare/Edit.
   - Step 5: Billing & Attest with draft claim preview and `submittedClaim=false`.
   - Step 6: Sign & Dispatch.
   - Include blocked state when unresolved MA blockers remain.

5. Open `/aura-note/finalized/[noteId]`.
   - Show read-only final note.
   - Show patient summary tab without internal billing/revenue/coaching/confidence details.
   - Show export/PDF/copy/download metadata card.
   - Show writeback disabled or queued state depending on configuration.

6. Open `/aura-note/operations`.
   - Show the MA blocker task list and billing review queue.
   - Show route-back links to workspace/finalized viewer.

## Required Negative/Guardrail Prototype Branches

Create at least one frame branch for each:

- permission-denied workspace;
- read-only finalized note;
- failed export/download token;
- expired or wrong-tenant secure download;
- live EHR disabled;
- ClinicOS mapping degraded or stale;
- no raw PHI to external AI governance state;
- launch blocked / production launch not approved;
- billing staff denied transcript unless billing review is routed;
- support user sees metadata-only support state.

## Prototype Naming Convention

Use this naming pattern for frames:

`[Priority] [Route] - [State] - [Role] - [Breakpoint]`

Examples:

- `P0 Schedule - Ready - Clinician - Desktop`
- `P0 Workspace - Timer Running - Clinician - Desktop`
- `P0 Workspace - Permission Denied - Billing Staff - Desktop`
- `P0 Finalization - Blocked By MA Task - Clinician - Desktop`
- `P0 Finalized Viewer - Read Only - Clinician - Mobile`

## Minimum Click Targets

Wire these actions:

- Home -> Schedule
- Schedule appointment -> Workspace
- Workspace -> transcript drawer
- Workspace -> Suggestions
- Workspace -> low-confidence override modal
- Workspace -> Compliance drawer
- Workspace -> History Gap drawer
- Workspace -> Finalization
- Finalization step rail navigation
- Finalization blocked state -> Operations task
- Finalization success -> Finalized viewer
- Finalized viewer -> export status
- Finalized viewer -> writeback status
- Operations -> billing review queue
- Platform -> EHR integration
- Platform -> ClinicOS integration
- Platform -> AI Governance

## Reviewer Acceptance

The prototype is acceptable for product review when a reviewer can understand:

- how a visit starts;
- why the editor is locked or unlocked;
- what suggestions are draft/candidate;
- what blocks finalization;
- how MA follow-up is routed;
- how draft claim preview stays non-submitted;
- how final artifacts are read-only;
- how permissions affect sensitive panels;
- how standalone and ClinicOS-integrated modes differ without creating two products;
- which capabilities are disabled until later approval.

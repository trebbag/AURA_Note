# Figma Workflow Map

Status as of `WO-065`: workflow map for design handoff. This map describes browser/API-testable or documented-disabled flows; it does not authorize live vendors, production PHI, autonomous finalization, claim submission, or production launch.

## Primary Standalone Workflow

1. Standalone home opens `/aura-note`.
2. Schedule Builder creates or links a standalone patient shell with a safe patient identifier.
3. Appointment creation creates one note shell.
4. Start Visit opens the Documentation Workspace.
5. Timer running or approved recording exception unlocks documentation.
6. Audio/transcription panel records metadata-only chunks in local synthetic mode and processes mock transcription.
7. Suggestions and Visit Selections remain draft/candidate-only.
8. Compliance Review and History Gap Review create blockers where required.
9. Finalization Wizard steps 1-6 require human review.
10. Draft claim preview remains `submittedClaim=false`.
11. Sign/Dispatch creates read-only final artifacts.
12. Finalized Note viewer exposes copy/PDF/export/writeback metadata according to role.

## Supporting Workflows

| Workflow | Entry | Required screens/panels | Exit | Stop/safety condition |
| --- | --- | --- | --- | --- |
| MA follow-up blocker | History Gap Review | workspace drawer, operations task inbox, MA worklist | blocker cleared or finalization remains blocked | open blockers prevent signing/finalization preparation |
| Billing review | Finalization/Billing & Attest | billing review queue, final note viewer billing tab, draft claim preview | human-reviewed billing state | no charge finalization or claim submission |
| Patient summary export | Finalized viewer | patient summary tab, export artifact card, secure download metadata | copy/PDF/download metadata | internal billing/revenue/coaching/confidence excluded |
| EHR writeback queue | Finalized viewer/EHR integration | writeback approval, retry, dead-letter, reconciliation, audit | queued/reconciled/failed metadata | live writeback disabled without credentials/governance |
| ClinicOS embedded mode | ClinicOS adapter entry | mode banner, mapping review, degraded/unavailable/permission-denied states | mapped local AURA Note workflow or safe degraded state | ClinicOS cannot bypass AURA Note permissions |
| AI governance review | Workspace/AI governance route | prompt/model metadata, eval cases, unsafe-output rejection, PHI scrub status | candidate output routed to human review | no raw PHI to external AI |
| Support audit/export/restore readiness | Support status | operational status, audit export metadata, backup/restore evidence | review package only | support users denied PHI by default |

## Workflow-State Expectations

- Empty states must identify the missing record and valid next action.
- Loading states must identify the API-backed or documented mock source.
- Ready states must show tenant/site scoped data only.
- Saving states must prevent duplicate submissions where applicable.
- Blocked states must name the blocker, owner, and next safe action.
- Failed states must avoid PHI/secrets in error copy.
- Permission-denied states must avoid exposing sensitive data.
- Read-only states must remove mutation controls.
- Degraded/disabled states must identify live-vendor or production-review dependency.
- Demo fixture states must be labeled synthetic/local.

## Figma Flow Questions To Preserve

- Final visual hierarchy and density for daily clinician work.
- Exact keyboard shortcuts and command palette scope.
- Final responsive layout for workspace drawers.
- Motion/transition guidance for panels and banners.
- Visual treatment for degraded/disabled live-vendor state without implying readiness.

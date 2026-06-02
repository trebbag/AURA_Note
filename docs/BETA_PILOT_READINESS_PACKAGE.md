# Beta Pilot Commercial Readiness Package

Status: `WO-074` review-ready synthetic evidence. This is a controlled beta review package only. It does not onboard real tenants, process live PHI, enable live vendors, or approve launch.

## Beta Scope

The beta package is standalone-first and synthetic/local-first. ClinicOS-integrated mode remains optional, adapter-bound, and degraded unless a later approval authorizes live ClinicOS configuration.

## Onboarding Checklist

| Area | Evidence | Status |
| --- | --- | --- |
| Tenant setup | Synthetic tenant/site/user records and platform admin route. | ready_synthetic |
| Role training | Clinician, MA, billing, admin, support, compliance/privacy, and authorized-admin flows. | ready_synthetic |
| Disabled feature inventory | Live vendors, claim submission, charge finalization, live AI, live EHR writeback, live transcription, and live PHI storage remain disabled. | ready_synthetic |
| Support plan | Support status route, runbooks, incident taxonomy, and escalation placeholders. | ready_synthetic |
| Rollback plan | Migration restore-readiness metadata and rollback runbook coverage. | review_required |
| Success metrics | Synthetic smoke, frontend runtime gate, support status, and acceptance readiness. | ready_synthetic |

## Training Checklist

- Clinician: schedule, workspace, transcription states, suggestions, finalization, export, and human review.
- MA: History Gap follow-up and blocker task handling.
- Billing: triggered billing review, candidate-only claim preview, and transcript access limits.
- Admin: settings, integrations, templates, dot phrases, estimates, rules catalog, and user status.
- Support: metadata-only support status and incident evidence.
- Compliance/privacy: redacted audit export, backup/restore readiness, and no-PHI review evidence.

## Pilot Smoke

`scripts/simulate-pilot-launch-smoke.js` and Playwright runtime tests provide synthetic smoke evidence. The smoke proves route and workflow posture only; it does not prove real tenant onboarding, live PHI processing, live vendor availability, production reliability, or production launch readiness.

Production launch remains blocked: `productionLaunchReady=false`.

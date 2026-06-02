# Commercial Readiness Definition Of Done

## Overall definition

AURA Note may be described as commercial-readiness-review-ready only after `WO-075` is complete, all required gates pass, and `CHECKPOINT_REPORT.md` records CR-4 evidence. It still must not be called production-launch-ready unless a later founder-approved launch work order explicitly changes the launch posture.

Implementation status as of `WO-075`: CR-4 evidence is packaged for review through `docs/COMMERCIAL_READINESS_REVIEW_PACKET.md`, `/support/commercial-readiness`, and the `pnpm commercial:readiness` gate. Production launch remains false.

## Required evidence by area

| Area | Required evidence before CR-4 |
| --- | --- |
| Runtime persistence | Core workflow services use repository ports; production-intended local runtime persists through Prisma/PostgreSQL; in-memory is demo/test only. |
| Tenant isolation | API, repository, and RLS or equivalent database evidence covers tenant-owned persisted tables. |
| API boundary | Global validation, standard envelopes, redacted errors/logs, request/trace IDs, request limits, and fail-closed auth context. |
| Identity | Synthetic headers work only in explicit local/demo mode; production/preview fails closed without configured auth adapters. |
| Frontend runtime | Production-intended routes use typed API clients and backend state; local React state is transient or demo/story-only. |
| UX states | Loading, empty, ready, saving, failed, permission-denied, read-only, and relevant blocked/degraded/disabled states are API-backed or documented mocks. |
| Standalone mode | End-to-end standalone daily workflow works without ClinicOS. |
| ClinicOS mode | Adapter boundaries exist; ClinicOS cannot bypass AURA Note permissions, audit, PHI policy, tenant/site scope, or human review. |
| Transcription | Browser/device/permission/exception states, mock provider, retention metadata, correction history, and disabled live provider boundary. |
| EHR | Athenahealth-first sandbox-shaped adapter and vendor-neutral boundary with human approval, retry, dead-letter, reconciliation, and disabled credentials. |
| AI governance | Prompt/model/eval scaffolds, PHI scrub/rejection, output validation, source evidence, human-review gates, and live model disabled posture. |
| Billing | Candidate-only coding/billing support, draft claim preview with `submittedClaim=false`, no autonomous charge/claim behavior. |
| Security/privacy | Threat model, privacy/HIPAA-readiness checklist without certification claims, PHI redaction, minimum necessary, support restrictions, role-denial tests. |
| Operations | Support runbooks, status surfaces, incident taxonomy, observability placeholders, rollback and degraded-mode evidence. |
| Figma handoff | Complete screen/component/state/workflow/role/data/copy inventory and basic UI scaffold. |
| Beta package | Synthetic pilot smoke, onboarding/training/support/rollback/checklist/metrics package. |

## Work-order completion rule

A CR work order is done only when:

- behavior traces to `AGENTS.md`, locked decisions, canonical specs, active work order, API/event/data/RBAC contracts, or tests;
- no product policy is invented silently;
- every state-changing action is tenant/site scoped, permission checked, audit/event emitting, and idempotent where repeated submission is plausible;
- relevant positive and negative tests pass;
- public contracts/docs are updated when behavior changes;
- standalone mode remains usable;
- ClinicOS mode remains adapter-bound and fail-safe;
- AI output remains draft/candidate/suggestion-only;
- no raw PHI leaves governed local/safe paths;
- no live credential, vendor, PHI, claim, or launch behavior is enabled without a future approved work order;
- `RUN_LOG.md`, `repo_status.json`, `SPEC_GAPS.md`, and checkpoint evidence are updated.

## Launch claim rule

`commercial-readiness-review-ready` does not mean `production-launch-ready`. Production launch requires explicit founder approval plus evidence for live environments, credentials, legal/compliance/privacy/security review, backup/restore, support/on-call ownership, vendor contracts, incident response, and final go/no-go.

# WO-070 — AI Governance Runtime Boundary And Evaluation Harness Expansion

## Objective

Expand the AI governance runtime boundary and evaluation harness so future private/BAA model use can be reviewed safely while live external AI remains disabled.

## Why This Work Order Exists

Commercial AI use needs prompt/model governance, deterministic evaluations, source evidence, human-review gates, PHI rejection/redaction evidence, unsafe-output rejection, drift placeholders, and clear no-live-model boundaries. Existing AI scaffolding is useful, but CR-3 needs runtime evidence that AI outputs remain draft/candidate-only and cannot finalize clinical, coding, billing, medical-necessity, payer, order, or patient-financial decisions.

## Prerequisites

- `WO-069` EHR sandbox runtime boundary complete.
- Current `packages/ai-gateway`, AI governance API/browser route, RBAC/ABAC matrix, event contracts, and AI/PHI governance docs.
- Current `docs/BACKEND_BUILD_SPEC.md`, `docs/API_EVENT_CONTRACTS.md`, `docs/DATA_MODEL.md`, `docs/RBAC_ABAC_MATRIX.md`, `docs/AI_PHI_GOVERNANCE.md`, and `docs/STANDALONE_AND_CLINICOS_MODES.md`.

## In Scope

- Prompt registry and model/provider configuration metadata expansion.
- Deterministic evaluation cases for unsupported diagnosis, code finalization, charge finalization, claim submission, medical-necessity determination, order placement, patient-facing financial conclusions, unsafe coaching, and unsupported payer language.
- Source-evidence, source-freshness, confidence, risk-label, schema-validation, and human-review metadata.
- PHI rejection/redaction regression coverage proving no raw PHI goes to external AI.
- Browser-visible AI governance states for disabled, configured, degraded, failed, source-stale, scrubbed, PHI-rejected, output-validation-failed, unsafe-output-rejected, human-review-required, permission-denied, read-only, loading, empty, ready, and demo fixture states.
- `pnpm ai:runtime-governance-readiness`.

## Out Of Scope

- Live model calls.
- Live credentials.
- Production prompt store.
- Private/BAA model pathway approval.
- Raw PHI transfer to external AI.
- Autonomous diagnosis, code, charge, claim, medical-necessity, order, patient-facing financial, or billing finalization behavior.

## UX Requirements

- `/aura-note/ai-governance` must show runtime-boundary evidence for prompt/model/evaluation/source/scrub/output-validation/human-review states.
- Unsafe or prohibited outputs must display as rejected and human-review-required, not as actionable final guidance.
- Support users must see operational metadata only.
- The route must keep clear disabled-live-model and no-raw-PHI-to-external-AI posture.

## Backend/API Requirements

- AI requests must remain server-side through the AI Gateway boundary.
- Runtime actions must be tenant/site scoped, permission checked, purpose-of-use checked, PHI guarded, audit logged, and event emitting.
- Evaluation runs must be deterministic and synthetic.
- Output validation must reject unsupported final determinations and raw-PHI-bearing payloads.
- Live provider invocation must fail closed unless a later approved work order supplies private/BAA pathway decisions and credentials.

## Data Model/Persistence Requirements

- Represent prompt version, model configuration, evaluation run, context package metadata, source-evidence references, PHI scrub decision, output validation, human review, override, drift placeholder, and incident metadata consistently with existing DTO/event/data-model docs.
- Do not persist raw prompt text, raw note text, raw transcript text, raw EHR/ClinicOS payloads, real model responses, credentials, private keys, production URLs, or real PHI.

## Event/Audit Requirements

- Record prompt/model review, context package creation, PHI scrubbed/rejected, request denied, output validated/rejected, human review required, evaluation run completed, regression blocked, and incident metadata.
- Event payloads must be audit-safe metadata only and must not include raw PHI, raw prompts, raw model responses, final clinical/coding/billing decisions, medical-necessity determinations, claim submissions, or patient financial conclusions.

## RBAC/ABAC Requirements

- AI governance evaluation/configuration metadata remains limited to compliance/privacy leads and authorized admins unless existing permissions allow narrower clinician-linked view.
- Clinicians may request permitted draft/candidate support only when linked to the visit and the output remains human-review-required.
- Billing staff may view billing-review AI metadata only where existing billing-review permissions allow it; no broad transcript or coaching access is added.
- Support users remain operational metadata only.
- ClinicOS-integrated mode cannot bypass AURA Note AI Gateway policy or permissions.

## Standalone-Mode Behavior

- Standalone mode uses deterministic local/mock AI evidence only.
- Disabled live model state must not block non-AI documentation, finalization, export, or draft claim preview workflows.

## ClinicOS-Integrated Behavior

- Future M23 Copilot Runtime and M24 AI Governance delegation remains adapter-bound.
- ClinicOS cannot bypass AURA Note PHI scrubber, purpose-of-use checks, source freshness checks, output validation, human-review gates, role limits, or audit/event requirements.

## AI/PHI/Security Requirements

- No raw PHI may be sent to external AI.
- Live model calls remain disabled.
- All AI outputs remain draft/candidate/suggestion-only and source-linked where applicable.
- Unsafe outputs must be rejected before user-facing adoption.
- Logs remain redacted and request/trace correlated.

## Testing Requirements

- Unit tests for prompt/model governance metadata, PHI rejection/redaction, output schema validation, unsafe-output rejection, source/confidence requirements, and disabled live-provider fail-closed behavior.
- API/e2e tests for evaluation runs, output validation, role denial, cross-tenant denial, source-stale behavior, and no-live-model/no-raw-PHI evidence.
- Browser tests for the AI governance route states listed above.
- Regression tests proving no autonomous diagnosis, final code/charge behavior, medical-necessity determination, claim submission, order placement, or patient-facing financial conclusion can be accepted.

## Required Scripts/Gates

- `pnpm ai:runtime-governance-readiness`
- `pnpm ai:governance-readiness`
- `pnpm mode:adapter-readiness`
- Default local gate applicable to touched files.
- `pnpm production:readiness`
- `node scripts/status.js`

## Definition Of Done

- AI governance runtime is production-shaped, deterministic, adapter-mediated, permission-checked, source-linked, PHI guarded, human-review-gated, and safely disabled/mockable.
- Prompt/model/eval/output-validation contracts, docs, tests, status, and run-log evidence are updated.
- No live AI credential, raw PHI transfer to external AI, live model call, production prompt store, autonomous clinical/coding/billing behavior, medical-necessity determination, charge finalization, claim submission, or production launch behavior is introduced.

## Stop Conditions

- Private/BAA model selection, live credential source, production prompt store, tenant AI policy, live monitoring, or legal/privacy approval is required.
- Any AI path would allow final diagnosis, final code, charge finalization, claim submission, medical-necessity determination, order placement, patient-facing financial conclusion, or bypass of human review.
- Three focused repair attempts fail.

## Risks And Deferred Decisions

- Private/BAA model pathway, model/vendor selection, evaluation thresholds, drift response ownership, live-monitoring posture, tenant policy, and legal/privacy/security approval remain deferred.

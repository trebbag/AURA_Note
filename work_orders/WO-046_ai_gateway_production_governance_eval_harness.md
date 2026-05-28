# WO-046 — AI Gateway Production Governance And Evaluation Harness

## Objective

Harden the AURA Note AI Gateway for production-review readiness by adding prompt/model governance records, deterministic evaluation harnesses, stricter PHI/de-identification evidence, source-linked output validation, and human-review gates while keeping live external AI disabled.

## Why this exists

P9 cannot be complete until AI behavior is governed beyond mock invocation. AURA Note may draft, summarize, suggest, score confidence, and route work for human review, but it must not send raw PHI to external AI or autonomously finalize clinical, coding, billing, medical-necessity, charge, or claim decisions.

## Prerequisites

- `WO-044` EHR sandbox/writeback hardening is complete.
- `WO-045` ClinicOS integration hardening is complete.
- Existing AI Gateway mock-only PHI boundary tests remain passing.
- No private/BAA model credential, production prompt registry, live model endpoint, or production PHI sample is required.

## In Scope

- Add prompt registry and model configuration metadata records for mock/private-BAA/external-disabled modes.
- Add deterministic local evaluation cases for suggestions, note drafting, patient summary drafting, billing-preview drafting, and coaching feedback where already supported by contracts.
- Harden PHI scrubber/de-identification tests for forbidden keys, obvious PHI-like text, nested payloads, and source-evidence references.
- Add output schema validation and rejection events for unsupported or unsafe AI output shapes.
- Add source-linked evidence metadata, confidence/risk labels, prompt/model version metadata, and human-review-required status to AI responses.
- Add or harden API/browser evidence that external AI remains disabled unless later governance authorizes private/BAA live execution.
- Add `pnpm ai:governance-readiness` or an equivalent named verifier.

## Out of Scope

- Live external AI calls.
- Production model credentials, production prompt stores, production PHI, private keys, `.env` files, or tenant secrets.
- Autonomous diagnosis, code finalization, charge finalization, medical-necessity determination, order placement, claim submission, denial automation, or patient-facing financial conclusions.
- Replacing ClinicOS M23/M24 modules or building the full ClinicOS governance platform in this repo.

## UX Requirements

- Browser-visible AI governance/status surface must show empty, loading, ready, saving, failed, permission-denied, disabled, read-only, evaluation-failed, unsafe-output-rejected, and demo fixture states.
- External AI must be visibly disabled by default.
- Mock/private-BAA/governance statuses must be understandable without exposing prompts containing PHI.
- Human-review-required labels must remain visible for all AI candidate outputs.

## Backend/API Requirements

- Keep AI requests assembled server-side through the AI Gateway.
- Add or harden endpoints/service methods for prompt registry status, model configuration status, evaluation runs, output schema validation, and unsafe output rejection.
- Every state-changing AI governance action must be tenant/site scoped, permission checked, audit logged, event emitting, and idempotent where repeated evaluation or config writes are plausible.
- API responses must not include raw PHI, real prompts with PHI, production credentials, or live model payloads.

## Data Model/Persistence Requirements

- Use existing durable metadata patterns for prompt/model/governance/evaluation records where available, or document safe local in-memory metadata as a bounded follow-on if no table exists.
- Represent prompt version, model mode, model version, policy mode, eval case ID, output type, source evidence IDs, validation status, risk label, human-review status, trace ID, and timestamps.
- Do not persist raw PHI, raw external model prompts, raw model responses, secrets, or production endpoint URLs.

## Event/Audit Requirements

- Emit or harden audit-safe events for AI request prepared, PHI scrubbed/rejected, response recorded, output rejected, prompt/model config changed, and evaluation run completed/failed.
- Event payloads must remain metadata-only and source-linked where applicable.
- No event may contain raw note text, raw transcript text, production chart data, real model output, or patient identifiers.

## RBAC/ABAC Requirements

- Linked treating clinicians may invoke allowed draft/candidate AI actions for their visit only.
- Compliance/privacy leads and authorized admins may view governance/evaluation metadata.
- Support users may view operational AI status only and cannot access prompts, transcripts, final notes, billing details, coaching output, or raw AI payloads.
- Billing staff cannot invoke clinical AI suggestions unless a later approved work order explicitly grants a review-specific path.

## Standalone-Mode Behavior

- Standalone mode uses local governance metadata and deterministic mock AI/evaluation fixtures.
- Standalone workflows remain usable with external AI disabled.
- Candidate outputs remain human-review-required.

## ClinicOS-Integrated Behavior

- ClinicOS-integrated mode may map AI request/governance metadata to M23 Copilot Runtime and M24 AI Governance through adapter boundaries only.
- AURA Note remains authoritative for PHI scrubbing, purpose-of-use, source freshness, role checks, and human-review gates.
- Missing or degraded ClinicOS AI governance delegation fails closed and does not permit live external AI calls.

## AI/PHI/Security Requirements

- Raw PHI must not be sent to external AI.
- External AI remains disabled unless a later work order adds approved private/BAA configuration and governance evidence.
- Output validation must reject unsupported final diagnoses, final codes, charges, claim submission, orders, medical-necessity conclusions, or patient-facing revenue conclusions.
- Logs and evaluation evidence must be PHI-safe and trace correlated.

## Testing Requirements

- Unit/API tests for prompt/model metadata, eval harness execution, PHI rejection/redaction, source-linked evidence, output schema validation, unsafe output rejection, human-review-required labels, role denial, and cross-tenant denial.
- Contract/OpenAPI/event tests for any new DTO, operation, or event.
- Browser tests for AI governance/status route states.
- Readiness script coverage proving no live model credential, no raw PHI, no prohibited autonomous behavior, docs/status/run-log evidence, and external AI disabled by default.

## Required Scripts/Gates

- Add `pnpm ai:governance-readiness` or an equivalent named verifier.
- Run the standard local gate:
  - `pnpm install --frozen-lockfile`
  - `pnpm db:client:generate`
  - `pnpm lint`
  - `pnpm lint:phi`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm test:e2e`
  - `pnpm test:browser`
  - `pnpm build`
  - all persistence/storage/retention/identity/config/observability/EHR/ClinicOS/readiness scripts
  - `pnpm production:readiness`
  - `pnpm acceptance:readiness`
  - `node scripts/status.js`
  - `git diff --check`

## Definition of Done

- AI Gateway governance hardening is browser/API-testable with synthetic data.
- Prompt/model/evaluation metadata, source-linked evidence, output validation, rejection, audit/event, idempotency, role-denial, and cross-tenant evidence exists.
- External AI remains disabled by default and no live model/provider credential is required.
- All AI outputs remain draft/candidate/suggestion-only and human-review-required.
- `RUN_LOG.md`, `repo_status.json`, relevant docs, scripts, tests, and work-order status are updated.

## Stop Conditions

- Live model credentials, production prompt store access, production PHI, or vendor private/BAA terms are required.
- A safety, clinical, billing, or privacy policy decision is ambiguous and would require guessing.
- Required AI behavior conflicts with no-raw-PHI, human-review, or no-autonomous-finalization boundaries.
- Three focused repair attempts fail to resolve a build, test, migration, or runtime blocker.

## Risks And Deferred Decisions

- Private/BAA model selection, tenant-specific model policy, legal/security/vendor approval, model monitoring ownership, evaluation thresholds, drift response, and live ClinicOS M23/M24 integration remain deferred until founder/security/privacy review.

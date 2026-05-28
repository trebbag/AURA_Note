# WO-057 — External AI Private/BAA Pathway Review Intake

## Objective

Promote external AI private/BAA pathway review into a planning/control decision package without enabling live AI credentials, raw PHI transfer to external AI, live model calls, production prompt stores, autonomous finalization, or production launch behavior.

## Why This Work Order Exists

`WO-046` established synthetic/local AI Gateway governance evidence. Commercial AI use requires explicit provider, BAA/private-path, credential, prompt registry, model configuration, PHI scrub/de-identification, source freshness, output validation, evaluation, human-review, role-boundary, observability, audit, and incident-response decisions before any live model path is enabled.

## Prerequisites

- `WO-056` complete and merged.
- P11 remains the current checkpoint.
- No active `SPEC_GAP` blocks planning/control work.
- Existing AI Gateway, security, PHI, post-P11, and production readiness scripts remain green.

## In Scope

- Add a production AI private/BAA pathway review document.
- Capture required future decisions, acceptance criteria, event/audit inventory, standalone requirements, and ClinicOS-integrated requirements.
- Add a readiness verifier proving the tranche remains planning/control only.
- Update `repo_status.json`, `work_orders/README.md`, `docs/PRODUCTION_BUILD_PLAN.md`, `docs/POST_P11_CONTINUATION_PLAN.md`, `docs/POST_CP4_PRODUCTIONIZATION_BACKLOG.md`, `SPEC_GAPS.md`, `CHECKPOINT_REPORT.md`, `RUN_LOG.md`, `package.json`, and CI.

## Out Of Scope

- Provider selection or contracting approval.
- Live AI credentials, tokens, private endpoints, secret-manager integration, or `.env` files.
- Raw PHI transfer to any external AI path.
- Live model SDK/API calls.
- Production prompt registry implementation.
- Production model evaluation execution beyond synthetic/local evidence.
- PHI-bearing support AI content access.
- Runtime AI behavior, schema changes, migrations, autonomous clinical/coding/billing behavior, or launch approval.

## UX Requirements

No new product route is required. Future operational UX must expose provider disabled/configured/degraded/failed states, prompt/model version states, source freshness states, PHI scrub/rejection states, output validation failed states, unsafe-output rejection states, evaluation-blocked release states, human-review-required states, permission-denied states, and read-only audit states before launch readiness.

## Backend/API Requirements

No new endpoint is required. Future AI operations must be tenant/site scoped, permission checked, purpose-of-use checked, server mediated, AI Gateway enforced, PHI scrubber enforced, source-freshness checked, schema validated, audit/event emitting, fail closed when credentials/purpose/context are missing, and tested for wrong-tenant, wrong-role, stale-source, missing-purpose, unsafe-output, schema-invalid, no-raw-PHI-leakage, and no-autonomous-finalization cases.

## Data Model/Persistence Requirements

No schema change is required for this planning tranche. Future implementation must define provider configuration metadata, credential reference metadata, prompt registry records, prompt version records, model configuration records, context package metadata, PHI scrub decisions, request metadata, output validation records, evaluation run records, human-review records, override records, support-access evidence, and incident records.

## Event/Audit Requirements

Inventory future AI governance events including provider config reviewed, credential configured/disabled, prompt approved/published/rolled back, model config approved, context package created, PHI scrubbed/rejected, request authorized/denied, provider request sent/failed, output schema validated/rejected, suggestion created, human review recorded, override recorded, evaluation run completed, regression blocked release, and AI incident recorded.

## RBAC/ABAC Requirements

Preserve existing role boundaries. Future implementation must require clinician/authorized delegate controls for clinical suggestion review, billing controls for billing-review candidates, compliance/privacy controls for governance review, authorized-admin or AI-governance controls for prompt/model/provider configuration, and support-scope limits for operational metadata. It must deny ordinary MAs, unscoped support users, wrong-tenant users, wrong-site users, and users without purpose-of-use.

## Standalone-Mode Behavior

Standalone mode remains mock/local for live AI until a future approved implementation work order enables a governed provider path. AURA Note remains the source of tenant/site AI policy, prompt registry, model configuration, source freshness, PHI policy, human-review gates, audit, evaluation evidence, and support controls.

## ClinicOS-Integrated Behavior

ClinicOS-integrated mode may provide source context and receive AI governance status through adapters. ClinicOS must not bypass AURA Note AI Gateway policy, PHI scrubber, tenant/site scoping, role checks, purpose-of-use checks, human-review gates, evaluation thresholds, audit evidence, or support-access limits.

## AI/PHI/Security Requirements

Use synthetic data only. Do not introduce real PHI, credentials, tokens, production URLs, `.env` files, private keys, live model calls, raw PHI transfer to external AI, production prompt stores, production AI output persistence beyond existing synthetic evidence, autonomous diagnosis/coding/billing/finalization behavior, medical-necessity determination, claim submission, or launch approval.

## Testing Requirements

- Add `pnpm ai:live-review-readiness`.
- Preserve and run AI Gateway, security, post-P11, production, acceptance, status, and whitespace gates.
- The readiness verifier must fail if the repo claims live AI credentials, raw-PHI-to-external-AI, live model calls, production prompt stores, autonomous finalization, support AI PHI content access, or production launch approval.

## Required Scripts/Gates

- `pnpm ai:live-review-readiness`
- `pnpm post-p11:readiness`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

## Definition Of Done

- Review document exists and names required production AI decisions.
- `WO-057` is indexed and marked done.
- `next_work_order` remains `null`.
- Readiness scripts pass locally and in CI.
- `SPEC_GAPS.md`, `RUN_LOG.md`, and `CHECKPOINT_REPORT.md` record the planning/control evidence.
- No live AI credential, raw-PHI-to-external-AI path, live model call, production prompt store, support AI PHI content access, autonomous finalization, runtime AI behavior, or launch behavior is authorized.

## Stop Conditions

Stop if implementation requires provider selection, BAA/private-path approval, live credentials, raw PHI transfer, live SDK/API execution, prompt registry implementation, production model evaluation, support AI content access policy, autonomous finalization policy, or production launch approval.

## Risks And Deferred Decisions

Provider selection, private/BAA deployment path, region, credential source, prompt registry ownership, model configuration approval, PHI scrub/de-identification policy, source freshness rules, evaluation thresholds, monitoring, drift response, incident response, support visibility, and operational ownership remain deferred.

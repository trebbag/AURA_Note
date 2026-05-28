# Production AI Private/BAA Pathway Review

## Purpose

This document captures the production decisions required before AURA Note can use any live external or private/BAA model pathway for PHI-adjacent clinical documentation, coding-support, quality, compliance, patient-summary, coaching, or payer-readable support workflows.

This is a planning/control artifact only. It does not select an AI provider, introduce credentials, enable live model calls, create a production prompt store, send raw PHI to external AI, approve autonomous diagnosis/coding/billing/finalization, or approve production launch.

## Current Safe Posture

- `WO-046` provides synthetic/local AI Gateway governance evidence: prompt/model metadata, deterministic evaluation cases, output validation, unsafe-output rejection, human-review-required labels, and no-live-model/no-raw-PHI evidence.
- Existing AI behavior remains mock/local and draft/candidate/suggestion-only unless a later approved implementation work order enables a governed live path.
- External AI remains disabled by default.
- Client components must not call AI providers directly.
- No AI path may independently diagnose, finalize codes, finalize charges, determine medical necessity, submit claims, deny care, or create patient-facing financial conclusions.

## Required Production Decisions

### Provider and deployment posture

- Select the provider, model family, deployment region, private deployment posture, BAA status, and allowed workloads.
- Define whether PHI may be processed by the provider and whether de-identification or transformation is required first.
- Define prohibited workloads, including autonomous clinical, coding, billing, claim, medical-necessity, order, care-denial, or patient-financial finalization.

### Credential source and model access

- Select the credential source, such as managed identity, secret manager, tenant-scoped credential reference, or private endpoint identity.
- Prohibit committed credentials, `.env` secrets, browser-side model keys, plaintext token logging, and direct client-to-model calls.
- Define credential rotation, disabled credential handling, rate limits, quota controls, and incident escalation.

### Prompt registry and model configuration

- Define the production prompt registry owner, approval workflow, versioning model, rollback policy, and emergency disable path.
- Define model configuration records, temperature/top-p settings, output types, schema versions, and tenant-specific policy overrides.
- Define how prompts are tied to source documents, rules catalog versions, templates, and evaluation thresholds.

### PHI scrubbing and de-identification

- Define the PHI scrubber/de-identification policy for every AI-bound context package.
- Define when PHI is rejected, transformed, minimized, or allowed only under a BAA/private path.
- Define tests proving raw PHI is not sent to external AI unless a future approved policy explicitly permits a governed private/BAA pathway.

### Source freshness and evidence packaging

- Define source freshness rules for chart context, transcript, note draft, selections, rules catalog, templates, patient summary, and finalization evidence.
- Define how source-linked citations and evidence references must be represented in AI outputs.
- Define stale/degraded/missing-source states before suggestions can be shown.

### Output schema validation and safety filters

- Define required output schemas, unsupported-output rejection rules, unsafe-output filters, confidence/rationale requirements, and escalation behavior.
- Preserve draft/candidate/suggestion-only labels for all AI outputs.
- Define how low-confidence, conflicting, unsupported, or unsafe outputs are routed for human review.

### Evaluation harness and regression thresholds

- Define evaluation datasets, synthetic PHI-safe fixtures, quality thresholds, regression blocking rules, bias/fairness checks, red-team cases, and manual review cadence.
- Define separate thresholds for note drafting, coding support, quality measures, HCC, E/M, compliance, history gaps, patient summaries, payer support language, and coaching.
- Define release criteria for prompt/model changes.

### Human review and role boundaries

- Define which roles can request, view, accept, reject, override, or finalize AI-generated candidates.
- Preserve clinician, billing, compliance/privacy, admin, support, and coaching visibility boundaries.
- Define support visibility as metadata-only unless a future privacy/security review authorizes scoped content access.

### Observability, audit, and governance events

- Define audit events for prompt/model approval, credential use, PHI scrub decisions, AI request creation, output validation, unsafe output rejection, human review, override, evaluation run, and incident response.
- Define redacted logs, trace correlation, and retention windows for AI governance evidence.

## Future Acceptance Criteria

A later implementation work order may enable a governed live AI pathway only when all of the following are true:

- Provider, BAA/private deployment posture, region, and allowed workloads are approved.
- Credential source, rotation, disabled credential handling, rate limits, quota controls, and incident response are approved.
- Prompt registry, model configuration records, versioning, approvals, rollback, and emergency disable controls are implemented.
- PHI scrubber/de-identification policies are approved and tested for every AI-bound context package.
- No raw PHI reaches external AI unless a later approved private/BAA policy explicitly authorizes a governed path.
- Source freshness, source-linked evidence, stale/degraded state behavior, output schemas, unsafe-output rejection, and human-review gates are implemented.
- Evaluation harness thresholds and regression-blocking rules are defined and passing with synthetic PHI-safe fixtures.
- Role-denial, wrong-tenant, missing-purpose, stale-source, unsafe-output, schema-invalid, no-raw-PHI-leakage, and no-autonomous-finalization tests pass locally and in CI.

## Future Event And Audit Inventory

Future implementation must define and test these events before live use:

- `ai.provider_config_reviewed.v1`
- `ai.credential_configured.v1`
- `ai.credential_disabled.v1`
- `ai.prompt_approved.v1`
- `ai.prompt_version_published.v1`
- `ai.prompt_version_rolled_back.v1`
- `ai.model_config_approved.v1`
- `ai.context_package_created.v1`
- `ai.phi_scrubbed.v1`
- `ai.phi_rejected.v1`
- `ai.request_authorized.v1`
- `ai.request_denied.v1`
- `ai.provider_request_sent.v1`
- `ai.provider_request_failed.v1`
- `ai.output_schema_validated.v1`
- `ai.output_rejected.v1`
- `ai.suggestion_created.v1`
- `ai.human_review_recorded.v1`
- `ai.override_recorded.v1`
- `ai.evaluation_run_completed.v1`
- `ai.regression_blocked_release.v1`
- `ai.incident_recorded.v1`

## Standalone Mode Requirements

Standalone mode must use AURA Note tenant/site AI configuration, prompt registry, model configuration, PHI policy, source freshness rules, role permissions, audit events, evaluation evidence, and support-access controls.

## ClinicOS-Integrated Mode Requirements

ClinicOS-integrated mode may receive context and publish AI governance status through adapter boundaries. ClinicOS must not bypass AURA Note AI Gateway policy, PHI scrubber, tenant/site scoping, role checks, purpose-of-use checks, human-review gates, evaluation thresholds, audit evidence, or support-access limits.

## Deferred Until Future Work Order

- AI provider selection and contracting approval.
- Live AI credentials, tokens, private endpoint setup, or secret-manager integration.
- Production prompt registry implementation.
- Live model SDK/API calls.
- Raw PHI transfer to any external AI path.
- Production model evaluation execution beyond synthetic/local evidence.
- PHI-bearing support AI content access.
- Autonomous diagnosis, coding finalization, charge finalization, claim submission, medical-necessity determination, care denial, order placement, or patient financial conclusion.
- Production launch approval.

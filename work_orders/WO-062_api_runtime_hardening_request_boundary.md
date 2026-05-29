# WO-062 — API Runtime Hardening And Request Boundary

## Objective

Harden the NestJS runtime boundary with validation, errors, logging, redaction, security headers, request limits, and consistent response behavior.

## Why This Work Order Exists

A commercial runtime cannot rely on minimal bootstrap behavior, inconsistent endpoint validation, or ad hoc exception handling. `WO-061` established repository-port and local Prisma runtime persistence evidence; `WO-062` makes the request boundary production-shaped while preserving local/demo safety.

## Prerequisites

- `WO-061` complete and merged.
- Current DTO/OpenAPI contracts.
- Existing RBAC/ABAC and PHI helpers.
- Existing synthetic local API and browser tests.

## In Scope

- Global validation pipe for implemented public endpoints.
- Global exception filter with PHI-safe error envelopes.
- Request/trace ID middleware.
- Structured redacted logging.
- Body-size limits.
- CORS/security header posture.
- Rate-limit/throttle scaffold.
- Schema coverage for implemented public endpoints.
- OpenAPI updates as needed.
- Consistent handling for loading, failed, permission-denied, blocked, and read-only route states where API errors drive frontend behavior.

## Out Of Scope

- Raw audio upload transport.
- Live WAF/CDN configuration.
- Production SIEM/APM vendor integration.
- Live identity provider integration.
- Production PHI storage approval.
- Launch approval.

## UX Requirements

- API errors map to clear route states without exposing stack traces, raw PHI, transcript text, final-note text, billing detail, raw audio, tokens, secrets, or EHR payloads.
- Existing browser routes remain usable in explicit local/demo mode.
- Permission-denied and failed states remain browser-testable with synthetic data.

## Backend/API Requirements

- All implemented public endpoints pass through the same request boundary.
- Request validation rejects invalid bodies before service mutation.
- Exceptions return standard AURA Note envelopes or a documented safe exception shape.
- Request ID and trace ID are available to controllers, logs, audit/event payloads, and tests.
- Missing, invalid, or spoofed tenant/site/session/role contexts fail closed where existing helpers support the decision.

## Data Model/Persistence Requirements

- No schema change unless request-boundary evidence needs persisted audit metadata already in scope.
- No production database credential, production PHI persistence, live migration, or support database access is enabled.

## Event/Audit Requirements

- Denied and failed state-changing operations produce audit-safe evidence where required by the active contract.
- Logs and audit metadata remain redacted and trace-correlated.

## RBAC/ABAC Requirements

- Missing/invalid role, tenant, site, purpose, relationship, support, and billing-review contexts fail closed.
- ClinicOS or delegated contexts cannot bypass AURA Note permission checks.
- Support and billing access remains limited by the existing matrix.

## Standalone-Mode Behavior

Standalone local API remains usable with explicit local/demo configuration and synthetic data only.

## ClinicOS-Integrated Behavior

Delegated/ClinicOS contexts remain fail-closed unless configured and still pass AURA Note tenant/site/RBAC/ABAC guards.

## AI/PHI/Security Requirements

- Logs exclude raw PHI, transcript/final-note text, billing detail, raw audio, tokens, secrets, credentials, and EHR payloads.
- No raw PHI is sent to external AI.
- AI output remains draft/candidate/suggestion-only.
- No live vendor credential or production launch posture is introduced.

## Testing Requirements

- Invalid body tests.
- Oversized body tests.
- Missing context tests.
- Cross-tenant request denial tests.
- Forbidden PHI-like payload tests.
- Redacted log tests.
- Standard envelope tests.
- Regression tests proving existing schedule, notes, finalization, export, support, AI, EHR, ClinicOS, coaching, and operations endpoints still pass local/demo gates.

## Required Scripts/Gates

- Add `pnpm api:runtime-hardening-readiness`.
- Run the default local gate.
- Run `pnpm commercial:readiness-plan`.

## Definition Of Done

- API bootstrap is production-shaped.
- All implemented public endpoints validate consistently.
- Negative and redaction tests pass.
- Existing synthetic/local runtime behavior still works.
- `repo_status.json`, `RUN_LOG.md`, docs, contracts, and tests are updated.
- No production PHI, live credential, live vendor behavior, claim submission, autonomous clinical/coding/billing behavior, or production launch claim is introduced.

## Stop Conditions

- Security policy ambiguity about accepted payload size, CORS origins, or production auth requirements blocks safe defaulting.
- Live IdP, WAF/CDN, SIEM/APM, production PHI, or production credential access is required.
- Three focused repair attempts fail.

## Risks And Deferred Decisions

- Production WAF, gateway, observability vendor, production auth, and environment-specific CORS policies remain deferred.

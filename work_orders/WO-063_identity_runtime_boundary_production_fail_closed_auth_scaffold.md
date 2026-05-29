# WO-063 — Identity Runtime Boundary And Production Fail-Closed Auth Scaffold

## Objective

Prevent local synthetic header identity from becoming accidental production authentication and add a production-shaped identity boundary that fails closed outside explicit local/demo modes.

## Why This Work Order Exists

`WO-062` hardened the generic API request boundary, but local synthetic headers are still the dominant identity mechanism for development and tests. Commercial-readiness work needs an explicit identity adapter boundary before any preview, staging, ClinicOS delegation, OIDC, SAML, or production identity path can be considered.

## Prerequisites

- `WO-062` complete and merged.
- Existing RBAC/ABAC helpers in `packages/security`.
- Existing platform identity/config DTOs and API surfaces from `WO-041`.
- Current API runtime boundary and e2e tests.

## In Scope

- Identity adapter interface for local synthetic, local demo, disabled production OIDC, disabled production SAML, and disabled ClinicOS delegated modes.
- Fail-closed API auth guard or equivalent boundary that rejects synthetic role/tenant/user headers outside explicit local/demo mode.
- Explicit `AURA_NOTE_AUTH_MODE` / demo-mode posture validation.
- Purpose-of-use, session expiration, disabled-user, delegated-identity-not-configured, and missing-identity states.
- Tenant/site/user/role context normalization for implemented public endpoints.
- Frontend/client labeling of local synthetic/demo headers where applicable.
- Tests proving local synthetic mode works only when explicitly configured and production/preview modes fail closed without a configured adapter.

## Out Of Scope

- Live OIDC/SAML credentials.
- Production IdP setup, MFA, SCIM, account recovery, or real directory sync.
- Live ClinicOS delegated identity.
- Runtime break-glass access.
- Production PHI access approval.
- Production launch approval.

## UX Requirements

- API-backed routes and shells must be able to show permission-denied, expired-session, disabled-user, missing-purpose, delegated-denied, read-only, and degraded states from API responses.
- Local/demo mode must remain visibly labeled so synthetic identity is not confused with production authentication.
- No screen may imply production SSO, ClinicOS identity delegation, or launch readiness.

## Backend/API Requirements

- Implement a shared identity runtime boundary that runs after the generic request boundary and before service mutation.
- Synthetic role/tenant/user/session headers are accepted only for explicit local synthetic/demo auth posture.
- Preview/production auth posture fails closed unless a configured OIDC, SAML, or ClinicOS delegated adapter exists.
- Invalid, missing, expired, disabled, wrong-tenant, wrong-site, wrong-purpose, and delegated-not-configured contexts return PHI-safe error envelopes.
- Existing endpoint service contexts continue to receive normalized request ID, trace ID, tenant, site, role, user, session, purpose-of-use, and relationship attributes.

## Data Model/Persistence Requirements

- Reuse existing synthetic platform identity/config DTOs where possible.
- Add persistence only if the scaffold requires local synthetic session/user metadata evidence.
- Do not add production identity stores, token persistence, raw token payloads, or production credentials.

## Event/Audit Requirements

- Identity accepted, denied, expired, disabled-user, missing-purpose, wrong-tenant/site, and delegated-denied decisions must produce audit-safe metadata where state-changing operations are attempted.
- Event/audit metadata must include request ID, trace ID, tenant/site context where available, adapter mode, failure reason, and `liveCredentialPresent=false`.
- No raw tokens, secrets, SAML assertions, OIDC claims payloads, or PHI-bearing identity evidence may be logged or emitted.

## RBAC/ABAC Requirements

- Arbitrary client headers cannot spoof role, tenant, site, user, purpose, relationship, support, billing-review, or authorized-admin state outside local/demo mode.
- Support, billing, transcript, final-note, coaching, audit/export, EHR/writeback, ClinicOS, AI governance, storage/download, and claim-boundary permissions remain enforced by AURA Note.
- ClinicOS-integrated mode cannot bypass AURA Note permissions through delegated identity metadata.

## Standalone-Mode Behavior

Standalone local synthetic identity remains available for development and tests only when explicitly configured. Production standalone identity remains disabled/fail-closed until a later approved IdP work order supplies live configuration and governance.

## ClinicOS-Integrated Behavior

ClinicOS delegated identity is represented as an adapter boundary but remains disabled/fail-closed until configured by a later approved work order. ClinicOS identity metadata cannot bypass tenant/site, RBAC/ABAC, purpose-of-use, or PHI controls.

## AI/PHI/Security Requirements

- No raw tokens, secrets, credentials, PHI-bearing identity payloads, or production identity claims are committed, logged, returned, or emitted.
- External AI remains disabled by default and no raw PHI is sent to external AI.
- AI, coding, billing, patient-summary, payer-support, and coaching outputs remain draft/candidate/human-review-required.
- No autonomous diagnosis, code finalization, charge finalization, medical-necessity determination, claim submission, denial automation, payment posting, or patient-facing financial conclusion is introduced.

## Testing Requirements

- Local synthetic mode accepted when explicitly configured.
- Synthetic headers rejected in preview/production mode without configured auth adapter.
- Missing role/user/session/purpose failures return standard PHI-safe envelopes.
- Disabled user denied.
- Expired session denied.
- Wrong tenant/site denied.
- Delegated ClinicOS/OIDC/SAML identity denied until configured.
- Support PHI access remains denied.
- Billing transcript access remains limited to triggered billing review.
- Existing API e2e suites continue to pass through the identity boundary.

## Required Scripts/Gates

- Add `pnpm identity:runtime-boundary-readiness`.
- Run the default local gate.
- Run `pnpm api:runtime-hardening-readiness`.
- Run `pnpm commercial:readiness-plan`.

## Definition Of Done

- Identity runtime boundary is implemented and shared across public API endpoints.
- Local synthetic/demo auth is explicit and test-labeled.
- Preview/production modes fail closed without configured auth adapters.
- Negative identity, delegated, disabled-user, expired-session, purpose, tenant/site, support, and billing tests pass.
- Contracts/docs/status/run-log are updated.
- `repo_status.json` marks `WO-063` done only after tests and evidence pass.
- CR-1 checkpoint report is updated after `WO-063` because `WO-061` through `WO-063` define CR-1.
- No production identity provider, production credential, live ClinicOS delegation, production PHI access, claim submission, autonomous clinical/coding/billing behavior, or production launch claim is introduced.

## Stop Conditions

- Production IdP credential, live OIDC/SAML setup, live ClinicOS delegated identity, token signing material, or production PHI access is required.
- Identity policy ambiguity affects PHI, clinical, billing, support, or high-impact financial access.
- Three focused repair attempts fail.

## Risks And Deferred Decisions

- Production IdP selection, MFA posture, SCIM/directory sync, account recovery, access-review ownership, ClinicOS delegated identity contract, break-glass policy, token/session lifetime, and launch identity approval remain deferred until later founder/security/privacy review.

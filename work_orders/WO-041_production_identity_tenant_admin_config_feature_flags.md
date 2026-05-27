# WO-041 — Production Identity, Tenant Administration, Secrets, Configuration, And Feature Flags

## Objective

Implement the P8 production platform identity and configuration tranche: production-shaped identity adapter boundaries, tenant/site/user/role administration, session and disabled-user handling, purpose-of-use enforcement, typed secrets/config validation, and governed feature flags.

## Why this exists

The repo has strong synthetic/local identity and permission scaffolding, but commercial production readiness requires fail-closed identity, administration, configuration, and feature-flag controls. Header/local identity must not be mistaken for production SSO or ClinicOS delegation.

## Prerequisites

- `WO-040` is complete and P8.5 audio/transcription candidate evidence is recorded.
- P7 durable runtime evidence remains intact.
- No active `SPEC_GAP` blocks production-shaped identity adapter boundaries, tenant administration, session handling, purpose-of-use, config validation, or feature-flag governance.

## In scope

- OIDC/SAML/ClinicOS delegated identity adapter interfaces with safe local/mock implementations.
- Session expiration, disabled-user, missing-purpose, and spoofed-tenant denial behavior.
- Tenant, site, user, role, and purpose-of-use administration surfaces in browser/API-testable synthetic form.
- Typed configuration validation for local/staging/production-shaped environments.
- Secret-source placeholders that never commit or echo secret values.
- Feature-flag governance for high-risk capabilities such as live transcription, external AI, writeback, production storage, retention deletion, revenue estimates, and claim/payer behavior.
- Audit/event evidence for identity, session, administration, configuration, and flag changes.

## Out of scope

- Real IdP credentials or live SSO onboarding.
- Production account recovery operations.
- Live ClinicOS delegated identity.
- Production PHI storage approval.
- Live transcription providers.
- Live EHR writeback.
- External AI provider enablement.
- Medical-necessity determination, charge finalization, claim submission, or patient-facing financial conclusions.

## UX requirements

- Add or extend admin/settings surfaces so authorized admins can inspect synthetic tenant/site/user/role/session/config/feature-flag states.
- Expose empty, loading, ready, saving, blocked, failed, permission-denied, disabled-user, expired-session, unsafe-config, and demo fixture states where relevant.
- Disabled users, expired sessions, missing purpose-of-use, and insufficient role paths must produce visible denial states without exposing sensitive data.
- Feature flags for high-risk capabilities must display disabled/default-safe state and required approval evidence.

## Backend/API requirements

- Add identity/session/admin/config/feature-flag DTOs and API routes only where backed by synthetic service behavior and tests.
- Identity middleware or service harness must fail closed for disabled users, expired sessions, missing purpose-of-use, wrong tenant/site, and unsupported delegated identity.
- Admin operations must be tenant/site scoped, permission checked, validated, audited, and idempotent where duplicate updates are plausible.
- Config validation must distinguish local development, staging-like, and production-shaped settings without requiring real credentials.
- Secret placeholders must validate presence/source metadata without logging or returning secret values.

## Data model/persistence requirements

- Use existing durable runtime/config/feature-flag records where available.
- Add or extend local synthetic persistence evidence only when needed for tenant/site/user/session/config/flag records.
- Tenant-owned persisted records must enforce tenant/site scope and have RLS or documented local evidence consistent with the P7 pattern.
- No `.env`, private key, production connection string, credential, real user, or real patient data may be committed.

## Event/audit requirements

- Emit audit/domain evidence for identity adapter status checks, login/session decisions, session expiration, disabled-user denial, tenant/site/user/role administration, purpose-of-use enforcement, config validation, secret-source validation, and feature-flag changes.
- Event payloads must be audit-safe metadata and must not include secrets, tokens, raw PHI, or private identifiers.

## RBAC/ABAC requirements

- Authorized admins can manage tenant/site/user/role/config/flag synthetic records.
- Clinic managers may view limited site/user settings only where the existing RBAC matrix allows.
- Clinicians, MAs, billing staff, support users, and ordinary admins must not gain unauthorized access to transcripts, final notes, billing details, coaching outputs, or high-risk flag changes.
- Purpose-of-use must be enforced for chart/transcript/final-note-sensitive surfaces.

## Standalone-mode behavior

- Standalone mode owns tenant/site/user/session/config/feature-flag administration through AURA Note APIs and UI.
- Local development may use a safe dev identity adapter, but production-shaped posture must make real IdP configuration explicit before live use.

## ClinicOS-integrated behavior

- ClinicOS delegated identity maps through an adapter and cannot bypass AURA Note tenant/site/user/role/purpose checks.
- Missing, disabled, or unsupported ClinicOS identity state must fail closed with safe degraded status.
- ClinicOS mode must not hard-code AURA Note as embedded-only; standalone behavior remains intact.

## AI/PHI/security requirements

- No raw PHI is sent to external AI.
- Secrets, tokens, private keys, production URLs, and credentials must never be logged, returned in API responses, committed, or used in tests.
- High-risk flags for external AI, live transcription, production storage, destructive deletion, EHR writeback, and claim/payer behavior must default disabled and require explicit approval evidence.
- Logs must be redacted and request/trace correlated.

## Testing requirements

- Unit and API tests for disabled user, expired session, missing purpose-of-use, spoofed tenant/site, unsupported delegated identity, and unauthorized admin operations.
- Config validation tests for safe local, staging-like, production-shaped missing-secret, and unsafe-flag combinations.
- Security tests proving secrets are redacted and high-risk flags fail closed.
- Browser tests for admin/settings identity/config/feature-flag states and permission denial.
- Readiness tests proving no real credential, `.env`, production URL, private key, real user, real patient, or PHI-bearing fixture is committed.

## Required scripts/gates

- Add `pnpm identity:production-readiness` or equivalent.
- Add `pnpm config:production-readiness` or equivalent.
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
  - all applicable persistence/storage/retention/readiness scripts
  - `pnpm standalone:patient-schedule-readiness`
  - `pnpm standalone:operations-readiness`
  - `pnpm audio:transcription-readiness`
  - new identity/config readiness scripts
  - `pnpm production:readiness`
  - `pnpm acceptance:readiness`
  - `node scripts/status.js`
  - `git diff --check`

## Definition of Done

- Production-shaped identity/config/feature-flag boundary is ready for security review using synthetic/local evidence.
- Disabled-user, expired-session, missing-purpose, spoofed-tenant/site, and unauthorized-admin paths fail closed.
- Tenant/site/user/role administration is browser/API-testable with synthetic data.
- High-risk flags default disabled and require approval evidence.
- Secrets/config validation is typed, fail-closed, redacted, and covered by tests.
- Standalone and ClinicOS-integrated identity modes are both represented without bypassing AURA Note permissions.
- `RUN_LOG.md`, `repo_status.json`, relevant docs, scripts, tests, and work-order status are updated.

## Stop conditions

- Real IdP credentials, production secret stores, production ClinicOS delegation, live PHI identity linkage, or production account recovery policy is required.
- Missing or contradictory policy for production MFA, account recovery, disabled-user handling, purpose-of-use, tenant administration ownership, or high-risk feature-flag approval blocks safe implementation.
- Any implementation would expose secrets, tokens, raw PHI, transcripts, billing data, coaching outputs, final notes, autonomous clinical/coding/billing behavior, charge finalization, or claim submission without explicit authorization.

## Risks and deferred decisions

- IdP vendor selection, MFA requirements, account recovery operations, access-review cadence, live ClinicOS delegation contracts, production secret manager selection, and production high-risk feature approval governance remain deferred until founder/security review.

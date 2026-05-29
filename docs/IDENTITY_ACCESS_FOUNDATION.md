# Identity and access foundation

## Status

`WO-016` establishes a local synthetic tenant identity and access boundary. It is a development/test scaffold, not production SSO.

The implementation keeps all existing RBAC/ABAC rules intact while replacing duplicated request-context parsing with a shared security helper. API calls now receive a tenant, site, actor user, session, role, purpose-of-use, and identity-provider mode in the access context.

`WO-063` adds the shared API identity runtime boundary for commercial-readiness work. Non-health API requests now require an explicit `AURA_NOTE_AUTH_MODE` before synthetic headers are trusted. `AURA_NOTE_AUTH_MODE=local_demo` is the backwards-compatible local/browser/demo posture that labels and normalizes synthetic headers. `AURA_NOTE_AUTH_MODE=local_synthetic` is the strict local test posture that requires role, user, session, and purpose headers. `preview_oidc`, `production_oidc`, `production_saml`, and `clinicos_delegate` modes fail closed until a later approved work order configures a live adapter. No live OIDC, SAML, ClinicOS delegated identity, raw token parsing, production IdP credential, or production PHI access is enabled.

## Local synthetic session contract

The local scaffold accepts these synthetic headers for tests and development:

- `x-aura-role`
- `x-aura-user-id`
- `x-aura-session-id`
- `x-aura-tenant-id`
- `x-aura-site-id`
- `x-aura-purpose-of-use`
- `x-aura-identity-provider`
- `x-aura-linked-patient`
- `x-aura-linked-visit`
- `x-aura-billing-review-triggered`
- `x-aura-break-glass-active`

When tenant or site headers are omitted, the API uses the synthetic defaults `tenant-synthetic-primary` and `site-synthetic-primary`. Any different tenant or site is denied before the route performs clinical, billing, AI, integration, coaching, support, audit, or export behavior.

## Delegation boundary

The shared helper recognizes these identity-provider modes:

- `local_synthetic`
- `clinicos_delegate`
- `oidc_delegate`

Only `local_synthetic` is enabled. `clinicos_delegate` and `oidc_delegate` are represented as future adapter modes and are denied until provider configuration, audit behavior, and tenant policy are specified in a later work order.

`WO-063` makes that denial run at the shared Nest runtime boundary before controller execution. Synthetic role, tenant, site, user, session, purpose, relationship, billing-review, and break-glass headers are forbidden in preview/production/delegated modes and are accepted only in explicit local/demo auth posture. Runtime denials return the PHI-safe API error envelope with audit-safe metadata: auth mode, identity source, failure reason, `liveCredentialPresent=false`, `delegatedIdentityConfigured=false`, and `rawTokenReturned=false`.

## Enforced surfaces

The shared identity boundary is wired through:

- schedule, appointment, and Start Visit routes;
- Draft Notes, Documentation Workspace, timer, transcript, Suggestions, Visit Selections, Compliance, History Gap, finalization, export, and EHR writeback routes through `ScheduleService`;
- AI Gateway routes;
- EHR adapter routes;
- ClinicOS adapter routes;
- coaching routes;
- support status and audit export routes.

## Out of scope

- production OIDC/SSO;
- MFA;
- SCIM/user provisioning;
- account recovery;
- organization administration;
- persistent identity/session storage;
- real ClinicOS identity delegation;
- new support, audit, billing, transcript, final-note, export, coaching, AI, EHR, or ClinicOS permissions.

## Test evidence

`WO-016` adds tests for:

- local synthetic session creation;
- cross-tenant and cross-site denial;
- disabled delegated identity mode;
- tenant-scoped resource authorization;
- cross-tenant denial in API services and API e2e.

`WO-063` adds `pnpm identity:runtime-boundary-readiness` and `apps/api/src/runtime/identity-runtime.e2e.test.ts` evidence for:

- explicit local demo acceptance with response headers `x-aura-auth-mode` and `x-aura-identity-source`;
- strict local synthetic acceptance only when role, user, session, and purpose are present;
- missing identity context, invalid identity context, disabled-user, expired-session, wrong tenant/site, wrong-purpose, and delegated-provider denial states;
- synthetic header rejection in preview/production auth modes;
- support users denied audit export/PHI-sensitive paths while billing staff transcript access remains limited to triggered billing review.

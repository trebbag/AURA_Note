# Identity and access foundation

## Status

`WO-016` establishes a local synthetic tenant identity and access boundary. It is a development/test scaffold, not production SSO.

The implementation keeps all existing RBAC/ABAC rules intact while replacing duplicated request-context parsing with a shared security helper. API calls now receive a tenant, site, actor user, session, role, purpose-of-use, and identity-provider mode in the access context.

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

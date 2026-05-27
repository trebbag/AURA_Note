# WO-016 — Tenant Identity and Access Foundation

## Objective

Replace duplicated header-only request-context parsing with a local synthetic tenant/user/session boundary that preserves existing RBAC/ABAC behavior and denies cross-tenant access.

## Scope

This work order implements development/test identity scaffolding only. It defines a local synthetic session contract, tenant/site scope checks, and an adapter boundary for future ClinicOS or OIDC delegation. It does not implement production SSO, MFA, user administration, account recovery, production identity-provider configuration, or PHI-bearing identity storage.

## Source traceability

- `AGENTS.md` sections 11, 14, and 16 require tenant scope, RBAC/ABAC enforcement, adapter boundaries, and cross-tenant denial tests.
- `docs/specs/AURA_NOTE_V1_CANONICAL_BUILD_SPEC.md` defines default identity as OIDC-compatible workforce login with local seeded users allowed only in demo/dev.
- `docs/POST_CP4_PRODUCTIONIZATION_BACKLOG.md` defines P5-02 Tenant Identity And Access Foundation.
- `docs/RBAC_ABAC_MATRIX.md` defines role, linkage, billing-review, support, audit, transcript, final-note, export, and coaching access boundaries.

## Implementation requirements

- Add a shared local synthetic session helper in `packages/security`.
- Represent tenant, site, user, session, role, purpose-of-use, and identity-provider mode in the access context.
- Deny cross-tenant and cross-site access for implemented API request contexts.
- Keep delegated `clinicos_delegate` and `oidc_delegate` modes represented but disabled until a provider adapter is configured.
- Wire schedule, notes/workspace/finalization/export, AI gateway, EHR adapter, ClinicOS adapter, coaching, and support services through the shared identity boundary.
- Add contract seeds/OpenAPI components for local synthetic session and tenant-scope decisions.
- Add cross-tenant denial tests while preserving existing permission behavior.
- Update docs, run log, and status metadata.

## Out of scope

- Production SSO, MFA, account recovery, SCIM, user administration, or organization administration.
- Real ClinicOS identity delegation.
- Real OIDC provider integration.
- Persistent identity/session storage.
- Changing clinical, billing, finalization, AI, EHR, ClinicOS, coaching, support, or export workflow behavior.
- Granting support, billing, coaching, transcript, final-note, audit, or export access beyond existing RBAC/ABAC rules.

## Acceptance criteria

- `packages/security` tests cover local synthetic session creation, cross-tenant denial, delegated-provider denial, and tenant-scope resource checks.
- API service and e2e tests prove cross-tenant API access is denied.
- Existing schedule, workspace, finalization, export, AI, EHR, ClinicOS, coaching, and support tests still pass.
- `repo_status.json` records `WO-016` completion only after local evidence passes.
- `RUN_LOG.md` records files changed, tests run, out-of-scope behavior, accepted risks, and next step.

## Definition of done

- Meets this work order's acceptance criteria.
- Meets the global definition of done in `AGENTS.md` for the scoped identity/access foundation.
- Updates relevant contracts, docs, and tests.
- Updates `repo_status.json` and `RUN_LOG.md`.
- Adds `SPEC_GAPS.md` entries only for unresolved blockers.

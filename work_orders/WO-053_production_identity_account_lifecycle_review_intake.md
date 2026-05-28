# WO-053 — Production Identity And Account Lifecycle Review Intake

## Objective

Promote the post-P11 production identity and account lifecycle candidate into a reviewable planning/control work order without enabling live identity, production credentials, PHI access, production launch, or ClinicOS delegation.

## Why This Work Order Exists

Production identity must be governed before any later live PHI, vendor, storage, EHR, AI, or payer tranche can be safely implemented. AURA Note already has synthetic fail-closed identity boundaries; this work order defines the live-readiness decision package and acceptance evidence required before a future implementation work order can connect to a real identity provider.

## Prerequisites

- `WO-052` is complete and merged.
- P11 remains the current checkpoint.
- `next_work_order` is `null` before this tranche is promoted.
- No active SPEC_GAP blocks planning/control work.

## In Scope

- Production identity/account lifecycle intake document.
- Required founder/security/privacy decisions for a future live identity tranche.
- OIDC/SAML/ClinicOS delegation decision inventory.
- MFA, session expiration, disabled-user, account recovery, break-glass, tenant/site/user administration, support role, and access-review acceptance criteria.
- Readiness verifier proving this tranche is planning/control only.
- Status, run-log, SPEC_GAPS, production plan, continuation plan, work-order index, package script, and CI updates.

## Out Of Scope

- Live OIDC or SAML implementation.
- Production IdP credentials.
- Real user directory sync.
- ClinicOS live delegated identity.
- Break-glass runtime implementation.
- Production PHI access.
- Production launch approval.
- Any change to runtime authentication behavior.

## UX Requirements

- No new production UX route is required.
- Future identity UX must preserve fail-closed disabled-user, expired-session, missing-purpose, permission-denied, and delegated-identity-denied states.
- Future admin UX must expose tenant, site, user, role, support, break-glass, and access-review states through typed API clients before launch readiness can be claimed.

## Backend/API Requirements

- No new runtime endpoint is implemented in this work order.
- Future live identity work must use adapter boundaries for OIDC, SAML, and ClinicOS delegation.
- Future state-changing identity operations must be tenant-scoped, permission-checked, idempotent where repeated submissions are plausible, and audit/event emitting.

## Data Model/Persistence Requirements

- No schema change is required in this work order.
- Future live identity work must define durable tenant, site, user, role assignment, delegated identity mapping, session, break-glass, access-review, and support-access evidence records before implementation.
- Future tenant-owned identity records must include tenant/site isolation and RLS or documented equivalent evidence before completion.

## Event/Audit Requirements

- No runtime event is emitted in this work order.
- Future work must define audit/event contracts for user provisioned, role assigned, role removed, user disabled, session expired, purpose-of-use recorded, delegated identity linked, delegated identity denied, break-glass requested, break-glass approved, support access opened, support access closed, and access review completed.

## RBAC/ABAC Requirements

- Current permissions remain unchanged.
- Future live identity work must preserve clinician, MA, billing, admin, authorized-admin, compliance/privacy lead, support metadata-only, and service-account boundaries.
- ClinicOS identity must not bypass AURA Note tenant, site, role, patient-linkage, purpose-of-use, or support-scope checks.

## Standalone-Mode Behavior

- Standalone mode remains authoritative for local tenant/site/user/role administration until a future live identity work order replaces the synthetic boundary.
- Future live identity work must support standalone tenant onboarding without requiring ClinicOS.

## ClinicOS-Integrated Behavior

- ClinicOS-integrated mode remains mock/degraded and fail-closed.
- Future live ClinicOS delegation must map external identities into AURA Note users, roles, tenant/site scopes, and purpose-of-use without bypassing AURA Note permissions.

## AI/PHI/Security Requirements

- No raw PHI, credentials, tokens, private keys, `.env` files, production URLs, or real user directory data may be committed.
- No external AI behavior is changed.
- No production identity provider may be contacted in this work order.
- Future live identity work must include secret-source validation, token redaction, disabled-user tests, expired-session tests, spoofed-scope denial tests, and access-review evidence.

## Testing Requirements

- Add and run a deterministic readiness verifier for the identity live-review intake.
- Run production/post-P11/acceptance status gates.
- CI must run the new verifier.
- No browser or API runtime tests are required unless runtime behavior changes; this tranche intentionally does not change runtime behavior.

## Required Scripts/Gates

- `pnpm identity:live-review-readiness`
- `pnpm post-p11:readiness`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

## Definition Of Done

- Production identity/account lifecycle intake document exists.
- `WO-053` is indexed, represented in `repo_status.json`, and marked done only after readiness evidence exists.
- `next_work_order` remains `null` after completion.
- Readiness scripts pass locally and in CI.
- `SPEC_GAPS.md` records no active gap for planning/control scope and keeps production identity as a deferred decision before live use.
- No live identity provider, live ClinicOS delegation, production credential, production PHI path, or production launch behavior is introduced.

## Stop Conditions

- A future implementation request requires selecting a real IdP, handling real credentials, or defining legal/security/privacy policy not present in the repo.
- A higher-priority spec conflicts with the planned fail-closed identity posture.
- Readiness scripts cannot distinguish this planning/control work from live identity implementation.

## Risks And Deferred Decisions

- Production IdP selection, OIDC/SAML posture, MFA, account recovery, break-glass, access-review cadence, support access, tenant administration ownership, and ClinicOS delegation rules remain deferred until a future approved implementation work order.
- This work order is not a production identity approval and not a launch approval.

# Production Identity And Account Lifecycle Review

## Purpose

This document is the `WO-053` planning/control intake for production identity and account lifecycle work. It does not enable live identity, production credentials, production PHI access, ClinicOS delegated identity, or production launch behavior.

## Current Safe Posture

- Local synthetic identity remains fail-closed.
- Delegated identity modes remain denied until configured by a future approved work order.
- Production IdP credentials, raw tokens, user directory payloads, and `.env` files are not present.
- AURA Note permissions remain authoritative in standalone and ClinicOS-integrated modes.
- Support access remains metadata-only and role-limited.

## Founder-Provided Partial Input Captured 2026-06-02

Use the local Flow project at `/Users/gregorygabbert/Documents/GitHub/Flow` as the reference implementation pattern for identity and account lifecycle planning.

Flow evidence to evaluate for AURA Note:

- Azure/Microsoft Entra-first authentication with the `clinicos1` tenant.
- Microsoft redirect login with separate frontend SPA and backend API app-registration shape.
- Backend JWT validation through Entra issuer, audience, and JWKS configuration.
- Entra-linked user provisioning with application-owned role and scope enforcement after identity resolution.
- Tenant-member-only accounts, no guest/B2B access, disabled/deleted directory identity denial, and unprovisioned account denial.
- Microsoft Graph-backed directory sync posture through managed identity or approved Graph capability.

This partial input does not select exact AURA Note app-registration names, non-secret config variable values, credential delivery, MFA/session policy, break-glass policy, access-review cadence, or ClinicOS delegated identity behavior.

## Required Decisions Before Live Implementation

- Production identity provider: OIDC, SAML, ClinicOS delegation, or a staged combination.
- MFA requirements by role and environment.
- Tenant, site, user, and role administration owner.
- Account recovery and invite flow.
- Disabled-user source of truth and revocation latency.
- Session timeout, refresh, reauthentication, and idle-lock posture.
- Purpose-of-use requirements by workflow.
- Break-glass policy, approval authority, duration, patient scope, and post-event review.
- Support access boundaries, approval, duration, evidence, and closure process.
- Access-review cadence, reviewers, evidence retention, and remediation rules.
- ClinicOS delegated identity mapping, stale mapping behavior, and fallback mode.
- Secret manager, credential rotation, and token redaction requirements.

## Future Implementation Acceptance Criteria

- Live identity adapter boundaries exist for the selected provider path.
- Runtime user, tenant, site, role, purpose-of-use, session, and delegated identity records are durable where required.
- Disabled users, expired sessions, missing purpose, spoofed tenant/site scopes, and delegated identity mismatches fail closed.
- Tenant/site/user/role administration is permission-checked and audited.
- Break-glass and support access require approval, reason, scope, time limit, trace ID, and post-event review evidence.
- ClinicOS delegated identity cannot bypass AURA Note tenant, site, role, patient-linkage, or purpose-of-use checks.
- Tokens, claims, and identity-provider payloads are redacted from logs and audit-safe evidence.
- Role-denial, cross-tenant denial, expired-session, disabled-user, support-access, and break-glass tests pass.

## Required Future Audit/Event Contracts

- `identity.user_provisioned.v1`
- `identity.user_disabled.v1`
- `identity.role_assigned.v1`
- `identity.role_removed.v1`
- `identity.session_expired.v1`
- `identity.purpose_of_use_recorded.v1`
- `identity.delegated_identity_linked.v1`
- `identity.delegated_identity_denied.v1`
- `identity.break_glass_requested.v1`
- `identity.break_glass_approved.v1`
- `identity.break_glass_closed.v1`
- `identity.support_access_opened.v1`
- `identity.support_access_closed.v1`
- `identity.access_review_completed.v1`

## Standalone Mode Requirements

Standalone mode must support tenant onboarding, site setup, user administration, role assignment, disabled-user handling, session expiration, support-access approval, and access-review evidence without requiring ClinicOS.

## ClinicOS-Integrated Mode Requirements

ClinicOS-integrated mode may delegate identity only through an adapter boundary. AURA Note must still enforce local tenant/site mappings, role permissions, purpose-of-use checks, patient linkage, support scopes, audit logging, and fail-closed behavior for stale or missing mappings.

## Deferred Until A Future Work Order

- Selecting or configuring a production IdP.
- Implementing live OIDC/SAML/ClinicOS delegated identity.
- Storing production identity credentials.
- Syncing real users or groups.
- Implementing production break-glass runtime behavior.
- Enabling production PHI access.
- Claiming production launch readiness.

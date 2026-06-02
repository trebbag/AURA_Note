# Figma Role And Permission Views

Status as of `WO-065`: role and permission inventory for design handoff. Role views must preserve AURA Note RBAC/ABAC and cannot use ClinicOS-integrated mode to bypass local permissions.

## Role View Matrix

| Role/context | Must see | Must not see by default | Required denied/read-only states |
| --- | --- | --- | --- |
| clinician | schedule, own workspace, draft/final notes, transcript when allowed, suggestions, finalization, own coaching | support-only internals, unauthorized admin settings, patient-facing revenue | permission-denied for admin/support; read-only finalized note |
| MA | schedule, task inbox, MA follow-up worklist, assigned history-gap questions | unrestricted transcript, billing details, coaching analytics, AI governance internals | denied transcript/final note/billing/coaching where not permitted |
| billing staff | billing review queue, triggered final note/billing context, draft claim preview | unrelated transcript access, coaching analytics, support PHI, patient-facing revenue conclusions | transcript denied unless review is triggered; no claim submission |
| admin | settings/admin/integrations, templates, dot phrases, rules catalog, operations summaries | raw PHI outside purpose-of-use, support-only operational secrets | denied PHI/support content outside role and purpose |
| authorized admin | platform controls, tenant/site/user/role admin, support readiness, audit/export metadata | production secrets, raw tokens, live vendor payloads | high-risk live flags disabled until review |
| compliance/privacy lead | audit/export metadata, AI governance, support status, privacy review states | operational secrets or unnecessary raw clinical content | includePhi rejected; read-only review posture |
| support | support status and operational evidence | PHI, final note bodies, raw transcript, billing details, coaching reports | support PHI denial; metadata-only status |
| service account/integration | adapter-scoped events, writeback queue metadata, ClinicOS mappings | user-facing workflow screens, broad PHI by default | tenant/site/purpose scoped service-account denial states |

## Sensitive Surface Rules

- Transcript visibility differs for clinician, billing staff, admin, MA, support, and service-account contexts.
- Final note visibility is role-limited and read-only after finalization.
- Billing details are available only to billing-permitted users and triggered review contexts.
- Coaching output is not patient-facing and is not visible to support by default.
- Audit exports require compliance/privacy lead or authorized admin and reject `includePhi`.
- Platform/admin changes require admin/authorized admin permission and fail closed for high-risk flags.
- ClinicOS mode carries delegated context but AURA Note still enforces tenant, site, purpose-of-use, RBAC, and ABAC.

## Required Permission States For Figma

- Permission-denied card without sensitive preview content.
- Read-only artifact viewer for finalized notes.
- Disabled action with reason and required review.
- Degraded integration card when EHR/ClinicOS/AI/storage is unavailable.
- Support metadata-only view for operational status.
- Service-account denied view for user-facing screen attempts.

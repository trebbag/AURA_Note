# RBAC / ABAC Matrix

AURA Note must enforce role permissions and relationship-to-patient constraints.

## Roles

- Clinician / treating clinician.
- MA.
- Billing staff.
- Admin.
- Authorized admin.
- Clinic manager.
- Compliance/privacy lead.
- Support user.
- ClinicOS integration service account.

## Relationship attributes

- linked to patient;
- linked to visit;
- assigned to task;
- treating clinician;
- billing review triggered;
- authorized admin;
- support break-glass active;
- ClinicOS trusted service context.

## Visibility rules

| Data | Clinician | MA | Billing | Admin | Authorized Admin | Notes |
|---|---:|---:|---:|---:|---:|---|
| Schedule | yes | yes | limited | yes | yes | Tenant/site scoped. |
| Draft note | treating only | limited if task-linked | no unless billing review | configurable | yes | Minimum necessary. |
| Final note | if linked | if linked | if linked and billing purpose | configurable | yes | User specified: only staff linked to visit/patient see final notes. |
| Patient summary | if linked | if linked | if linked | configurable | yes | Patient-facing, still PHI. |
| Transcript | treating clinician | no by default | only when billing review triggered | configurable | yes | Must be purpose-limited. |
| Billing details | treating clinician | no by default | yes | configurable | yes | Internal only. |
| Coaching own | yes | no | no | no | yes | Treating clinician sees own. |
| Coaching team | no | no | no | if authorized | yes | Can be aggregate-only. |
| Templates | create/edit if clinician/admin | no or limited | no | yes | yes | Any clinician or admin can create. |
| Dot phrases | use | use if permitted | no | manage | manage | Clinic-level settings. |
| Audit logs | limited self | no | limited billing | admin | yes | Privacy-controlled. |
| Support status | no | no | no | yes | yes | Support and service accounts can view operational metadata only. |
| Audit export | no | no | no | no unless authorized | yes | Compliance/privacy lead and authorized admin only; redacted metadata only in CP-4. |

## ABAC enforcement examples

- Billing staff transcript access requires `billingReviewTriggered = true`.
- MA final-note access requires `linkedToVisit = true` or assigned follow-up task with minimum necessary view.
- Coaching dashboard access requires `role = authorized_admin` and tenant configuration permits identifiable analytics; otherwise aggregate-only.
- Billing staff can see billing detail and transcript only through billing-purpose rules, but cannot see coaching outputs unless they also hold an authorized-admin role.
- Aggregate-only coaching mode hides individual clinician identifiers even from admin dashboard views.
- Support users require break-glass reason and time-boxed access.
- `WO-013` adds `support_status:view` for support, service account, clinic manager, compliance/privacy lead, and authorized admin roles. It does not expose PHI payloads.
- `WO-013` adds `audit:export` for compliance/privacy leads and authorized admins only. Support users can view status but cannot request audit exports.
- `WO-016` adds a local synthetic tenant/session boundary. Every implemented API context now carries tenant, site, actor user, session, purpose-of-use, and identity-provider mode metadata.
- `WO-016` denies cross-tenant and cross-site requests before route behavior executes. Delegated `clinicos_delegate` and `oidc_delegate` modes are represented but denied until configured by later work orders.
- `WO-033` re-establishes the production build rails and keeps RBAC/ABAC expansion sequenced: `WO-034` through `WO-037` must prove tenant/site and role boundaries for durable workflow records, `WO-041` must harden production identity/purpose-of-use/session enforcement, `WO-043` must harden support operational access, and `WO-047` must reconcile this matrix against implemented checks before launch candidate review.

## WO-043 support operations access

`WO-043` adds `support_operations:record` for audit-safe operational evidence. The permission is limited to support, service account, clinic manager, compliance/privacy lead, and authorized admin contexts. Ordinary clinicians and billing staff cannot record support operational evidence. Support users remain limited to operational metadata and cannot access PHI-bearing transcripts, final notes, billing details, coaching outputs, audit export downloads, or writeback payloads. Compliance/privacy lead or authorized admin remains required for audit export download.
- `WO-041` adds `identity:view`, `identity:manage`, `config:view`, `config:manage`, `feature_flag:view`, and `feature_flag:manage` permissions. Authorized admins/admins can manage synthetic workforce user, config, and high-risk feature-flag records; clinic managers and compliance/privacy leads have limited view posture where allowed; clinicians, MAs, billing staff, and support users cannot manage high-risk platform controls.
- `WO-041` enforces purpose-of-use, disabled-user, expired-session, delegated-identity-not-configured, and tenant/site spoofing fail-closed checks before platform session decisions return DTO data. ClinicOS delegated identity cannot bypass AURA Note permissions.
- `WO-042` enforces secure download ABAC before storage delivery: final-note artifacts require `final_note:export`; patient-summary artifacts require `patient_summary:export` plus internal-detail exclusion evidence; audit exports require `audit:export`; tokens are tenant, site, requester, permission, and expiry scoped. Support users cannot download audit exports.
- `WO-042` keeps retention deletion behind feature flag, approval token, approval ID, and open recovery-window evidence. ClinicOS-integrated mode cannot bypass AURA Note storage, download, deletion, or restore-readiness permissions.

## WO-044 EHR writeback queue access

`WO-044` adds `ehr_writeback:view`, `ehr_writeback:approve`, and `ehr_writeback:manage` permission checks. Treating clinicians linked to the visit and authorized admins can approve writeback metadata. Authorized admins, admins, clinic managers, compliance/privacy leads, and service accounts can manage retry, dead-letter, and reconciliation metadata. Support users can view operational queue metadata only; support cannot approve or manage writeback actions and cannot access raw writeback payloads or external job identifiers. ClinicOS-integrated mode cannot bypass these AURA Note permission checks.

## WO-045 ClinicOS integration access

`WO-045` hardens `clinicos_adapter:view` and `clinicos_mapping:write`. Treating clinicians, admins, clinic managers, compliance/privacy leads, support users, service accounts, and authorized admins may view ClinicOS operational metadata. Support users remain metadata-only and cannot view raw payloads, transcripts, final notes, billing details, coaching outputs, or event-bus messages. Only authorized admins and service accounts may record ClinicOS mapping or publication metadata, and those requests still pass tenant/site scope, purpose-of-use, audit, and idempotency checks. Ordinary clinicians cannot write ClinicOS mappings even when linked to the visit. Cross-tenant and cross-site service-account attempts are denied before metadata is exposed.

## WO-046 AI governance access

`WO-046` keeps `ai_gateway:invoke` limited to treating clinicians linked to the visit and authorized admins. `ai_governance:view` remains limited to compliance/privacy leads and authorized admins for evaluation runs and output-validation metadata. Support users may view broader operational status surfaces elsewhere, but they cannot run AI governance evaluations, validate outputs, access prompts, transcripts, final notes, billing details, coaching outputs, raw AI payloads, or raw model data. Billing staff cannot invoke clinical AI suggestions or governance actions unless a later approved work order adds a review-specific path. Cross-tenant AI requests are denied before context packaging or metadata exposure.

## WO-047 security/privacy/compliance review

`WO-047` reconciles this matrix against implemented P8/P8.5/P9 checks. No new P9 blocker was found in the synthetic/local scope. The review keeps AURA Note RBAC/ABAC authoritative in standalone and ClinicOS-integrated modes: ClinicOS service context cannot bypass tenant/site scope, purpose-of-use, support metadata-only limits, transcript/final-note/billing/coaching restrictions, AI governance role checks, or human-review gates. Future P10 UX/accessibility hardening must preserve visible denied, read-only, disabled, and failed states for these sensitive paths.

## WO-062 API request-boundary access

`WO-062` hardens the runtime request boundary before controller execution. Public API requests outside `/health` must include an explicit local/demo role context; missing role context returns a PHI-safe permission-denied envelope, and invalid role or purpose-of-use headers return a PHI-safe validation envelope. Cross-tenant and cross-site denial remains enforced by existing service/security helpers before DTO exposure. ClinicOS-integrated mode still cannot bypass AURA Note role, tenant, site, purpose, support metadata-only, billing-review, transcript, final-note, coaching, AI governance, writeback, storage, or claim-boundary permissions.

## WO-063 identity runtime-boundary access

`WO-063` moves the synthetic-header trust decision into an explicit identity runtime boundary. Non-health API requests require `AURA_NOTE_AUTH_MODE`. `local_demo` labels and normalizes local synthetic headers for development/browser evidence; `local_synthetic` requires explicit role, user, session, and purpose headers. Preview/production OIDC, production SAML, and ClinicOS delegated modes reject synthetic role/tenant/site/user/session/purpose headers and fail closed until a later approved work order configures a live adapter. Disabled users, expired sessions, wrong tenant/site, wrong purpose, delegated providers, missing identity context, and invalid identity context are denied before controller execution. Support users remain metadata-only and cannot request audit exports; billing staff transcript access remains allowed only when billing-review context is triggered. ClinicOS-integrated mode still cannot bypass AURA Note tenant/site, purpose-of-use, RBAC/ABAC, transcript, billing, final-note, coaching, AI governance, writeback, storage, or claim boundaries.

## WO-067 ModeResolver adapter-boundary access

`WO-067` makes mode resolution explicit before ClinicOS adapter status, mapping, or publication metadata is returned. ClinicOS cannot bypass AURA Note permissions: `clinicos_adapter:view` is still required for status metadata, `clinicos_mapping:write` is still required for mapping and publication metadata, and cross-tenant or cross-site contexts are denied before DTO data is exposed.

The runtime `modeAdapterBoundaries` evidence records all adapter seams as `permissionBoundary='aura_note_authoritative'` with `liveDelegationEnabled=false`. Support users remain metadata-only; ordinary clinicians cannot write mappings; authorized admins and service accounts may write metadata only inside tenant/site scope. Degraded or unavailable ClinicOS mode fails closed for writes and does not weaken transcript, final-note, billing, coaching, AI governance, writeback, storage/download, human-review, or claim-boundary checks.

## WO-068 transcription runtime access

`WO-068` keeps transcription runtime access behind AURA Note permissions in both standalone and ClinicOS-integrated modes. Treating clinicians linked to the visit can record microphone permission metadata, append metadata-only chunks, request deterministic mock transcription, request the disabled live-provider fail-closed check, view transcripts, and record corrections. Billing staff transcript access remains limited to triggered billing-review context. Support users remain metadata-only and cannot view transcripts, record corrections, invoke transcription jobs, or access raw audio. ClinicOS cannot bypass AURA Note transcript, recording, retention, correction, billing-review, purpose-of-use, or tenant/site checks.

## WO-049 launch operations access

`WO-049` documents `launch_operations:view` and future `launch_operations:record` posture for operational rehearsal evidence. Authorized admin, compliance/privacy lead, clinic manager, support, and service-account contexts may view metadata-only launch operations evidence. Recording production launch approval remains out of scope. Support users remain metadata-only and cannot access transcripts, final notes, billing details, coaching outputs, raw prompts, raw EHR/ClinicOS payloads, audit export payloads, production credentials, or PHI-bearing logs. ClinicOS-integrated mode cannot bypass AURA Note launch operations permissions.

## WO-050 beta pilot launch gate access

`WO-050` documents `launch_pilot:view` and future `launch_pilot:record` posture for the beta-pilot decision package. Authorized admin, compliance/privacy lead, clinic manager, support metadata-only, and service-account contexts may view pilot launch metadata. Recording future pilot evidence is restricted to authorized admin, release/security owner, compliance/privacy lead, and approved service-account contexts. Founder, clinical, compliance/privacy, and security signoff placeholders are visible as metadata only and do not grant production launch authority.

## WO-051 claim/payer decision gate access

`WO-051` documents `claim_strategy:view` and future `claim_strategy:record` posture for claim/payer strategy evidence. Authorized admin, billing lead, compliance/privacy lead, security/founder context, and approved service-account contexts may view or record metadata-only decision evidence. Clinicians may review clinical documentation support but cannot submit claims autonomously through AURA Note. Support users remain metadata-only and cannot access claim payloads, payer details, transcripts, final notes, billing evidence beyond operational status, production credentials, or patient financial conclusions. ClinicOS-integrated mode and M21 Charge Integrity cannot bypass AURA Note permissions, human approval, audit, or the default `submittedClaim=false` posture.

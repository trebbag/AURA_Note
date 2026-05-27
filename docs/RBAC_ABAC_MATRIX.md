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

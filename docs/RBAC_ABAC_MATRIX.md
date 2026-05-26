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

## ABAC enforcement examples

- Billing staff transcript access requires `billingReviewTriggered = true`.
- MA final-note access requires `linkedToVisit = true` or assigned follow-up task with minimum necessary view.
- Coaching dashboard access requires `role = authorized_admin` and tenant configuration permits identifiable analytics; otherwise aggregate-only.
- Support users require break-glass reason and time-boxed access.

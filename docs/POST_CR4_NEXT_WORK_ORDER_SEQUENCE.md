# Post-CR4 Next Work Order Sequence

## Purpose

This document establishes the explicit post-CR4 sequence after `WO-076`. It keeps the repo on rails without implying production launch approval.

`WO-077` completed the duplicate artifact cleanup and next-sequence rails. `WO-078` through `WO-089` are planned decision/activation work orders. They must not be promoted to `todo` until the required founder, clinical, compliance, security, legal, vendor, and operations inputs are available for that scope.

## Partial Inputs Captured After WO-077

The founder/operator supplied these partial inputs on 2026-06-02:

- `WO-078`: the founder/operator is the launch owner and approval authority unless a later written decision delegates an approval lane.
- `WO-079`: identity and account lifecycle planning should reference the local Flow project's Azure/Microsoft Entra, `clinicos1` tenant, Microsoft redirect login, JWT validation, Entra-linked provisioning, tenant-member-only, guest/B2B denial, disabled/deleted identity denial, and app-owned role/scope pattern.
- `WO-080`: production PHI database planning should evaluate Flow's Azure PostgreSQL Flexible Server, migration/runtime role posture, RLS evidence, PHI encryption, append-only event protection, and backup/restore objectives; Azure CLI verified the AURA Note tenant/subscription/resource group baseline as tenant `b9b1d566-d7ed-44a4-b3cc-cf8786d6a6ed`, subscription `Subscription Malady` (`91d0e7fe-e9c6-40a0-af0f-98a9dc07b218`), resource group `AURA_resource_group`, location `eastus`, provisioning state `Succeeded`.
- `WO-081`: production Azure storage planning should evaluate Flow's Key Vault, Blob soft-delete/versioning, and recovery posture, while deciding separate AURA Note PHI artifact-storage, deletion, restore, and monitoring controls; the same verified Azure baseline is available for storage planning.

These are partial inputs only. `WO-078` through `WO-081` remain `planned` until the remaining AURA Note-specific configuration, approval, credential-delivery, scope, and operational details are documented.

## Status Rules

- `WO-077` may be marked `done` after cleanup evidence, run-log evidence, status updates, and readiness gates pass.
- `WO-078` through `WO-089` remain `planned`.
- `next_work_order` remains `null` while all remaining work is planned and awaiting production decision inputs.
- A planned work order may move to `todo` only after its work-order file exists and the required inputs for that work order are available.
- None of these work orders may set production launch, live PHI, live vendor, claim submission, or autonomous clinical/coding/billing behavior to enabled by default.

## Sequence

| Work order | Title | Status after WO-077 | Primary decision/input dependency |
| --- | --- | --- | --- |
| `WO-077` | Duplicate artifact cleanup and post-CR4 next-work-order rails | `done` | Founder instruction to adjudicate duplicate artifacts and create the next sequence |
| `WO-078` | Production launch governance inputs and approval dossier | `planned` | launch owner, approval roles, beta/launch scope, rollback authority |
| `WO-079` | Production identity provider and account lifecycle activation | `planned` | IdP, OIDC/SAML/ClinicOS delegation, MFA, lifecycle, access review |
| `WO-080` | Production PHI persistence and database operations activation | `planned` | database host, roles, RLS review, backup/restore, migration approval |
| `WO-081` | Production Azure storage, backup/restore, and retention deletion activation | `planned` | Azure storage account/container, keys, soft delete, deletion approval |
| `WO-082` | Live transcription provider and audio transport activation | `planned` | provider, BAA/privacy posture, consent/audio transport, failure policy |
| `WO-083` | External AI private/BAA pathway activation | `planned` | provider/model, BAA/private path, prompt/eval governance, PHI policy |
| `WO-084` | Production EHR writeback credentialing and sandbox-to-live activation | `planned` | EHR credentials, sandbox/live scope, writeback ownership, reconciliation |
| `WO-085` | ClinicOS live integration contract and event-bus activation | `planned` | ClinicOS contracts, identity mapping, event schemas, replay/reconciliation |
| `WO-086` | Production observability, SIEM/APM, and support operations activation | `planned` | telemetry vendors, on-call ownership, alert thresholds, support procedures |
| `WO-087` | Revenue estimate and patient-facing financial policy activation | `planned` | estimate data sources, caveats, permissions, patient-facing policy |
| `WO-088` | Claim, clearinghouse, payer, denial, and payment strategy decision gate | `planned` | claim strategy, clearinghouse/payer scope, human approvals, compliance |
| `WO-089` | Beta pilot execution and production launch go/no-go | `planned` | tenant participants, approvals, deployment, support, incident and rollback readiness |

## Promotion Criteria

Before any planned work order is promoted:

- the exact required inputs for that work order are documented;
- live credentials are supplied through an approved secret store, not committed files;
- the implementation can preserve tenant/site isolation, RBAC/ABAC, auditability, and PHI boundaries;
- the work order file is created with scope, out-of-scope items, tests, gates, and stop conditions;
- readiness scripts are updated to distinguish decision readiness from launch readiness.

## Safety Boundary

This sequence is not production launch approval. It does not authorize live PHI, production credentials, live vendor calls, claim submission, charge finalization, medical-necessity determination, patient-facing financial conclusions, or autonomous clinical/coding/billing behavior.

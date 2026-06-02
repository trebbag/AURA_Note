# Post-CR4 Production Decision Inputs

This file lists exactly what Codex needs from the founder/operator and reviewers before each deferred production decision can be implemented or promoted from `planned` to `todo`.

Do not place secrets, passwords, tokens, private keys, real patient data, production PHI, or `.env` contents in this repository. Credentials must be provided through an approved secret store or local secure runtime configuration after the relevant work order is promoted.

## Founder-Provided Partial Inputs Captured 2026-06-02

These inputs came directly from the founder/operator and reduce ambiguity for the next production-decision work orders. They do not approve production launch, live PHI, live vendors, production credentials, live EHR writeback, live transcription, live AI, live Azure PHI storage, claim submission, charge finalization, medical-necessity determination, or autonomous clinical/coding/billing behavior.

- Launch owner and approval authority: the founder/operator is the launch owner and approver for founder, clinical, compliance/privacy, security, legal/risk, and commercial go/no-go decisions unless a later written decision delegates one of those authorities.
- Reference project for identity, account lifecycle, Azure, and database posture: `/Users/gregorygabbert/Documents/GitHub/Flow`.
- Flow identity/account pattern to evaluate for AURA Note: Microsoft Entra-first authentication, Microsoft account redirect login, the `clinicos1` Entra tenant, backend JWT validation, Entra-linked user provisioning, tenant-member accounts only, no guest/B2B users, disabled/deleted directory identity rejection, and application-owned role/scope enforcement after identity resolution.
- Flow Azure/database pattern to evaluate for AURA Note: Azure Static Web Apps plus Azure App Service deployment posture, Azure Database for PostgreSQL Flexible Server, separate migration/runtime database roles where configured, app-layer scope checks, RLS evidence, PHI-at-rest encryption posture, and documented backup/restore objectives.
- Flow storage/recovery pattern to evaluate for AURA Note: Azure Key Vault for secrets, Azure Blob soft-delete/versioning as the documented object-storage recovery posture, and private Blob run-from-package deployment packaging. This is not yet an AURA Note PHI artifact-storage approval.
- AURA Note Azure resource baseline: Azure CLI verified tenant `b9b1d566-d7ed-44a4-b3cc-cf8786d6a6ed`, subscription `Subscription Malady` (`91d0e7fe-e9c6-40a0-af0f-98a9dc07b218`), resource group `AURA_resource_group`, location `eastus`, and provisioning state `Succeeded`.
- Exact tenant IDs, app registration IDs, client IDs, database connection strings, storage account names, secret values, and `.env` values must not be copied into this repo as production configuration. AURA Note still needs approved non-secret configuration names and secret-store delivery before live work is promoted.

## 1. Production Launch Governance

Required inputs:

- named launch decision owner;
- named clinical approver;
- named compliance/privacy approver;
- named security approver;
- named legal or risk reviewer, if applicable;
- launch scope: internal only, beta, limited production, or general availability;
- tenant/site scope for launch;
- roles enabled at launch;
- disabled-feature inventory accepted for launch;
- go/no-go criteria;
- rollback authority and rollback procedure owner;
- support hours and escalation path;
- incident commander and backup;
- access review cadence;
- backup/restore drill acceptance criteria;
- launch communications owner;
- explicit written approval to change `productionLaunchApproved` from false if that is intended.

Captured partial input:

- The founder/operator is the named launch decision owner and approval authority for launch, clinical, compliance/privacy, security, legal/risk, and commercial go/no-go decisions unless delegated later.

Still needed before `WO-078` can be promoted:

- launch scope, tenant/site scope, enabled roles, disabled-feature inventory, go/no-go criteria, rollback procedure owner, support hours/escalation path, incident commander and backup, access review cadence, backup/restore drill acceptance criteria, launch communications owner, and explicit written approval if the launch flags are intended to change later.

## 2. Production Identity Provider And Account Lifecycle

Required inputs:

- chosen identity provider;
- OIDC, SAML, ClinicOS delegated identity, or mixed identity mode;
- tenant/user/site provisioning owner;
- user role source of truth;
- MFA requirement;
- session duration and inactivity timeout;
- disabled-user handling;
- account recovery policy;
- joiner/mover/leaver process;
- access review cadence and approver;
- break-glass policy, if any;
- audit retention requirements for identity events;
- test users or sandbox tenant identity metadata;
- approved non-secret configuration names;
- credential delivery method through secret storage.

Captured partial input:

- Candidate identity provider and account pattern should reference the Flow project in `/Users/gregorygabbert/Documents/GitHub/Flow`.
- Flow uses Azure/Microsoft Entra with the `clinicos1` tenant, Microsoft redirect login, SPA/API app-registration separation, backend JWT validation, Entra-linked user records, tenant-member-only access, guest/B2B denial, disabled/deleted account denial, and DB-managed role/scope authorization after identity resolution.

Still needed before `WO-079` can be promoted:

- AURA Note-specific OIDC/SAML/ClinicOS delegated identity mode; exact non-secret Entra authority/audience/scope/config variable names; approved app registration names; Microsoft Graph access posture; MFA/session/inactivity policy; disabled-user and account-recovery policy; joiner/mover/leaver process; access-review cadence; break-glass policy; identity audit retention; sandbox test users; and secret-store delivery method.

## 3. Production PHI Persistence And Database Operations

Required inputs:

- production database vendor and hosting posture;
- database region and residency requirements;
- tenant/site isolation policy;
- RLS coverage approval for all tenant-owned tables;
- app database roles and migration roles;
- migration approval and rollback process;
- backup schedule;
- restore time objective and restore point objective;
- backup encryption/key ownership;
- PHI retention policy by data class;
- support database access policy;
- audit/evidence retention requirements;
- database monitoring requirements;
- staging database policy;
- approved production connection-string secret name, not the secret value.

Captured partial input:

- Candidate database posture should reference Flow's Azure Database for PostgreSQL Flexible Server pattern, local-to-PostgreSQL staging support, separate migration/runtime database URL posture, RLS evidence, append-only event protection, PHI-at-rest encryption posture, and documented backup/restore objectives.
- The Azure tenant/subscription/resource group baseline for future AURA Note infrastructure is now verified: tenant `b9b1d566-d7ed-44a4-b3cc-cf8786d6a6ed`, subscription `Subscription Malady` (`91d0e7fe-e9c6-40a0-af0f-98a9dc07b218`), resource group `AURA_resource_group`, location `eastus`, provisioning state `Succeeded`.

Still needed before `WO-080` can be promoted:

- AURA Note-specific database vendor/host approval, confirmation that `eastus` is acceptable for database residency or a different database region if required, tenant/site isolation policy, RLS coverage approval for all AURA Note tenant-owned tables, migration/admin/runtime role names, migration approval and rollback process, backup schedule, RTO/RPO, encryption and key ownership, PHI retention by data class, support database access policy, monitoring requirements, staging database policy, and approved production connection-string secret name.

## 4. Production Azure Storage, Deletion, And Restore

Required inputs:

- Azure tenant/subscription/resource group;
- storage account name;
- container names by artifact class;
- region and residency requirement;
- private networking requirement;
- encryption/key management posture;
- soft-delete/versioning/legal-hold configuration;
- signed-download expiration policy;
- artifact retention classes;
- raw-audio deletion approval role;
- deletion approval token or approval-record source;
- recovery window requirement;
- backup/restore drill criteria;
- evidence-retention policy;
- storage monitoring and alerting requirements;
- approved secret names for credentials or managed identity, not secret values.

Captured partial input:

- Candidate Azure posture should reference Flow's Azure resource/runbook pattern, Azure Key Vault secret posture, Azure Blob soft-delete/versioning recovery posture, and private Blob deployment-package usage.
- Flow's private Blob run-from-package deployment packaging is not the same as AURA Note PHI-bearing export/audio/audit artifact storage.
- Azure CLI verified the AURA Note resource baseline: tenant `b9b1d566-d7ed-44a4-b3cc-cf8786d6a6ed`, subscription `Subscription Malady` (`91d0e7fe-e9c6-40a0-af0f-98a9dc07b218`), resource group `AURA_resource_group`, location `eastus`, provisioning state `Succeeded`.
- The founder/operator confirmed `eastus` is acceptable and authorized Codex to make the remaining non-secret storage/deletion/restore choices.
- `docs/PRODUCTION_AZURE_STORAGE_DECISION_RECORD.md` now selects candidate storage account `auranoteeastus91d0` (`az storage account check-name` reported available on 2026-06-02), artifact-class containers, `Standard ZRS`, managed identity, candidate identity/key-vault names, private endpoint requirement, server-mediated download TTLs, tenant/site object-key partitioning, raw-audio 7-day purge eligibility, transcript indefinite retention, 14-day Blob/container soft delete, versioning, legal-hold deletion blocking, quarterly synthetic restore-readiness, evidence retention, and monitoring/alerting requirements.

Still needed before `WO-081` can be promoted:

- If the candidate storage account name is no longer available at provisioning time, a fresh deterministic replacement name and `az storage account check-name` evidence.
- Actual Azure resource provisioning evidence for the storage account, containers, managed identity, private endpoint, private DNS, firewall, Blob public-access denial, shared-key denial, TLS, soft delete, container soft delete, versioning, legal-hold support, and least-privilege RBAC assignments.
- Actual managed identity client ID, resource IDs, approved config/secret-store references, and deployment environment names recorded in approved secret/config stores, not source control.
- Synthetic no-PHI live Azure readiness tests proving upload/download-token/deletion-block/restore-readiness behavior against the configured resource.
- Explicit production flag approval before PHI-bearing object delivery, destructive production deletion, PHI restore execution, or production launch is enabled.

## 5. Live Transcription Provider And PHI-Bearing Audio Transport

Required inputs:

- selected transcription provider;
- BAA/privacy review status;
- whether audio may leave AURA Note infrastructure;
- consent and recording notice policy;
- browser microphone capture policy;
- chunk upload size and retry policy;
- provider diarization capability;
- provider confidence metadata capability;
- correction/edit history policy;
- failure and fallback policy;
- raw-audio one-week retention approval;
- transcript indefinite-retention approval;
- support access policy for transcripts/audio metadata;
- monitoring and incident policy;
- approved credential secret names, not secret values.

## 6. External AI Private/BAA Pathway

Required inputs:

- selected AI provider and model family;
- BAA/private deployment status;
- whether raw PHI may be sent to the model;
- de-identification/scrubbing policy;
- prompt approval owner;
- model configuration approval owner;
- prompt/version registry location;
- evaluation thresholds;
- drift monitoring owner and cadence;
- source-freshness thresholds;
- human-review requirements by output type;
- prohibited output classes confirmed for v1;
- incident response for unsafe AI output;
- audit retention requirements;
- approved credential secret names, not secret values.

## 7. Production EHR Writeback Credentialing

Required inputs:

- EHR vendor and environment: sandbox, preview, production, or phased;
- athenahealth credentialing status if athenahealth is used;
- writeback object types allowed: final note, patient summary, attachments, or metadata only;
- human approver role for writeback;
- idempotency key policy;
- retry/dead-letter policy;
- reconciliation owner and cadence;
- raw payload storage policy;
- vendor acknowledgement/error taxonomy;
- rollback or correction process;
- support escalation path;
- audit retention requirements;
- approved credential secret names, not secret values.

## 8. ClinicOS Live Integration Contracts And Event Bus

Required inputs:

- ClinicOS environment and tenant mapping source;
- delegated identity contract;
- AURA Note tenant/site/user role mapping rules;
- M03 VisitGraph contract;
- M04 WorkOS/task contract;
- M17 NP Cockpit embedding contract;
- M21 Charge Integrity contract;
- M23 Copilot Runtime contract;
- M24 AI Governance contract;
- M25 Integration Hub contract;
- M26 Data Cloud contract;
- event-bus provider and delivery semantics;
- replay and reconciliation owner;
- raw payload storage policy;
- failure/degraded mode policy;
- permission-boundary review confirming ClinicOS cannot bypass AURA Note rules.

## 9. Production Observability, SIEM/APM, And Support Operations

Required inputs:

- selected log sink;
- selected metrics/APM provider;
- selected tracing backend;
- SIEM destination;
- log retention window;
- metric retention window;
- trace retention window;
- PHI redaction review approval;
- alert thresholds;
- SLO/SLA targets;
- on-call owner and schedule;
- incident severity taxonomy approval;
- support ticket system;
- support access policy;
- break-glass policy, if any;
- operational status page owner.

## 10. Revenue Estimate And Patient-Facing Financial Policy

Required inputs:

- whether patient-facing financial estimates are allowed in v1;
- source data for fee schedule, payer contracts, benefits, or other estimate basis;
- caveat/disclaimer language;
- role allowed to configure estimates;
- tenant-level enablement policy;
- patient-summary exclusion rules;
- audit requirements for displayed estimates;
- support policy for estimate disputes;
- compliance/legal reviewer;
- explicit approval before any patient-facing financial conclusion is enabled.

## 11. Claim, Clearinghouse, Payer, Denial, And Payment Strategy

Required inputs:

- whether live claim submission remains out of v1 or is proposed for a later release;
- clearinghouse candidate, if any;
- payer API scope, if any;
- claim object ownership model;
- charge finalization owner;
- medical-necessity determination boundary;
- human approval workflow;
- denial workflow scope;
- payment posting scope;
- void/reversal/correction process;
- audit retention requirements;
- compliance/legal reviewer;
- explicit approval before `claimSubmissionEnabled` can ever change from false.

## 12. Beta Pilot Execution And Production Launch Go/No-Go

Required inputs:

- beta tenant/site list;
- pilot users and roles;
- training owner;
- support owner;
- launch window;
- success metrics;
- exclusion criteria;
- disabled features accepted for pilot;
- live integrations allowed or explicitly disabled;
- production data policy;
- rollback plan;
- incident response coverage;
- founder approval;
- clinical approval;
- compliance/privacy approval;
- security approval.

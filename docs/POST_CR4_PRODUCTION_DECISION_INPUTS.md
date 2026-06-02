# Post-CR4 Production Decision Inputs

This file lists exactly what Codex needs from the founder/operator and reviewers before each deferred production decision can be implemented or promoted from `planned` to `todo`.

Do not place secrets, passwords, tokens, private keys, real patient data, production PHI, or `.env` contents in this repository. Credentials must be provided through an approved secret store or local secure runtime configuration after the relevant work order is promoted.

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

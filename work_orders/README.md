# Work Orders

Codex must complete work orders sequentially unless a checkpoint or blocker stops progress.

## Status source

`repo_status.json` is the machine-readable status source. Codex should update it after each completed work order.

## Work order sequence

- `WO-000` — Repository foundation.
- `WO-001` — Domain model, contracts, events, security skeleton.
- `WO-002` — Schedule Builder and appointment-note lifecycle.
- `WO-003` — Draft/Finalized Notes and Documentation Workspace shell.
- `WO-004` — Timer, recording gate, transcription scaffold.
- `WO-005` — Suggestions, Visit Selections, Compliance, History Gap Review.
- `WO-006` — Finalization Wizard steps 1–4.
- `WO-007` — Billing & Attest, draft claim preview, Sign & Dispatch.
- `WO-008` — Export/PDF/copy/final note viewer.
- `WO-009` — AI Gateway and PHI boundary.
- `WO-010` — EHR adapters with athenahealth-first path.
- `WO-011` — ClinicOS integration adapter.
- `WO-012` — Coaching and analytics scaffolding.
- `WO-013` — Production hardening, observability, retention, audit.
- `WO-014` — End-to-end acceptance and readiness report.
- `WO-015` — Persistence migration foundation.
- `WO-016` — Tenant identity and access foundation.
- `WO-017` — Committed browser E2E and accessibility suite.
- `WO-018` — Observability, deployment, and support runbooks.
- `WO-019` — Design system, UX hardening, and compliance review package.
- `WO-020` — Persistence runtime readiness.
- `WO-021` — Prisma adapter scaffold.
- `WO-022` — Persistence UUID projection readiness.
- `WO-023` — Core Prisma relationship readiness.
- `WO-024` — Visit, recording, and transcript Prisma relationship readiness.
- `WO-025` — Review panel Prisma relationship readiness.
- `WO-026` — Finalization Prisma relationship readiness.
- `WO-027` — Output and writeback Prisma relationship readiness.
- `WO-028` — Local database orchestration readiness.
- `WO-029` — Local PostgreSQL migration apply and rollback evidence.
- `WO-030` — Prisma schedule runtime adapter.
- `WO-031` — Tenant isolation and core RLS evidence.
- `WO-032` — Azure Blob export delivery and retention deletion readiness.
- `WO-033` — Production build rails and readiness controls.
- `WO-034` — Durable visit capture runtime persistence.
- `WO-035` — Durable review panels, selections, compliance, and task persistence.
- `WO-036` — Durable finalization, output metadata, and writeback queue persistence.
- `WO-037` — Durable audit, events, support, configuration, coaching, and broad RLS completion.
- `WO-038` — Standalone patient, chart context, and schedule completion.
- `WO-039` — Standalone worklists, settings, templates, estimates, and rules catalog.
- `WO-040` — Browser audio capture and transcription candidate.
- `WO-041` — Production identity, tenant administration, secrets, configuration, and feature flags.
- `WO-042` — Azure storage, secure downloads, retention deletion, backup, and restore controls.
- `WO-043` — Production observability, support operations, and status views.
- `WO-044` — EHR sandbox integration and writeback queue hardening.
- `WO-045` — ClinicOS integration hardening.
- `WO-046` — AI Gateway production governance and evaluation harness.
- `WO-047` — Security, privacy, compliance, and threat-model remediation.
- `WO-048` — UX, accessibility, responsive, and visual regression hardening.
- `WO-049` — Deployment, environment promotion, performance, reliability, and operational drills.
- `WO-050` — Beta pilot and limited production launch gate.
- `WO-051` — Claim submission and payer integration decision gate.
- `WO-052` — Post-P11 continuation rails and tranche intake.
- `WO-053` — Production identity and account lifecycle review intake.
- `WO-054` — Production PHI persistence and database operations review intake.
- `WO-055` — Production Azure storage, deletion, and restore review intake.
- `WO-056` — Live transcription provider review intake.
- `WO-057` — External AI private/BAA pathway review intake.
- `WO-058` — Production EHR writeback credentialing review intake.
- `WO-059` — ClinicOS live integration review intake.
- `WO-060` — Commercial readiness rebaseline and runtime implementation rails.
- `WO-061` — Runtime persistence switchover for core workflow.
- `WO-062` — API runtime hardening and request boundary.
- `WO-063` — Identity runtime boundary and production fail-closed auth scaffold.
- `WO-064` — Primary UI runtime API conversion.
- `WO-065` — Figma-ready basic UI scaffold and screen inventory.
- `WO-066` — Standalone workflow completion.
- `WO-067` — ModeResolver and adapter runtime wiring.
- `WO-068` — Transcription runtime boundary and provider-ready interface.
- `WO-069` — Athenahealth sandbox and vendor-neutral EHR runtime boundary.
- `WO-070` — AI governance runtime boundary and evaluation harness expansion.
- `WO-071` — Security, privacy, compliance, and threat-model runtime hardening.
- `WO-072` — Observability, SRE, support, and incident operations.
- `WO-073` — Billing, revenue integrity, claim-decision, and compliance boundary completion.
- `WO-074` — Beta pilot commercial readiness package.
- `WO-075` — Commercial readiness decision gate.

## Work order rules

- Implement only the active work order and prerequisites.
- Update tests and docs with every work order.
- Stop at checkpoint gates.
- Create SPEC_GAPs instead of inventing missing behavior.
- Future work orders may be listed as `planned` in `repo_status.json`. Codex should treat the first `todo` or `in_progress` work order as active.

## Post-CP4 planning

The defined AURA Note v1 synthetic local-first work-order sequence ends at `WO-014`.

Post-CP4 productionization candidates are documented in `docs/POST_CP4_PRODUCTIONIZATION_BACKLOG.md`. They are planning artifacts only until a tranche is promoted into a numbered `work_orders/WO-###_*.md` file and `repo_status.json` is updated deliberately.

`WO-015` promotes the first post-CP4 productionization tranche into an active persistence migration foundation. Runtime repository replacement remains out of scope until a later numbered work order.

`WO-016` promotes the second post-CP4 productionization tranche into an active local synthetic tenant identity and access foundation. Production SSO, MFA, and identity administration remain out of scope until a later numbered work order.

`WO-017` promotes the third post-CP4 productionization tranche into a committed Playwright browser E2E and accessibility-oriented route regression suite. Visual regression and final design-system work remain out of scope until later numbered work orders.

`WO-018` promotes the fourth post-CP4 productionization tranche into a local-first observability, deployment matrix, and support runbook foundation. Production observability vendors, deployment automation, audit export download delivery, and destructive retention deletion remain out of scope until later numbered work orders.

`WO-019` promotes the fifth post-CP4 productionization tranche into an initial design-token, UX copy review, responsive browser hardening, and compliance/security/privacy review package. Final Figma fidelity, visual regression baselines, compliance certification, and production launch approval remain out of scope.

`WO-020` promotes the next persistence follow-on into a repository-seam and migration-readiness tranche. Runtime still defaults to the in-memory adapter; live database connection, production PHI storage, and full Prisma-backed repository replacement remain out of scope until later numbered work orders.

`WO-021` promotes a disabled Prisma adapter scaffold into a package-level persistence boundary. It maps schedule/note DTOs into synthetic row projections and keeps runtime database writes disabled until later local database integration evidence exists.

`WO-022` hardens the disabled Prisma projection so schema ID and reference fields use deterministic UUID-shaped values while semantic fixture identifiers remain natural keys. Runtime database writes remain disabled.

`WO-023` adds core Prisma relation fields and migration SQL checks for the tenant/site/user/patient/appointment/note graph. Runtime database writes remain disabled.

`WO-024` adds Prisma relation fields and migration SQL checks for visit sessions, recording assets, transcripts, and transcript segments. Runtime database writes remain disabled.

`WO-025` adds Prisma relation fields and migration SQL checks for suggestions, Visit Selections, compliance issues, History Gap questions, and blocker tasks. Runtime database writes remain disabled.

`WO-026` adds Prisma relation fields and migration SQL checks for finalization runs, wizard decisions, enhanced note versions, patient summary versions, billing attestations, and draft claim previews. Runtime database writes remain disabled.

`WO-027` adds Prisma relation fields and migration SQL checks for export artifacts and EHR writeback jobs. Runtime database writes and live writeback remain disabled.

`WO-028` adds a local PostgreSQL compose contract and static readiness verifier. Runtime database writes, live migration apply/rollback, Prisma Client runtime usage, row-level security, and production PHI persistence remain disabled.

`WO-029` adds live local PostgreSQL apply/rollback evidence using generated Prisma SQL against the synthetic compose database. Runtime database writes, Prisma Client runtime usage, row-level security, tenant-scoped live query tests, and production PHI persistence remain disabled.

`WO-030` adds the first Prisma-backed runtime adapter slice for standalone schedule appointment and note shell persistence against the local synthetic PostgreSQL database. The broad API runtime remains on the in-memory adapter until later workflow state can be moved safely.

`WO-031` adds live local PostgreSQL tenant/site query evidence and adopts core row-level security policies for the currently persisted schedule/note slice only. Broader-table RLS expansion and full Prisma-backed workflow persistence remain out of scope.

`WO-032` adds Azure Blob-oriented object storage adapter boundaries, storage-backed export/audit delivery metadata, and raw-audio storage deletion readiness with synthetic approval controls. Real Azure credentials, production storage execution, PHI-bearing payloads, and production backup/restore execution remain out of scope.

`WO-033` re-establishes the production build rails after `WO-032`. It updates status semantics, checkpoint sequence, readiness scripts, `SPEC_GAPS.md`, and future-work-order discoverability. It does not implement runtime product behavior.

`WO-034` through `WO-037` form the P7 durable runtime candidate. They move broad workflow state to local Prisma/PostgreSQL persistence, add tenant/site query enforcement, expand RLS coverage, and make audit/event records durable.

`WO-036` adds durable local finalization/output/writeback metadata evidence for signed final note, patient summary, billing attestation, draft claim preview, export artifacts, and EHR writeback queue state. `WO-037` completes durable audit/event/support/config/coaching state and broad RLS evidence, closing P7 as synthetic/local durable runtime evidence.

`WO-038` through `WO-039` form the P7.5 standalone product completion candidate. They complete standalone patient/chart/schedule/worklist/settings/template/estimate/rules-catalog surfaces so core v1 operation does not depend on ClinicOS. P7.5 is complete once `WO-039` is implemented, tested, and merged.

`WO-040` forms the P8.5 audio and transcription candidate. It adds browser microphone capture, metadata-only recording transport, transcription adapters, mock provider coverage, retention metadata, correction history, and provider-governance boundaries. Live transcription providers and production PHI audio storage remain disabled unless a later governance work order explicitly authorizes them. P8.5 is complete once `WO-040` is implemented, tested, merged, and recorded in the checkpoint report.

`WO-041` through `WO-043` form the P8 production platform candidate. `WO-041` is complete as synthetic production-shaped identity/config/feature-flag governance evidence. `WO-042` is complete as synthetic server-mediated secure download, retention deletion approval/recovery, and backup/restore readiness evidence. `WO-043` is complete as synthetic production observability, support operations, operational evidence, and status-view readiness. P8 is complete once `WO-043` is implemented, tested, merged, and recorded in the checkpoint report.

`WO-044` through `WO-047` form the P9 integration and AI candidate. `WO-044` is complete as synthetic/browser/API-testable EHR sandbox integration and writeback queue hardening evidence. EHR writeback remains metadata-only with human approval, idempotency, retry, dead-letter, reconciliation, role-denial, PHI rejection, and audit/event coverage; no live production EHR writeback is enabled. `WO-045` is complete as synthetic/browser/API-testable ClinicOS integration hardening evidence. ClinicOS mode now exposes metadata-only module boundaries, stale/degraded mapping review, failed/degraded event publication metadata, service-account/cross-tenant denial, and AURA Note permission-boundary evidence; no live ClinicOS sync or raw payload storage is enabled. `WO-046` is complete as synthetic/browser/API-testable AI Gateway governance hardening evidence. The AI Gateway now exposes prompt/model metadata, deterministic evaluation cases, unsafe output rejection, source-linked evidence, human-review gates, and no-live-model/no-raw-PHI-to-external-AI proof. `WO-047` is complete as synthetic/local P9 security/privacy/compliance and threat-model review evidence. P9 is complete with no active SPEC_GAPs for the synthetic/local scope, but it does not certify HIPAA compliance, security readiness, privacy readiness, or launch readiness.

`WO-048` through `WO-050` form the P10 launch candidate. `WO-048` is complete as synthetic/local frontend runtime-integration gate evidence: it adds a typed web API client, an API-backed runtime evidence route, a route inventory, a named readiness verifier, and Playwright evidence from appointment creation through finalization/export with reload/refetch proof. `WO-049` is complete as synthetic/local launch operations readiness evidence: it adds launch-operations docs/runbook coverage, support-status launch drill states, a deterministic performance baseline, and `pnpm launch:ops-readiness`. `WO-050` is complete as synthetic/local beta-pilot and limited-launch decision-package evidence: it adds pilot readiness docs/runbook coverage, support-status pilot gate states, a deterministic smoke harness, `pnpm pilot:readiness`, and `pnpm launch:readiness`. P10 is complete as a decision package only; `productionLaunchApproved=false`, `productionLaunchReady=false`, `submittedClaim=false`, and live production launch still requires explicit founder/clinical/compliance/security approval.

`WO-051` is complete as the P11 claim/payer decision gate. It captures the strategy for claim submission, clearinghouse, payer integration, denial automation, and payment workflows without implementing autonomous submission by default. P11 is complete as a decision package only: `submittedClaim=false`, `claimSubmissionEnabled=false`, no clearinghouse API, no payer API, no denial automation, no payment posting, no charge finalization, no medical-necessity determination, and no patient-facing financial conclusion are enabled.

`WO-052` is complete as a post-P11 planning/control tranche. It adds continuation rails, candidate future tranche families, activation criteria, and `pnpm post-p11:readiness` without authorizing live production, vendor, claim, PHI, or launch behavior.

`WO-053` is complete as a post-P11 planning/control intake tranche for production identity and account lifecycle review. It promotes the first candidate future tranche family into a fully specified decision package and readiness verifier without enabling live OIDC/SAML, ClinicOS delegated identity, production credentials, PHI access, runtime identity behavior, or launch behavior.

`WO-054` is complete as a post-P11 planning/control intake tranche for production PHI persistence and database operations review. It promotes the second candidate future tranche family into a fully specified decision package and readiness verifier without enabling production PHI storage, production database credentials, live migrations, runtime repository changes, support database access, backup/restore execution, or launch behavior.

`WO-055` is complete as a post-P11 planning/control intake tranche for production Azure storage, deletion, and restore review. It promotes the third candidate future tranche family into a fully specified decision package and readiness verifier without enabling live Azure credentials, PHI-bearing object delivery, public URLs, destructive production deletion, production restore execution, PHI-bearing audit exports, runtime storage behavior, or launch behavior.

`WO-056` is complete as a post-P11 planning/control intake tranche for live transcription provider review. It promotes the fourth candidate future tranche family into a fully specified decision package and readiness verifier without enabling live transcription credentials, PHI-bearing audio transport, live provider calls, production raw-audio storage, PHI-bearing support transcript access, runtime transcription behavior, or launch behavior.

`WO-057` is complete as a post-P11 planning/control intake tranche for external AI private/BAA pathway review. It promotes the fifth candidate future tranche family into a fully specified decision package and readiness verifier without enabling live AI credentials, raw-PHI-to-external-AI paths, live model calls, production prompt stores, support AI PHI content access, autonomous finalization, runtime AI behavior, or launch behavior.

`WO-058` is complete as a post-P11 planning/control intake tranche for production EHR writeback credentialing review. It promotes the sixth candidate future tranche family into a fully specified decision package and readiness verifier without enabling production EHR credentials, raw EHR payload storage, live writeback delivery, writeback without human approval, autonomous finalization, runtime EHR behavior, claim submission, or launch behavior.

`WO-059` is complete as a post-P11 planning/control intake tranche for ClinicOS live integration review. It promotes the seventh candidate future tranche family into a fully specified decision package and readiness verifier without enabling live ClinicOS credentials, live event-bus delivery, delegated identity bypass, raw ClinicOS payload storage, live synchronization, runtime ClinicOS behavior, autonomous finalization, claim submission, or launch behavior.

`WO-060` is complete as the CR-0 commercial-readiness rails reopening. It replaces the post-P11 `next_work_order: null` state with a new runtime implementation sequence, adds CR-0 through CR-4 checkpoints, records remaining synthetic-to-runtime gaps, and keeps production launch approval false. It does not enable live vendors, live PHI, production credentials, autonomous clinical/coding/billing behavior, claim submission, or production launch.

`WO-061` is complete as the first CR-1 runtime foundation tranche. It moves `ScheduleService` behind explicit repository/storage ports, labels in-memory usage as demo/test adapter behavior, adds the `createPrismaCoreWorkflowRuntimeRepository` composite adapter, and adds `pnpm runtime:persistence-readiness` evidence for local PostgreSQL service-recreation persistence across appointment, visit, Visit Selection, finalization, export, audit, and domain state. This is still synthetic/local evidence only; production PHI database approval remains out of scope.

`WO-062` is complete as the second CR-1 runtime foundation tranche. It adds a shared Nest API runtime boundary used by `main.ts` and e2e tests, global request validation, PHI-safe error envelopes, request/trace correlation headers, security headers, body-size guardrails, local rate-limit scaffolding, redacted structured runtime logs, OpenAPI/contract error-envelope seeds, and `pnpm api:runtime-hardening-readiness`. This is still synthetic/local request-boundary evidence only; production WAF/CDN, live SIEM/APM, production auth, live vendors, PHI-bearing production storage, claim submission, and production launch remain out of scope.

`WO-063` is complete as the third CR-1 runtime foundation tranche. It adds a shared identity runtime boundary that requires explicit `AURA_NOTE_AUTH_MODE`, labels local demo synthetic identity, requires role/user/session/purpose in strict local synthetic mode, rejects synthetic headers in preview/production/delegated modes, and fails closed for disabled users, expired sessions, wrong tenant/site, wrong purpose, missing identity context, invalid identity context, and delegated providers until configured. `pnpm identity:runtime-boundary-readiness` records the evidence. CR-1 is complete as a runtime foundation checkpoint.

`WO-064` is complete as the first CR-2 product UX runtime tranche. It converts primary production-intended AURA Note routes to typed API-backed runtime state, expands the web API client, preserves API-backed loading/empty/ready/saving/failed/permission-denied/read-only/degraded/disabled states, keeps local React state transient or documented-demo only, and adds `pnpm frontend:primary-runtime-readiness` evidence. `WO-065` is the next active CR-2 work order.

`WO-061` through `WO-063` form the CR-1 runtime foundation candidate. They move core runtime services behind repository ports with local Prisma/PostgreSQL as the production-shaped local runtime path, harden the Nest API request boundary, and make synthetic header identity fail closed outside explicit local/demo modes.

`WO-064` through `WO-066` form the CR-2 product UX runtime candidate. `WO-064` is complete; `WO-065` and `WO-066` remain to complete the basic UI/Figma handoff inventory and prove a standalone daily workflow without ClinicOS dependency.

`WO-067` through `WO-070` form the CR-3 integration and governance runtime candidate. They enforce standalone/ClinicOS mode adapter boundaries and prepare transcription, EHR, AI, and ClinicOS integration paths as production-shaped but safely disabled or mock/sandbox-governed runtime paths.

`WO-071` through `WO-075` form the CR-4 commercial readiness review candidate. They harden security/privacy/compliance, observability/support, billing/revenue integrity, beta-pilot packaging, and the final commercial-readiness decision packet without granting production launch approval.

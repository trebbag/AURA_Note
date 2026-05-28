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

`WO-041` through `WO-043` form the P8 production platform candidate. They harden identity, tenant administration, config/secrets, feature flags, Azure storage/download/retention/backup/restore, observability, support operations, and status views.

`WO-044` through `WO-047` form the P9 integration and AI candidate. They harden EHR, ClinicOS, AI governance/evaluation, and security/privacy/compliance evidence without enabling prohibited autonomous behavior.

`WO-048` through `WO-050` form the P10 launch candidate. They cover UX/accessibility/visual regression, deployment/release controls, performance/reliability/operational drills, beta readiness, and limited launch governance.

`WO-051` is the P11 claim/payer decision gate. It captures the strategy for claim submission, clearinghouse, payer integration, denial automation, and payment workflows without implementing autonomous submission by default.

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

## Work order rules

- Implement only the active work order and prerequisites.
- Update tests and docs with every work order.
- Stop at checkpoint gates.
- Create SPEC_GAPs instead of inventing missing behavior.

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

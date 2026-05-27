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

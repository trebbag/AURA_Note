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

## Work order rules

- Implement only the active work order and prerequisites.
- Update tests and docs with every work order.
- Stop at checkpoint gates.
- Create SPEC_GAPs instead of inventing missing behavior.

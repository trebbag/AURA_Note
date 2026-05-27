# WO-018 — Observability, Deployment, And Support Runbooks

## Source traceability

- `docs/POST_CP4_PRODUCTIONIZATION_BACKLOG.md` tranche P5-04.
- `docs/specs/AURA_NOTE_V1_CANONICAL_BUILD_SPEC.md` sections 66, 72.2, and 111.2-111.4.
- `docs/BACKEND_BUILD_SPEC.md` observability, audit, retention, support tools, and service rules.
- `work_orders/WO-013_production_hardening_observability_retention_audit.md`.
- `docs/runbooks/WO-013_SUPPORT_HARDENING_RUNBOOK.md`.

## Scope

Promote the fourth post-CP4 productionization tranche into an active local-first foundation. Define and expose local structured log, metric, trace, and audit-export sink scaffolding; document deployment environment expectations; and extend support runbooks for deploy, rollback, incident triage, audit export handling, retention review, and disabled integration review.

## In scope

- Extend typed contracts for observability sink status, metric probes, trace probes, deployment environments, and runbook index items.
- Extend local security helpers with PHI-safe observability probes and local sink snapshots.
- Extend support status API, tests, and browser shell to show local observability/deployment/runbook posture.
- Add deployment matrix and observability sink documentation.
- Add a WO-018 runbook covering deploy, rollback, incident severity, audit export handling, retention review, and external integration disabled states.

## Out of scope

- Production log, trace, SIEM, APM, storage, or analytics vendor integration.
- Production secrets, credentials, `.env` files, private keys, or PHI-bearing samples.
- Production deployment automation, infrastructure provisioning, destructive retention purge, live EHR writeback, live ClinicOS sync, live AI, claim submission, or production audit file delivery.
- New clinical, billing, coding, finalization, patient-summary, coaching, or integration behavior.

## Acceptance criteria

- Local support status includes redacted request-correlated structured logging plus local metric and trace probe status.
- Production observability sinks remain explicitly disabled until configured.
- Deployment matrix identifies local, preview, staging, and production requirements without committing secrets.
- Runbooks cover deploy, rollback, incident triage, audit export handling, retention review, and disabled integrations.
- Unit, API e2e, and browser tests cover the new support status evidence.
- `RUN_LOG.md`, `repo_status.json`, docs, OpenAPI, and this work order reflect the evidence and boundaries.

## Definition of done

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm lint:phi`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm test:browser`
- `pnpm build`
- `pnpm acceptance:readiness`
- `pnpm persistence:foundation`
- `node scripts/status.js`
- `git diff --check`

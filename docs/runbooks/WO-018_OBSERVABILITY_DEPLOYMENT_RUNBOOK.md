# WO-018 Observability Deployment Runbook

This runbook extends the `WO-013` hardening runbook for the post-CP4 observability/deployment tranche. It is synthetic and local-first; it does not authorize production PHI, live AI, live EHR writeback, live ClinicOS sync, production analytics delivery, production audit export download, or destructive retention purge.

## Deploy Review

Before deploying any environment beyond local:

1. Confirm `pnpm install --frozen-lockfile`, lint, PHI lint, typecheck, tests, browser tests, build, readiness, persistence validation, and status checks pass.
2. Confirm `repo_status.json` reflects only completed work orders.
3. Confirm `SPEC_GAPS.md` has no active blocking entry.
4. Confirm environment variables are supplied by the deployment platform or secrets manager, not committed to git.
5. Confirm external integration feature flags remain disabled unless a later work order provides approval evidence.
6. Confirm support status shows request-correlated, PHI-redacted logs and disabled production sinks.

## Rollback

Use the smallest rollback that restores a safe state:

1. Revert the release commit or redeploy the previous known-good image.
2. Preserve audit/event logs and do not delete operational evidence.
3. If a migration is involved, pause writes and review the generated migration plan before rollback. Do not run destructive schema rollback without approval.
4. Keep external AI, EHR writeback, ClinicOS sync, production analytics, and audit downloads disabled during rollback unless their later work orders explicitly approve them.
5. Add a `RUN_LOG.md` entry describing the release, rollback trigger, commands run, tests run, and remaining risk.

## Incident Severity

| Severity | Examples | Immediate action |
| --- | --- | --- |
| Sev 1 | PHI exposure, unauthorized access, live claim/writeback side effect, destructive purge | Disable affected route/flag, preserve evidence, escalate for founder/security review. |
| Sev 2 | Failed finalization/export/writeback queue, audit export defect, cross-tenant denial failure | Stop affected workflow, keep safe degraded mode, run narrow regression tests. |
| Sev 3 | Browser route regression, support status degraded, local observability probe failure | Fix through normal PR flow and keep production sinks disabled. |
| Sev 4 | Documentation mismatch, runbook stale detail, nonblocking warning | Patch docs/status and include in next verification batch. |

## Audit Export Handling

- Audit export remains metadata-only and redacted by default.
- `includePhi` must be `false`.
- Download delivery remains disabled until storage delivery, encryption, access review, retention, and audit trail behavior are specified.
- Compliance/privacy lead or authorized admin permission is required.
- Support users can view status but cannot request audit export.

## Retention Review

- Raw audio policy remains one week with candidate scanning only.
- Transcript retention remains indefinite unless future tenant policy changes.
- Audit retention follows tenant policy in scaffold form.
- Destructive purge remains disabled until approval, recovery, storage, and audit behavior are implemented and tested.

## Disabled Integration Review

Before enabling an external integration, verify a later work order has implemented:

- explicit tenant configuration and credentials outside git;
- RBAC/ABAC and purpose-of-use checks;
- request IDs, trace IDs, audit events, and redacted logs;
- retry/failure/degraded-mode behavior;
- human approval gates for clinical, billing, finalization, writeback, and export effects;
- tests proving no autonomous diagnosis, coding, billing, medical-necessity determination, claim submission, or PHI-bearing AI path is introduced.

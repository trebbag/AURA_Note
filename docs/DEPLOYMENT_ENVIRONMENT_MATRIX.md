# Deployment Environment Matrix

This matrix documents the `WO-018` deployment posture for AURA Note v1. It is a configuration contract, not a production deployment claim.

`WO-049` extends this matrix with launch-operations rehearsal evidence in `docs/LAUNCH_OPERATIONS_READINESS.md` and `docs/runbooks/WO-049_LAUNCH_OPS_RUNBOOK.md`. The updated launch path keeps production blocked by default, requires `pnpm launch:ops-readiness`, and still requires founder/clinical/compliance/security approval before any limited launch.

| Environment | Readiness | Data allowed | Required secret classes | External integrations |
| --- | --- | --- | --- | --- |
| Local | Ready local | Synthetic only | None required by default | None. |
| Preview | Configuration required | Synthetic only | `DATABASE_URL`, `SESSION_SIGNING_KEY`, `AUDIT_LOG_SALT` | Audit export download remains disabled unless a later work order enables storage delivery. |
| Staging | Configuration required | Synthetic or approved test data only | `DATABASE_URL`, `SESSION_SIGNING_KEY`, `OBJECT_STORAGE_BUCKET`, `OBSERVABILITY_EXPORTER_URL` | EHR, ClinicOS, production analytics, and audit download require explicit sandbox/test configuration. |
| Production | Blocked until security review | Not allowed by this work order | `DATABASE_URL`, `SESSION_SIGNING_KEY`, `OBJECT_STORAGE_BUCKET`, `OBSERVABILITY_EXPORTER_URL`, `SIEM_EXPORTER_URL`, `KMS_KEY_ID` | External AI, EHR writeback, ClinicOS sync, production analytics, and audit download require separate approvals and implementation evidence. |

## Deployment gates

- No `.env`, credential, production connection string, private key, or PHI-bearing seed may be committed.
- Production deployment remains blocked until security, privacy, secret management, observability vendor, retention, rollback, and incident-response decisions are approved.
- Every environment must preserve tenant scoping, RBAC/ABAC, request IDs, trace IDs, redacted logs, audit events, and disabled external integrations unless explicitly configured.
- Destructive retention purge remains disabled until storage, approval, recovery, and audit behavior are specified and tested.

## Rollback posture

- Rollback starts with code revert or previous release redeploy.
- Database rollback requires migration-specific review because `WO-015` introduced schema tooling but not production migration execution.
- External integrations stay disabled by default, so rollback must preserve safe degraded modes rather than attempting live vendor retries.

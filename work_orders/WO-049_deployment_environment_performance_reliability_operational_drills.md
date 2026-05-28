# WO-049 — Deployment, Environment Promotion, Performance, Reliability, And Operational Drills

## Objective

Create synthetic/local launch-candidate evidence for deployment controls, environment promotion, performance testing, reliability drills, operational runbooks, and release rollback posture without performing a production deployment.

## Why this exists

`WO-048` adds frontend runtime integration evidence, but P10 still needs operational proof that AURA Note can be promoted, observed, rolled back, and supported safely. Commercial launch-candidate review requires environment definitions, release controls, smoke checks, reliability/failure drills, and support playbooks before a limited launch can be considered.

## Prerequisites

- `WO-048` is complete and merged.
- P8/P9 platform, observability, EHR, ClinicOS, AI governance, and security review gates remain passing.
- No production credentials, real PHI, live vendors, or production deployment authority are required.

## In Scope

- Local/staging/production environment matrix and promotion rules.
- Deployment runbook or automation scaffold for build, migrate, smoke test, rollback, and release evidence.
- Production-shaped health checks and smoke checks for web, API, worker, persistence, storage, retention, EHR, ClinicOS, AI gateway, and support status.
- Performance/load test harness using synthetic data only.
- Reliability/failure drills for disabled vendors, unavailable API/storage/AI/EHR/ClinicOS, expired sessions, denied roles, failed writeback, failed exports, and retention deletion recovery windows.
- Incident response, access review, rollback, and support escalation runbooks.
- A named readiness gate, for example `pnpm launch:ops-readiness`, that remains synthetic/local and does not claim production launch approval.

## Out of Scope

- Production deployment execution.
- Real staging or production credentials.
- Live EHR, ClinicOS, AI, transcription, SIEM/APM, object storage, or clearinghouse integrations.
- Real PHI, patient data, production URLs, secrets, private keys, or `.env` files.
- Final founder/clinical/compliance/security launch approval.

## UX Requirements

- Support/status and platform surfaces must show degraded, failed, permission-denied, disabled, read-only, and recovery states clearly.
- Operational state labels must not imply production launch readiness or live vendor execution.
- Critical controls must remain keyboard accessible and have accessible names.

## Backend/API Requirements

- Health/smoke evidence must be available through existing API/support/platform boundaries or documented synthetic scripts.
- State-changing operational evidence must be tenant/site scoped, permission checked, audit-safe, and event documented when API-backed.
- Disabled live vendor paths must fail closed with clear metadata.

## Data Model/Persistence Requirements

- No new production persistence is required unless synthetic operational evidence records are added.
- Any evidence metadata must remain synthetic, tenant scoped, and free of PHI/secrets.
- Existing backup/restore and retention metadata must remain intact.

## Event/Audit Requirements

- Deployment, smoke-test, incident-drill, rollback, access-review, and reliability-drill evidence must be documented as audit-safe records or event stubs.
- No PHI-bearing logs, raw vendor payloads, or secret values may be emitted.

## RBAC/ABAC Requirements

- Operational readiness and evidence recording must remain limited to authorized admin, compliance/privacy, clinic manager, support, or service-account roles as appropriate.
- Support users must remain metadata-only and cannot gain access to transcripts, final notes, billing details, coaching outputs, raw AI prompts, or raw EHR/ClinicOS payloads.

## Standalone-Mode Behavior

- Standalone deployment and smoke checks must not depend on ClinicOS being available.
- Standalone schedule, workflow, finalization/export, support status, and operations readiness must be represented in smoke coverage.

## ClinicOS-Integrated Behavior

- ClinicOS-integrated mode must degrade safely when ClinicOS delegation, event publication, or mapping services are disabled or unavailable.
- ClinicOS must not bypass AURA Note permissions or operational safety gates.

## AI/PHI/Security Requirements

- No raw PHI may be sent to external AI or vendors.
- AI and billing outputs remain draft/candidate/human-review-required.
- Logs, traces, runbooks, screenshots, and evidence files must avoid secrets, production URLs, real patient data, private keys, and PHI-bearing samples.

## Testing Requirements

- Add tests or readiness scripts for deployment smoke checks, disabled-vendor failure modes, rollback evidence, performance/load harness execution, reliability drill metadata, access-review evidence, and role-denied operational access.
- Preserve existing full gate coverage, including frontend runtime integration readiness.

## Required Scripts/Gates

- `pnpm launch:ops-readiness` or equivalent.
- `pnpm frontend:runtime-integration-readiness`.
- `pnpm install --frozen-lockfile`.
- `pnpm db:client:generate`.
- `pnpm lint`.
- `pnpm lint:phi`.
- `pnpm typecheck`.
- `pnpm test`.
- `pnpm test:e2e`.
- `pnpm test:browser`.
- `pnpm build`.
- all current persistence/storage/retention/identity/config/observability/EHR/ClinicOS/AI/security/readiness scripts.
- `pnpm production:readiness`.
- `pnpm acceptance:readiness`.
- `node scripts/status.js`.
- `git diff --check`.

## Definition of Done

- Environment matrix, deployment/promotion/rollback runbook, incident/access-review runbooks, performance/load harness, and reliability/failure drills are documented and testable with synthetic data.
- A named operational launch-readiness gate exists, runs in CI, and does not claim production launch approval.
- Support/platform/status surfaces reflect operational degraded and blocked states.
- `RUN_LOG.md`, `repo_status.json`, `docs/TEST_PLAN.md`, `docs/BACKEND_BUILD_SPEC.md`, `docs/UX_BUILD_SPEC.md`, and relevant runbooks are updated.
- CI and local gates pass.

## Stop Conditions

- A production deployment, credential, production URL, live vendor, or real PHI is required.
- A reliability drill requires policy decisions that are missing or safety-critical.
- Operational readiness evidence would imply launch approval without founder/clinical/compliance/security signoff.
- Three focused repair attempts fail to resolve a build, test, browser, or runtime blocker.

## Risks And Deferred Decisions

- Production hosting target, staging URL, secret manager, SIEM/APM vendor, on-call owner, SLO/SLA targets, incident severity taxonomy, and final launch approval remain deferred unless explicitly decided in this work order.

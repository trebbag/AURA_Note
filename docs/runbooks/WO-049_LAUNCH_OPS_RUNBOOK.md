# WO-049 Launch Operations Runbook

This runbook supports synthetic/local launch-operations evidence for `WO-049`. It does not authorize production deployment, production PHI, live vendor traffic, live AI, live EHR/ClinicOS sync, destructive deletion, charge finalization, medical-necessity determination, autonomous coding/billing, or claim submission.

## build, migrate, smoke, rollback

1. Build: run `pnpm install --frozen-lockfile`, `pnpm db:client:generate`, `pnpm lint`, `pnpm lint:phi`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm test:browser`, and `pnpm build`.
2. Migrate: run the existing synthetic PostgreSQL migration apply/rollback evidence before any staging rehearsal.
3. Smoke: run persistence, storage, retention, identity, config, observability, EHR, ClinicOS, AI, security, frontend runtime, production, acceptance, and `pnpm launch:ops-readiness` gates.
4. Rollback: disable high-risk feature flags, redeploy the last known good artifact, preserve audit evidence, and do not run destructive database rollback without migration-owner and compliance/security approval.

## failure drill

Each drill must record synthetic tenant/site, actor role, trace ID, affected subsystem, expected degraded state, actual result, rollback decision, and follow-up owner. Evidence must remain metadata-only and must not include PHI, secrets, production URLs, raw transcripts, final notes, billing details, raw AI prompts, EHR payloads, ClinicOS payloads, or storage object payloads.

## disabled vendor

Live AI, EHR, ClinicOS, transcription, storage delivery, observability sinks, and claim submission stay disabled unless a later approved work order supplies credentials, policy, and launch approval. When a disabled vendor path is exercised, the expected outcome is fail-closed metadata: no payload delivery, no external write, no public URL, and no bypass of AURA Note permissions.

## retention deletion recovery window

Retention deletion remains guarded by feature flag, approval token, recovery-window evidence, soft-delete/versioning posture, and audit-safe deletion result metadata. The launch rehearsal must prove transcript purge count remains zero and raw-audio deletion does not run without approval.

## support escalation

Escalation starts with the release owner and routes to clinical, compliance/privacy, security, infrastructure, and founder approval owners. Support users can view operational metadata only. They cannot view transcripts, final notes, billing details, coaching outputs, raw prompts, raw EHR/ClinicOS payloads, audit export payloads, or PHI-bearing logs.

## founder/clinical/compliance/security approval

P10 launch-candidate review cannot be claimed until founder, clinical, compliance/privacy, and security approvals are recorded in the launch package. `WO-049` supplies operational rehearsal evidence only; it keeps `productionLaunchReady=false`.

# WO-056 — Live Transcription Provider Review Intake

## Objective

Promote live transcription provider review into a planning/control decision package without enabling live transcription credentials, PHI-bearing audio transport, live provider calls, production raw-audio storage, or production launch behavior.

## Why This Work Order Exists

`WO-040` established browser audio capture, recording exception, metadata-only recording transport, mock transcription, retention metadata, correction history, and provider-governance boundaries. Commercial transcription requires explicit provider, BAA/private-path, credential, consent, audio transport, retention, diarization, confidence/source metadata, retry/dead-letter, support, privacy, security, and audit decisions before any live provider path is enabled.

## Prerequisites

- `WO-055` complete and merged.
- P11 remains the current checkpoint.
- No active `SPEC_GAP` blocks planning/control work.
- Existing audio, storage, retention, and AI/PHI readiness scripts remain green.

## In Scope

- Add a production transcription provider review document.
- Capture required future decisions, acceptance criteria, event/audit inventory, standalone requirements, and ClinicOS-integrated requirements.
- Add a readiness verifier proving the tranche remains planning/control only.
- Update `repo_status.json`, `work_orders/README.md`, `docs/PRODUCTION_BUILD_PLAN.md`, `docs/POST_P11_CONTINUATION_PLAN.md`, `docs/POST_CP4_PRODUCTIONIZATION_BACKLOG.md`, `SPEC_GAPS.md`, `CHECKPOINT_REPORT.md`, `RUN_LOG.md`, `package.json`, and CI.

## Out Of Scope

- Provider selection or contracting approval.
- Live transcription credentials, tokens, secret-manager integration, or `.env` files.
- PHI-bearing audio transport to a provider.
- Production raw-audio object storage.
- Live provider SDK/API calls.
- Real diarization or production speaker-label behavior.
- Production retry, replay, or dead-letter execution.
- PHI-bearing support transcript access.
- Runtime product behavior, schema changes, migrations, or launch approval.

## UX Requirements

No new product route is required. Future operational UX must expose provider disabled/configured/degraded/failed states, browser permission states, consent/notice states, recording refusal, approved recording exception, low-confidence transcript states, diarization unsupported/degraded states, correction history, retry/dead-letter states, permission-denied states, and read-only finalized transcript states before launch readiness.

## Backend/API Requirements

No new endpoint is required. Future transcription operations must be tenant/site scoped, permission checked, consent/purpose-of-use checked, server mediated, idempotent where retries are plausible, audit/event emitting, fail closed when credentials/consent/context are missing, and tested for wrong-tenant, wrong-role, missing-consent, provider-disabled, credential-missing, retry, dead-letter, and no-raw-PHI-leakage cases.

## Data Model/Persistence Requirements

No schema change is required for this planning tranche. Future implementation must define provider configuration metadata, credential reference metadata, consent/notice evidence, recording chunk metadata, transcription job records, transcript segment provider metadata, confidence/source metadata, diarization/speaker-label metadata, correction history, retry/dead-letter records, retention evidence, support-access evidence, and incident records.

## Event/Audit Requirements

Inventory future transcription events including provider config reviewed, credential configured/disabled, consent recorded/denied, recording exception used, chunk upload authorized/denied, transcription job requested/denied, provider request sent/failed, segment received, segment low confidence, correction recorded, dead-lettered, replay requested, raw-audio retention purged, transcript retention preserved, and transcription incident recorded.

## RBAC/ABAC Requirements

Preserve existing role boundaries. Future implementation must require clinician/authorized delegate controls for recording and correction, authorized-admin or integration-admin controls for provider configuration, compliance/privacy controls for review, and support-scope restrictions for operational metadata. It must deny ordinary billing staff, MAs without task scope, unscoped support users, wrong-tenant users, and wrong-site users.

## Standalone-Mode Behavior

Standalone mode remains mock/local for live transcription until a future approved implementation work order enables a governed provider path. AURA Note remains the source of tenant/site transcription configuration, consent/notice policy, recording exception policy, retention policy, transcript visibility, audit, and support controls.

## ClinicOS-Integrated Behavior

ClinicOS-integrated mode may receive visit/session context and publish transcription status through adapters. ClinicOS must not bypass AURA Note permissions, consent policy, recording exception rules, tenant/site scoping, purpose-of-use checks, retention controls, audit evidence, or support-access limits.

## AI/PHI/Security Requirements

Use synthetic data only. Do not introduce real PHI, credentials, tokens, production URLs, `.env` files, private keys, live provider calls, PHI-bearing audio payloads, production raw-audio storage, external AI changes, autonomous diagnosis/coding/billing behavior, or launch approval.

## Testing Requirements

- Add `pnpm transcription:live-review-readiness`.
- Preserve and run audio, storage, retention, post-P11, production, acceptance, status, and whitespace gates.
- The readiness verifier must fail if the repo claims live provider credentials, PHI audio transport, live provider calls, production raw-audio storage, real diarization production behavior, PHI-bearing support transcript access, or production launch approval.

## Required Scripts/Gates

- `pnpm transcription:live-review-readiness`
- `pnpm post-p11:readiness`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

## Definition Of Done

- Review document exists and names required production transcription decisions.
- `WO-056` is indexed and marked done.
- `next_work_order` remains `null`.
- Readiness scripts pass locally and in CI.
- `SPEC_GAPS.md`, `RUN_LOG.md`, and `CHECKPOINT_REPORT.md` record the planning/control evidence.
- No live transcription credential, PHI-bearing audio transport, live provider call, production raw-audio storage, PHI-bearing support transcript access, runtime transcription behavior, or launch behavior is authorized.

## Stop Conditions

Stop if implementation requires provider selection, BAA/private-path approval, live credentials, PHI-bearing audio payloads, live SDK/API execution, production raw-audio storage, consent/legal/privacy policy decisions, support transcript access policy, or production launch approval.

## Risks And Deferred Decisions

Provider selection, BAA/private deployment path, region, credential source, consent/notice policy, audio transport design, raw-audio retention execution, transcript correction/version retention, diarization reliability, retry/dead-letter policy, support visibility, incident response, and operational ownership remain deferred.

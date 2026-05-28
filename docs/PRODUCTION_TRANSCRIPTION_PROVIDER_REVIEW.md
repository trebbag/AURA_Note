# Production Transcription Provider Review

## Purpose

This document captures the production decisions required before AURA Note can connect browser recording and transcription workflows to a live transcription provider for PHI-bearing audio or transcript processing.

This is a planning/control artifact only. It does not select a provider, introduce credentials, enable live provider calls, transport PHI-bearing audio to an external service, store production raw audio, change transcript retention, or approve production launch.

## Current Safe Posture

- `WO-040` provides browser microphone permission UX, timer-controlled recording states, metadata-only chunk transport, deterministic mock transcription, correction history, and provider-governance boundaries.
- Existing transcription behavior remains mock/local and synthetic unless a later approved implementation work order enables a governed live path.
- Raw audio retention remains one week in policy and local readiness evidence only.
- Transcript retention remains indefinite unless a future tenant policy is approved and implemented.
- External AI remains separate from transcription provider review and remains disabled unless governed by AI-specific work orders.

## Required Production Decisions

### Provider and contracting posture

- Select the transcription provider, deployment model, region, and BAA/private-path posture.
- Define whether a provider may process PHI-bearing audio and whether any de-identification or local preprocessing is required before transmission.
- Define allowed provider features, including streaming, batch transcription, diarization, confidence scores, timestamps, redaction, and correction feedback.

### Credential source and secret handling

- Select the credential source, such as managed identity, secret manager, or tenant-scoped credential record.
- Prohibit committed credentials, `.env` secrets, browser-side provider keys, and plaintext token logging.
- Define credential rotation, disabled credential handling, and incident escalation.

### Audio capture and transport

- Confirm browser capture constraints, chunk size, retry policy, timeout policy, offline/degraded behavior, and upload integrity checks.
- Define whether raw audio chunks flow through AURA Note servers before provider delivery or through a governed direct-upload mechanism.
- Define tenant/site object metadata and trace correlation for every audio chunk and transcription job.

### Consent, notice, and recording exceptions

- Define consent/notice requirements by tenant, site, jurisdiction, visit type, and provider.
- Preserve approved recording exception behavior so documentation can continue without implying normal recording occurred.
- Define how consent unavailable, patient refusal, browser denial, provider outage, and recording exception states are represented.

### Raw audio and transcript retention

- Confirm one-week raw-audio retention and the exact purge eligibility clock.
- Confirm transcript retention remains indefinite unless a future tenant policy changes it.
- Define correction/edit history retention, transcript versioning, and source metadata retention.

### Diarization and speaker labels

- Decide whether diarization is required for launch or can remain a clearly labeled placeholder.
- Define speaker-label confidence, correction workflow, unsupported-provider fallback, and human-review requirements.

### Confidence and source metadata

- Define minimum provider confidence metadata required for transcript segments and final transcript output.
- Define how low-confidence segments, inaudible segments, interrupted recording, and provider uncertainty appear in the UI and audit trail.
- Define how transcript source references connect to suggestions and finalization evidence without autonomous diagnosis, coding, billing, or medical-necessity decisions.

### Retry, dead-letter, and operational support

- Define retry policy, dead-letter handling, manual replay authority, provider incident escalation, support visibility, and tenant notification.
- Define whether support can see transcript text or only metadata, and what approvals are required.

### Privacy, security, and audit evidence

- Define audit events for provider credential use, audio transport, transcription requests, provider failures, transcript receipt, corrections, and retention deletion.
- Define log redaction and trace-correlation requirements.
- Define no-raw-PHI-leakage tests and provider-contract tests before live use.

## Future Acceptance Criteria

A later implementation work order may enable a governed live transcription path only when all of the following are true:

- Provider, BAA/private deployment posture, region, and PHI-processing authorization are approved.
- Credential source, rotation, least-privilege access, and disabled credential handling are approved.
- Audio capture, chunking, transport, integrity, retry, timeout, and degraded-mode behavior are specified and tested.
- Consent/notice, recording refusal, browser denial, recording exception, and provider outage states are implemented and browser-testable.
- Raw audio is retained for one week and deleted only through approved retention controls.
- Transcript retention remains indefinite unless an approved tenant policy changes it.
- Transcript segments include source, timestamp, confidence, provider metadata, and correction history.
- Diarization/speaker-label posture is either implemented or explicitly labeled as unsupported/degraded.
- Role-denial, wrong-tenant, missing-consent, provider-disabled, credential-missing, retry, dead-letter, and no-raw-PHI-leakage tests pass locally and in CI.

## Future Event And Audit Inventory

Future implementation must define and test these events before live use:

- `transcription.provider_config_reviewed.v1`
- `transcription.credential_configured.v1`
- `transcription.credential_disabled.v1`
- `recording.consent_recorded.v1`
- `recording.consent_denied.v1`
- `recording.exception_used.v1`
- `recording.chunk_upload_authorized.v1`
- `recording.chunk_upload_denied.v1`
- `transcription.job_requested.v1`
- `transcription.job_denied.v1`
- `transcription.provider_request_sent.v1`
- `transcription.provider_request_failed.v1`
- `transcription.segment_received.v1`
- `transcription.segment_low_confidence.v1`
- `transcription.correction_recorded.v1`
- `transcription.dead_lettered.v1`
- `transcription.replay_requested.v1`
- `transcription.raw_audio_retention_purged.v1`
- `transcription.transcript_retention_preserved.v1`
- `transcription.incident_recorded.v1`

## Standalone Mode Requirements

Standalone mode must use AURA Note tenant/site transcription configuration, AURA Note permissions, AURA Note consent/notice policy, AURA Note audit events, AURA Note retention policy, and AURA Note support-access controls.

## ClinicOS-Integrated Mode Requirements

ClinicOS-integrated mode may receive visit/session context and publish transcription status through adapter boundaries. ClinicOS must not bypass AURA Note tenant/site scoping, consent policy, recording exception rules, role checks, purpose-of-use checks, retention controls, audit evidence, or support-access limits.

## Deferred Until Future Work Order

- Provider selection and contracting approval.
- Live transcription credentials, tokens, or secret-manager integration.
- PHI-bearing audio transport to any provider.
- Production raw-audio object storage.
- Live provider SDK/API calls.
- Real diarization or speaker-label production behavior.
- Production replay/dead-letter execution.
- PHI-bearing support transcript access.
- Production launch approval.

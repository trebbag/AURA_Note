# Security Policy

AURA Note is a healthcare application scaffold. The implementation must assume HIPAA-grade controls even when running with synthetic data.

## Non-negotiables

- No real PHI in local fixtures, tests, screenshots, logs, or demo mode.
- No raw PHI to external AI.
- All AI calls must pass through `packages/ai-gateway`.
- All user actions touching patient, visit, note, transcript, billing, export, coaching, or EHR writeback data must be permission-checked and audit-logged.
- Raw audio retention is one week.
- Transcripts are retained indefinitely unless a future tenant policy overrides this through an approved retention configuration.

# Security, Privacy, Compliance, And Threat Model Runtime Review

Status: `WO-071` review-ready synthetic evidence. This is not a HIPAA certification claim, SOC 2 claim, legal opinion, or production launch approval.

## Scope

This package covers the CR-4 security, privacy, compliance, and threat-model runtime posture for AURA Note. It reviews the current production-shaped runtime boundaries without enabling live PHI, live credentials, live vendors, production object storage, claim submission, charge finalization, medical-necessity determination, autonomous clinical/coding/billing behavior, or production launch.

## Threat Model Summary

| Threat | Current mitigation evidence | Remaining approval |
| --- | --- | --- |
| Cross-tenant or cross-site data exposure | Tenant/site scoped repository and API tests, RLS evidence for persisted core tables, identity/session fail-closed checks, and CR-4 commercial readiness API evidence. | Security review before live PHI. |
| Unauthorized support access | Support routes expose metadata only, clinician access is denied, audit export requires compliance/privacy or authorized admin role, and transcript/final-note/billing/coaching access remains role limited. | Support access operating procedure approval. |
| Raw PHI in logs or AI payloads | PHI lint, structured log redaction, AI Gateway PHI rejection/redaction, no raw PHI to external AI, and request/trace correlation. | Privacy validation against production logging sinks. |
| Break-glass misuse | Break-glass remains a disabled placeholder and cannot unlock PHI-bearing workflows. | Founder/security/compliance break-glass policy decision. |
| Live vendor credential misuse | OIDC/SAML, Azure storage, transcription, EHR, ClinicOS, AI, SIEM, APM, and claim/payer credentials are not configured or returned. | Vendor credentialing and secret-management review. |
| Autonomous high-risk behavior | AI and rules outputs remain draft/candidate/human-review-required; claim submission and charge finalization remain disabled. | Later founder-approved work order required for any policy change. |

## Minimum Necessary And Support Scope

- Support users may view operational metadata, status, runbook evidence, and disabled-feature posture only.
- Compliance/privacy leads may request redacted audit exports with `includePhi=false`.
- Billing staff transcript access remains tied to a triggered billing review context and does not grant broad transcript visibility.
- ClinicOS-integrated mode cannot bypass AURA Note permissions.
- Production launch remains blocked: `productionLaunchReady=false`.

## Review Checklist

| Item | Evidence | Status |
| --- | --- | --- |
| Threat model updated for CR-4 | This document and `docs/THREAT_MODEL.md` lineage | ready_synthetic |
| Privacy and minimum-necessary posture visible | `docs/RBAC_ABAC_MATRIX.md`, `/support/commercial-readiness` | ready_synthetic |
| PHI redaction and forbidden-key tests | `pnpm lint:phi`, security package tests, AI Gateway tests | ready_synthetic |
| Support access restriction evidence | `apps/api/src/support/support.service.test.ts`, support route Playwright test | ready_synthetic |
| Break-glass disabled placeholder | `docs/IDENTITY_ACCESS_FOUNDATION.md`, platform route | disabled_by_default |
| Certification claims avoided | This document states no certification claim | review_required |

## Stop Conditions

Stop before production if any review requires live PHI, live credentials, raw production logs, live AI, live EHR/writeback, live ClinicOS event delivery, live claim submission, or a certification/compliance representation not documented and approved by founder, clinical, compliance/privacy, and security reviewers.

# WO-071 — Security, Privacy, Compliance, And Threat-Model Runtime Hardening

## Objective
Move from scaffold safety to review-ready runtime security posture for commercial review.

## Why This Work Order Exists
Commercial review needs threat modeling, privacy controls, audit completeness, PHI redaction, role-denial evidence, support-scope restrictions, and a no-certification/no-launch posture.

## Prerequisites
- CR-3 complete.
- Existing runtime identity, support, audit, AI, EHR, ClinicOS, persistence, storage, and frontend runtime gates.

## In Scope
- CR-4 security/privacy/compliance package.
- Minimum-necessary and support metadata-only evidence.
- Threat model and privacy checklist.
- Break-glass disabled placeholder evidence.
- PHI log redaction and route/endpoint denial evidence.
- `pnpm security:commercial-readiness`.

## Out Of Scope
- HIPAA or SOC 2 certification claims.
- External audit completion.
- Live break-glass.
- Production launch approval.

## UX Requirements
- Support route must show permission-denied, support-scope, break-glass-disabled, compliance-review, read-only, failed, loading, ready, and demo states.

## Backend/API Requirements
- Sensitive support/commercial review endpoints fail closed, redact logs, enforce minimum necessary, and audit denied/sensitive access.

## Data Model/Persistence Requirements
- Use existing durable audit/support/security metadata where present. Do not add PHI-bearing schema fields.

## Event/Audit Requirements
- Emit audit-safe security/privacy and threat-model review events.

## RBAC/ABAC Requirements
- Deny ordinary clinician access to support/commercial review metadata.
- Support remains metadata-only.
- Compliance/privacy and authorized admin roles retain appropriate review access.

## Standalone-Mode Behavior
- Standalone has review-ready security posture without ClinicOS.

## ClinicOS-Integrated Behavior
- ClinicOS cannot bypass AURA Note controls and fails closed on delegated-security ambiguity.

## AI/PHI/Security Requirements
- No PHI leakage, no raw PHI to external AI, no certification claims, no autonomous high-risk behavior.

## Testing Requirements
- PHI redaction, role denial, commercial readiness endpoint, audit/event, and browser route evidence.

## Required Scripts/Gates
- `pnpm security:commercial-readiness`
- Default local gate applicable to touched files.

## Definition Of Done
- Security/privacy/compliance package is ready for formal review without claiming certification or launch readiness.

## Stop Conditions
- Legal/security/privacy decision is required for high-risk behavior or live PHI/vendor use.

## Risks And Deferred Decisions
- Formal compliance review, production security approval, and live break-glass policy remain deferred.

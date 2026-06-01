# Figma Content Copy Guide

Status as of `WO-065`: copy guide for design handoff. Copy must be precise, conservative, and safe for a regulated clinical documentation product.

## Required Copy Posture

- Use "draft", "candidate", "suggestion", "human review required", "metadata-only", "disabled until reviewed", and "synthetic/local evidence" where applicable.
- Do not use copy that implies autonomous diagnosis, autonomous code finalization, charge finalization, claim submission, medical-necessity determination, denial automation, payment posting, production launch approval, HIPAA certification, or live PHI processing.
- Do not expose internal billing, revenue, coaching, confidence, audit, support, disabled-live vendor, or claim-boundary details on patient-facing views.
- Failed states must not include secrets, private keys, raw tokens, production URLs, real patient data, or PHI-bearing examples.

## Preferred Copy Patterns

| Context | Preferred copy | Avoid |
| --- | --- | --- |
| AI suggestions | "Candidate suggestion. Human review required." | "AI selected the diagnosis." |
| Low confidence diagnosis | "Override requires reason and billing review flag." | "Diagnosis accepted automatically." |
| Draft claim preview | "Draft claim preview. submittedClaim=false." | "Claim submitted." |
| EHR writeback | "Queued metadata after human approval." | "Written to production EHR." |
| Live vendor disabled | "Disabled until governance and credentials are approved." | "Launch approved." |
| Support status | "Metadata-only support view." | "Support can open PHI details." |
| Patient summary | "Patient-safe summary excludes internal billing/revenue/coaching/confidence details." | "Show internal opportunity value to patient." |
| Production launch | "Launch approval remains blocked until review." | "Launch complete." |

## State Copy Requirements

- Empty: name the missing item and the allowed next step.
- Loading: name the data source, such as typed API client or documented disabled mock.
- Ready: avoid overstating completeness; show source freshness.
- Saving: explain what is being sent and prevent duplicate submissions.
- Blocked: name the blocker, owner, and required next action.
- Failed: show a safe error and retry path without PHI/secrets.
- Permission-denied: state access is denied without previewing restricted data.
- Read-only/finalized: state that artifacts cannot reopen the active editor.
- Degraded/disabled: name the missing vendor/config/review dependency.
- Demo fixture: label synthetic/local evidence clearly.

## Required Terms

Use these exact terms consistently in Figma and UI copy where applicable: `safe patient identifier`, `Chart freshness`, `Visit Selections`, `Compliance Review`, `History Gap Review`, `MA follow-up blocker`, `Finalization Wizard`, `Patient Opportunity Analysis`, `Billing & Attest`, `draft claim preview`, `submittedClaim=false`, `server-mediated download`, `ClinicOS-integrated mode`, `AI Gateway`, `no raw PHI to external AI`, and `production launch not approved`.

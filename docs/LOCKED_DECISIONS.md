# Locked Decisions

These decisions are resolved and should not be reopened unless the founder explicitly updates this file.

## Product identity

- Product name: **AURA Note**.
- First user: clinician.
- Product posture: standalone-first app with a clear integration path into AURA ClinicOS / M17 NP Cockpit.

## Platform relationship

- AURA Note must run independently without AURA ClinicOS.
- AURA Note must also integrate into AURA ClinicOS using adapter boundaries.
- AURA ClinicOS is the larger operating system described in the ClinicOS reference specification.
- AURA Note should align with M17 NP Cockpit, M03 VisitGraph, M04 WorkOS, M21 Charge Integrity / ClaimGuard, M23 Copilot Runtime, M24 AI Governance, M25 Integration Hub, and M26 Data Cloud.

## Scheduling

- The first release includes a basic modular Schedule Builder.
- Schedule Builder can later be replaced by EHR scheduling or ClinicOS scheduling.
- Every appointment has exactly one associated clinician note shell.
- Notes and appointments are one-to-one.
- Notes appear in Draft Notes only after the visit has been opened/started according to the workflow.

## EHR integration

- First target: athenahealth.
- Architecture must remain vendor-neutral through EHR adapter interfaces.
- Final note writeback is supported only when configured.
- Copy/export/PDF must work even without EHR writeback.

## Timer, recording, and editing

- Start Visit must be clicked before editing is allowed.
- The controlling rule is no documenting without the timer running.
- Audio recording starts and stops with the timer by default.
- Recording is required with an approved exception path.
- Editor access is tied to the active timer/visit session.
- Raw audio retention: one week.
- Transcript retention: indefinite.

## Transcripts and permissions

- Full transcript is available after finalization subject to role permissions.
- Billing staff can see transcripts only when billing review is triggered.
- Billing staff can see billing detail.
- Treating clinician and authorized admins can see coaching outputs.
- Only staff linked to the visit/patient should see final notes.
- Staff can see patient summaries when linked to the visit/patient and permitted by role.

## Templates and dot phrases

- Templates can be specialty-specific, appointment-type-specific, provider-specific, or clinic-approved.
- Provider-specific templates should be shared within the clinic.
- Any clinician or admin can create templates.
- Dot phrases are created in Settings for clinic use.
- Dot phrases must support variables and smart phrases.
- First-release visit templates include chronic follow-up, AWV plus problem, TCM, urgent, new patient, procedure, and telehealth.

## Coding and suggestions

- Suggestions must include CPT, HCPCS, ICD-10, HCC, E/M, and quality measures.
- Visit Selections is the selected-items panel.
- Visit Selections may contain codes, diagnoses, differentials, services, tasks, quality items, risk items, and plan items.
- Visit Selection cards should support filtering by category.
- Selected items do not persist visibly through every wizard step unless that step requires them.
- During Compose, selected codes are written into the note in a payer-readable justification section.
- Services and tasks are written into the plan.
- Revenue opportunities are hidden from patient-facing summary flow by default.

## Low-confidence diagnosis

- Adding a diagnosis with confidence under 75 percent requires an override reason.
- The override must show support, non-support, uncertainty, and what would improve confidence.
- Low-confidence overrides flag coaching and billing review.

## MA follow-up and blockers

- MA follow-up questions can happen after the clinician visit is over.
- Any open/unadjudicated follow-up question blocks signing if marked as a blocker or if the workflow requires adjudication.
- Users must answer, close, or assign open questions before signing.
- Tasks/open questions must support a flag indicating whether they block signing.

## Finalization Wizard

All six steps are required for MVP:

1. Code Review.
2. Suggestion Review.
3. Compose.
4. Compare & Edit.
5. Billing & Attest.
6. Sign & Dispatch.

Wizard Step 2 must not show the full raw transcript. Transcript evidence can remain hidden/audit/debug unless surfaced through permitted panels.

Final-pass suggestions are limited to items over 50 percent confidence. Clinicians cannot skip Suggestion Review.

## Patient summary and final note

- Patient summary must be printable and downloadable as PDF.
- Final note must support copy/export/PDF and EHR writeback if configured.
- AI draft plus clinician approval; approved summary is final.
- Final note is the accepted enhanced version.
- Re-beautify replaces the prior enhanced version using updated original-side content.

## Patient Opportunity Analysis

- The panel is named Patient Opportunity Analysis.
- Clinical opportunities are shown first.
- Revenue impact is hidden from patient-facing summary flow.
- Revenue estimates may appear in internal/billing/admin sections if configured.
- Patient Opportunity Analysis can optionally show revenue estimates if tenant chooses and configured data exists.

## Billing and estimates

- Show estimates only if configured source data exists.
- Otherwise show unavailable/caveat language.
- Settings must include a way to capture and review estimate configuration.
- Route to billing review when diagnosis impacts coding, claim preview, or quality/risk capture.
- Claims and denials can expand later, but v1 includes draft claim preview.

## AI and PHI

- No raw PHI to external AI.
- Data must be scrubbed of PHI before being sent to AI.
- Use private/BAA model only with governance approval.
- Scaffold AI review events and permissions; full review queue can come later.

## Coaching

- Clinicians may see their own coaching.
- Premium dashboard supports longitudinal analytics.
- Authorized admins can see coaching dashboards.
- Coaching can be configured aggregate-only.
- Coaching ROI story: time saved, revenue captured, training/medical-care improvement, and denials reduced.

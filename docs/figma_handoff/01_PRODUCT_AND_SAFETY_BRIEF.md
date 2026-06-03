# Product And Safety Brief For Figma

## Product Summary

AURA Note is a standalone-first clinical documentation, transcription, coding-support, finalization, draft-claim-preview, export, writeback, task, and coaching application. It must also be embeddable into AURA ClinicOS / M17 NP Cockpit through adapter boundaries. The same user experience should support both modes; this is one product, not two separate apps.

The front-end design should help a clinician move from a scheduled appointment into a documentation workspace, capture or acknowledge visit context, review transcript and chart evidence, accept or reject draft suggestions, resolve blockers, complete a six-step finalization flow, generate final artifacts, and route any follow-up work.

## Design Personality

- Quiet, clinical, operational, and trustworthy.
- Dense enough for repeated daily use, but not cramped.
- Clear hierarchy: patient/visit context first, then action gates, then supporting panels.
- Evidence-forward: suggestions, codes, tasks, and outputs should show source and confidence when available.
- Human-review-forward: draft/candidate outputs should never look final until the correct role approves them.

Avoid decorative hero layouts, oversized marketing cards, one-note color palettes, ornamental gradients, or anything that makes the app feel like a sales page instead of a clinician workspace.

## Core Actors

| Actor | Primary goals | Design implications |
| --- | --- | --- |
| Clinician | Document the visit, review evidence, accept or reject suggestions, resolve finalization steps, sign final artifacts | Fast workspace, keyboard-friendly editor, clear blockers, low-friction evidence review |
| MA | Follow up on History Gap questions and blocker tasks | Worklist clarity, owner/status filters, handoff context, no unnecessary billing/coaching exposure |
| Billing staff | Review routed billing items and draft claim preview context | Limited transcript access only when review is triggered; no broad clinical workspace access |
| Admin / authorized admin | Manage tenant/site/users/settings/integrations/features | Fail-closed flags, risk labels, review evidence, no secrets displayed |
| Compliance/privacy lead | Review audit, AI governance, support, retention, export evidence | Metadata-first views, denial states, redaction posture, review trail |
| Support | Inspect support status without PHI by default | Operational status, degraded states, audit-safe metadata, no patient content |
| Service account/integration | Adapter-mediated EHR/ClinicOS/writeback behavior | Status, queue, retry, dead-letter, reconciliation, and permission boundaries |

## Standalone Mode

In standalone mode, AURA Note owns the tenant, patient shell, schedule, appointment, note shell, visit session, transcript metadata, suggestions, selections, finalization, tasks, exports, templates, settings, and coaching records.

Figma should show standalone mode as fully usable for core v1 workflows without depending on ClinicOS. The schedule, workspace, finalization, operations, and settings areas should work as first-class product screens.

## ClinicOS-Integrated Mode

In ClinicOS-integrated mode, AURA Note receives or maps identity, schedule, VisitGraph, tasks, charge-integrity context, AI governance context, integration state, and data-cloud references through adapter boundaries.

Figma should preserve the same primary screens while adding mode banners, mapping status, degraded/unavailable states, stale mapping warnings, and permission-denied paths. ClinicOS must never appear to bypass AURA Note permissions.

## Safety Boundaries To Preserve In Design

Design all AI and coding-support output as draft/candidate/human-review-required until approved by the correct role.

Never design a path that implies AURA Note autonomously:

- diagnoses a patient;
- finalizes ICD-10, CPT, HCPCS, HCC, E/M, modifiers, quality measures, charges, claims, or medical necessity;
- submits claims;
- places orders;
- denies care;
- exposes transcripts, final notes, billing details, coaching, PHI, or audit evidence to unauthorized users;
- sends raw PHI to external AI;
- performs destructive production deletion without approval, backup, restore, soft-delete/versioning, and audit evidence.

## Required Copy Style

Use direct labels and status copy:

- "Draft suggestion"
- "Candidate item"
- "Human review required"
- "Permission denied"
- "Read-only finalized note"
- "Finalization blocked"
- "Submitted claim: false"
- "Live vendor disabled"
- "No raw PHI to external AI"
- "Production launch not approved"

Avoid:

- "AI diagnosed"
- "Code finalized"
- copy implying a claim was submitted;
- copy implying medical necessity was approved;
- copy implying EHR writeback completion unless the route explicitly shows approved writeback metadata;
- any copy that implies launch approval or certification

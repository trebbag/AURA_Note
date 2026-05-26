# AURA Note v1 Codex Initial Repository Package

This repository package is the starting point for building **AURA Note v1**: a standalone-first clinical documentation, transcription, coding-support, finalization, draft-claim-preview, and coaching application that can later be embedded into **AURA ClinicOS / M17 NP Cockpit** without a rewrite.

AURA Note v1 has two operating modes:

1. **Standalone mode** — AURA Note includes its own scheduling, appointment-note creation, clinician documentation workspace, visit timer, recording/transcription workflow, Finalization Wizard, export/PDF tools, staff tasks, draft claim preview, settings, and premium coaching analytics.
2. **ClinicOS-integrated mode** — AURA Note receives scheduling, patient, encounter, task, identity, audit, VisitGraph, M17, M21, M23, M24, and integration context from AURA ClinicOS while preserving the same AURA Note domain model and UX contracts.

This package is intentionally documentation-heavy. Codex should be able to read the repo, determine the next unfinished work order, implement broad batches independently, run tests, and stop only at defined checkpoints, unresolved SPEC_GAPs, or repeated breakage that cannot be resolved after several attempts.

## How Codex should start

1. Read `AGENTS.md` first.
2. Read `docs/START_HERE_FOR_CODEX.md`.
3. Read `docs/specs/AURA_NOTE_V1_CANONICAL_BUILD_SPEC.md`.
4. Read `work_orders/README.md` and begin with the first incomplete work order.
5. After each work order, update `repo_status.json`, `RUN_LOG.md`, and `SPEC_GAPS.md` if needed.

## Canonical sources in this package

- `AGENTS.md` — how Codex must work, when it can proceed, when it must stop, and the global definition of done.
- `docs/specs/AURA_NOTE_V1_CANONICAL_BUILD_SPEC.md` — the full functional + technical production build specification.
- `docs/specs/AURA_CLINICOS_REFERENCE.md` — the larger ClinicOS / M17 / M21 / M23 / M24 reference context.
- `docs/LOCKED_DECISIONS.md` — founder-resolved product and architecture decisions.
- `docs/STANDALONE_AND_CLINICOS_MODES.md` — the standalone-versus-integrated architecture contract.
- `docs/UX_BUILD_SPEC.md` — screen, state, and user-flow requirements.
- `docs/BACKEND_BUILD_SPEC.md` — service, data, security, AI, integration, and worker requirements.
- `docs/API_EVENT_CONTRACTS.md` and `packages/contracts/openapi/aura-note.v1.yaml` — API and event expectations.
- `work_orders/` — sequential implementation batches with acceptance criteria.

## First-release product promise

A clinician should be able to:

1. Create or receive an appointment from the Schedule Builder or EHR adapter.
2. Open the appointment and click **Start Visit**.
3. Have the timer, recording, transcription, and editable note workspace activate together.
4. Document with live AI-supported Suggestions, Visit Selections, Compliance & Quality Review, and History Gap Review.
5. Finalize through all six required wizard steps.
6. Generate a polished final note, patient summary, visit plan, draft claim preview, and export package.
7. Dispatch final outputs by PDF/download/copy and writeback if configured.
8. Preserve transcript, audit, coaching, billing, and review evidence according to permissions and retention policy.

## Non-negotiable safety posture

AURA Note may draft, summarize, suggest, score, route, and create candidates. It must not autonomously diagnose, finalize codes, finalize charges, submit claims, determine medical necessity, place orders, deny care, coerce patient financial action, or override clinician/compliance/safety review.

## Initial repo status

This package contains repo scaffolding and build instructions, not a completed application. Codex should implement in the order defined by the work orders. The first production acceptance target is the end-to-end browser journey from appointment creation through final note dispatch using synthetic demo data.

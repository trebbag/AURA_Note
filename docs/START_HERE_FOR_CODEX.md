# Start Here for Codex

Codex should operate from the repository instructions, not from memory.

## Required reading order

1. `AGENTS.md`
2. `docs/LOCKED_DECISIONS.md`
3. `docs/specs/AURA_NOTE_V1_CANONICAL_BUILD_SPEC.md`
4. `docs/STANDALONE_AND_CLINICOS_MODES.md`
5. `docs/UX_BUILD_SPEC.md`
6. `docs/BACKEND_BUILD_SPEC.md`
7. `docs/API_EVENT_CONTRACTS.md`
8. `work_orders/README.md`
9. The first incomplete work order in `repo_status.json`

## Build philosophy

AURA Note is not only a note generator. It is a closed-loop documentation, coding-support, visit-finalization, patient-summary, revenue-integrity, and coaching workflow. Codex should build small vertical slices that are demonstrable in a browser, but the backend must preserve production boundaries from the beginning.

## First acceptance target

The first meaningful end-to-end demo is:

1. MA creates an appointment in standalone Schedule Builder.
2. A one-to-one note shell is created.
3. Clinician clicks Start Visit.
4. Timer starts, recording/transcription mock starts, and editor becomes active.
5. Clinician documents.
6. Suggestions, Visit Selections, Compliance alerts, and History Gap questions appear.
7. Clinician finalizes through all six wizard steps.
8. Final note and patient summary are approved.
9. Draft claim preview is generated.
10. Final note and patient summary can be viewed, copied, downloaded, and exported.

## Do not wait for Figma

Visual design is intentionally not final. Implement clean, accessible, low-friction UI states with semantic structure. Figma can restyle later.

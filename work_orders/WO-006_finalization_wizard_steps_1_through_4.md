# WO-006 — Finalization Wizard Steps 1 Through 4

## Objective

Build Code Review, Suggestion Review, Compose, and Compare & Edit.

## Scope

Step 1 requires keep/remove decisions on selected items. Step 2 requires review of final-pass suggestions over 50 percent confidence and does not show raw transcript. Step 3 creates enhanced note/patient summary through mock compose. Step 4 supports compare/edit, approve note, approve summary, re-beautify, AI Planning Assistant, and Patient Opportunity Analysis.

## Suggested files/areas

Finalization module, wizard UI, compose worker, events/audit, tests.

## Acceptance criteria

User cannot skip required decisions. Removed items go to unused audit list. Compose progress states show. Note and summary approval required. Re-beautify replaces enhanced version.

## Definition of done

- Meets this work order's acceptance criteria.
- Meets the global definition of done in `AGENTS.md`.
- Updates relevant docs and tests.
- Updates `repo_status.json` and `RUN_LOG.md`.
- Adds `SPEC_GAPS.md` entries for unresolved gaps.

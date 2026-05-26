# WO-004 — Timer Recording Gate Transcription Scaffold

## Objective

Implement timer-controlled editing, recording-required behavior, exception path, and transcription scaffold.

## Scope

Start Visit starts timer and recording by default; pause/stop controls editor access; approved exception path allows timer/documentation without recording; raw audio retention metadata is created; transcript mock segments can stream or be appended.

## Suggested files/areas

Visit session module, recording module, transcript module, worker retention job, tests.

## Acceptance criteria

No editing without active timer or approved exception. Raw audio retention job scaffold exists. Transcript retained. Start/pause/resume/stop events and audits emitted.

## Definition of done

- Meets this work order's acceptance criteria.
- Meets the global definition of done in `AGENTS.md`.
- Updates relevant docs and tests.
- Updates `repo_status.json` and `RUN_LOG.md`.
- Adds `SPEC_GAPS.md` entries for unresolved gaps.

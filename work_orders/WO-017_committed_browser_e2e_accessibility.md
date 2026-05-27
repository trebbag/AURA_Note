# WO-017 — Committed Browser E2E and Accessibility Suite

## Objective

Convert CP-4 manual browser route-sweep evidence into a committed browser regression suite with accessibility-oriented route, landmark, heading, accessible-name, disabled-state, and synthetic workflow checks.

## Scope

Add a Playwright Chromium test harness for the existing synthetic Next.js web shell. This work order verifies browser-visible route behavior and semantic accessibility affordances only. It does not add visual regression, Figma-level design fidelity, real API-backed browser flows, production monitoring, or new clinical workflow behavior.

## Source traceability

- `AGENTS.md` sections 7, 13, and 16 require browser-testable UX states and browser-level or component-level tests for core behavior.
- `docs/POST_CP4_PRODUCTIONIZATION_BACKLOG.md` defines P5-03 Committed Browser E2E And Accessibility Suite.
- `docs/UX_BUILD_SPEC.md` requires clear accessible states for empty, loading, ready, saving, warning, blocked, failed, permission-denied, finalized/read-only, and demo fixture states.
- Existing CP-4 route evidence in `docs/CP4_ACCEPTANCE_READINESS.md` defines the route set to preserve.

## Implementation requirements

- Add Playwright test tooling and a root browser-test command.
- Add a web Playwright e2e script that can run through Turbo and directly from the web package.
- Cover Schedule, Draft Notes, Documentation Workspace, Finalization, Finalized Notes, finalized viewer, Coaching, Support hardening, and Status routes.
- Verify main landmarks, expected H1 headings, section navigation where present, accessible labels, and disabled/blocked/finalized/read-only states.
- Exercise a small deterministic browser flow for Schedule creation, workspace timer/blocker behavior, finalized viewer actions, coaching permission states, and support degraded-mode states.
- Add CI coverage for browser installation and the browser test suite.
- Keep all fixtures synthetic.

## Out of scope

- Visual regression or screenshot baselines.
- Figma polish or design-system implementation.
- Live API-backed browser orchestration.
- Real PHI, credentials, patient records, EHR, AI, ClinicOS, storage, analytics, or claim-submission behavior.
- New clinical, billing, finalization, coaching, support, or integration product behavior.

## Acceptance criteria

- `pnpm test:browser` passes locally.
- `pnpm --filter @aura-note/web test:e2e` passes locally.
- Existing full local gate remains green.
- GitHub Actions runs and passes the browser suite.
- Browser test artifacts are ignored by git.
- `RUN_LOG.md`, `repo_status.json`, docs, and this work order reflect the evidence and boundaries.

## Definition of done

- Meets this work order's acceptance criteria.
- Meets the global definition of done in `AGENTS.md` for the scoped browser/accessibility test foundation.
- Updates relevant scripts, docs, tests, and CI.
- Updates `repo_status.json` and `RUN_LOG.md`.
- Adds `SPEC_GAPS.md` entries only for unresolved blockers.

# Browser E2E and accessibility suite

## Status

`WO-017` adds a committed Playwright Chromium suite for the AURA Note web shell. It replaces manual-only CP-4 route-sweep evidence with repeatable browser tests that run locally and in CI.

## Commands

- `pnpm test:browser` runs the root Playwright suite.
- `pnpm --filter @aura-note/web test:e2e` runs the same suite through the web package.
- CI installs Chromium with `pnpm exec playwright install --with-deps chromium` before running `pnpm test:browser`.

## Coverage

The suite covers these browser routes:

- `/status`
- `/aura-note/schedule`
- `/aura-note/drafts`
- `/aura-note/workspace/appt-demo-001`
- `/aura-note/finalization/note-demo-001`
- `/aura-note/finalized`
- `/aura-note/finalized/note-demo-finalized-001`
- `/aura-note/coaching`
- `/aura-note/support/status`

Each route check verifies the main landmark and expected H1. AURA Note application routes also verify the shared section navigation landmark.

## Accessibility-oriented checks

The suite verifies:

- form controls can be found by accessible labels;
- buttons can be found by accessible names;
- sections with `aria-label` are reachable as named regions;
- workspace timer-gated editor state is visibly blocked before Start Visit;
- the workspace Finalize-facing button is disabled while blocked and after an MA blocker is created;
- finalized note viewer tabs expose selected state and read-only text;
- coaching permission states and support degraded-mode states are visible.

## Artifact handling

Playwright traces and screenshots are configured for failure cases. Generated local artifacts under `test-results/` and `playwright-report/` are ignored by git.

## Out of scope

- screenshot baselines or visual regression;
- final Figma fidelity;
- production API-backed browser orchestration;
- real PHI, credentials, EHR, AI, ClinicOS, analytics, audit delivery, storage deletion, charge finalization, or claim submission.

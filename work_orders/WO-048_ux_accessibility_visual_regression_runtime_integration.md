# WO-048 — UX, Accessibility, Visual Regression, And Frontend Runtime Integration

## Objective

Harden AURA Note's production-intended browser routes for UX correctness, accessibility, responsive behavior, visual regression readiness, and the Frontend Runtime Integration Gate.

## Why this exists

P9 proves integration, AI governance, and security/privacy/compliance review readiness in a synthetic/local scope. P10 cannot be claimed until production browser screens stop relying on unlabelled local React state, use typed API clients, preserve role-denied/read-only/failed states, and prove at least one persisted backend-backed workflow in Playwright.

## Prerequisites

- P9 is complete through `WO-047`.
- `docs/PRODUCTION_BUILD_PLAN.md` includes the Frontend Runtime Integration Gate.
- Current CI, production readiness, and acceptance readiness pass.

## In Scope

- Inventory all production-intended web routes and classify each as API-backed runtime, documented mock, Storybook/demo-only, or blocked by a later dependency.
- Add or update typed API-client usage for routes in scope where the route already has backend support.
- Ensure each affected route exposes loading, empty, ready, saving, failed, permission-denied, and read-only states backed by API responses, persisted records, or documented mocks.
- Add keyboard-accessible controls and accessible names for critical route actions.
- Add responsive and visual-regression-oriented Playwright coverage for the current shell.
- Add `pnpm frontend:runtime-integration-readiness` or equivalent named verifier.
- Preserve all existing safety, PHI, RBAC/ABAC, and no-autonomy boundaries.

## Out of Scope

- Final Figma visual signoff if no Figma source is available.
- Live EHR, ClinicOS, AI, transcription, production storage, claim submission, or production PHI workflows.
- Broad redesign or marketing/landing-page work.
- Patient-facing revenue, confidence, coaching, or internal billing details.

## UX Requirements

- Production-intended routes must use clear functional UI, responsive layout, keyboard-reachable actions, accessible names, and non-overlapping text.
- Sensitive routes must preserve disabled, permission-denied, read-only, failed, and degraded states.
- Patient-facing or patient-summary surfaces must exclude internal billing, revenue, confidence, coaching, and payer-optimization details.
- Synthetic local React state is allowed only in Storybook, demo mode, fixture-only tests, or clearly documented mocks.

## Backend/API Requirements

- Route actions must call existing typed API contracts where backend behavior exists.
- Any route state that cannot be API-backed must document the missing backend dependency and remain labeled as a mock/demo/deferred state.
- State-changing actions must remain tenant/site scoped, permission checked, audit/event emitting, and idempotent where duplicate submissions are plausible.

## Data Model/Persistence Requirements

- No new persistence is required unless route-state hardening uncovers an existing production-intended screen that lacks durable state.
- Any persisted workflow used by the Playwright runtime-integration test must prove state survives reload or API refetch.

## Event/Audit Requirements

- Existing state-changing UI actions must preserve backend audit/event behavior.
- New verifier or test evidence must not introduce runtime domain events unless a new state-changing backend operation is added.

## RBAC/ABAC Requirements

- Role-denied states must be browser-testable for sensitive views including transcript, final note, billing, coaching, support/audit, EHR, ClinicOS, AI governance, and admin/config surfaces.
- ClinicOS-integrated mode cannot bypass AURA Note permissions or hide denied states.

## Standalone-Mode Behavior

- Standalone workflows must remain browser-testable without ClinicOS.
- At least one seeded backend-backed standalone workflow from appointment creation through finalization/export must be exercised before P10 launch-candidate readiness can be claimed.

## ClinicOS-Integrated Behavior

- Integrated routes must degrade safely when ClinicOS is disabled, unavailable, stale, or delegated identity is not configured.
- ClinicOS metadata views must remain adapter-bound and permission checked.

## AI/PHI/Security Requirements

- No raw PHI may be sent to external AI or exposed in route tests.
- AI, coding, billing, claim, and medical-necessity outputs remain draft/candidate/human-review-required.
- Browser tests and screenshots must use synthetic data only and avoid secrets, `.env`, real patient data, production URLs, private keys, or PHI-bearing samples.

## Testing Requirements

- Add or update Playwright tests for route states, keyboard/accessibility affordances, responsive behavior, and the backend-backed workflow required by the Frontend Runtime Integration Gate.
- Add a static or runtime route inventory verifier that fails on unapproved production local-state routes.
- Preserve existing API, unit, browser, security, PHI, readiness, persistence, storage, retention, EHR, ClinicOS, AI, and production-build gates.

## Required Scripts/Gates

- `pnpm frontend:runtime-integration-readiness`
- `pnpm ux:production-readiness` if added in this tranche
- `pnpm install --frozen-lockfile`
- `pnpm db:client:generate`
- `pnpm lint`
- `pnpm lint:phi`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm test:browser`
- `pnpm build`
- all current persistence/storage/retention/identity/config/observability/EHR/ClinicOS/AI/security/readiness scripts
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

## Definition Of Done

- Production-intended routes have a documented runtime-integration inventory.
- Unapproved local-only React state is removed from production routes or explicitly moved/labeled as demo/mock/deferred.
- Required route states are API-backed, persisted, or documented mocks.
- Playwright covers at least one seeded backend-backed appointment creation through finalization/export workflow with reload/refetch evidence.
- Accessibility, responsive, and sensitive-role denial evidence is present.
- `RUN_LOG.md`, `repo_status.json`, `docs/TEST_PLAN.md`, and relevant UX/backend docs are updated.
- CI and local gates pass.

## Stop Conditions

- A production route requires product policy that is not specified.
- A route cannot be API-backed without a new backend or persistence decision outside this work order.
- A design/accessibility requirement conflicts with safety, privacy, or compliance boundaries.
- Three focused repair attempts fail to resolve a build, test, browser, or runtime blocker.

## Risks And Deferred Decisions

- Final Figma fidelity, formal usability testing, production accessibility audit, visual baseline approval, and launch approval remain deferred until later P10 work.

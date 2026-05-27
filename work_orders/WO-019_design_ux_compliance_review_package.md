# WO-019 — Design System, UX Hardening, And Compliance Review Package

## Source traceability

- `docs/POST_CP4_PRODUCTIONIZATION_BACKLOG.md` tranche P5-05.
- `docs/UX_BUILD_SPEC.md`.
- `docs/LOCKED_DECISIONS.md`.
- `docs/BACKEND_BUILD_SPEC.md`.
- `docs/CP4_ACCEPTANCE_READINESS.md`.
- `docs/OBSERVABILITY_SINKS.md` and `docs/DEPLOYMENT_ENVIRONMENT_MATRIX.md`.

## Scope

Prepare AURA Note for human product, security, privacy, compliance, and design review as a commercial product surface without changing clinical authority boundaries.

## In scope

- Establish initial design-system tokens in `packages/ui`.
- Add reusable review-boundary metadata for clinical, billing, patient-summary, coaching, audit/support, and integration surfaces.
- Adopt design tokens in the current browser shell CSS.
- Add responsive browser coverage for core route shells.
- Add review package documentation that separates implemented, synthetic, disabled, deferred, and prohibited behavior.
- Add UX copy review documentation for clinical, billing, patient-summary, coaching, audit, support, and integration states.

## Out of scope

- Final Figma fidelity, brand design, visual regression baselines, icon library decisions, Storybook production documentation, and component library completeness.
- New clinical workflow, billing workflow, finalization behavior, patient-facing feature, EHR/ClinicOS/AI integration, claim submission, or production PHI behavior.
- Compliance certification, legal conclusion, security attestation, or production launch approval.

## Acceptance criteria

- UI token package has deterministic tests.
- Existing screens remain browser-testable and include a mobile overflow smoke check.
- Patient-facing copy boundaries explicitly exclude internal revenue, coding logic, coaching analytics, and audit/support details.
- Review package clearly labels implemented, synthetic, disabled, deferred, and prohibited behavior.
- `RUN_LOG.md`, `repo_status.json`, docs, and this work order reflect evidence and boundaries.

## Definition of done

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm lint:phi`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm test:browser`
- `pnpm build`
- `pnpm acceptance:readiness`
- `pnpm persistence:foundation`
- `node scripts/status.js`
- `git diff --check`

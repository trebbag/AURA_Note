# RUN_LOG

Codex must append a dated entry after each work order or meaningful implementation batch.

## Initial package generation

- Created initial AURA Note v1 Codex repository package.
- No application work orders have been completed yet.
- Next work order: `WO-000`.

## 2026-05-26T13:44:23Z — CP-0 GitHub establishment, WO-000, and WO-001

- **Work order:** `WO-000` Repository Foundation and `WO-001` Domain Contracts Events Security Skeleton.
- **Summary of changes:** Established private GitHub repository `trebbag/AURA_Note`, seeded the initial scaffold to `main`, and completed CP-0 on branch `tranche/cp0-foundation-domain`.
- **Repository foundation:** Added `pnpm-lock.yaml`, Node 20 version pins, deterministic workspace scripts, a Next root layout, a web status page update, worker status scaffold, and API TypeScript config alignment.
- **Domain/contracts/security:** Added typed invariants for appointment-note one-to-one, timer/editor gating, recording exception state, signing blockers, low-confidence diagnosis override, finalization wizard ordering, role-limited visibility, API envelopes, event envelopes, CP-0 DTOs, and synthetic fixtures.
- **Files changed:** `.gitignore`, `.nvmrc`, `.node-version`, app/package scripts, `apps/web`, `apps/api`, `apps/worker`, `packages/domain`, `packages/contracts`, `packages/security`, `packages/testing`, `docs/API_EVENT_CONTRACTS.md`, `docs/DATA_MODEL.md`, `repo_status.json`, and `CHECKPOINT_REPORT.md`.
- **Tests run:** `pnpm install --frozen-lockfile`; `pnpm --filter @aura-note/domain test`; `pnpm --filter @aura-note/security test`; `pnpm --filter @aura-note/contracts test`; `pnpm --filter @aura-note/testing test`; `pnpm --filter @aura-note/worker test`; `pnpm typecheck`; `pnpm lint`; `pnpm lint:phi`; `pnpm test`; `pnpm build`; `node scripts/status.js`.
- **GitHub Actions:** PR #1 `AURA Note CI / build-test` passed with install, lint, PHI lint, typecheck, test, and build.
- **Tests not run:** Browser E2E and API integration flows are intentionally deferred until `WO-002` introduces the first schedule and appointment-note workflow.
- **Accepted risks:** CP-0 includes scaffold checks for packages whose implementation belongs to later work orders; those checks are explicit and do not claim runtime workflow completion. GitHub Actions emitted a non-failing Node 20 action-runtime deprecation annotation; the project runtime remains pinned to Node 20 for CP-0 and the workflow should be revisited before GitHub removes Node 20 runner support.
- **Open SPEC_GAPs:** None discovered for CP-0.
- **Next step:** Open draft PR for CP-0, confirm GitHub Actions, then begin `WO-002` after review.

## 2026-05-26T14:16:40Z — WO-002 Schedule Builder appointment-note lifecycle

- **Work order:** `WO-002` Schedule Builder Appointment Note Lifecycle.
- **Summary of changes:** Implemented standalone synthetic appointment creation, one-to-one note shell creation, schedule listing with note status, Start Visit activation, permission checks, idempotent create replay, audit events, and domain events.
- **Backend behavior:** Added Nest schedule endpoints for `GET /api/v1/schedule/appointments`, `POST /api/v1/schedule/appointments`, and `POST /api/v1/schedule/appointments/{appointmentId}/start-visit` using an in-memory standalone repository. EHR and ClinicOS scheduling are disabled but do not block standalone mode.
- **UX behavior:** Added `/aura-note/schedule` with synthetic appointment creation, note shell status, disabled external scheduling indicators, and Start Visit state feedback. Full timer, recording, transcription, and editor-depth behavior remain scoped to `WO-004`.
- **Files changed:** `apps/api/src/schedule/*`, `apps/web/app/aura-note/schedule/page.tsx`, shared domain/contracts/security/testing packages, OpenAPI contract, `docs/API_EVENT_CONTRACTS.md`, `docs/DATA_MODEL.md`, `docs/UX_BUILD_SPEC.md`, `repo_status.json`, and lockfile/package metadata.
- **Tests run:** `pnpm --filter @aura-note/domain test`; `pnpm --filter @aura-note/security test`; `pnpm --filter @aura-note/contracts test`; `pnpm --filter @aura-note/testing test`; `pnpm --filter @aura-note/api test`; `pnpm --filter @aura-note/api test:e2e`; `pnpm --filter @aura-note/api typecheck`; `pnpm --filter @aura-note/web typecheck`; `pnpm install --frozen-lockfile`; `pnpm lint`; `pnpm lint:phi`; `pnpm typecheck`; `pnpm test`; `pnpm test:e2e`; `pnpm build`; `node scripts/status.js`; `git diff --check`.
- **Browser verification:** Opened `http://localhost:3001/aura-note/schedule`, created a synthetic appointment, and started a visit. The page showed note shell creation, `visit_started`, `visit_active`, and Draft Notes visibility.
- **Tests not run:** External EHR/ClinicOS schedule ingestion is disabled and scoped to later adapter work orders. Persistent database tests are deferred until repository/migration work is introduced.
- **Accepted risks:** The Schedule Builder repository is process-local and synthetic for `WO-002`; it is not production persistence. Start Visit creates a visit-session scaffold only; detailed timer/recording/transcription behavior remains deferred to `WO-004`.
- **Open SPEC_GAPs:** None discovered for `WO-002`.
- **Next step:** Open PR for `WO-002`, confirm GitHub Actions, then begin `WO-003`.

## 2026-05-26T15:20:00Z — WO-003 Draft/Finalized Notes and Documentation Workspace shell

- **Work order:** `WO-003` Draft Finalized Notes Documentation Workspace Shell.
- **Summary of changes:** Added CP-1 notes and workspace shells for Draft Notes, Finalized Notes, read-only finalized note viewing, and the Documentation Workspace.
- **Backend behavior:** Added implemented read/query endpoints for Draft Notes, Finalized Notes, finalized note placeholders, and appointment-linked Documentation Workspace state. The editor gate remains enforced through the visit-session timer/recording state and returns a blocked reason before timer activation.
- **UX behavior:** Added browser-testable routes for `/aura-note/drafts`, `/aura-note/finalized`, `/aura-note/finalized/[noteId]`, and `/aura-note/workspace/[appointmentId]`, and linked Schedule Builder rows into the workspace.
- **Files changed:** `apps/api/src/notes/*`, `apps/api/src/schedule/*`, `apps/web/app/aura-note/*`, `apps/web/app/globals.css`, `packages/contracts`, `packages/contracts/openapi/aura-note.v1.yaml`, `docs/API_EVENT_CONTRACTS.md`, `docs/DATA_MODEL.md`, `docs/UX_BUILD_SPEC.md`, and `repo_status.json`.
- **Tests run:** `pnpm --filter @aura-note/contracts test`; `pnpm --filter @aura-note/api test`; `pnpm --filter @aura-note/api typecheck`; `pnpm --filter @aura-note/web typecheck`; `pnpm --filter @aura-note/api test:e2e`; `pnpm install --frozen-lockfile`; `pnpm lint`; `pnpm lint:phi`; `pnpm typecheck`; `pnpm test`; `pnpm test:e2e`; `pnpm build`; `node scripts/status.js`; `git diff --check`.
- **Tests not run:** Timer pause/resume/stop, recording exception, transcript append, Suggestions, Visit Selections, Compliance, and History Gap task routing remain scoped to `WO-004` and `WO-005`.
- **Accepted risks:** The notes/workspace UI uses synthetic browser fixtures and the API uses the existing process-local standalone repository. No production persistence or clinical content generation is claimed.
- **Open SPEC_GAPs:** None discovered for `WO-003`.
- **Next step:** Run the WO-003 gate, open its draft PR, then begin `WO-004`.

## 2026-05-26T15:35:00Z — WO-004 Timer recording gate transcription scaffold

- **Work order:** `WO-004` Timer Recording Gate Transcription Scaffold.
- **Summary of changes:** Added synthetic timer controls, normal recording scaffold, approved recording exception path, mock transcript segment append/read behavior, and raw-audio retention metadata.
- **Backend behavior:** Extended the CP-1 API with pause/resume/stop visit-session controls, recording exception approval, transcript retrieval, and mock transcript segment append endpoints. Start Visit now creates raw-audio retention metadata and an empty indefinitely retained transcript shell.
- **Worker behavior:** Added a raw-audio retention candidate scan scaffold that marks one-week audio metadata purge-eligible without connecting to production storage.
- **UX behavior:** Updated the Documentation Workspace to show browser-testable Start Visit, Pause, Resume, Stop, recording exception, editor gate, and mock transcript append states.
- **Files changed:** `apps/api/src/notes/*`, `apps/api/src/schedule/*`, `apps/web/app/aura-note/workspace/*`, `apps/web/app/globals.css`, `apps/worker`, shared domain/contracts packages, OpenAPI contract, `docs/API_EVENT_CONTRACTS.md`, `docs/DATA_MODEL.md`, `docs/UX_BUILD_SPEC.md`, `repo_status.json`, and package metadata.
- **Tests run:** `pnpm install`; `pnpm install --frozen-lockfile`; `pnpm --filter @aura-note/domain test`; `pnpm --filter @aura-note/contracts test`; `pnpm --filter @aura-note/api test`; `pnpm --filter @aura-note/api typecheck`; `pnpm --filter @aura-note/api test:e2e`; `pnpm --filter @aura-note/worker test`; `pnpm --filter @aura-note/web typecheck`; `pnpm lint`; `pnpm lint:phi`; `pnpm typecheck`; `pnpm test`; `pnpm test:e2e`; `pnpm build`; `node scripts/status.js`; `git diff --check`.
- **Tests not run:** Suggestions, Visit Selections, Compliance hard-blocks, and History Gap MA follow-up routing remain scoped to `WO-005`. Live recording, microphone capture, external transcription, external AI, and production storage are out of scope.
- **Accepted risks:** Timer and transcript behavior remains synthetic and process-local. The retention worker identifies purge candidates but does not delete production objects.
- **Open SPEC_GAPs:** None discovered for `WO-004`.
- **Next step:** Run the WO-004 gate, open its draft PR, then begin `WO-005`.

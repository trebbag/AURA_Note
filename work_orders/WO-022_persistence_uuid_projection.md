# WO-022 — Persistence UUID Projection Readiness

## Status

Done.

## Objective

Harden the disabled Prisma adapter scaffold so schedule/note projections use deterministic UUID-shaped persistence identifiers aligned with the Prisma PostgreSQL schema before any runtime database adapter is enabled.

## Scope

- Keep the in-memory adapter as the only enabled runtime adapter.
- Keep Prisma mode disabled for runtime writes.
- Add deterministic UUID projection for tenant, site, synthetic clinician user, patient, appointment, and note rows.
- Preserve synthetic semantic identifiers only as natural keys or safe external references.
- Align appointment and note row projection field names with the current Prisma schema shape.
- Keep PHI-key rejection and one appointment to one note mismatch rejection in place.

## Out of scope

- Prisma Client runtime usage.
- Connecting to PostgreSQL.
- Applying migrations to a live database.
- Row-level security policies.
- Full Prisma-backed repository replacement.
- Production PHI persistence.
- Production identity, EHR, ClinicOS, AI, analytics, audit export delivery, storage deletion, charge submission, or claim submission.

## Acceptance criteria

- `@aura-note/persistence` unit tests prove projected primary keys and schema reference fields are UUID-shaped.
- Projection remains deterministic for the same synthetic natural keys.
- Projection creates a synthetic clinician `User` row needed by appointment/note clinician references.
- Appointment rows reference the projected patient UUID.
- Note rows reference the projected appointment UUID.
- Mismatched appointment/note references are rejected.
- Forbidden PHI key material is rejected before projection.
- `pnpm persistence:adapter-readiness` passes.
- Full repository gate and GitHub Actions pass before merge.

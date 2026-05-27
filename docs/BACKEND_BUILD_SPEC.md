# Backend Build Specification

AURA Note must be built as a production-oriented backend even before external integrations are live.

## Recommended stack

- Next.js web app.
- NestJS API.
- Worker service for asynchronous jobs.
- PostgreSQL with row-level security where practical.
- Prisma or equivalent schema/migration tooling.
- S3-compatible object storage for audio, exports, and uploaded documents.
- OpenAPI contracts and generated typed clients.
- Zod or equivalent runtime validation.
- Event bus abstraction with in-memory/dev implementation and production-compatible queue implementation.
- Feature flags.
- OpenTelemetry-style structured logging/tracing.

## Core bounded contexts

1. Platform / tenant / settings.
2. Identity / RBAC / ABAC.
3. Scheduling / appointments.
4. Patient context and chart parsing.
5. Notes and visit sessions.
6. Recording, audio storage, and transcription.
7. AI gateway and suggestions.
8. Visit Selections.
9. Compliance & Quality Review.
10. History Gap Review.
11. Finalization Wizard.
12. Tasks / MA follow-up.
13. Billing & Attest / draft claim preview.
14. Exports and EHR writeback.
15. Templates and dot phrases.
16. Coaching analytics.
17. ClinicOS integration adapter.
18. Observability, audit, retention, and support tools.

## Service rules

Every write operation must:

- validate input;
- enforce tenant/site scoping;
- enforce role/relationship/purpose permission;
- be idempotent when duplicate submission is plausible;
- write an audit event;
- emit a domain event if state changes;
- return a standard response envelope;
- avoid logging PHI.

## Chart context package

When an appointment is created or opened, the backend should parse available EHR/standalone chart context into structured packages for the app and AI gateway:

- patient demographics display object;
- visit metadata;
- problem list;
- medications;
- allergies;
- past medical history;
- vitals;
- labs;
- imaging/results;
- prior notes/summaries;
- quality gaps;
- risk/HCC evidence;
- care-management opportunities;
- prior billing/coding context if allowed;
- source freshness and confidence.

The app may display this context, but AI-bound context must pass through the AI gateway.

## AI gateway

The AI gateway owns:

- PHI scrubbing;
- prompt registry;
- model configuration;
- output schema validation;
- safety policy enforcement;
- source-link handling;
- confidence/rationale normalization;
- audit metadata;
- model governance event emission.

No UI or backend feature may call external AI directly.

## Retention

- Raw audio: retain one week, then delete/purge according to job policy.
- Transcript: retain indefinitely.
- Final notes, patient summaries, audit logs, coding evidence, and finalization decisions: retain according to tenant legal/operational policy; v1 defaults should be conservative.
- Export/PDF objects: retain according to tenant configuration and audit needs.

## EHR adapters

First target: athenahealth.

The generic EHR adapter interface must support:

- patient lookup;
- demographics;
- appointments;
- encounter context;
- medications;
- allergies;
- problems;
- labs/results;
- document references;
- note writeback if configured;
- task/writeback if configured;
- connection health;
- sync state;
- mapping errors.

Do not hard-code athenahealth into domain logic. Domain logic uses generic adapter contracts.

## ClinicOS adapter

The ClinicOS adapter maps AURA Note state to and from:

- M03 VisitGraph;
- M04 WorkOS/tasks;
- M17 NP Cockpit;
- M21 Charge Integrity;
- M23 Copilot Runtime;
- M24 AI Governance;
- M25 Integration Hub;
- M26 Data Cloud.

If ClinicOS is not enabled, standalone implementations must satisfy the same domain needs.

## Standard API response envelope

All API responses should use a consistent shape:

```ts
type ApiResponse<T> = {
  data: T;
  meta: {
    requestId: string;
    traceId?: string;
    mode: 'standalone' | 'clinicos_integrated';
    generatedAt: string;
  };
  warnings?: Array<{ code: string; message: string; severity: 'info' | 'warning' | 'error' }>;
};
```

## Background jobs

Workers must support:

- transcription processing;
- AI suggestion evaluation;
- finalization compose;
- PDF generation;
- EHR writeback queue;
- raw audio retention purge;
- audit export;
- coaching analysis;
- integration sync;
- event projection refresh.

`WO-013` implements the first hardening scaffold for these requirements:

- structured log entries are request/trace correlated and redacted before persistence or export;
- external AI, live EHR writeback, ClinicOS live sync, production analytics, and audit export download delivery are governed by default-off feature flags;
- worker retention status covers raw-audio one-week purge eligibility and transcript indefinite retention while keeping destructive purge disabled;
- audit export is compliance/admin-only, redacted, metadata-only, and retained as audit evidence;
- support status exposes safe degraded states without requiring live vendor credentials.

`WO-015` adds the first persistence migration foundation:

- PostgreSQL remains the durable database target.
- Prisma schema validation and SQL diff generation are available through root scripts.
- The schema foundation covers platform, identity, appointment, note, visit session, transcript, review panel, finalization, export, writeback, coaching, audit, event, integration, feature-flag, and support status records.
- Runtime repository replacement, row-level-security policy implementation, live database migration apply/rollback, production credentials, and PHI-bearing persistence are deferred to later numbered work orders.

`WO-016` adds the first tenant identity and access foundation:

- API request contexts use a shared local synthetic session parser from `packages/security`.
- Tenant ID, site ID, actor user ID, session ID, role, purpose-of-use, and identity-provider mode are represented in the access context.
- Cross-tenant and cross-site requests are denied before implemented API services perform route behavior.
- `clinicos_delegate` and `oidc_delegate` modes are reserved adapter boundaries and are denied until provider configuration is specified.
- Production SSO, MFA, account administration, persistent identity/session storage, and real ClinicOS identity delegation are deferred to later numbered work orders.

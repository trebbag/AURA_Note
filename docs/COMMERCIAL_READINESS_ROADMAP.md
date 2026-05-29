# Commercial Readiness Roadmap

## Status

As of `WO-063`, AURA Note is in commercial-readiness implementation, not production launch. The repo has strong synthetic/local evidence through P11 plus CR-1 runtime persistence switchover, API request-boundary hardening, and identity runtime fail-closed evidence, but it is not commercially production-ready, not live against production identity, EHR, ClinicOS, external AI, transcription, Azure storage, production PHI databases, clearinghouses, payers, production WAF/CDN/SIEM infrastructure, or production launch infrastructure.

`productionLaunchApproved=false` remains the required posture until a later founder-approved work order explicitly changes it after clinical, compliance, privacy, security, legal, vendor, credential, backup/restore, incident-response, and operational decisions are resolved.

## Roadmap checkpoints

| Checkpoint | Work orders | Outcome | Launch posture |
| --- | --- | --- | --- |
| `CR-0` | `WO-060` | Commercial-readiness rails reopened. | Not launch-ready |
| `CR-1` | `WO-061` through `WO-063` | Runtime foundation candidate: repository ports, local Prisma runtime, API boundary, fail-closed identity. | Not launch-ready |
| `CR-2` | `WO-064` through `WO-066` | Product UX runtime candidate: primary routes API-backed, Figma scaffold complete, standalone workflow complete. | Not launch-ready |
| `CR-3` | `WO-067` through `WO-070` | Integration and governance runtime candidate: mode resolver, transcription/EHR/AI/ClinicOS boundaries. | Not launch-ready |
| `CR-4` | `WO-071` through `WO-075` | Commercial readiness review candidate for founder/clinical/compliance/security review. | Review-ready only |

## Sequential work

1. `WO-060` reopens rails and validates no-launch-claim posture.
2. `WO-061` moves core workflow runtime services from direct in-memory state to repository ports with local Prisma/PostgreSQL as the production-shaped local adapter.
3. `WO-062` hardens the API request boundary with shared Nest bootstrap, validation, PHI-safe error envelopes, request correlation, security headers, request limits, redacted logs, and readiness evidence.
4. `WO-063` made local synthetic identity explicit and production/preview auth fail closed through `AURA_NOTE_AUTH_MODE` and `pnpm identity:runtime-boundary-readiness`.
5. `WO-064` converts primary production-intended routes to typed API-backed state.
6. `WO-065` creates the basic UI and documentation inventory Figma needs.
7. `WO-066` proves a complete standalone workflow without ClinicOS.
8. `WO-067` enforces runtime standalone/ClinicOS adapter boundaries.
9. `WO-068` makes transcription provider integration production-shaped but disabled/live-gated.
10. `WO-069` hardens athenahealth-first and vendor-neutral EHR runtime boundaries.
11. `WO-070` expands AI governance/evaluation while live model calls remain disabled.
12. `WO-071` packages security/privacy/compliance runtime evidence.
13. `WO-072` packages observability, SRE, support, and incident operations.
14. `WO-073` completes billing/revenue integrity boundaries without claim submission.
15. `WO-074` prepares a controlled beta pilot package without launch approval.
16. `WO-075` creates the commercial readiness decision packet and final review gate.

## Non-negotiable boundaries

- No real PHI, real patient data, real payer data, secrets, `.env` files, production URLs, private keys, or production credentials are committed.
- No live EHR writeback, live ClinicOS synchronization, live external AI, live transcription provider, live Azure PHI storage, clearinghouse, payer API, denial automation, payment posting, or claim submission is enabled by this roadmap.
- No autonomous diagnosis, diagnosis finalization, code finalization, charge finalization, medical-necessity determination, order placement, denial decision, patient financial conclusion, or claim submission is allowed.
- AI may draft, summarize, score confidence, identify missing evidence, create candidate items, and route human review only.

## Evidence tiers

- **Synthetic/local readiness:** deterministic tests and local adapters prove intended behavior with synthetic data.
- **Commercial-readiness implementation:** runtime architecture and UX/API/persistence boundaries are implemented in production-intended shape, still without live PHI or vendors.
- **Commercial-readiness review:** founder, clinical, compliance, security, privacy, and legal review can inspect the evidence packet.
- **Production launch:** not approved by this roadmap. Production launch requires a separate founder-approved work order and evidence packet.

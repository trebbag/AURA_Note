# Figma Component Inventory

Status as of `WO-065`: component inventory for design handoff only. Components must preserve AURA Note safety boundaries and should not imply live PHI, live vendors, autonomous clinical/coding/billing behavior, claim submission, or production launch approval.

## Navigation And Layout Components

| Component | Used by surfaces | Required states | Data/API posture |
| --- | --- | --- | --- |
| App shell and section navigation | `/aura-note`, schedule, drafts, workspace, finalization, finalized notes, operations, platform, integrations, AI governance, coaching, support, figma handoff | ready, read-only, permission-denied route state where applicable | typed API route sources or read-only handoff metadata |
| Hero/status band | all primary routes | loading, ready, failed, degraded, disabled | API health/status or documented disabled adapter mock |
| Summary metric cards | runtime home, operations, support, platform | loading, empty, ready, failed, read-only | typed API summary data |
| Table/list rows | schedule, draft notes, finalized notes, task inbox, billing queue, rules catalog | empty, loading, ready, saving, failed, permission-denied, read-only | API-backed records or documented demo fixtures |
| Drawer layout | transcript, Compliance Review, History Gap Review, audit/history | loading, ready, saving, blocked, failed, permission-denied, read-only | API-backed panel state |
| Modal/confirmation | low-confidence diagnosis, recording exception, sign/dispatch, export, writeback | ready, saving, failed, blocked, disabled | state-changing API or disabled future-work-order mock |

## Clinical Workflow Components

| Component | Required content | Safety requirements |
| --- | --- | --- |
| Safe patient chip | safe patient identifier, chart freshness, source snapshot state | no real patient data or unsupported PHI samples |
| Appointment card | visit type, time, clinician, status, note shell link, modality | one appointment maps to one note shell |
| Visit controls bar | Start, Pause, Resume, Stop, timer, recording status, exception state, autosave | editor unlock only when timer running or approved exception active |
| Editor locked state | locked message, required action, read-only state | no free-form clinical workflow outside valid visit state |
| Suggestion card | category, confidence, rationale, evidence, missing evidence, source link, action buttons | draft/candidate-only and human-review-required |
| Visit Selection card | selected item, category, source, review status, remove action | no autonomous diagnosis/code finalization |
| Compliance issue card | severity, blocker status, evidence, owner, next action | blockers disable finalize-facing controls |
| History Gap question card | question, owner, MA task state, blocker indicator | open blockers prevent signing/finalization preparation |

## Finalization And Output Components

| Component | Required content | Safety requirements |
| --- | --- | --- |
| Six-step wizard rail | Code Review, Suggestion Review, Compose, Compare/Edit, Billing & Attest, Sign & Dispatch | human review required at every step |
| Patient Opportunity Analysis card | clinical-first opportunity, supporting evidence, caveats | revenue hidden from patient-facing output by default |
| Draft claim preview panel | candidate lines, `submittedClaim=false`, billing review routing | no live clearinghouse, payer, or claim submission |
| Final note viewer tabs | final note, patient summary, transcript if allowed, billing if allowed, audit/history if allowed | read-only and role-limited |
| Export artifact card | storage provider, key, checksum, content length, retention class, signed-download availability | server-mediated short-lived download metadata only |
| Writeback queue card | human approval, idempotency key, retry, dead-letter, reconciliation, audit | disabled unless configured and never bypasses approval |

## Platform, Integration, And Governance Components

| Component | Required content | Safety requirements |
| --- | --- | --- |
| Feature flag row | flag name, environment, enabled/disabled, risk level, reviewer | high-risk flags fail closed without approval |
| Identity/session state card | auth mode, session expiration, disabled-user state, purpose-of-use | synthetic headers only in explicit local/demo mode |
| EHR integration card | sandbox status, mapping, writeback queue, dead-letter/retry state | no production credentials or live writeback |
| ClinicOS mode card | standalone/integrated, degraded, unavailable, stale mapping, event publication | ClinicOS cannot bypass AURA Note permissions |
| AI governance card | prompt/model version, eval outcome, unsafe-output rejection, PHI scrub status | no raw PHI to external AI |
| Support status card | support health, audit export, restore readiness, launch gate, operational drills | support users do not receive PHI by default |

## State Components

Every component family must have visible examples for `empty`, `loading`, `ready`, `saving`, `blocked`, `failed`, `permission-denied`, `read-only`, `degraded`, `disabled`, `finalized`, and `demo fixture` where applicable. Synthetic local React state is allowed only for Storybook/demo fixtures or transient UI controls; production-intended route state must come from typed API responses or documented disabled mocks.

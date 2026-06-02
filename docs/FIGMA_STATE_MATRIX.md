# Figma State Matrix

Status as of `WO-065`: required state matrix for Figma and browser scaffolding. This matrix is a design and QA contract, not production launch approval.

## State Vocabulary

| State | Meaning | Required UI behavior | Data/API evidence |
| --- | --- | --- | --- |
| loading | API request or documented mock is pending | skeleton/status text, controls disabled where mutation would be unsafe | typed API request or documented disabled mock |
| empty | API returns no records for the tenant/site/context | empty-state message and valid next action when allowed | typed API empty response |
| ready | route has API-backed data and permitted actions | visible content and enabled safe actions | typed API ready response |
| saving | state-changing request is pending | action progress text, duplicate submit protection | typed API mutation or disabled mock action |
| blocked | blocker prevents the next workflow step | reason, owner, next safe action | compliance/task/finalization API state |
| failed | API or documented adapter response failed | error detail without PHI/secrets and no readiness claim | error envelope or disabled adapter failure |
| permission-denied | role/purpose/tenant/site lacks access | denied copy, no sensitive content exposure | RBAC/ABAC-denied API response |
| read-only | content can be inspected but not changed | no editor/mutation controls, read-only label | finalized/API read-only flag or role-limited response |
| degraded | integration or support capability is partially unavailable | degraded banner and safe fallback | adapter/status API degraded response |
| disabled | live or high-risk capability intentionally unavailable | disabled badge and future-work-order/review copy | feature flag/config/status response |
| finalized | workflow output is signed/dispatched or immutable | read-only final artifact, history/audit state | finalization/finalized note API |
| demo fixture | route shows synthetic fixture or Storybook-only example | demo label and no production claim | documented local fixture/mock |

## Route-State Coverage

| Route/surface | Empty | Loading | Ready | Saving | Blocked | Failed | Permission-denied | Read-only | Degraded/disabled | Demo fixture |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/aura-note` | documented | required | required | n/a | n/a | required | documented | required | required | documented |
| `/aura-note/schedule` | required | required | required | required | documented | required | required | required | documented | required |
| `/aura-note/drafts` | required | required | required | n/a | required | required | required | required | documented | required |
| `/aura-note/workspace/[appointmentId]` | documented | required | required | required | required | required | required | required | required | required |
| workspace audio/transcription | required | required | required | required | required | required | required | required | required | required |
| workspace Suggestions/Visit Selections | required | required | required | required | required | required | required | required | documented | required |
| workspace Compliance/History Gap | required | required | required | required | required | required | required | required | documented | required |
| `/aura-note/finalization/[noteId]` | documented | required | required | required | required | required | required | required | documented | required |
| `/aura-note/finalized` | required | required | required | n/a | n/a | required | required | required | documented | required |
| `/aura-note/finalized/[noteId]` | documented | required | required | required for artifact actions | documented | required | required | required | documented | documented |
| `/aura-note/operations` | required | required | required | required | required | required | required | required | required | required |
| `/aura-note/platform` | documented | required | required | required | required | required | required | required | required | required |
| `/aura-note/integrations/ehr` | documented | required | required | required | required | required | required | required | required | required |
| `/aura-note/integrations/clinicos` | documented | required | required | required | required | required | required | required | required | required |
| `/aura-note/ai-governance` | documented | required | required | n/a | required | required | required | required | required | required |
| `/aura-note/coaching` | required | required | required | n/a | documented | required | required | required | documented | required |
| `/aura-note/support/status` | documented | required | required | documented | required | required | required | required | required | required |
| `/aura-note/figma-handoff` | n/a | n/a | required | n/a | n/a | documented | documented | required | documented | required |

## Launch-Candidate Constraint

Before launch-candidate readiness can be claimed, Playwright must exercise at least one seeded backend-backed workflow from appointment creation through finalization/export, and all production-intended screens must use typed API clients and persisted backend state. Synthetic local React state is allowed only in Storybook/demo mode or transient control state.

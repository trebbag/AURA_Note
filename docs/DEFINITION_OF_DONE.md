# Definition of Done

AURA Note implementation is done only when the feature is usable, testable, safe, and documented.

See `AGENTS.md` for the global definition. This file adds feature-level reminders.

## UX done

- Screen has empty/loading/ready/saving/blocked/error/read-only states.
- Main user action can be completed with synthetic data.
- Error messaging is clear and non-technical.
- Accessibility basics are respected.

## Backend done

- Endpoint exists and is contract-tested.
- DTO validation exists.
- Permission guard exists.
- Audit event exists.
- Domain event exists if state changes.
- Idempotency is handled when needed.
- Tests cover normal, blocked, and permission-denied paths.

## AI done

- AI request uses the gateway.
- PHI scrubber is tested.
- Response schema is validated.
- Output is labeled draft/candidate/suggestion.
- Human approval gate exists.

## Integration done

- Standalone implementation works.
- Adapter interface exists.
- Mock integrated implementation exists.
- External failures degrade visibly and safely.

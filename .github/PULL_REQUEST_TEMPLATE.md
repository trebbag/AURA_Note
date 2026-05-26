# AURA Note PR Checklist

## Work order

- Work order ID:
- Checkpoint:

## Definition of done

- [ ] Functional behavior matches work order and canonical spec.
- [ ] UX states are browser-testable or Storybook-testable.
- [ ] API/DTO/contracts updated when needed.
- [ ] Events/audit updated when needed.
- [ ] RBAC/ABAC enforced or test-stubbed.
- [ ] AI outputs remain draft/candidate/suggestion only.
- [ ] PHI boundary tests pass.
- [ ] Unit/integration/browser tests added or updated.
- [ ] RUN_LOG.md updated.
- [ ] repo_status.json updated.
- [ ] SPEC_GAPS.md updated if needed.

## Tests run

- [ ] `pnpm lint`
- [ ] `pnpm lint:phi`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`

## Notes


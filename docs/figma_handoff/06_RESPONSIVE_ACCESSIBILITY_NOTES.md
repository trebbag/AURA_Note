# Responsive And Accessibility Notes

## Breakpoints To Design

| Breakpoint | Width | Required coverage |
| --- | --- | --- |
| Desktop | 1440 px | Full workspace, side panels, drawers, operations tables, finalization wizard |
| Tablet | 1024 px | Collapsible panels, persistent action footer, readable tables |
| Mobile | 390 px | Stacked route sections, bottom action bar where useful, no horizontal overflow |

## Layout Rules

- Workspace desktop should prioritize the editor center, with context and action controls always visible.
- Right-side panels can become tabs or drawers on tablet/mobile.
- Drawer overlays must not cover required save/cancel/blocked status actions without an obvious close route.
- Tables should collapse into rows/cards on mobile with the same status and owner data.
- Critical state labels must remain visible on small screens.
- Button text must fit its container; use shorter labels or icon+tooltip patterns where needed.
- Avoid nested cards. Use panels, rows, drawers, tabs, and full-width bands.

## Keyboard Requirements

Design focus states for:

- primary navigation;
- Start/Pause/Resume/Stop controls;
- editor lock/unlock status action;
- suggestion accept/remove;
- low-confidence override modal actions;
- drawer open/close controls;
- finalization step rail;
- Sign & Dispatch;
- export/PDF/copy/download actions;
- task row actions;
- permission-denied close/return actions.

## Screen Reader Requirements

Every screen should have:

- one visible H1 matching the route purpose;
- a main landmark;
- named navigation region;
- named drawers and modals;
- labels for timer, recording state, transcript state, blocker count, and finalization state;
- no hidden sensitive content in permission-denied variants.

## State Visibility

Figma should include visual variants for:

- empty;
- loading;
- ready;
- saving;
- blocked;
- failed;
- permission-denied;
- read-only;
- degraded;
- disabled;
- finalized;
- demo fixture.

States should be visible in the frame body, not only in a tiny badge. Users need to understand what changed and what action is safe.

## Sensitive Data Boundaries

Use synthetic data only in Figma. Do not include real patient names, dates of birth, addresses, phone numbers, MRNs, policy IDs, visit notes, transcripts, payer IDs, claim numbers, tokens, production URLs, private keys, or credentials.

Safe examples:

- "Synthetic patient A"
- "AN-APPT-1001"
- "Demo transcript segment"
- "Candidate ICD-10 suggestion"
- "Internal estimate unavailable"
- "Signed download token expired"

Avoid designing any patient-facing surface that shows:

- internal revenue;
- billing review details;
- draft claim lines;
- coding confidence;
- coaching feedback;
- audit/support data;
- AI governance internals;
- disabled live-vendor details.

## Accessibility Review Checklist

- Interactive controls are at least 44 px high/tall on touch breakpoints where feasible.
- Focus order follows visual order.
- Permission-denied and failed states do not expose sensitive data.
- Read-only states remove mutation controls rather than leaving ambiguous disabled controls.
- Color is not the only status signal.
- Error and blocked states name the owner and next safe action.
- Finalized artifacts are clearly immutable.

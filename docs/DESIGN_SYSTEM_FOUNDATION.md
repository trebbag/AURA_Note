# Design System Foundation

`WO-019` establishes the first AURA Note design-system foundation for the current synthetic web shell. This is not final visual design and does not claim Figma fidelity.

## Token Contract

The source of truth for current token names and review-boundary metadata is `packages/ui/src/index.ts`.

| Token | CSS variable | Use |
| --- | --- | --- |
| Text primary | `--aura-color-text-primary` | Body text, compact headings, and artifact text. |
| Text muted | `--aura-color-text-muted` | Metadata, labels, and explanatory support copy. |
| Action primary | `--aura-color-action-primary` | Primary actions and navigational controls. |
| Surface | `--aura-color-surface` | Panels, forms, rows, status bands, and read-only viewers. |
| Canvas | `--aura-color-canvas` | Application background and inactive artifact areas. |
| Border | `--aura-color-border` | Section, row, and panel separators. |
| Border strong | `--aura-color-border-strong` | Form field and compact badge borders. |
| Success | `--aura-color-success` | Ready, approved, and completed states. |
| Warning | `--aura-color-warning` | Blocked, follow-up, and compliance warning states. |
| Control radius | `--aura-radius-control` | Buttons, inputs, links, and segmented controls. |
| Panel spacing | `--aura-space-panel` | Panel, form, row, and status-band padding. |

## Layout Posture

- AURA Note surfaces should stay dense, operational, and scannable.
- Cards are reserved for repeated items, panels, and framed tools.
- Page shells use constrained content widths with responsive single-column fallback.
- Button and control heights remain stable so state changes do not shift layouts.
- Mobile layouts must avoid horizontal overflow on schedule, workspace, and finalized-note shells.

## Review Boundaries

The UI package defines review-surface boundaries for:

- clinical documentation;
- billing and attest;
- patient summary;
- coaching;
- audit/support;
- integration status.

These boundaries are used to prevent patient-facing or human-review copy from implying autonomous diagnosis, claim submission, final charges, internal revenue exposure, coaching disclosure, unredacted audit export, or live writeback completion.

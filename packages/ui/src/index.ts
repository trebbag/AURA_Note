export const packageName = '@aura-note/ui';

export type UiTokenCategory = 'color' | 'space' | 'radius' | 'typography' | 'border';

export interface DesignToken {
  name: string;
  cssVariable: string;
  category: UiTokenCategory;
  value: string;
  usage: string;
}

export interface ReviewSurfaceBoundary {
  surface:
    | 'clinical_documentation'
    | 'billing_and_attest'
    | 'patient_summary'
    | 'coaching'
    | 'audit_support'
    | 'integration_status';
  patientFacing: boolean;
  internalOnly: boolean;
  mustShowHumanReview: boolean;
  prohibitedCopy: string[];
}

export const auraNoteDesignTokens = [
  {
    name: 'Text primary',
    cssVariable: '--aura-color-text-primary',
    category: 'color',
    value: '#17202a',
    usage: 'Primary body text and compact operational headings.'
  },
  {
    name: 'Text muted',
    cssVariable: '--aura-color-text-muted',
    category: 'color',
    value: '#596579',
    usage: 'Secondary metadata, labels, and safe explanatory copy.'
  },
  {
    name: 'Action primary',
    cssVariable: '--aura-color-action-primary',
    category: 'color',
    value: '#155eef',
    usage: 'Primary actions and focused navigation links.'
  },
  {
    name: 'Surface',
    cssVariable: '--aura-color-surface',
    category: 'color',
    value: '#ffffff',
    usage: 'Panels, rows, forms, and read-only artifact surfaces.'
  },
  {
    name: 'Canvas',
    cssVariable: '--aura-color-canvas',
    category: 'color',
    value: '#f7f8fa',
    usage: 'Application background and inactive artifact preview backgrounds.'
  },
  {
    name: 'Border',
    cssVariable: '--aura-color-border',
    category: 'border',
    value: '#d5dae3',
    usage: 'Default section, panel, and row separators.'
  },
  {
    name: 'Success',
    cssVariable: '--aura-color-success',
    category: 'color',
    value: '#0f7b4f',
    usage: 'Ready, complete, and approved states.'
  },
  {
    name: 'Warning',
    cssVariable: '--aura-color-warning',
    category: 'color',
    value: '#aa3d00',
    usage: 'Blocked, compliance warning, and follow-up required states.'
  },
  {
    name: 'Radius control',
    cssVariable: '--aura-radius-control',
    category: 'radius',
    value: '4px',
    usage: 'Buttons, inputs, links, and segmented controls.'
  },
  {
    name: 'Space panel',
    cssVariable: '--aura-space-panel',
    category: 'space',
    value: '16px',
    usage: 'Panel, row, form, and status band padding.'
  }
] as const satisfies readonly DesignToken[];

export const reviewSurfaceBoundaries = [
  {
    surface: 'clinical_documentation',
    patientFacing: false,
    internalOnly: true,
    mustShowHumanReview: true,
    prohibitedCopy: ['autonomous diagnosis', 'medical necessity determination']
  },
  {
    surface: 'billing_and_attest',
    patientFacing: false,
    internalOnly: true,
    mustShowHumanReview: true,
    prohibitedCopy: ['claim submitted', 'final charge', 'guaranteed reimbursement']
  },
  {
    surface: 'patient_summary',
    patientFacing: true,
    internalOnly: false,
    mustShowHumanReview: true,
    prohibitedCopy: ['internal revenue', 'coding logic', 'coaching score']
  },
  {
    surface: 'coaching',
    patientFacing: false,
    internalOnly: true,
    mustShowHumanReview: true,
    prohibitedCopy: ['patient-facing coaching', 'disciplinary scoring']
  },
  {
    surface: 'audit_support',
    patientFacing: false,
    internalOnly: true,
    mustShowHumanReview: true,
    prohibitedCopy: ['PHI download enabled', 'unredacted export']
  },
  {
    surface: 'integration_status',
    patientFacing: false,
    internalOnly: true,
    mustShowHumanReview: true,
    prohibitedCopy: ['live writeback complete', 'production sync enabled by default']
  }
] as const satisfies readonly ReviewSurfaceBoundary[];

export function getDesignToken(cssVariable: string): DesignToken | undefined {
  return auraNoteDesignTokens.find((token) => token.cssVariable === cssVariable);
}

export function getReviewSurfaceBoundary(surface: ReviewSurfaceBoundary['surface']): ReviewSurfaceBoundary {
  const boundary = reviewSurfaceBoundaries.find((item) => item.surface === surface);
  if (!boundary) {
    throw new Error(`Unknown review surface: ${surface}`);
  }
  return boundary;
}

export function assertCopyAllowed(surface: ReviewSurfaceBoundary['surface'], copy: string): boolean {
  const boundary = getReviewSurfaceBoundary(surface);
  const normalized = copy.toLowerCase();
  return boundary.prohibitedCopy.every((phrase) => !normalized.includes(phrase.toLowerCase()));
}

export type Role =
  | 'clinician'
  | 'ma'
  | 'billing_staff'
  | 'admin'
  | 'authorized_admin'
  | 'clinic_manager'
  | 'compliance_privacy_lead'
  | 'support'
  | 'service_account';

export type Permission =
  | 'schedule:view'
  | 'appointment:create'
  | 'visit:start'
  | 'draft_note:view'
  | 'finalization:manage'
  | 'final_note:view'
  | 'patient_summary:view'
  | 'transcript:view'
  | 'billing_detail:view'
  | 'final_note:export'
  | 'patient_summary:export'
  | 'ehr_adapter:view'
  | 'ehr_chart_context:view'
  | 'ehr_writeback:queue'
  | 'clinicos_adapter:view'
  | 'clinicos_mapping:write'
  | 'ai_gateway:invoke'
  | 'ai_governance:view'
  | 'coaching_own:view'
  | 'coaching_dashboard:view'
  | 'audit:view';

export interface AccessContext {
  role: Role;
  linkedToPatient: boolean;
  linkedToVisit: boolean;
  treatingClinician: boolean;
  billingReviewTriggered: boolean;
  authorizedAdmin: boolean;
  ownCoachingReport?: boolean;
  breakGlassActive?: boolean;
}

export interface PhiScanResult {
  containsForbiddenPhi: boolean;
  paths: string[];
}

export interface PhiTextScanResult {
  containsForbiddenPhiText: boolean;
  paths: string[];
}

export const FORBIDDEN_PHI_KEYS = [
  'patientName',
  'mrn',
  'ssn',
  'socialSecurity',
  'dob',
  'dateOfBirth',
  'externalPatientId',
  'patientExternalId',
  'insuranceMemberId',
  'memberId',
  'phone',
  'phoneNumber',
  'email',
  'emailAddress',
  'address',
  'streetAddress',
  'caregiverName',
  'clinicianName',
  'facilityIdentifier',
  'appointmentDateTime'
] as const;

const forbiddenPhiKeySet = new Set<string>(FORBIDDEN_PHI_KEYS);
const forbiddenPhiTextPatterns = [
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/,
  /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/,
  /\bMRN[:\s-]*[A-Za-z0-9-]{3,}\b/i
] as const;

export function canViewTranscript(ctx: AccessContext): boolean {
  if (ctx.authorizedAdmin) return true;
  if (ctx.treatingClinician && ctx.linkedToVisit) return true;
  if (ctx.role === 'billing_staff' && ctx.billingReviewTriggered && ctx.linkedToVisit) return true;
  return false;
}

export function canViewFinalNote(ctx: AccessContext): boolean {
  if (ctx.authorizedAdmin) return true;
  return (
    (ctx.linkedToPatient || ctx.linkedToVisit) &&
    ['clinician', 'ma', 'billing_staff', 'admin', 'clinic_manager', 'compliance_privacy_lead'].includes(ctx.role)
  );
}

export function canViewPatientSummary(ctx: AccessContext): boolean {
  if (ctx.authorizedAdmin) return true;
  return (
    (ctx.linkedToPatient || ctx.linkedToVisit) &&
    ['clinician', 'ma', 'admin', 'clinic_manager'].includes(ctx.role)
  );
}

export function canViewBillingDetail(ctx: AccessContext): boolean {
  if (ctx.authorizedAdmin) return true;
  if (ctx.role === 'billing_staff' && ctx.linkedToVisit) return true;
  return ctx.treatingClinician && ctx.linkedToVisit;
}

export function canViewCoaching(ctx: AccessContext): boolean {
  if (ctx.authorizedAdmin) return true;
  return ctx.role === 'clinician' && Boolean(ctx.ownCoachingReport);
}

export function canPerform(permission: Permission, ctx: AccessContext): boolean {
  switch (permission) {
    case 'schedule:view':
      return ctx.authorizedAdmin || ['clinician', 'ma', 'admin', 'clinic_manager'].includes(ctx.role);
    case 'appointment:create':
      return ctx.authorizedAdmin || ['clinician', 'ma', 'admin', 'clinic_manager'].includes(ctx.role);
    case 'visit:start':
      return ctx.authorizedAdmin || (ctx.role === 'clinician' && ctx.linkedToVisit);
    case 'draft_note:view':
      return ctx.authorizedAdmin || (ctx.treatingClinician && ctx.linkedToVisit);
    case 'finalization:manage':
      return ctx.authorizedAdmin || (ctx.role === 'clinician' && ctx.treatingClinician && ctx.linkedToVisit);
    case 'final_note:view':
      return canViewFinalNote(ctx);
    case 'patient_summary:view':
      return canViewPatientSummary(ctx);
    case 'transcript:view':
      return canViewTranscript(ctx);
    case 'billing_detail:view':
      return canViewBillingDetail(ctx);
    case 'final_note:export':
      return (ctx.authorizedAdmin || ctx.role === 'clinician' || ctx.role === 'ma') && canViewFinalNote(ctx);
    case 'patient_summary:export':
      return (ctx.authorizedAdmin || ['clinician', 'ma'].includes(ctx.role)) && canViewPatientSummary(ctx);
    case 'ehr_adapter:view':
      return ctx.authorizedAdmin || ['clinician', 'admin', 'clinic_manager', 'compliance_privacy_lead'].includes(ctx.role);
    case 'ehr_chart_context:view':
      return ctx.authorizedAdmin || (ctx.role === 'clinician' && ctx.treatingClinician && ctx.linkedToPatient);
    case 'ehr_writeback:queue':
      return ctx.authorizedAdmin || (ctx.role === 'clinician' && ctx.treatingClinician && ctx.linkedToVisit);
    case 'clinicos_adapter:view':
      return ctx.authorizedAdmin || ['clinician', 'admin', 'clinic_manager', 'compliance_privacy_lead'].includes(ctx.role);
    case 'clinicos_mapping:write':
      return ctx.authorizedAdmin || ctx.role === 'service_account';
    case 'ai_gateway:invoke':
      return ctx.authorizedAdmin || (ctx.role === 'clinician' && ctx.treatingClinician && ctx.linkedToVisit);
    case 'ai_governance:view':
      return ctx.authorizedAdmin || ctx.role === 'compliance_privacy_lead';
    case 'coaching_own:view':
      return canViewCoaching(ctx);
    case 'coaching_dashboard:view':
      return ctx.authorizedAdmin;
    case 'audit:view':
      return ctx.authorizedAdmin || ctx.role === 'compliance_privacy_lead';
  }
}

export function scanForForbiddenPhiKeys(value: unknown): PhiScanResult {
  const paths: string[] = [];

  function visit(current: unknown, path: string): void {
    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }

    if (!current || typeof current !== 'object') return;

    for (const [key, child] of Object.entries(current as Record<string, unknown>)) {
      const childPath = path ? `${path}.${key}` : key;
      if (forbiddenPhiKeySet.has(key)) {
        paths.push(childPath);
      }
      visit(child, childPath);
    }
  }

  visit(value, '');
  return {
    containsForbiddenPhi: paths.length > 0,
    paths
  };
}

export function containsForbiddenPhiKeys(value: unknown): boolean {
  return scanForForbiddenPhiKeys(value).containsForbiddenPhi;
}

export function scanForForbiddenPhiText(value: unknown): PhiTextScanResult {
  const paths: string[] = [];

  function visit(current: unknown, path: string): void {
    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }

    if (typeof current === 'string') {
      if (forbiddenPhiTextPatterns.some((pattern) => pattern.test(current))) {
        paths.push(path);
      }
      return;
    }

    if (!current || typeof current !== 'object') return;

    for (const [key, child] of Object.entries(current as Record<string, unknown>)) {
      const childPath = path ? `${path}.${key}` : key;
      visit(child, childPath);
    }
  }

  visit(value, '');
  return {
    containsForbiddenPhiText: paths.length > 0,
    paths
  };
}

export function redactForbiddenPhiKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactForbiddenPhiKeys(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, child]) => [
      key,
      forbiddenPhiKeySet.has(key) ? '[REDACTED]' : redactForbiddenPhiKeys(child)
    ])
  );
}

export function redactForbiddenPhiText(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactForbiddenPhiText(item));
  }

  if (typeof value === 'string') {
    return forbiddenPhiTextPatterns.some((pattern) => pattern.test(value)) ? '[REDACTED]' : value;
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, child]) => [key, redactForbiddenPhiText(child)])
  );
}

export function redactForbiddenPhi(value: unknown): unknown {
  return redactForbiddenPhiText(redactForbiddenPhiKeys(value));
}

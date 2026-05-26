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

export interface AccessContext {
  role: Role;
  linkedToPatient: boolean;
  linkedToVisit: boolean;
  treatingClinician: boolean;
  billingReviewTriggered: boolean;
  authorizedAdmin: boolean;
  breakGlassActive?: boolean;
}

export function canViewTranscript(ctx: AccessContext): boolean {
  if (ctx.authorizedAdmin) return true;
  if (ctx.treatingClinician && ctx.linkedToVisit) return true;
  if (ctx.role === 'billing_staff' && ctx.billingReviewTriggered && ctx.linkedToVisit) return true;
  return false;
}

export function canViewFinalNote(ctx: AccessContext): boolean {
  if (ctx.authorizedAdmin) return true;
  return ctx.linkedToPatient || ctx.linkedToVisit;
}

export function canViewCoaching(ctx: AccessContext, ownReport: boolean): boolean {
  if (ctx.authorizedAdmin) return true;
  return ctx.role === 'clinician' && ownReport;
}

const forbiddenPhiKeys = ['patientName', 'mrn', 'ssn', 'dob', 'phone', 'email', 'address'];

export function containsForbiddenPhiKeys(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  return Object.keys(value as Record<string, unknown>).some((key) => forbiddenPhiKeys.includes(key));
}

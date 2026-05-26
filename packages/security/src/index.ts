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
  | 'support_status:view'
  | 'audit:view'
  | 'audit:export';

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

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StructuredLogInput {
  service: string;
  level: LogLevel;
  message: string;
  requestId: string;
  traceId: string;
  eventName: string;
  timestamp: string;
  payload?: unknown;
}

export interface StructuredLogEntry {
  service: string;
  level: LogLevel;
  message: string;
  requestId: string;
  traceId: string;
  eventName: string;
  timestamp: string;
  payload?: unknown;
  redactedPaths: string[];
  phiSafe: true;
}

export interface FeatureFlagInput {
  externalAiEnabled?: boolean;
  ehrWritebackEnabled?: boolean;
  clinicOsSyncEnabled?: boolean;
  productionAnalyticsEnabled?: boolean;
  auditExportDownloadEnabled?: boolean;
}

export interface FeatureFlagDecision {
  key: string;
  enabled: boolean;
  governs:
    | 'external_ai'
    | 'ehr_writeback'
    | 'clinicos_sync'
    | 'production_analytics'
    | 'audit_export_download';
  defaultValue: false;
  disabledReason?: string;
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

export function isForbiddenPhiKey(key: string): boolean {
  return forbiddenPhiKeySet.has(key);
}

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
    case 'support_status:view':
      return (
        ctx.authorizedAdmin ||
        ['support', 'service_account', 'clinic_manager', 'compliance_privacy_lead'].includes(ctx.role)
      );
    case 'audit:view':
      return ctx.authorizedAdmin || ctx.role === 'compliance_privacy_lead';
    case 'audit:export':
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

export function redactForStructuredLog(value: unknown): { value: unknown; redactedPaths: string[] } {
  const redactedPaths: string[] = [];

  function visit(current: unknown, path: string): unknown {
    if (Array.isArray(current)) {
      return current.map((item, index) => visit(item, `${path}[${index}]`));
    }

    if (typeof current === 'string') {
      if (forbiddenPhiTextPatterns.some((pattern) => pattern.test(current))) {
        redactedPaths.push(path);
        return '[REDACTED]';
      }
      return current;
    }

    if (!current || typeof current !== 'object') {
      return current;
    }

    const output: Record<string, unknown> = {};
    let redactedFieldCount = 0;
    for (const [key, child] of Object.entries(current as Record<string, unknown>)) {
      const childPath = path ? `${path}.${key}` : key;
      if (forbiddenPhiKeySet.has(key)) {
        redactedPaths.push(childPath);
        redactedFieldCount += 1;
        output[`redactedField${redactedFieldCount}`] = '[REDACTED]';
        continue;
      }
      output[key] = visit(child, childPath);
    }
    return output;
  }

  return { value: visit(value, ''), redactedPaths };
}

export function createStructuredLogEntry(input: StructuredLogInput): StructuredLogEntry {
  const redacted = redactForStructuredLog(input.payload ?? {});
  return {
    service: input.service,
    level: input.level,
    message: input.message,
    requestId: input.requestId,
    traceId: input.traceId,
    eventName: input.eventName,
    timestamp: input.timestamp,
    payload: redacted.value,
    redactedPaths: redacted.redactedPaths,
    phiSafe: true
  };
}

export function buildExternalIntegrationFeatureFlags(input: FeatureFlagInput = {}): FeatureFlagDecision[] {
  function flag(
    key: string,
    enabled: boolean,
    governs: FeatureFlagDecision['governs'],
    disabledReason: string
  ): FeatureFlagDecision {
    return {
      key,
      enabled,
      governs,
      defaultValue: false,
      ...(enabled ? {} : { disabledReason })
    };
  }

  return [
    flag(
      'AURA_ENABLE_EXTERNAL_AI',
      input.externalAiEnabled === true,
      'external_ai',
      'External AI is disabled until private BAA governance is configured.'
    ),
    flag(
      'AURA_ENABLE_EHR_WRITEBACK',
      input.ehrWritebackEnabled === true,
      'ehr_writeback',
      'Live EHR writeback is disabled until tenant credentials and approval gates are configured.'
    ),
    flag(
      'AURA_ENABLE_CLINICOS_SYNC',
      input.clinicOsSyncEnabled === true,
      'clinicos_sync',
      'ClinicOS live sync is disabled outside mock adapter mode.'
    ),
    flag(
      'AURA_ENABLE_PRODUCTION_ANALYTICS',
      input.productionAnalyticsEnabled === true,
      'production_analytics',
      'Production analytics warehouse export is disabled for CP-4 scaffold.'
    ),
    flag(
      'AURA_ENABLE_AUDIT_EXPORT_DOWNLOAD',
      input.auditExportDownloadEnabled === true,
      'audit_export_download',
      'Audit export download is metadata-only until storage delivery is configured.'
    )
  ];
}

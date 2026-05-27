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
  tenantId?: string;
  siteId?: string;
  actorUserId?: string;
  sessionId?: string;
  purposeOfUse?: PurposeOfUse;
  identityProviderMode?: IdentityProviderMode;
  linkedToPatient: boolean;
  linkedToVisit: boolean;
  treatingClinician: boolean;
  billingReviewTriggered: boolean;
  authorizedAdmin: boolean;
  ownCoachingReport?: boolean;
  breakGlassActive?: boolean;
}

export type IdentityProviderMode = 'local_synthetic' | 'clinicos_delegate' | 'oidc_delegate';

export type PurposeOfUse = 'treatment' | 'payment' | 'operations' | 'support' | 'audit' | 'coaching' | 'break_glass';

export type HeaderMap = Record<string, string | string[] | undefined>;

export interface SyntheticLocalSessionOptions {
  defaultTenantId: string;
  defaultSiteId: string;
  defaultRole?: Role;
  defaultUserId?: string;
  defaultSessionId?: string;
  defaultPurposeOfUse?: PurposeOfUse;
  defaultLinkedToPatient?: boolean | ((role: Role) => boolean);
  defaultLinkedToVisit?: boolean | ((role: Role) => boolean);
  defaultBillingReviewTriggered?: boolean;
  requestId: string;
  traceId: string;
  userIdForRole?: (role: Role) => string;
  overrides?: Partial<AccessContext>;
}

export interface SyntheticLocalSession {
  tenantId: string;
  siteId: string;
  actorUserId: string;
  sessionId: string;
  requestId: string;
  traceId: string;
  idempotencyKey?: string;
  access: AccessContext;
  identityProviderMode: IdentityProviderMode;
  tenantScopeAllowed: boolean;
  denialReason?: string;
}

export interface TenantScopedResource {
  tenantId: string;
  siteId?: string;
}

export interface TenantScopeDecision {
  allowed: boolean;
  reason?: string;
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

const roles: Role[] = [
  'clinician',
  'ma',
  'billing_staff',
  'admin',
  'authorized_admin',
  'clinic_manager',
  'compliance_privacy_lead',
  'support',
  'service_account'
];

const roleSet = new Set<Role>(roles);

const identityProviderModes = new Set<IdentityProviderMode>(['local_synthetic', 'clinicos_delegate', 'oidc_delegate']);

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseBooleanHeader(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function parseRole(value: string | undefined, defaultRole: Role): Role {
  return value && roleSet.has(value as Role) ? (value as Role) : defaultRole;
}

function parseIdentityProviderMode(value: string | undefined): IdentityProviderMode {
  return value && identityProviderModes.has(value as IdentityProviderMode)
    ? (value as IdentityProviderMode)
    : 'local_synthetic';
}

function defaultPurposeOfUse(role: Role): PurposeOfUse {
  if (role === 'billing_staff') return 'payment';
  if (role === 'support') return 'support';
  if (role === 'compliance_privacy_lead') return 'audit';
  if (role === 'authorized_admin' || role === 'admin' || role === 'clinic_manager' || role === 'service_account') {
    return 'operations';
  }
  return 'treatment';
}

function resolveRoleBooleanDefault(value: boolean | ((role: Role) => boolean) | undefined, role: Role, fallback: boolean): boolean {
  if (typeof value === 'function') return value(role);
  return value ?? fallback;
}

export function isForbiddenPhiKey(key: string): boolean {
  return forbiddenPhiKeySet.has(key);
}

export function createSyntheticLocalSession(headers: HeaderMap, options: SyntheticLocalSessionOptions): SyntheticLocalSession {
  const role = parseRole(headerValue(headers['x-aura-role']), options.defaultRole ?? 'clinician');
  const tenantId = headerValue(headers['x-aura-tenant-id']) ?? options.defaultTenantId;
  const siteId = headerValue(headers['x-aura-site-id']) ?? options.defaultSiteId;
  const identityProviderMode = parseIdentityProviderMode(headerValue(headers['x-aura-identity-provider']));
  const actorUserId =
    headerValue(headers['x-aura-user-id']) ?? options.defaultUserId ?? options.userIdForRole?.(role) ?? `synthetic-${role}`;
  const sessionId =
    headerValue(headers['x-aura-session-id']) ?? options.defaultSessionId ?? `session-${actorUserId}-${tenantId}`;
  const purposeOfUse =
    (headerValue(headers['x-aura-purpose-of-use']) as PurposeOfUse | undefined) ??
    options.defaultPurposeOfUse ??
    defaultPurposeOfUse(role);
  const linkedToPatient =
    parseBooleanHeader(headerValue(headers['x-aura-linked-patient'])) ??
    resolveRoleBooleanDefault(options.defaultLinkedToPatient, role, role !== 'billing_staff');
  const linkedToVisit =
    parseBooleanHeader(headerValue(headers['x-aura-linked-visit'])) ??
    resolveRoleBooleanDefault(options.defaultLinkedToVisit, role, role === 'clinician');
  const billingReviewTriggered =
    parseBooleanHeader(headerValue(headers['x-aura-billing-review-triggered'])) ??
    options.defaultBillingReviewTriggered ??
    false;
  const breakGlassActive = parseBooleanHeader(headerValue(headers['x-aura-break-glass-active'])) ?? false;
  const idempotencyKey = headerValue(headers['idempotency-key']);

  let tenantScopeAllowed = true;
  let denialReason: string | undefined;
  if (identityProviderMode !== 'local_synthetic') {
    tenantScopeAllowed = false;
    denialReason = 'delegated identity providers are not configured in this local scaffold';
  } else if (tenantId !== options.defaultTenantId || siteId !== options.defaultSiteId) {
    tenantScopeAllowed = false;
    denialReason = 'cross-tenant or cross-site access is denied by the local synthetic identity boundary';
  }

  return {
    tenantId,
    siteId,
    actorUserId,
    sessionId,
    requestId: headerValue(headers['x-request-id']) ?? options.requestId,
    traceId: headerValue(headers['x-trace-id']) ?? options.traceId,
    ...(idempotencyKey ? { idempotencyKey } : {}),
    identityProviderMode,
    tenantScopeAllowed,
    ...(denialReason ? { denialReason } : {}),
    access: {
      role,
      tenantId,
      siteId,
      actorUserId,
      sessionId,
      purposeOfUse,
      identityProviderMode,
      linkedToPatient,
      linkedToVisit,
      treatingClinician: role === 'clinician' && linkedToVisit,
      billingReviewTriggered,
      authorizedAdmin: role === 'authorized_admin' || role === 'admin',
      ...(breakGlassActive ? { breakGlassActive } : {}),
      ...options.overrides
    }
  };
}

export function authorizeTenantScope(access: AccessContext, resource: TenantScopedResource): TenantScopeDecision {
  if (!access.tenantId) return { allowed: false, reason: 'access context is missing tenant scope' };
  if (access.tenantId !== resource.tenantId) return { allowed: false, reason: 'cross-tenant access denied' };
  if (resource.siteId && access.siteId && access.siteId !== resource.siteId) {
    return { allowed: false, reason: 'cross-site access denied' };
  }
  return { allowed: true };
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

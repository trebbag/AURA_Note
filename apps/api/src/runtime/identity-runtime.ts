import { HttpStatus } from '@nestjs/common';
import {
  AURA_NOTE_IDENTITY_PROVIDER_MODES,
  AURA_NOTE_PURPOSES_OF_USE,
  AURA_NOTE_ROLES,
  defaultPurposeOfUseForRole,
  type IdentityProviderMode,
  type PurposeOfUse,
  type Role
} from '@aura-note/security';

export type AuraAuthMode =
  | 'local_demo'
  | 'local_synthetic'
  | 'preview_oidc'
  | 'production_oidc'
  | 'production_saml'
  | 'clinicos_delegate';

export type IdentityRuntimeFailureReason =
  | 'auth_mode_missing'
  | 'auth_mode_invalid'
  | 'identity_context_missing'
  | 'invalid_identity_context'
  | 'synthetic_headers_forbidden'
  | 'delegated_identity_not_configured'
  | 'disabled_user'
  | 'expired_session'
  | 'wrong_tenant_or_site'
  | 'wrong_purpose';

export interface IdentityRuntimeDecision {
  allowed: boolean;
  statusCode: number;
  code: string;
  message: string;
  authMode: AuraAuthMode | 'disabled';
  identitySource: 'local_demo_headers' | 'local_synthetic_headers' | 'oidc_adapter' | 'saml_adapter' | 'clinicos_delegate_adapter' | 'none';
  failureReason?: IdentityRuntimeFailureReason;
  normalizedHeaders: Record<string, string>;
  details: {
    adapterMode: AuraAuthMode | 'disabled';
    identitySource: IdentityRuntimeDecision['identitySource'];
    failureReason?: IdentityRuntimeFailureReason;
    liveCredentialPresent: false;
    delegatedIdentityConfigured: false;
    rawTokenReturned: false;
    syntheticHeadersAccepted: boolean;
  };
}

export interface IdentityRuntimeInput {
  headers: Record<string, string | string[] | undefined>;
  path: string;
  env?: NodeJS.ProcessEnv;
  now?: string;
}

export const AURA_LOCAL_TENANT_ID = 'tenant-synthetic-primary';
export const AURA_LOCAL_SITE_ID = 'site-synthetic-primary';

const validAuthModes = new Set<AuraAuthMode>([
  'local_demo',
  'local_synthetic',
  'preview_oidc',
  'production_oidc',
  'production_saml',
  'clinicos_delegate'
]);
const validRoles = new Set<Role>(AURA_NOTE_ROLES);
const validPurposes = new Set<PurposeOfUse>(AURA_NOTE_PURPOSES_OF_USE);
const validIdentityProviderModes = new Set<IdentityProviderMode>(AURA_NOTE_IDENTITY_PROVIDER_MODES);
const safeIdPattern = /^[A-Za-z0-9._:-]{3,160}$/;

const rolePurposeAllowList: Record<Role, PurposeOfUse[]> = {
  clinician: ['treatment', 'coaching', 'break_glass'],
  ma: ['treatment', 'operations'],
  billing_staff: ['payment'],
  admin: ['operations', 'audit'],
  authorized_admin: ['operations', 'audit', 'support'],
  clinic_manager: ['operations', 'audit', 'coaching'],
  compliance_privacy_lead: ['audit', 'support'],
  support: ['support'],
  service_account: ['operations']
};

export function evaluateIdentityRuntimeBoundary(input: IdentityRuntimeInput): IdentityRuntimeDecision {
  const authModeHeader = input.env?.AURA_NOTE_AUTH_MODE;
  const authMode = validAuthModes.has(authModeHeader as AuraAuthMode) ? (authModeHeader as AuraAuthMode) : undefined;
  const path = input.path;

  if (path.includes('/health')) {
    return allowDecision(authMode ?? 'disabled', 'none', {});
  }

  if (!authModeHeader) {
    return denyDecision({
      statusCode: HttpStatus.FORBIDDEN,
      code: 'AUTH_MODE_REQUIRED',
      message: 'AURA_NOTE_AUTH_MODE is required before non-health API use.',
      authMode: 'disabled',
      identitySource: 'none',
      failureReason: 'auth_mode_missing'
    });
  }

  if (!authMode) {
    return denyDecision({
      statusCode: HttpStatus.BAD_REQUEST,
      code: 'AUTH_MODE_INVALID',
      message: 'AURA_NOTE_AUTH_MODE is not a supported AURA Note auth posture.',
      authMode: 'disabled',
      identitySource: 'none',
      failureReason: 'auth_mode_invalid'
    });
  }

  if (authMode === 'local_demo' || authMode === 'local_synthetic') {
    return evaluateLocalIdentity(input, authMode);
  }

  const source =
    authMode === 'production_saml'
      ? 'saml_adapter'
      : authMode === 'clinicos_delegate'
        ? 'clinicos_delegate_adapter'
        : 'oidc_adapter';
  const syntheticHeaderPresent = hasAnySyntheticIdentityHeader(input.headers);
  return denyDecision({
    statusCode: HttpStatus.FORBIDDEN,
    code: syntheticHeaderPresent ? 'SYNTHETIC_HEADERS_FORBIDDEN' : 'IDENTITY_ADAPTER_NOT_CONFIGURED',
    message: syntheticHeaderPresent
      ? 'Synthetic AURA Note identity headers are forbidden outside explicit local/demo auth modes.'
      : 'Production identity adapter is disabled until configured by a later approved work order.',
    authMode,
    identitySource: source,
    failureReason: syntheticHeaderPresent ? 'synthetic_headers_forbidden' : 'delegated_identity_not_configured'
  });
}

function evaluateLocalIdentity(input: IdentityRuntimeInput, authMode: 'local_demo' | 'local_synthetic'): IdentityRuntimeDecision {
  const role = headerValue(input.headers['x-aura-role']);
  if (!role) {
    return missingLocalIdentity(authMode, 'x-aura-role is required.');
  }
  if (!validRoles.has(role as Role)) {
    return invalidLocalIdentity(authMode, 'Invalid AURA Note role context.');
  }

  const typedRole = role as Role;
  const userId = headerValue(input.headers['x-aura-user-id']) ?? (authMode === 'local_demo' ? `user-${typedRole}-synthetic-runtime` : undefined);
  const sessionId =
    headerValue(input.headers['x-aura-session-id']) ?? (authMode === 'local_demo' ? `session-${typedRole}-synthetic-runtime` : undefined);
  const purpose =
    headerValue(input.headers['x-aura-purpose-of-use']) ?? (authMode === 'local_demo' ? defaultPurposeOfUseForRole(typedRole) : undefined);
  if (!userId || !sessionId || !purpose) {
    return missingLocalIdentity(authMode, 'x-aura-user-id, x-aura-session-id, and x-aura-purpose-of-use are required.');
  }
  if (!validPurposes.has(purpose as PurposeOfUse)) {
    return invalidLocalIdentity(authMode, 'Invalid AURA Note purpose-of-use context.');
  }
  if (!rolePurposeAllowList[typedRole].includes(purpose as PurposeOfUse)) {
    return denyDecision({
      statusCode: HttpStatus.FORBIDDEN,
      code: 'PURPOSE_OF_USE_DENIED',
      message: 'AURA Note purpose-of-use is not allowed for this role.',
      authMode,
      identitySource: identitySourceForLocalMode(authMode),
      failureReason: 'wrong_purpose'
    });
  }

  const identityProviderMode = headerValue(input.headers['x-aura-identity-provider']) ?? 'local_synthetic';
  if (!validIdentityProviderModes.has(identityProviderMode as IdentityProviderMode)) {
    return invalidLocalIdentity(authMode, 'Invalid AURA Note identity-provider context.');
  }
  if (identityProviderMode !== 'local_synthetic') {
    return denyDecision({
      statusCode: HttpStatus.FORBIDDEN,
      code: 'DELEGATED_IDENTITY_NOT_CONFIGURED',
      message: 'Delegated identity providers are disabled until configured by a later approved work order.',
      authMode,
      identitySource: identitySourceForLocalMode(authMode),
      failureReason: 'delegated_identity_not_configured'
    });
  }

  const tenantId = headerValue(input.headers['x-aura-tenant-id']) ?? AURA_LOCAL_TENANT_ID;
  const siteId = headerValue(input.headers['x-aura-site-id']) ?? AURA_LOCAL_SITE_ID;
  for (const value of [userId, sessionId, tenantId, siteId]) {
    if (!safeIdPattern.test(value)) {
      return invalidLocalIdentity(authMode, 'AURA Note identity context contains an invalid synthetic identifier.');
    }
  }
  if (tenantId !== AURA_LOCAL_TENANT_ID || siteId !== AURA_LOCAL_SITE_ID) {
    return denyDecision({
      statusCode: HttpStatus.FORBIDDEN,
      code: 'TENANT_SITE_SCOPE_DENIED',
      message: 'Cross-tenant or cross-site access is denied by the AURA Note identity boundary.',
      authMode,
      identitySource: identitySourceForLocalMode(authMode),
      failureReason: 'wrong_tenant_or_site'
    });
  }

  if (headerValue(input.headers['x-aura-user-status']) === 'disabled' || headerValue(input.headers['x-aura-user-disabled']) === 'true') {
    return denyDecision({
      statusCode: HttpStatus.FORBIDDEN,
      code: 'DISABLED_USER_DENIED',
      message: 'Disabled users are blocked by the AURA Note identity boundary.',
      authMode,
      identitySource: identitySourceForLocalMode(authMode),
      failureReason: 'disabled_user'
    });
  }

  const expiresAt = headerValue(input.headers['x-aura-session-expires-at']) ?? '2099-01-01T00:00:00.000Z';
  if (Number.isNaN(Date.parse(expiresAt))) {
    return invalidLocalIdentity(authMode, 'AURA Note session expiration context is invalid.');
  }
  if (Date.parse(expiresAt) <= Date.parse(input.now ?? new Date().toISOString())) {
    return denyDecision({
      statusCode: HttpStatus.FORBIDDEN,
      code: 'SESSION_EXPIRED',
      message: 'Expired sessions are blocked by the AURA Note identity boundary.',
      authMode,
      identitySource: identitySourceForLocalMode(authMode),
      failureReason: 'expired_session'
    });
  }

  return allowDecision(authMode, identitySourceForLocalMode(authMode), {
    'x-aura-role': typedRole,
    'x-aura-user-id': userId,
    'x-aura-session-id': sessionId,
    'x-aura-purpose-of-use': purpose,
    'x-aura-identity-provider': 'local_synthetic',
    'x-aura-tenant-id': tenantId,
    'x-aura-site-id': siteId,
    'x-aura-session-expires-at': expiresAt
  });
}

function allowDecision(
  authMode: AuraAuthMode | 'disabled',
  identitySource: IdentityRuntimeDecision['identitySource'],
  normalizedHeaders: Record<string, string>
): IdentityRuntimeDecision {
  return {
    allowed: true,
    statusCode: HttpStatus.OK,
    code: 'IDENTITY_ACCEPTED',
    message: 'AURA Note identity context accepted.',
    authMode,
    identitySource,
    normalizedHeaders,
    details: {
      adapterMode: authMode,
      identitySource,
      liveCredentialPresent: false,
      delegatedIdentityConfigured: false,
      rawTokenReturned: false,
      syntheticHeadersAccepted: identitySource === 'local_demo_headers' || identitySource === 'local_synthetic_headers'
    }
  };
}

function missingLocalIdentity(authMode: AuraAuthMode, message: string): IdentityRuntimeDecision {
  return denyDecision({
    statusCode: HttpStatus.FORBIDDEN,
    code: 'IDENTITY_CONTEXT_MISSING',
    message,
    authMode,
    identitySource: identitySourceForLocalMode(authMode),
    failureReason: 'identity_context_missing'
  });
}

function invalidLocalIdentity(authMode: AuraAuthMode, message: string): IdentityRuntimeDecision {
  return denyDecision({
    statusCode: HttpStatus.BAD_REQUEST,
    code: 'IDENTITY_CONTEXT_INVALID',
    message,
    authMode,
    identitySource: identitySourceForLocalMode(authMode),
    failureReason: 'invalid_identity_context'
  });
}

function denyDecision(input: {
  statusCode: number;
  code: string;
  message: string;
  authMode: AuraAuthMode | 'disabled';
  identitySource: IdentityRuntimeDecision['identitySource'];
  failureReason: IdentityRuntimeFailureReason;
}): IdentityRuntimeDecision {
  return {
    allowed: false,
    statusCode: input.statusCode,
    code: input.code,
    message: input.message,
    authMode: input.authMode,
    identitySource: input.identitySource,
    failureReason: input.failureReason,
    normalizedHeaders: {},
    details: {
      adapterMode: input.authMode,
      identitySource: input.identitySource,
      failureReason: input.failureReason,
      liveCredentialPresent: false,
      delegatedIdentityConfigured: false,
      rawTokenReturned: false,
      syntheticHeadersAccepted: false
    }
  };
}

function identitySourceForLocalMode(mode: AuraAuthMode): 'local_demo_headers' | 'local_synthetic_headers' {
  return mode === 'local_demo' ? 'local_demo_headers' : 'local_synthetic_headers';
}

function hasAnySyntheticIdentityHeader(headers: Record<string, string | string[] | undefined>): boolean {
  return [
    'x-aura-role',
    'x-aura-user-id',
    'x-aura-session-id',
    'x-aura-tenant-id',
    'x-aura-site-id',
    'x-aura-purpose-of-use',
    'x-aura-identity-provider',
    'x-aura-linked-patient',
    'x-aura-linked-visit',
    'x-aura-billing-review-triggered',
    'x-aura-break-glass-active'
  ].some((header) => headerValue(headers[header]) !== undefined);
}

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

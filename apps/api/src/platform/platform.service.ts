import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  createApiEnvelope,
  createEventEnvelope,
  type ApiEnvelope,
  type AuditEventDto,
  type CoreEventType,
  type GovernedFeatureFlagDto,
  type PlatformActionResponseDto,
  type PlatformAdminViewDto,
  type ProductionConfigValidationDto,
  type ProductionConfigValidationRequestDto,
  type SecretSourceStatusDto,
  type SessionEvaluationDto,
  type SessionEvaluationRequestDto,
  type UpdateGovernedFeatureFlagRequestDto,
  type UpdateWorkforceUserRequestDto,
  type WorkforceUserAdminDto,
  type AuraNoteEvent
} from '@aura-note/contracts';
import {
  canPerform,
  createSyntheticLocalSession,
  evaluateProductionIdentityGuard,
  scanForForbiddenPhiKeys,
  scanForForbiddenPhiText,
  type AccessContext,
  type IdentityProviderMode,
  type PurposeOfUse
} from '@aura-note/security';

const TENANT_ID = 'tenant-synthetic-primary';
const SITE_ID = 'site-synthetic-primary';
const APP_MODE = 'standalone' as const;

interface RequestContext {
  requestId: string;
  traceId: string;
  actorUserId: string;
  access: AccessContext;
  idempotencyKey?: string;
}

@Injectable()
export class PlatformService {
  private sequence = 1;

  private readonly users: WorkforceUserAdminDto[] = [
    {
      userId: 'user-admin-synthetic-001',
      tenantId: TENANT_ID,
      siteIds: [SITE_ID],
      role: 'admin',
      status: 'active',
      allowedPurposes: ['operations', 'audit'],
      disabledUserBlocked: false,
      syntheticOnly: true
    },
    {
      userId: 'user-clinician-synthetic-001',
      tenantId: TENANT_ID,
      siteIds: [SITE_ID],
      role: 'clinician',
      status: 'active',
      allowedPurposes: ['treatment'],
      disabledUserBlocked: false,
      syntheticOnly: true
    },
    {
      userId: 'user-support-disabled',
      tenantId: TENANT_ID,
      siteIds: [SITE_ID],
      role: 'support',
      status: 'disabled',
      allowedPurposes: ['support'],
      disabledUserBlocked: true,
      syntheticOnly: true
    }
  ];

  private readonly secretSources: SecretSourceStatusDto[] = [
    {
      secretName: 'OIDC_CLIENT_SECRET',
      source: 'not_configured',
      configured: false,
      valueReturned: false,
      requiredFor: 'identity_provider'
    },
    {
      secretName: 'AZURE_STORAGE_CREDENTIAL_SOURCE',
      source: 'environment_reference',
      configured: false,
      valueReturned: false,
      requiredFor: 'production_storage'
    },
    {
      secretName: 'LIVE_TRANSCRIPTION_PROVIDER_SECRET',
      source: 'secret_manager_reference',
      configured: false,
      valueReturned: false,
      requiredFor: 'live_transcription'
    }
  ];

  private readonly featureFlags: GovernedFeatureFlagDto[] = [
    this.createFlag('AURA_ENABLE_LIVE_TRANSCRIPTION', 'live_transcription'),
    this.createFlag('AURA_ENABLE_EXTERNAL_AI', 'external_ai'),
    this.createFlag('AURA_ENABLE_EHR_WRITEBACK', 'ehr_writeback'),
    this.createFlag('AURA_ENABLE_PRODUCTION_STORAGE', 'production_storage'),
    this.createFlag('AURA_ENABLE_RETENTION_DELETION', 'retention_deletion'),
    this.createFlag('AURA_ENABLE_PATIENT_FACING_ESTIMATES', 'patient_facing_estimates'),
    this.createFlag('AURA_ENABLE_CLAIM_SUBMISSION', 'claim_submission')
  ];

  getPlatformAdmin(context: RequestContext): ApiEnvelope<PlatformAdminViewDto> {
    this.assertTenantScope(context);
    if (!canPerform('identity:view', context.access) || !canPerform('config:view', context.access)) {
      throw new ForbiddenException('role cannot view production platform administration');
    }
    return createApiEnvelope(this.createPlatformView(), this.createMeta(context));
  }

  updateUser(
    userId: string,
    request: UpdateWorkforceUserRequestDto,
    context: RequestContext
  ): ApiEnvelope<PlatformActionResponseDto> {
    this.assertTenantScope(context);
    if (!canPerform('identity:manage', context.access)) {
      throw new ForbiddenException('role cannot manage workforce identity');
    }
    this.assertSafeReason(request.reason, 'user status update reason');
    const user = this.users.find((candidate) => candidate.userId === userId);
    if (!user) {
      throw new NotFoundException('workforce user not found');
    }
    user.status = request.status;
    user.disabledUserBlocked = request.status === 'disabled';

    return createApiEnvelope(
      {
        platform: this.createPlatformView(),
        user,
        auditEvent: this.createAuditEvent('identity.user_update', 'User', user.userId, context),
        domainEvents: [
          this.createDomainEvent('identity.user_updated.v1', context, {
            userId: user.userId,
            status: user.status,
            disabledUserBlocked: user.disabledUserBlocked
          })
        ]
      },
      this.createMeta(context)
    );
  }

  evaluateSession(
    request: SessionEvaluationRequestDto,
    context: RequestContext
  ): ApiEnvelope<PlatformActionResponseDto> {
    this.assertTenantScope(context);
    if (!canPerform('identity:view', context.access)) {
      throw new ForbiddenException('role cannot evaluate identity sessions');
    }
    if (scanForForbiddenPhiKeys(request).containsForbiddenPhi || scanForForbiddenPhiText(request).containsForbiddenPhiText) {
      throw new BadRequestException('session evaluation payload must not contain obvious PHI or secrets');
    }

    const user = this.users.find((candidate) => candidate.userId === request.userId);
    const decisionAccess: AccessContext = {
      role: user?.role ?? 'clinician',
      tenantId: request.tenantId,
      siteId: request.siteId,
      actorUserId: request.userId,
      sessionId: request.sessionId,
      ...(request.purposeOfUse ? { purposeOfUse: request.purposeOfUse as PurposeOfUse } : {}),
      identityProviderMode: request.identityProviderMode as IdentityProviderMode,
      linkedToPatient: true,
      linkedToVisit: true,
      treatingClinician: user?.role === 'clinician',
      billingReviewTriggered: false,
      authorizedAdmin: user?.role === 'authorized_admin' || user?.role === 'admin'
    };
    const guard = evaluateProductionIdentityGuard({
      access: decisionAccess,
      expectedTenantId: TENANT_ID,
      expectedSiteId: SITE_ID,
      userStatus: request.disabled ? 'disabled' : user?.status ?? 'active',
      expiresAt: request.expiresAt,
      now: '2026-05-27T23:59:00.000Z',
      delegatedIdentityConfigured: false
    });
    const sessionDecision: SessionEvaluationDto = {
      allowed: guard.allowed,
      ...(guard.reason ? { denialReason: guard.reason } : {}),
      userId: request.userId,
      sessionId: request.sessionId,
      identityProviderMode: request.identityProviderMode,
      ...(request.purposeOfUse ? { purposeOfUse: request.purposeOfUse } : {}),
      expiresAt: request.expiresAt,
      evaluatedAt: '2026-05-27T23:59:00.000Z',
      failClosed: true,
      rawTokenReturned: false
    };

    return createApiEnvelope(
      {
        sessionDecision,
        auditEvent: this.createAuditEvent('identity.session_evaluate', 'Session', request.sessionId, context),
        domainEvents: [
          this.createDomainEvent('identity.session_evaluated.v1', context, {
            sessionId: request.sessionId,
            allowed: sessionDecision.allowed,
            denialReason: sessionDecision.denialReason ?? null,
            rawTokenReturned: false
          })
        ]
      },
      this.createMeta(context)
    );
  }

  validateConfig(
    request: ProductionConfigValidationRequestDto,
    context: RequestContext
  ): ApiEnvelope<PlatformActionResponseDto> {
    this.assertTenantScope(context);
    if (!canPerform('config:view', context.access)) {
      throw new ForbiddenException('role cannot validate production configuration');
    }
    if (scanForForbiddenPhiKeys(request).containsForbiddenPhi || scanForForbiddenPhiText(request).containsForbiddenPhiText) {
      throw new BadRequestException('configuration validation payload must not contain obvious PHI or secret values');
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    if (request.environment === 'production') {
      const missing = request.secretSources.filter((source) => source.source === 'not_configured' || !source.configured);
      errors.push(...missing.map((source) => `${source.secretName} is required before production use`));
    }
    for (const flag of request.highRiskFlags ?? []) {
      if (flag.enabled && !flag.approvalId) {
        errors.push(`${flag.key} requires approval evidence before enablement`);
      }
      if (flag.enabled) {
        warnings.push(`${flag.key} is metadata-only until the governed live integration work order approves execution`);
      }
    }

    const configValidation: ProductionConfigValidationDto = {
      environment: request.environment,
      valid: errors.length === 0,
      failClosed: true,
      errors,
      warnings,
      secretValuesReturned: false,
      productionCredentialsRequired: request.environment === 'production'
    };

    return createApiEnvelope(
      {
        configValidation,
        auditEvent: this.createAuditEvent('config.validate', 'Configuration', request.environment, context),
        domainEvents: [
          this.createDomainEvent('config.validation_completed.v1', context, {
            environment: request.environment,
            valid: configValidation.valid,
            secretValuesReturned: false
          })
        ]
      },
      this.createMeta(context)
    );
  }

  updateFeatureFlag(
    key: string,
    request: UpdateGovernedFeatureFlagRequestDto,
    context: RequestContext
  ): ApiEnvelope<PlatformActionResponseDto> {
    this.assertTenantScope(context);
    if (!canPerform('feature_flag:manage', context.access)) {
      throw new ForbiddenException('role cannot manage high-risk feature flags');
    }
    this.assertSafeReason(request.reason, 'feature flag update reason');
    const flag = this.featureFlags.find((candidate) => candidate.key === key);
    if (!flag) {
      throw new NotFoundException('feature flag not found');
    }
    if (request.enabled && !request.approvalId) {
      throw new BadRequestException('high-risk feature flags require approval evidence before enablement');
    }
    flag.enabled = request.enabled;
    if (request.enabled && request.approvalId) {
      flag.approvalId = request.approvalId;
    } else {
      delete flag.approvalId;
    }
    flag.runtimeEffect = request.enabled ? 'metadata_only_no_live_execution' : 'disabled';

    return createApiEnvelope(
      {
        platform: this.createPlatformView(),
        featureFlag: flag,
        auditEvent: this.createAuditEvent('feature_flag.update', 'FeatureFlag', flag.key, context),
        domainEvents: [
          this.createDomainEvent('feature_flag.updated.v1', context, {
            key: flag.key,
            enabled: flag.enabled,
            approvalId: flag.approvalId ?? null,
            liveExecutionEnabled: false
          })
        ]
      },
      this.createMeta(context)
    );
  }

  createRequestContext(headers: Record<string, string | string[] | undefined>): RequestContext {
    const session = createSyntheticLocalSession(headers, {
      defaultTenantId: TENANT_ID,
      defaultSiteId: SITE_ID,
      defaultRole: 'admin',
      requestId: 'req-platform',
      traceId: 'trace-platform',
      defaultPurposeOfUse: 'operations',
      defaultLinkedToPatient: false,
      defaultLinkedToVisit: false,
      userIdForRole: (role) => `user-${role}-synthetic-001`
    });
    if (!session.tenantScopeAllowed) {
      throw new ForbiddenException(session.denialReason ?? 'tenant scope denied');
    }
    return {
      requestId: session.requestId,
      traceId: session.traceId,
      actorUserId: session.actorUserId,
      access: session.access,
      ...(session.idempotencyKey ? { idempotencyKey: session.idempotencyKey } : {})
    };
  }

  private createPlatformView(): PlatformAdminViewDto {
    return {
      tenant: {
        tenantId: TENANT_ID,
        displayName: 'Synthetic Primary Tenant',
        standaloneOwned: true
      },
      sites: [{ siteId: SITE_ID, displayName: 'Synthetic Primary Site', status: 'active' }],
      identityAdapters: [
        {
          adapterId: 'identity-local-dev',
          kind: 'local_dev',
          identityProviderMode: 'local_synthetic',
          status: 'ready_local',
          configured: true,
          liveCredentialPresent: false,
          delegatedIdentityAllowed: false
        },
        {
          adapterId: 'identity-oidc',
          kind: 'oidc',
          identityProviderMode: 'oidc_delegate',
          status: 'disabled_until_configured',
          configured: false,
          liveCredentialPresent: false,
          delegatedIdentityAllowed: false,
          disabledReason: 'OIDC provider and secret source are not configured.'
        },
        {
          adapterId: 'identity-saml',
          kind: 'saml',
          identityProviderMode: 'saml_delegate',
          status: 'disabled_until_configured',
          configured: false,
          liveCredentialPresent: false,
          delegatedIdentityAllowed: false,
          disabledReason: 'SAML metadata and signing material are not configured.'
        },
        {
          adapterId: 'identity-clinicos',
          kind: 'clinicos_delegate',
          identityProviderMode: 'clinicos_delegate',
          status: 'disabled_until_configured',
          configured: false,
          liveCredentialPresent: false,
          delegatedIdentityAllowed: false,
          disabledReason: 'ClinicOS delegated identity remains adapter-bound and disabled.'
        }
      ],
      users: this.users,
      sessionPolicies: {
        expirationEnforced: true,
        disabledUsersFailClosed: true,
        purposeOfUseRequired: true,
        spoofedTenantDenied: true
      },
      secretSources: this.secretSources,
      featureFlags: this.featureFlags,
      modeMappings: [
        { localObject: 'identity_session', clinicosTarget: 'M17 NP Cockpit delegated identity', status: 'safe_degraded' },
        { localObject: 'feature_flag', clinicosTarget: 'M24 AI Governance policy', status: 'not_configured' }
      ],
      states: ['empty', 'loading', 'ready', 'saving', 'blocked', 'failed', 'permission-denied', 'disabled-user', 'expired-session', 'unsafe-config', 'demo fixture'],
      demoFixture: true
    };
  }

  private createFlag(key: GovernedFeatureFlagDto['key'], governs: GovernedFeatureFlagDto['governs']): GovernedFeatureFlagDto {
    return {
      key,
      enabled: false,
      defaultValue: false,
      governs,
      highRisk: true,
      approvalRequired: true,
      runtimeEffect: 'disabled',
      liveExecutionEnabled: false,
      visibleToAdmins: true
    };
  }

  private assertSafeReason(value: string, label: string): void {
    if (!value.trim()) {
      throw new BadRequestException(`${label} is required`);
    }
    if (scanForForbiddenPhiText(value).containsForbiddenPhiText) {
      throw new BadRequestException(`${label} must not contain obvious PHI or secrets`);
    }
  }

  private assertTenantScope(context: RequestContext): void {
    if (context.access.tenantId !== TENANT_ID || context.access.siteId !== SITE_ID) {
      throw new ForbiddenException('cross-tenant or cross-site access denied');
    }
  }

  private createAuditEvent(action: string, entityType: string, entityId: string, context: RequestContext): AuditEventDto {
    return {
      auditEventId: this.nextId('audit'),
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      actorUserId: context.actorUserId,
      action,
      entityType,
      entityId,
      traceId: context.traceId,
      createdAt: new Date().toISOString()
    };
  }

  private createDomainEvent(
    eventType: CoreEventType,
    context: RequestContext,
    payload: Record<string, unknown>
  ): AuraNoteEvent<Record<string, unknown>> {
    return createEventEnvelope({
      eventId: this.nextId('evt'),
      eventType,
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      producer: 'aura-note-api',
      traceId: context.traceId,
      idempotencyKey: context.idempotencyKey ?? `${context.requestId}:${eventType}`,
      sensitivity: 'restricted',
      retentionClass: 'audit',
      payload
    });
  }

  private createMeta(context: RequestContext) {
    return {
      requestId: context.requestId,
      traceId: context.traceId,
      mode: APP_MODE,
      generatedAt: new Date().toISOString()
    };
  }

  private nextId(prefix: string): string {
    const value = `${prefix}-${String(this.sequence).padStart(4, '0')}`;
    this.sequence += 1;
    return value;
  }
}

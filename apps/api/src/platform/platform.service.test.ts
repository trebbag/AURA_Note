import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PlatformService } from './platform.service';

describe('PlatformService', () => {
  it('exposes production-shaped identity and config status without live credentials', () => {
    const service = new PlatformService();
    const response = service.getPlatformAdmin(service.createRequestContext({ 'x-aura-role': 'admin' }));

    assert.equal(response.data.identityAdapters.some((adapter) => adapter.identityProviderMode === 'oidc_delegate'), true);
    assert.equal(response.data.identityAdapters.every((adapter) => adapter.liveCredentialPresent === false), true);
    assert.equal(response.data.sessionPolicies.disabledUsersFailClosed, true);
    assert.equal(response.data.featureFlags.every((flag) => flag.defaultValue === false), true);
    assert.equal(response.data.featureFlags.every((flag) => flag.liveExecutionEnabled === false), true);
  });

  it('fails closed for disabled, expired, missing purpose, spoofed tenant, and delegated sessions', () => {
    const service = new PlatformService();
    const context = service.createRequestContext({ 'x-aura-role': 'admin' });

    const disabled = service.evaluateSession(
      {
        userId: 'user-support-disabled',
        sessionId: 'session-disabled',
        tenantId: 'tenant-synthetic-primary',
        siteId: 'site-synthetic-primary',
        identityProviderMode: 'local_synthetic',
        purposeOfUse: 'support',
        expiresAt: '2026-05-28T23:59:00.000Z',
        disabled: true
      },
      context
    );
    assert.equal(disabled.data.sessionDecision?.allowed, false);
    assert.equal(disabled.data.sessionDecision?.denialReason, 'disabled user blocked');

    const expired = service.evaluateSession(
      {
        userId: 'user-clinician-synthetic-001',
        sessionId: 'session-expired',
        tenantId: 'tenant-synthetic-primary',
        siteId: 'site-synthetic-primary',
        identityProviderMode: 'local_synthetic',
        purposeOfUse: 'treatment',
        expiresAt: '2026-05-27T20:00:00.000Z'
      },
      context
    );
    assert.equal(expired.data.sessionDecision?.denialReason, 'session expired');

    const missingPurpose = service.evaluateSession(
      {
        userId: 'user-clinician-synthetic-001',
        sessionId: 'session-missing-purpose',
        tenantId: 'tenant-synthetic-primary',
        siteId: 'site-synthetic-primary',
        identityProviderMode: 'local_synthetic',
        expiresAt: '2026-05-28T23:59:00.000Z'
      },
      context
    );
    assert.equal(missingPurpose.data.sessionDecision?.denialReason, 'purpose-of-use is required');

    const wrongTenant = service.evaluateSession(
      {
        userId: 'user-clinician-synthetic-001',
        sessionId: 'session-wrong-tenant',
        tenantId: 'tenant-other',
        siteId: 'site-synthetic-primary',
        identityProviderMode: 'local_synthetic',
        purposeOfUse: 'treatment',
        expiresAt: '2026-05-28T23:59:00.000Z'
      },
      context
    );
    assert.equal(wrongTenant.data.sessionDecision?.denialReason, 'spoofed tenant or site denied');

    const delegated = service.evaluateSession(
      {
        userId: 'user-clinician-synthetic-001',
        sessionId: 'session-delegated',
        tenantId: 'tenant-synthetic-primary',
        siteId: 'site-synthetic-primary',
        identityProviderMode: 'oidc_delegate',
        purposeOfUse: 'treatment',
        expiresAt: '2026-05-28T23:59:00.000Z'
      },
      context
    );
    assert.equal(delegated.data.sessionDecision?.denialReason, 'delegated identity provider is not configured');
  });

  it('requires admin authority and approval evidence for high-risk flag changes', () => {
    const service = new PlatformService();

    assert.throws(
      () =>
        service.updateFeatureFlag(
          'AURA_ENABLE_LIVE_TRANSCRIPTION',
          { enabled: true, reason: 'Synthetic approval review.' },
          service.createRequestContext({ 'x-aura-role': 'admin' })
        ),
      BadRequestException
    );

    assert.throws(
      () =>
        service.updateFeatureFlag(
          'AURA_ENABLE_LIVE_TRANSCRIPTION',
          { enabled: false, reason: 'Synthetic admin review.' },
          service.createRequestContext({ 'x-aura-role': 'clinic_manager' })
        ),
      ForbiddenException
    );

    const updated = service.updateFeatureFlag(
      'AURA_ENABLE_LIVE_TRANSCRIPTION',
      { enabled: true, approvalId: 'approval-synthetic-security-001', reason: 'Synthetic approval review.' },
      service.createRequestContext({ 'x-aura-role': 'admin' })
    );
    assert.equal(updated.data.featureFlag?.enabled, true);
    assert.equal(updated.data.featureFlag?.runtimeEffect, 'metadata_only_no_live_execution');
    assert.equal(updated.data.featureFlag?.liveExecutionEnabled, false);
  });

  it('validates production config fail-closed without returning secret values', () => {
    const service = new PlatformService();
    const response = service.validateConfig(
      {
        environment: 'production',
        secretSources: [
          {
            secretName: 'OIDC_CLIENT_SECRET',
            source: 'not_configured',
            configured: false,
            valueReturned: false,
            requiredFor: 'identity_provider'
          }
        ],
        highRiskFlags: [{ key: 'AURA_ENABLE_EXTERNAL_AI', enabled: true }]
      },
      service.createRequestContext({ 'x-aura-role': 'admin' })
    );

    assert.equal(response.data.configValidation?.valid, false);
    assert.equal(response.data.configValidation?.secretValuesReturned, false);
    assert.equal(response.data.domainEvents[0]?.eventType, 'config.validation_completed.v1');
  });
});

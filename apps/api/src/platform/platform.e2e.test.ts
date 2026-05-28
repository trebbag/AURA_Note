import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('production platform API', () => {
  let app: INestApplication;

  before(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  after(async () => {
    await app.close();
  });

  it('exposes identity, tenant admin, config, and feature flag status to admins only', async () => {
    const admin = await request(app.getHttpServer()).get('/api/v1/platform/admin').set('x-aura-role', 'admin').expect(200);

    assert.equal(admin.body.data.identityAdapters.some((adapter: { identityProviderMode: string }) => adapter.identityProviderMode === 'saml_delegate'), true);
    assert.equal(admin.body.data.secretSources.every((source: { valueReturned: boolean }) => source.valueReturned === false), true);
    assert.equal(admin.body.data.featureFlags.every((flag: { liveExecutionEnabled: boolean }) => flag.liveExecutionEnabled === false), true);
    assert.equal(admin.body.data.states.includes('disabled-user'), true);

    await request(app.getHttpServer()).get('/api/v1/platform/admin').set('x-aura-role', 'clinician').expect(403);
  });

  it('fails closed for session evaluation and updates disabled users with audit evidence', async () => {
    const expired = await request(app.getHttpServer())
      .post('/api/v1/platform/identity/session-evaluations')
      .set('x-aura-role', 'admin')
      .send({
        userId: 'user-clinician-synthetic-001',
        sessionId: 'session-e2e-expired',
        tenantId: 'tenant-synthetic-primary',
        siteId: 'site-synthetic-primary',
        identityProviderMode: 'local_synthetic',
        purposeOfUse: 'treatment',
        expiresAt: '2026-05-27T20:00:00.000Z'
      })
      .expect(201);

    assert.equal(expired.body.data.sessionDecision.allowed, false);
    assert.equal(expired.body.data.sessionDecision.denialReason, 'session expired');
    assert.equal(expired.body.data.sessionDecision.rawTokenReturned, false);

    const disabled = await request(app.getHttpServer())
      .patch('/api/v1/platform/identity/users/user-clinician-synthetic-001')
      .set('x-aura-role', 'admin')
      .send({ status: 'disabled', reason: 'Synthetic access review.' })
      .expect(200);

    assert.equal(disabled.body.data.user.disabledUserBlocked, true);
    assert.equal(disabled.body.data.domainEvents[0].eventType, 'identity.user_updated.v1');
  });

  it('validates production config and high-risk flags without enabling live execution', async () => {
    const config = await request(app.getHttpServer())
      .post('/api/v1/platform/config/validate')
      .set('x-aura-role', 'admin')
      .send({
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
      })
      .expect(201);

    assert.equal(config.body.data.configValidation.valid, false);
    assert.equal(config.body.data.configValidation.secretValuesReturned, false);

    await request(app.getHttpServer())
      .patch('/api/v1/platform/feature-flags/AURA_ENABLE_EXTERNAL_AI')
      .set('x-aura-role', 'admin')
      .send({ enabled: true, reason: 'Synthetic review without approval.' })
      .expect(400);

    const flag = await request(app.getHttpServer())
      .patch('/api/v1/platform/feature-flags/AURA_ENABLE_EXTERNAL_AI')
      .set('x-aura-role', 'admin')
      .send({
        enabled: true,
        approvalId: 'approval-synthetic-security-002',
        reason: 'Synthetic approval review.'
      })
      .expect(200);

    assert.equal(flag.body.data.featureFlag.runtimeEffect, 'metadata_only_no_live_execution');
    assert.equal(flag.body.data.featureFlag.liveExecutionEnabled, false);
    assert.equal(flag.body.data.domainEvents[0].eventType, 'feature_flag.updated.v1');
  });
});

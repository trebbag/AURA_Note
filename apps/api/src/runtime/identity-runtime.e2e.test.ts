import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { configureAuraApi } from './api-runtime';
import { clearRuntimeLogEntries, getRuntimeLogEntries } from './runtime-log';

describe('AURA identity runtime boundary', () => {
  let app: INestApplication;
  const previousAuthMode = process.env.AURA_NOTE_AUTH_MODE;

  before(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    configureAuraApi(app);
    await app.init();
  });

  beforeEach(() => {
    clearRuntimeLogEntries();
    process.env.AURA_NOTE_AUTH_MODE = 'local_demo';
  });

  after(async () => {
    if (previousAuthMode === undefined) {
      delete process.env.AURA_NOTE_AUTH_MODE;
    } else {
      process.env.AURA_NOTE_AUTH_MODE = previousAuthMode;
    }
    await app.close();
  });

  it('accepts local demo headers only when the local demo auth posture is explicit', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/platform/admin').set('x-aura-role', 'admin').expect(200);

    assert.equal(response.headers['x-aura-auth-mode'], 'local_demo');
    assert.equal(response.headers['x-aura-identity-source'], 'local_demo_headers');
    assert.equal(response.body.data.identityAdapters.some((adapter: { identityProviderMode: string }) => adapter.identityProviderMode === 'oidc_delegate'), true);
    assert.equal(getRuntimeLogEntries().some((entry) => entry.eventName === 'identity.accepted'), true);
  });

  it('accepts strict local synthetic identity only when role, user, session, and purpose are present', async () => {
    process.env.AURA_NOTE_AUTH_MODE = 'local_synthetic';

    await request(app.getHttpServer())
      .get('/api/v1/platform/admin')
      .set('x-aura-role', 'admin')
      .set('x-aura-user-id', 'user-admin-strict-001')
      .set('x-aura-session-id', 'session-admin-strict-001')
      .set('x-aura-purpose-of-use', 'operations')
      .expect(200);

    const missing = await request(app.getHttpServer()).get('/api/v1/platform/admin').set('x-aura-role', 'admin').expect(403);
    assert.equal(missing.body.error.code, 'IDENTITY_CONTEXT_MISSING');
    assert.equal(missing.body.error.category, 'permission_denied');
    assert.equal(missing.body.error.details.liveCredentialPresent, false);
  });

  it('rejects synthetic headers in preview and production auth postures until adapters are configured', async () => {
    process.env.AURA_NOTE_AUTH_MODE = 'preview_oidc';
    const preview = await request(app.getHttpServer()).get('/api/v1/schedule/appointments').set('x-aura-role', 'clinician').expect(403);
    assert.equal(preview.body.error.code, 'SYNTHETIC_HEADERS_FORBIDDEN');
    assert.equal(preview.body.error.details.failureReason, 'synthetic_headers_forbidden');

    process.env.AURA_NOTE_AUTH_MODE = 'production_saml';
    const production = await request(app.getHttpServer()).get('/api/v1/platform/admin').expect(403);
    assert.equal(production.body.error.code, 'IDENTITY_ADAPTER_NOT_CONFIGURED');
    assert.equal(production.body.error.details.delegatedIdentityConfigured, false);
    assert.equal(production.body.error.details.rawTokenReturned, false);
  });

  it('fails closed for disabled users, expired sessions, wrong tenant/site, wrong purpose, and delegated identity', async () => {
    process.env.AURA_NOTE_AUTH_MODE = 'local_synthetic';
    const strictHeaders = {
      'x-aura-role': 'admin',
      'x-aura-user-id': 'user-admin-strict-002',
      'x-aura-session-id': 'session-admin-strict-002',
      'x-aura-purpose-of-use': 'operations'
    };

    const disabled = await request(app.getHttpServer())
      .get('/api/v1/platform/admin')
      .set(strictHeaders)
      .set('x-aura-user-status', 'disabled')
      .expect(403);
    assert.equal(disabled.body.error.code, 'DISABLED_USER_DENIED');

    const expired = await request(app.getHttpServer())
      .get('/api/v1/platform/admin')
      .set(strictHeaders)
      .set('x-aura-session-expires-at', '2026-05-01T00:00:00.000Z')
      .expect(403);
    assert.equal(expired.body.error.code, 'SESSION_EXPIRED');

    const wrongTenant = await request(app.getHttpServer())
      .get('/api/v1/platform/admin')
      .set(strictHeaders)
      .set('x-aura-tenant-id', 'tenant-other')
      .expect(403);
    assert.equal(wrongTenant.body.error.code, 'TENANT_SITE_SCOPE_DENIED');

    const wrongPurpose = await request(app.getHttpServer())
      .get('/api/v1/support/status')
      .set({
        'x-aura-role': 'support',
        'x-aura-user-id': 'user-support-strict-001',
        'x-aura-session-id': 'session-support-strict-001',
        'x-aura-purpose-of-use': 'treatment'
      })
      .expect(403);
    assert.equal(wrongPurpose.body.error.code, 'PURPOSE_OF_USE_DENIED');

    const delegated = await request(app.getHttpServer())
      .get('/api/v1/platform/admin')
      .set(strictHeaders)
      .set('x-aura-identity-provider', 'clinicos_delegate')
      .expect(403);
    assert.equal(delegated.body.error.code, 'DELEGATED_IDENTITY_NOT_CONFIGURED');

    const serializedLogs = JSON.stringify(getRuntimeLogEntries());
    assert.equal(serializedLogs.includes('session-admin-strict-002'), false);
    assert.equal(getRuntimeLogEntries().some((entry) => entry.eventName === 'identity.denied'), true);
  });

  it('preserves support and billing role limits through the normalized identity context', async () => {
    process.env.AURA_NOTE_AUTH_MODE = 'local_synthetic';
    await request(app.getHttpServer())
      .get('/api/v1/support/status')
      .set({
        'x-aura-role': 'support',
        'x-aura-user-id': 'user-support-strict-002',
        'x-aura-session-id': 'session-support-strict-002',
        'x-aura-purpose-of-use': 'support'
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/support/audit-exports')
      .set({
        'x-aura-role': 'support',
        'x-aura-user-id': 'user-support-strict-003',
        'x-aura-session-id': 'session-support-strict-003',
        'x-aura-purpose-of-use': 'support'
      })
      .send({
        startAt: '2026-05-26T00:00:00.000Z',
        endAt: '2026-05-26T23:59:59.000Z',
        format: 'jsonl',
        includePhi: false
      })
      .expect(403);

    const billingDenied = await request(app.getHttpServer())
      .get('/api/v1/standalone/operations/billing-review')
      .set({
        'x-aura-role': 'billing_staff',
        'x-aura-user-id': 'user-billing-strict-001',
        'x-aura-session-id': 'session-billing-strict-001',
        'x-aura-purpose-of-use': 'payment'
      })
      .expect(200);
    assert.equal(billingDenied.body.data.items[0].transcriptAccess, 'denied');

    const billingAllowed = await request(app.getHttpServer())
      .get('/api/v1/standalone/operations/billing-review')
      .set({
        'x-aura-role': 'billing_staff',
        'x-aura-user-id': 'user-billing-strict-002',
        'x-aura-session-id': 'session-billing-strict-002',
        'x-aura-purpose-of-use': 'payment',
        'x-aura-billing-review-triggered': 'true'
      })
      .expect(200);
    assert.equal(billingAllowed.body.data.items[0].transcriptAccess, 'allowed_for_triggered_review');
  });
});

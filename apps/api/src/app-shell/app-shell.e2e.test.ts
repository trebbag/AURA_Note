import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { configureAuraApi } from '../runtime/api-runtime';

describe('AURA Note app shell API', () => {
  let app: INestApplication;

  before(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    configureAuraApi(app);
    await app.init();
  });

  after(async () => {
    await app.close();
  });

  it('returns a Figma-derived AURA Note shell backed by typed runtime state', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/app-shell')
      .set('x-aura-role', 'clinician')
      .set('x-request-id', 'req-app-shell-e2e-001')
      .set('x-trace-id', 'trace-app-shell-e2e-001')
      .expect(200);

    const appShell = response.body.data.appShell;
    assert.equal(appShell.productName, 'AURA Note');
    assert.equal(appShell.revenuePilotBrandingAccepted, false);
    assert.equal(appShell.supabaseBackendAccepted, false);
    assert.equal(appShell.rejectedPrototypeBackend, 'supabase');
    assert.equal(appShell.localReactStateLimit, 'transient_controls_only');
    assert.equal(appShell.dashboard.dataSource, 'typed_api_client_composite');
    assert.equal(appShell.dashboard.productionLaunchApproved, false);
    assert.equal(appShell.dashboard.liveVendorActionsEnabled, false);
    assert.equal(appShell.dashboard.submittedClaim, false);
    assert.equal(appShell.dashboard.requiredUiStates.includes('permission-denied'), true);
    assert.equal(appShell.dashboard.requiredUiStates.includes('read-only'), true);
    assert.equal(appShell.navigation.some((item: { key: string; state: string }) => item.key === 'support' && item.state === 'permission-denied'), true);
    assert.equal(appShell.notifications.some((item: { category: string }) => item.category === 'disabled_feature'), true);
    assert.equal(
      appShell.dashboard.disabledFeatureStates.some(
        (item: { feature: string; reason: string }) => item.feature === 'claim_submission' && item.reason.includes('submittedClaim=false')
      ),
      true
    );
    assert.equal(response.body.data.domainEvents[0].eventType, 'audit.event_recorded.v1');
  });

  it('shows role-scoped shell state for support without leaking clinical counts', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/app-shell')
      .set('x-aura-role', 'support')
      .set('x-request-id', 'req-app-shell-support-e2e-001')
      .set('x-trace-id', 'trace-app-shell-support-e2e-001')
      .expect(200);

    const appShell = response.body.data.appShell;
    assert.equal(appShell.currentUser.role, 'support');
    assert.equal(appShell.navigation.find((item: { key: string }) => item.key === 'support').state, 'ready');
    assert.equal(appShell.navigation.find((item: { key: string }) => item.key === 'schedule').state, 'permission-denied');
    assert.equal(appShell.dashboard.metrics.find((metric: { metricId: string }) => metric.metricId === 'appointments-today').value, 'permission-denied');
  });

  it('denies cross-tenant shell composition before DTO data is returned', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/app-shell')
      .set('x-aura-role', 'clinician')
      .set('x-aura-tenant-id', 'tenant-other')
      .expect(403);
  });
});

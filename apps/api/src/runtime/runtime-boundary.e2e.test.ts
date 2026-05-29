import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { configureAuraApi } from './api-runtime';
import { AURA_MAX_BODY_BYTES } from './request-boundary.middleware';
import { clearRuntimeLogEntries, getRuntimeLogEntries } from './runtime-log';

describe('AURA API runtime request boundary', () => {
  let app: INestApplication;

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
  });

  after(async () => {
    await app.close();
  });

  it('adds request correlation and security headers on implemented public endpoints', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('x-request-id', 'req-runtime-e2e-001')
      .set('x-trace-id', 'trace-runtime-e2e-001')
      .expect(200);

    assert.equal(response.headers['x-aura-request-id'], 'req-runtime-e2e-001');
    assert.equal(response.headers['x-aura-trace-id'], 'trace-runtime-e2e-001');
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.equal(response.headers['x-frame-options'], 'DENY');
    assert.equal(response.body.meta.requestId, 'req-runtime-e2e-001');
    assert.equal(response.body.meta.traceId, 'trace-runtime-e2e-001');
  });

  it('fails closed for missing, invalid, and cross-tenant request contexts before DTO exposure', async () => {
    const missing = await request(app.getHttpServer()).get('/api/v1/schedule/appointments').expect(403);
    assert.equal(missing.body.error.category, 'permission_denied');
    assert.equal(missing.body.error.redacted, true);
    assert.match(missing.body.error.requestId, /^req-/);

    const invalid = await request(app.getHttpServer())
      .get('/api/v1/schedule/appointments')
      .set('x-aura-role', 'superuser')
      .expect(400);
    assert.equal(invalid.body.error.category, 'validation');

    const crossTenant = await request(app.getHttpServer())
      .get('/api/v1/schedule/appointments')
      .set('x-aura-role', 'ma')
      .set('x-aura-tenant-id', 'tenant-other')
      .expect(403);
    assert.equal(crossTenant.body.error.category, 'permission_denied');
    assert.equal(crossTenant.body.error.redacted, true);
  });

  it('rejects invalid body shapes with a standard PHI-safe error envelope', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/schedule/appointments')
      .set('x-aura-role', 'ma')
      .send([{ unsafe: 'not-an-object' }])
      .expect(400);

    assert.equal(response.body.error.code, 'BAD_REQUEST');
    assert.equal(response.body.error.category, 'validation');
    assert.equal(response.body.error.redacted, true);
    assert.equal(typeof response.body.meta.requestId, 'string');
    assert.equal(response.body.stack, undefined);
  });

  it('rejects obvious PHI-like request bodies before service mutation', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/schedule/appointments')
      .set('x-aura-role', 'ma')
      .send({
        safePatientId: 'safe-patient-runtime-e2e-001',
        patientName: 'Synthetic Person',
        clinicianId: 'clinician-runtime-e2e-001',
        visitType: 'Chronic follow-up',
        startsAt: '2026-05-27T15:00:00.000Z',
        durationMinutes: 30,
        modality: 'in_person',
        reasonForVisit: 'Synthetic runtime validation'
      })
      .expect(400);

    assert.match(response.body.error.message, /PHI-like/);
    assert.equal(response.body.error.redacted, true);
  });

  it('rejects oversized bodies with metadata-only request evidence', async () => {
    const oversizedReason = 'x'.repeat(AURA_MAX_BODY_BYTES + 1);
    const response = await request(app.getHttpServer())
      .post('/api/v1/schedule/appointments')
      .set('x-aura-role', 'ma')
      .send({
        safePatientId: 'safe-patient-runtime-e2e-002',
        clinicianId: 'clinician-runtime-e2e-002',
        visitType: 'Chronic follow-up',
        startsAt: '2026-05-27T15:00:00.000Z',
        durationMinutes: 30,
        modality: 'in_person',
        reasonForVisit: oversizedReason
      })
      .expect(413);

    assert.equal(response.body.error.code, 'PAYLOAD_TOO_LARGE');
    assert.equal(response.body.error.category, 'request_too_large');
    assert.equal(response.body.error.redacted, true);
  });

  it('records request-correlated structured logs without retaining PHI-like payloads', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/support/operations/evidence')
      .set('x-aura-role', 'support')
      .set('x-request-id', 'req-runtime-log-e2e-001')
      .set('x-trace-id', 'trace-runtime-log-e2e-001')
      .send({
        actionType: 'degraded_mode_acknowledged',
        subjectId: 'runtime-boundary',
        patientName: 'Synthetic Person'
      })
      .expect(400);

    const serializedLogs = JSON.stringify(getRuntimeLogEntries());
    assert.equal(serializedLogs.includes('Synthetic Person'), false);
    assert.equal(getRuntimeLogEntries().every((entry) => entry.phiSafe), true);
    assert.equal(getRuntimeLogEntries().some((entry) => entry.requestId === 'req-runtime-log-e2e-001'), true);
  });
});

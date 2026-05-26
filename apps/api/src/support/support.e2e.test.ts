import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('Support hardening API e2e', () => {
  it('exposes permissioned support status and denies ordinary clinician access', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    try {
      const allowed = await request(app.getHttpServer())
        .get('/api/v1/support/status')
        .set('x-aura-role', 'support')
        .set('x-request-id', 'req-support-e2e-001')
        .set('x-trace-id', 'trace-support-e2e-001')
        .expect(200);

      assert.equal(allowed.body.data.status.checkpoint, 'CP-4');
      assert.equal(allowed.body.data.status.auditExport.downloadEnabled, false);
      assert.equal(allowed.body.data.status.logging.sample.requestId, 'req-support-e2e-001');

      await request(app.getHttpServer()).get('/api/v1/support/status').set('x-aura-role', 'clinician').expect(403);
    } finally {
      await app.close();
    }
  });

  it('creates redacted audit export metadata for compliance users only', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    try {
      const response = await request(app.getHttpServer())
        .post('/api/v1/support/audit-exports')
        .set('x-aura-role', 'compliance_privacy_lead')
        .set('x-aura-user-id', 'user-compliance-e2e-001')
        .set('x-request-id', 'req-audit-e2e-001')
        .set('x-trace-id', 'trace-audit-e2e-001')
        .set('idempotency-key', 'idem-audit-e2e-001')
        .send({
          startAt: '2026-05-26T00:00:00.000Z',
          endAt: '2026-05-26T23:59:59.000Z',
          format: 'jsonl',
          includePhi: false
        })
        .expect(201);

      assert.equal(response.body.data.auditExport.includePhi, false);
      assert.equal(response.body.data.auditExport.downloadEnabled, false);
      assert.equal(response.body.data.domainEvents[0].eventType, 'audit.export_requested.v1');

      await request(app.getHttpServer())
        .post('/api/v1/support/audit-exports')
        .set('x-aura-role', 'support')
        .send({
          startAt: '2026-05-26T00:00:00.000Z',
          endAt: '2026-05-26T23:59:59.000Z',
          format: 'jsonl',
          includePhi: false
        })
        .expect(403);
    } finally {
      await app.close();
    }
  });
});

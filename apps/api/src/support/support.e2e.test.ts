import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { configureAuraApi } from '../runtime/api-runtime';

describe('Support hardening API e2e', () => {
  it('exposes permissioned support status and denies ordinary clinician access', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    configureAuraApi(app);
    await app.init();

    try {
      const allowed = await request(app.getHttpServer())
        .get('/api/v1/support/status')
        .set('x-aura-role', 'support')
        .set('x-request-id', 'req-support-e2e-001')
        .set('x-trace-id', 'trace-support-e2e-001')
        .expect(200);

      assert.equal(allowed.body.data.status.checkpoint, 'P8');
      assert.equal(allowed.body.data.status.auditExport.downloadEnabled, false);
      assert.equal(allowed.body.data.status.logging.sample.requestId, 'req-support-e2e-001');
      assert.equal(allowed.body.data.status.observability.sinks.some((sink: { kind: string }) => sink.kind === 'metric'), true);
      assert.equal(allowed.body.data.status.observability.sinks.some((sink: { kind: string }) => sink.kind === 'siem'), true);
      assert.equal(allowed.body.data.domainEvents.some((event: { eventType: string }) => event.eventType === 'support.status_checked.v1'), true);
      assert.equal(
        allowed.body.data.status.deployment.some(
          (environment: { environment: string; productionDataAllowed: boolean }) =>
            environment.environment === 'production' && environment.productionDataAllowed === false
        ),
        true
      );
      assert.equal(allowed.body.data.status.runbooks.some((runbook: { runbookId: string }) => runbook.runbookId === 'WO-018'), true);

      await request(app.getHttpServer()).get('/api/v1/support/status').set('x-aura-role', 'clinician').expect(403);

      const readiness = await request(app.getHttpServer())
        .get('/api/v1/support/operations/readiness')
        .set('x-aura-role', 'support')
        .expect(200);
      assert.equal(readiness.body.data.readiness.checkpoint, 'P8');
      assert.equal(readiness.body.data.readiness.productionLaunchReady, false);

      const evidence = await request(app.getHttpServer())
        .post('/api/v1/support/operations/evidence')
        .set('x-aura-role', 'support')
        .set('x-request-id', 'req-support-evidence-e2e-001')
        .set('x-trace-id', 'trace-support-evidence-e2e-001')
        .send({
          actionType: 'degraded_mode_acknowledged',
          subjectId: 'external-ai-disabled',
          note: 'synthetic degraded-mode acknowledgement'
        })
        .expect(201);
      assert.equal(evidence.body.data.evidence.phiSafe, true);
      assert.equal(evidence.body.data.domainEvents[0].eventType, 'degraded_mode.acknowledged.v1');

      await request(app.getHttpServer())
        .post('/api/v1/support/operations/evidence')
        .set('x-aura-role', 'clinician')
        .send({ actionType: 'incident_runbook_viewed', subjectId: 'WO-018' })
        .expect(403);
    } finally {
      await app.close();
    }
  });

  it('creates redacted audit export metadata for compliance users only', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    configureAuraApi(app);
    await app.init();

    try {
      const previousAuditDownloadFlag = process.env.AURA_ENABLE_AUDIT_EXPORT_DOWNLOAD;
      process.env.AURA_ENABLE_AUDIT_EXPORT_DOWNLOAD = 'true';
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
      if (previousAuditDownloadFlag === undefined) {
        delete process.env.AURA_ENABLE_AUDIT_EXPORT_DOWNLOAD;
      } else {
        process.env.AURA_ENABLE_AUDIT_EXPORT_DOWNLOAD = previousAuditDownloadFlag;
      }

      assert.equal(response.body.data.auditExport.includePhi, false);
      assert.equal(response.body.data.auditExport.downloadEnabled, true);
      const delivered = await request(app.getHttpServer())
        .post(`/api/v1/support/audit-exports/${response.body.data.auditExport.auditExportId}/download`)
        .set('x-aura-role', 'compliance_privacy_lead')
        .set('x-aura-user-id', 'user-compliance-e2e-001')
        .send({ signedDownloadToken: response.body.data.auditExport.signedDownloadToken })
        .expect(201);
      assert.equal(delivered.body.data.download.serverMediated, true);
      assert.equal(delivered.body.data.download.publicUrl, null);
      assert.equal(response.body.data.domainEvents[0].eventType, 'audit.export_requested.v1');

      const restore = await request(app.getHttpServer())
        .get('/api/v1/support/backup-restore/readiness')
        .set('x-aura-role', 'compliance_privacy_lead')
        .expect(200);
      assert.equal(restore.body.data.readiness.restoreExecutionEnabled, false);

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
